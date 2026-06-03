import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  DEFAULT_DARK_BACKGROUND,
  DEFAULT_DARK_COLORS,
  DEFAULT_LIGHT_BACKGROUND,
  DEFAULT_LIGHT_COLORS,
  DEFAULT_WAVE_COUNT,
  MAX_WAVE_COUNT,
} from "./constants";
import { GradientCache } from "./gradientCache";
import { useAnimationFrame } from "./hooks/useAnimationFrame";
import { useCanvasSize } from "./hooks/useCanvasSize";
import { usePerformanceProfile } from "./hooks/usePerformanceProfile";
import { usePointerInteraction } from "./hooks/usePointerInteraction";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useResolvedTheme } from "./hooks/useResolvedTheme";
import { createRandomSeed, createSeededRandom } from "./random";
import { drawScene } from "./renderer";
import type { ColorTriplet, ResolvedColorMode, WaveBackgroundPosition, WaveBackgroundProps } from "./types";
import { classNames, clamp, finiteOr, optionalFinite } from "./utils";
import { createWave } from "./waveMath";

const BASE_CANVAS_STYLE: CSSProperties = {
  backfaceVisibility: "hidden",
  display: "block",
  height: "100%",
  inset: 0,
  pointerEvents: "none",
  transform: "translate3d(0, 0, 0)",
  userSelect: "none",
  willChange: "transform",
  width: "100%",
};

function resolvePalette(
  resolvedColorMode: ResolvedColorMode,
  colors: readonly string[],
  darkColors: readonly string[],
) {
  if (resolvedColorMode === "dark") {
    return darkColors.length > 0 ? darkColors : DEFAULT_DARK_COLORS;
  }

  return colors.length > 0 ? colors : DEFAULT_LIGHT_COLORS;
}

function resolvePosition(position: WaveBackgroundPosition) {
  return position === "absolute" ? "absolute" : "fixed";
}

export function WaveBackground({
  backgroundColors = DEFAULT_LIGHT_BACKGROUND,
  className,
  colorMode = "auto",
  colors = DEFAULT_LIGHT_COLORS,
  darkBackgroundColors = DEFAULT_DARK_BACKGROUND,
  darkColors = DEFAULT_DARK_COLORS,
  frameRate = "auto",
  glow = true,
  interactive = true,
  interactionRadius,
  interactionStrength = 1,
  intensity = 1,
  opacity = 1,
  position = "fixed",
  quality = "auto",
  responsive = true,
  seed,
  speed = 1,
  style,
  waveCount = DEFAULT_WAVE_COUNT,
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContextRef = useRef<{ canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | null>(null);
  const gradientCacheRef = useRef(new GradientCache());
  const randomSeedRef = useRef<number | null>(null);
  const renderFrameRef = useRef<(now: number) => boolean>(() => false);
  const reducedMotionRef = useRef(false);
  const speedRef = useRef(0);
  const staticFrameRef = useRef<number | null>(null);

  if (randomSeedRef.current === null) {
    randomSeedRef.current = createRandomSeed();
  }

  const activeSeed = seed ?? randomSeedRef.current;
  const resolvedColorMode = useResolvedTheme(colorMode, canvasRef);
  const reducedMotion = useReducedMotion();
  const performanceProfile = usePerformanceProfile(quality, frameRate);
  const size = useCanvasSize(canvasRef, performanceProfile.maxPixelRatio);
  const resolvedPosition = resolvePosition(position);
  const resolvedWaveCount = clamp(
    Math.round(finiteOr(waveCount, DEFAULT_WAVE_COUNT)),
    1,
    Math.min(MAX_WAVE_COUNT, performanceProfile.maxWaveCount),
  );
  const resolvedIntensity = clamp(finiteOr(intensity, 1), 0, 3);
  const resolvedOpacity = clamp(finiteOr(opacity, 1), 0, 1.5);
  const resolvedSpeed = performanceProfile.forceStatic ? 0 : clamp(finiteOr(speed, 1), -3, 3);
  const renderedSpeed = reducedMotion ? 0 : resolvedSpeed;
  const finiteInteractionRadius = optionalFinite(interactionRadius);
  const resolvedInteractionRadius =
    finiteInteractionRadius === undefined ? undefined : clamp(finiteInteractionRadius, 64, 720);
  const resolvedInteractionStrength = clamp(finiteOr(interactionStrength, 1), 0, 2);
  const resolvedGlow = Boolean(glow) && performanceProfile.glowScale > 0;
  const resolvedInteractive = Boolean(interactive) && !performanceProfile.disableInteraction;
  const resolvedResponsive = Boolean(responsive);

  const requestStaticRender = useCallback(() => {
    if (typeof window === "undefined" || (!reducedMotionRef.current && speedRef.current !== 0)) {
      return;
    }

    if (staticFrameRef.current !== null) {
      return;
    }

    const loop = (now: number) => {
      if (!reducedMotionRef.current && speedRef.current !== 0) {
        staticFrameRef.current = null;
        return;
      }

      if (renderFrameRef.current(now)) {
        staticFrameRef.current = window.requestAnimationFrame(loop);
      } else {
        staticFrameRef.current = null;
      }
    };

    staticFrameRef.current = window.requestAnimationFrame(loop);
  }, []);

  const getPointerSnapshot = usePointerInteraction({
    canvasRef,
    clearImmediatelyOnReset: reducedMotion,
    interactionRadius: resolvedInteractionRadius,
    interactionStrength: resolvedInteractionStrength,
    interactive: resolvedInteractive,
    onPointerActivity: requestStaticRender,
    pointerThrottleMs: performanceProfile.pointerThrottleMs,
  });

  const waves = useMemo(() => {
    const random = createSeededRandom(activeSeed);
    return Array.from({ length: resolvedWaveCount }, (_, index) => createWave(index, resolvedWaveCount, random));
  }, [activeSeed, resolvedWaveCount]);
  const waveCacheKey = useMemo(() => `${activeSeed}:${resolvedWaveCount}`, [activeSeed, resolvedWaveCount]);

  const palette = useMemo(
    () => resolvePalette(resolvedColorMode, colors, darkColors),
    [colors, darkColors, resolvedColorMode],
  );
  const resolvedBackgroundColors = useMemo<ColorTriplet>(
    () => (resolvedColorMode === "dark" ? darkBackgroundColors : backgroundColors),
    [backgroundColors, darkBackgroundColors, resolvedColorMode],
  );
  const paletteKey = palette.join("|");
  const backgroundKey = resolvedBackgroundColors.join("|");

  const canvasStyle = useMemo<CSSProperties>(
    () => ({
      ...BASE_CANVAS_STYLE,
      height: resolvedPosition === "fixed" ? "100dvh" : "100%",
      position: resolvedPosition,
      width: resolvedPosition === "fixed" ? "100vw" : "100%",
      zIndex: resolvedPosition === "fixed" ? -1 : undefined,
      ...style,
    }),
    [resolvedPosition, style],
  );

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    if (canvasContextRef.current?.canvas === canvas) {
      return canvasContextRef.current.context;
    }

    const context = canvas.getContext("2d", { alpha: false, desynchronized: true, willReadFrequently: false });

    if (!context) {
      return null;
    }

    canvasContextRef.current = { canvas, context };
    return context;
  }, []);

  const renderFrame = useCallback(
    (now: number) => {
      const context = getCanvasContext();

      if (!context) {
        return false;
      }

      const pointerFrame = getPointerSnapshot(size.width, size.height);

      context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
      drawScene(
        context,
        waves,
        size.width,
        size.height,
        {
          backgroundColors: resolvedBackgroundColors,
          cacheKey: waveCacheKey,
          colors: palette,
          glow: resolvedGlow,
          glowScale: performanceProfile.glowScale,
          intensity: resolvedIntensity,
          opacity: resolvedOpacity,
          pointer: pointerFrame.pointer,
          responsive: resolvedResponsive,
          smoothCurves: performanceProfile.smoothCurves,
          speed: renderedSpeed,
          stepScale: performanceProfile.stepScale,
        },
        now,
        gradientCacheRef.current,
      );

      return pointerFrame.needsAnimation;
    },
    [
      getCanvasContext,
      getPointerSnapshot,
      palette,
      performanceProfile.glowScale,
      performanceProfile.smoothCurves,
      performanceProfile.stepScale,
      resolvedBackgroundColors,
      resolvedGlow,
      resolvedIntensity,
      resolvedOpacity,
      resolvedResponsive,
      renderedSpeed,
      size.height,
      size.pixelRatio,
      size.width,
      waveCacheKey,
      waves,
    ],
  );

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    speedRef.current = renderedSpeed;
  }, [renderedSpeed]);

  useEffect(() => {
    renderFrameRef.current = renderFrame;
  }, [renderFrame]);

  useEffect(() => {
    gradientCacheRef.current.clear();
  }, [backgroundKey, paletteKey, size.height, size.width, waveCacheKey]);

  useEffect(() => {
    if (typeof performance === "undefined") {
      return;
    }

    renderFrame(performance.now());
  }, [renderFrame]);

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && staticFrameRef.current !== null) {
        window.cancelAnimationFrame(staticFrameRef.current);
      }
    },
    [],
  );

  useAnimationFrame(renderFrame, renderedSpeed !== 0, performanceProfile.frameInterval);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={classNames("wave-background", `wave-background--${resolvedPosition}`, className)}
      style={canvasStyle}
    />
  );
}

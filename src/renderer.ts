import { DEFAULT_LIGHT_BACKGROUND, DEFAULT_LIGHT_COLORS } from "./constants";
import { createGradientKey, type GradientCache } from "./gradientCache";
import { getResponsiveMetrics } from "./responsive";
import type { DrawOptions, PointerSnapshot, ResponsiveMetrics, WaveSpec } from "./types";
import { hexToTransparent } from "./utils";
import { createWaveFrame, getWaveY, getPointerWaveState, type WaveFrame } from "./waveMath";

type WavePointBuffer = {
  count: number;
  points: Float32Array;
};

function addColorStop(gradient: CanvasGradient, offset: number, color: string, fallback: string) {
  try {
    gradient.addColorStop(offset, color);
  } catch {
    gradient.addColorStop(offset, fallback);
  }
}

function getWavePointCount(width: number, step: number) {
  return Math.ceil((width + step * 2) / step) + 2;
}

function populateWavePoints(
  wave: WaveSpec,
  width: number,
  metrics: ResponsiveMetrics,
  frame: WaveFrame,
  pointer: PointerSnapshot,
  points: Float32Array,
): number {
  const step = metrics.step;
  const pointerState = getPointerWaveState(wave, frame.yBase, pointer);
  let count = 0;

  for (let x = -step; x <= width + step; x += step) {
    const pointIndex = count * 2;
    points[pointIndex] = x;
    points[pointIndex + 1] = getWaveY(wave, frame, x, pointerState);
    count += 1;
  }

  return count;
}

function buildWavePoints(
  gradientCache: GradientCache,
  wave: WaveSpec,
  width: number,
  metrics: ResponsiveMetrics,
  frame: WaveFrame,
  pointer: PointerSnapshot,
): WavePointBuffer {
  const step = metrics.step;
  const pointCount = getWavePointCount(width, step);
  const points = gradientCache.getPointBuffer(wave.index, pointCount * 2);
  const count = populateWavePoints(wave, width, metrics, frame, pointer, points);

  return { count, points };
}

function buildStaticWavePoints(
  gradientCache: GradientCache,
  cacheKey: string,
  wave: WaveSpec,
  width: number,
  height: number,
  intensity: number,
  metrics: ResponsiveMetrics,
  frame: WaveFrame,
): WavePointBuffer {
  const pointKey = createGradientKey(
    "points",
    cacheKey,
    wave.index,
    width,
    height,
    intensity,
    metrics.step,
    metrics.amplitudeScale,
    metrics.driftScale,
    metrics.maxAmplitudeRatio,
    metrics.verticalSpread,
    metrics.wavelengthScale,
  );

  return gradientCache.getStaticPointBuffer(pointKey, () => {
    const points = new Float32Array(getWavePointCount(width, metrics.step) * 2);
    const count = populateWavePoints(wave, width, metrics, frame, null, points);
    return { count, points };
  });
}

function buildWavePath(points: Float32Array, count: number, smoothCurves: boolean): Path2D {
  const path = new Path2D();

  if (count < 1) {
    return path;
  }

  let previousX = points[0];
  let previousY = points[1];
  path.moveTo(previousX, previousY);

  for (let index = 1; index < count; index += 1) {
    const pointIndex = index * 2;
    const x = points[pointIndex];
    const y = points[pointIndex + 1];

    if (!smoothCurves) {
      path.lineTo(x, y);
    } else {
      const midX = (previousX + x) / 2;
      const midY = (previousY + y) / 2;
      path.quadraticCurveTo(previousX, previousY, midX, midY);
    }

    previousX = x;
    previousY = y;
  }

  if (smoothCurves) {
    path.lineTo(previousX, previousY);
  }

  return path;
}

export function drawScene(
  context: CanvasRenderingContext2D,
  waves: readonly WaveSpec[],
  width: number,
  height: number,
  options: DrawOptions,
  now: number,
  gradientCache: GradientCache,
) {
  const staticWaves = options.speed === 0 && !options.pointer;
  const time = staticWaves ? 0 : now * 0.001;
  const [top, middle, bottom] = options.backgroundColors;
  const metrics = getResponsiveMetrics(width, height, options.responsive, options.stepScale);

  const background = gradientCache.get(createGradientKey("background", width, height, top, middle, bottom), () => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    addColorStop(gradient, 0, top, DEFAULT_LIGHT_BACKGROUND[0]);
    addColorStop(gradient, 0.48, middle, DEFAULT_LIGHT_BACKGROUND[1]);
    addColorStop(gradient, 1, bottom, DEFAULT_LIGHT_BACKGROUND[2]);
    return gradient;
  });

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  if (waves.length === 0 || options.colors.length === 0) {
    return;
  }

  context.save();

  for (const wave of waves) {
    const color = options.colors[(wave.index + wave.colorShift) % options.colors.length];
    const nextColor = options.colors[(wave.index + wave.colorShift + wave.secondaryColorShift) % options.colors.length];
    const accentColor =
      options.colors[(wave.index + wave.colorShift + wave.secondaryColorShift + 3) % options.colors.length];
    const fallbackColor = DEFAULT_LIGHT_COLORS[wave.index % DEFAULT_LIGHT_COLORS.length];
    const fallbackNextColor = DEFAULT_LIGHT_COLORS[(wave.index + 1) % DEFAULT_LIGHT_COLORS.length];
    const fallbackAccentColor = DEFAULT_LIGHT_COLORS[(wave.index + 2) % DEFAULT_LIGHT_COLORS.length];
    const waveFrame = createWaveFrame(wave, time, options.speed, height, options.intensity, metrics);
    const y = waveFrame.yBase;

    const { count, points } = staticWaves
      ? buildStaticWavePoints(
          gradientCache,
          options.cacheKey,
          wave,
          width,
          height,
          options.intensity,
          metrics,
          waveFrame,
        )
      : buildWavePoints(gradientCache, wave, width, metrics, waveFrame, options.pointer);

    const strokePath = buildWavePath(points, count, options.smoothCurves);

    // Draw ribbon
    const fillPath = new Path2D(strokePath);
    fillPath.lineTo(width + 32, height + metrics.ribbonOverscan);
    fillPath.lineTo(-32, height + metrics.ribbonOverscan);
    fillPath.closePath();

    const ribbonTop = 160 * metrics.ribbonScale;
    const ribbonBottom = 260 * metrics.ribbonScale;
    const ribbon = context.createLinearGradient(0, y - ribbonTop, 0, y + ribbonBottom);
    addColorStop(ribbon, 0, hexToTransparent(color), "rgba(0, 0, 0, 0)");
    addColorStop(ribbon, 0.36, color, fallbackColor);
    addColorStop(ribbon, 0.67, nextColor, fallbackNextColor);
    addColorStop(ribbon, 1, hexToTransparent(nextColor), "rgba(0, 0, 0, 0)");

    context.globalAlpha = wave.opacity * options.opacity * wave.ribbonOpacity * metrics.opacityScale;
    context.fillStyle = ribbon;
    context.fill(fillPath);

    // Draw stroke
    const stroke = gradientCache.get(createGradientKey("stroke", width, color, nextColor, accentColor), () => {
      const gradient = context.createLinearGradient(0, 0, width, 0);
      addColorStop(gradient, 0, color, fallbackColor);
      addColorStop(gradient, 0.5, nextColor, fallbackNextColor);
      addColorStop(gradient, 1, accentColor, fallbackAccentColor);
      return gradient;
    });

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = stroke;

    if (options.glow && options.glowScale > 0) {
      context.lineWidth = wave.lineWidth * metrics.lineWidthScale * 4.5 * metrics.glowScale * options.glowScale;
      context.globalAlpha = wave.opacity * options.opacity * metrics.opacityScale * 0.25;
      context.stroke(strokePath);
    }

    context.lineWidth = wave.lineWidth * metrics.lineWidthScale;
    context.globalAlpha = wave.opacity * options.opacity * metrics.opacityScale;
    context.stroke(strokePath);
  }

  context.restore();
}

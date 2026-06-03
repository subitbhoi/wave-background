import { useEffect, useMemo, useState } from "react";
import type { ResolvedRenderQuality, WaveRenderQuality } from "../types";
import { clamp } from "../utils";

type DeviceEnvironment = {
  cores: number;
  deviceMemory: number | null;
  height: number;
  pixelRatio: number;
  touch: boolean;
  width: number;
};

export type PerformanceProfile = {
  disableInteraction: boolean;
  forceStatic: boolean;
  frameInterval: number;
  glowScale: number;
  maxPixelRatio: number;
  maxWaveCount: number;
  pointerThrottleMs: number;
  quality: ResolvedRenderQuality;
  smoothCurves: boolean;
  stepScale: number;
};

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number;
};

const FALLBACK_ENVIRONMENT: DeviceEnvironment = {
  cores: 4,
  deviceMemory: null,
  height: 720,
  pixelRatio: 1,
  touch: false,
  width: 1280,
};

function readDeviceEnvironment(): DeviceEnvironment {
  if (typeof window === "undefined") {
    return FALLBACK_ENVIRONMENT;
  }

  const nav = window.navigator as NavigatorWithDeviceMemory;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;

  return {
    cores: nav.hardwareConcurrency || FALLBACK_ENVIRONMENT.cores,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    height: window.innerHeight || FALLBACK_ENVIRONMENT.height,
    pixelRatio: window.devicePixelRatio || 1,
    touch: coarsePointer || nav.maxTouchPoints > 0,
    width: window.innerWidth || FALLBACK_ENVIRONMENT.width,
  };
}

function resolveAutoQuality(environment: DeviceEnvironment): ResolvedRenderQuality {
  const shortestSide = Math.min(environment.width, environment.height);
  const renderPixelRatio = Math.min(environment.pixelRatio, 1.5);
  const viewportPixels = environment.width * environment.height * renderPixelRatio * renderPixelRatio;
  const veryConstrainedMemory = environment.deviceMemory !== null && environment.deviceMemory <= 2;
  const veryConstrainedCpu = environment.cores <= 2;
  const constrainedMemory = environment.deviceMemory !== null && environment.deviceMemory <= 4;
  const constrainedCpu = environment.cores <= 4;

  if (
    veryConstrainedCpu ||
    veryConstrainedMemory ||
    (constrainedCpu && constrainedMemory) ||
    (constrainedCpu && viewportPixels > 4_500_000)
  ) {
    return "low-end";
  }

  if (environment.touch || shortestSide < 640 || viewportPixels > 2_200_000 || constrainedCpu || constrainedMemory) {
    return "low";
  }

  if (shortestSide < 900 || environment.cores <= 6 || environment.deviceMemory === 6) {
    return "medium";
  }

  return "high";
}

function resolveFrameInterval(frameRate: number | "auto" | undefined, quality: ResolvedRenderQuality) {
  if (typeof frameRate === "number" && Number.isFinite(frameRate)) {
    const clampedRate = clamp(frameRate, 1, 60);
    return clampedRate >= 60 ? 0 : 1000 / clampedRate;
  }

  if (quality === "low-end") {
    return 1000 / 15;
  }

  if (quality === "low") {
    return 1000 / 30;
  }

  if (quality === "medium") {
    return 1000 / 45;
  }

  return 0;
}

function buildProfile(quality: ResolvedRenderQuality, frameRate: number | "auto" | undefined): PerformanceProfile {
  if (quality === "low-end") {
    return {
      disableInteraction: true,
      forceStatic: true,
      frameInterval: resolveFrameInterval(frameRate, quality),
      glowScale: 0,
      maxPixelRatio: 0.75,
      maxWaveCount: 10,
      pointerThrottleMs: 96,
      quality,
      smoothCurves: true,
      stepScale: 2.8,
    };
  }

  if (quality === "low") {
    return {
      disableInteraction: false,
      forceStatic: false,
      frameInterval: resolveFrameInterval(frameRate, quality),
      glowScale: 0,
      maxPixelRatio: 1,
      maxWaveCount: 10,
      pointerThrottleMs: 48,
      quality,
      smoothCurves: true,
      stepScale: 2.35,
    };
  }

  if (quality === "medium") {
    return {
      disableInteraction: false,
      forceStatic: false,
      frameInterval: resolveFrameInterval(frameRate, quality),
      glowScale: 0.35,
      maxPixelRatio: 1.25,
      maxWaveCount: 12,
      pointerThrottleMs: 24,
      quality,
      smoothCurves: true,
      stepScale: 1.45,
    };
  }

  return {
    disableInteraction: false,
    forceStatic: false,
    frameInterval: resolveFrameInterval(frameRate, quality),
    glowScale: 1,
    maxPixelRatio: 1.5,
    maxWaveCount: 32,
    pointerThrottleMs: 8,
    quality,
    smoothCurves: true,
    stepScale: 1,
  };
}

export function usePerformanceProfile(quality: WaveRenderQuality = "auto", frameRate?: number | "auto") {
  const [environment, setEnvironment] = useState<DeviceEnvironment>(readDeviceEnvironment);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let frameId: number | null = null;

    const updateEnvironment = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setEnvironment(readDeviceEnvironment());
      });
    };

    window.addEventListener("resize", updateEnvironment);
    window.addEventListener("orientationchange", updateEnvironment);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("resize", updateEnvironment);
      window.removeEventListener("orientationchange", updateEnvironment);
    };
  }, []);

  return useMemo(() => {
    const resolvedQuality = quality === "auto" ? resolveAutoQuality(environment) : quality;
    return buildProfile(resolvedQuality, frameRate);
  }, [environment, frameRate, quality]);
}

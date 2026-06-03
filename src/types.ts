import type { CSSProperties } from "react";

export type WaveBackgroundPosition = "fixed" | "absolute";
export type WaveColorMode = "auto" | "light" | "dark";
export type WaveRenderQuality = "auto" | "low-end" | "low" | "medium" | "high";
export type ResolvedRenderQuality = Exclude<WaveRenderQuality, "auto">;
export type ResolvedColorMode = Exclude<WaveColorMode, "auto">;
export type ColorTriplet = readonly [string, string, string];

export type WaveBackgroundProps = {
  className?: string;
  style?: CSSProperties;
  position?: WaveBackgroundPosition;
  waveCount?: number;
  speed?: number;
  intensity?: number;
  opacity?: number;
  glow?: boolean;
  responsive?: boolean;
  interactive?: boolean;
  quality?: WaveRenderQuality;
  frameRate?: number | "auto";
  interactionRadius?: number;
  interactionStrength?: number;
  colorMode?: WaveColorMode;
  colors?: readonly string[];
  darkColors?: readonly string[];
  backgroundColors?: ColorTriplet;
  darkBackgroundColors?: ColorTriplet;
  seed?: number;
};

export type ResponsiveMetrics = {
  amplitudeScale: number;
  driftScale: number;
  glowScale: number;
  lineWidthScale: number;
  maxAmplitudeRatio: number;
  opacityScale: number;
  ribbonOverscan: number;
  ribbonScale: number;
  step: number;
  verticalSpread: number;
  wavelengthScale: number;
};

export type PointerState = {
  initialized: boolean;
  influence: number;
  lastTime: number;
  lastX: number;
  lastY: number;
  targetInfluence: number;
  targetVelocityX: number;
  targetVelocityY: number;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
};

export type PointerSnapshot = {
  influence: number;
  radius: number;
  strength: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
} | null;

export type WaveSpec = {
  amplitude: number;
  amplitudeDrift: number;
  amplitudeSpeed: number;
  colorShift: number;
  direction: -1 | 1;
  harmonic: number;
  index: number;
  lineWidth: number;
  noiseFrequency: number;
  noiseSpeed: number;
  opacity: number;
  phase: number;
  ribbonOpacity: number;
  secondaryColorShift: number;
  speed: number;
  verticalDrift: number;
  verticalPosition: number;
  wavelength: number;
  wavelengthDrift: number;
  wavelengthSpeed: number;
};

export type DrawOptions = {
  backgroundColors: ColorTriplet;
  cacheKey: string;
  colors: readonly string[];
  glow: boolean;
  glowScale: number;
  intensity: number;
  opacity: number;
  pointer: PointerSnapshot;
  responsive: boolean;
  smoothCurves: boolean;
  speed: number;
  stepScale: number;
};

export type CanvasSize = {
  height: number;
  pixelRatio: number;
  width: number;
};

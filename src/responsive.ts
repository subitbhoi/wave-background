import type { ResponsiveMetrics } from "./types";
import { clamp } from "./utils";

export function getResponsiveMetrics(
  width: number,
  height: number,
  responsive: boolean,
  stepScale = 1,
): ResponsiveMetrics {
  const widthRatio = clamp(width / 1180, 0.44, 1.32);

  if (!responsive) {
    return {
      amplitudeScale: clamp(widthRatio, 0.74, 1.28),
      driftScale: 1,
      glowScale: 1,
      lineWidthScale: 1,
      maxAmplitudeRatio: 0.24,
      opacityScale: 1,
      ribbonOverscan: 80,
      ribbonScale: 1,
      step: clamp(clamp(width / 64, 14, 26) * stepScale, 10, 52),
      verticalSpread: 1,
      wavelengthScale: clamp(widthRatio, 0.74, 1.28),
    };
  }

  const compactWidth = clamp((560 - width) / 240, 0, 1);
  const compactHeight = clamp((680 - height) / 260, 0, 1);
  const wideScreen = clamp((width - 1280) / 720, 0, 1);
  const shortScreen = Math.max(compactWidth, compactHeight);

  return {
    amplitudeScale: clamp(0.72 + widthRatio * 0.36 + wideScreen * 0.1 - shortScreen * 0.22, 0.48, 1.32),
    driftScale: clamp(1 - shortScreen * 0.34, 0.64, 1),
    glowScale: clamp(0.72 + widthRatio * 0.24, 0.7, 1.18),
    lineWidthScale: clamp(0.72 + widthRatio * 0.28, 0.66, 1.12),
    maxAmplitudeRatio: clamp(0.24 - shortScreen * 0.08, 0.15, 0.24),
    opacityScale: clamp(1 - shortScreen * 0.16 + wideScreen * 0.08, 0.78, 1.08),
    ribbonOverscan: clamp(height * 0.1, 42, 96),
    ribbonScale: clamp(1 - shortScreen * 0.3, 0.68, 1),
    step: clamp(clamp(width / (shortScreen > 0.4 ? 44 : 64), 10, 28) * stepScale, 10, 56),
    verticalSpread: clamp(1 - shortScreen * 0.16, 0.82, 1),
    wavelengthScale: clamp(0.66 + widthRatio * 0.36 + compactWidth * 0.1 + wideScreen * 0.14, 0.62, 1.34),
  };
}

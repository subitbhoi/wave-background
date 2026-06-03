import { DEFAULT_LIGHT_COLORS } from "./constants";
import { randomBetween, randomInt } from "./random";
import type { PointerSnapshot, ResponsiveMetrics, WaveSpec } from "./types";
import { clamp } from "./utils";

const TWO_PI = Math.PI * 2;

export type WaveFrame = {
  baseAmplitude: number;
  baseWavelength: number;
  maxAmplitude: number;
  noisePhase: number;
  phase: number;
  time: number;
  yBase: number;
};

export type PointerWaveState = {
  active: boolean;
  cursorWake: number;
  dy: number;
  influence: number;
  pushDirection: number;
  radius: number;
  velocityX: number;
  x: number;
  yFalloffTerm: number;
};

export function createWave(index: number, total: number, random: () => number): WaveSpec {
  const spread = total <= 1 ? 0.5 : index / (total - 1);
  const laneJitter = randomBetween(random, -0.12, 0.12);

  return {
    amplitude: randomBetween(random, 18, 96),
    amplitudeDrift: randomBetween(random, 0.04, 0.18),
    amplitudeSpeed: randomBetween(random, 0.08, 0.26),
    colorShift: randomInt(random, 0, DEFAULT_LIGHT_COLORS.length - 1),
    direction: random() > 0.48 ? 1 : -1,
    harmonic: randomBetween(random, 0.34, 1.04),
    index,
    lineWidth: randomBetween(random, 1.1, 4.6),
    noiseFrequency: randomBetween(random, 0.0016, 0.011),
    noiseSpeed: randomBetween(random, 0.18, 0.98),
    opacity: randomBetween(random, 0.18, 0.58),
    phase: randomBetween(random, 0, Math.PI * 2),
    ribbonOpacity: randomBetween(random, 0.09, 0.19),
    secondaryColorShift: randomInt(random, 2, 8),
    speed: randomBetween(random, 0.14, 0.72),
    verticalDrift: randomBetween(random, 0.009, 0.032),
    verticalPosition: clamp(0.08 + spread * 0.84 + laneJitter, 0.08, 0.92),
    wavelength: randomBetween(random, 150, 820),
    wavelengthDrift: randomBetween(random, 0.035, 0.16),
    wavelengthSpeed: randomBetween(random, 0.06, 0.18),
  };
}

export function createWaveFrame(
  wave: WaveSpec,
  time: number,
  speed: number,
  height: number,
  intensity: number,
  metrics: ResponsiveMetrics,
) {
  const animationTime = speed === 0 ? 0 : time;
  const amplitudePulse = 1 + Math.sin(animationTime * wave.amplitudeSpeed + wave.phase) * wave.amplitudeDrift;
  const wavelengthPulse =
    1 + Math.cos(animationTime * wave.wavelengthSpeed + wave.phase * 0.7) * wave.wavelengthDrift;
  const phase = wave.phase + animationTime * wave.speed * speed * wave.direction;
  const drift = Math.sin(animationTime * 0.16 + wave.phase) * height * wave.verticalDrift * metrics.driftScale;
  const responsivePosition = 0.5 + (wave.verticalPosition - 0.5) * metrics.verticalSpread;
  const yBase = height * responsivePosition + drift;
  const baseAmplitude = wave.amplitude * amplitudePulse * metrics.amplitudeScale * intensity;

  return {
    baseAmplitude,
    baseWavelength: wave.wavelength * wavelengthPulse * metrics.wavelengthScale,
    maxAmplitude: height * metrics.maxAmplitudeRatio * 1.22,
    noisePhase: animationTime * wave.noiseSpeed + wave.phase,
    phase,
    time: animationTime,
    yBase,
  };
}

export function getPointerWaveState(wave: WaveSpec, yBase: number, pointer: PointerSnapshot): PointerWaveState {
  if (!pointer) {
    return { active: false, cursorWake: 0, dy: 0, influence: 0, pushDirection: 1, radius: 1, velocityX: 0, x: 0, yFalloffTerm: 0 };
  }

  const radius = pointer.radius * (0.88 + (wave.index % 4) * 0.06);
  const dy = yBase - pointer.y;
  const verticalRadius = radius * 0.72;
  const yFalloff = Math.exp(-(dy * dy) / (verticalRadius * verticalRadius));

  return {
    active: true,
    cursorWake: clamp(pointer.velocityY * 0.12, -46, 46),
    dy,
    influence: pointer.influence * pointer.strength,
    pushDirection: dy >= 0 ? 1 : -1,
    radius,
    velocityX: pointer.velocityX,
    x: pointer.x,
    yFalloffTerm: 0.26 + yFalloff * 0.74,
  };
}

export function getWaveY(wave: WaveSpec, frame: WaveFrame, x: number, pointerState: PointerWaveState) {
  const { baseAmplitude, baseWavelength, maxAmplitude, phase, time, yBase } = frame;
  let interaction = 0;
  let deflection = 0;
  let phaseWarp = 0;
  let wavelengthModifier = 1;
  let xWarp = 0;

  if (pointerState.active) {
    const dx = x - pointerState.x;
    const xFalloff = Math.exp(-(dx * dx) / (pointerState.radius * pointerState.radius));
    interaction = pointerState.influence * xFalloff * pointerState.yFalloffTerm;

    if (interaction > 0.001) {
      const ripple = Math.sin(dx / (pointerState.radius * 0.18) - time * 3.2 + wave.phase) * baseAmplitude * 0.2;
      deflection = pointerState.pushDirection * pointerState.radius * 0.14 * interaction + pointerState.cursorWake * interaction + ripple * interaction;
      wavelengthModifier = clamp(1 + Math.sin(dx / pointerState.radius + wave.phase) * interaction * 0.3, 0.66, 1.38);
      phaseWarp = Math.sin(dx / (pointerState.radius * 0.44) + time * 1.4) * interaction * 0.95;
      xWarp = clamp(pointerState.velocityX * 0.58, -52, 52) * interaction;
    }
  }

  const amplitude = clamp(baseAmplitude * (1 + interaction * 0.48), 8, maxAmplitude);
  const wavelength = Math.max(90, baseWavelength * wavelengthModifier);
  const theta = ((x + xWarp) / wavelength) * TWO_PI + phaseWarp;

  return (
    yBase +
    Math.sin(theta + phase) * amplitude +
    Math.sin(theta * wave.harmonic - phase * 0.74) * amplitude * 0.44 +
    Math.cos(x * wave.noiseFrequency + frame.noisePhase) * amplitude * 0.16 +
    deflection
  );
}

import type { ColorTriplet } from "./types";

export const DEFAULT_LIGHT_COLORS = [
  "#1d4ed8",
  "#2f7bff",
  "#38bdf8",
  "#00b8d9",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#facc15",
  "#fb923c",
  "#ff6b6b",
  "#7c3aed",
  "#a855f7",
  "#ff4d8d",
  "#e11d48",
  "#6366f1",
  "#0ea5e9",
] as const;

export const DEFAULT_DARK_COLORS = [
  "#60a5fa",
  "#22d3ee",
  "#2dd4bf",
  "#34d399",
  "#a3e635",
  "#fde047",
  "#fb7185",
  "#f472b6",
  "#c084fc",
  "#818cf8",
  "#38bdf8",
  "#f97316",
  "#e879f9",
  "#5eead4",
  "#93c5fd",
  "#facc15",
] as const;

export const DEFAULT_LIGHT_BACKGROUND = ["#fbfdff", "#eef7ff", "#f7f2ff"] as const satisfies ColorTriplet;
export const DEFAULT_DARK_BACKGROUND = ["#030712", "#07111f", "#170b2e"] as const satisfies ColorTriplet;

export const DEFAULT_WAVE_COUNT = 12;
export const MAX_WAVE_COUNT = 32;
export const MAX_DEVICE_PIXEL_RATIO = 2;

export const THEME_ATTRIBUTE_NAMES = ["data-theme", "data-color-mode", "data-bs-theme"] as const;

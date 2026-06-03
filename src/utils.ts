export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function finiteOr(value: number | undefined, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback;
}

export function optionalFinite(value: number | undefined): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

export function hexToTransparent(hex: unknown): string {
  if (typeof hex !== "string") {
    return "rgba(0, 0, 0, 0)";
  }

  const match = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(hex.trim());

  if (!match) {
    return "rgba(0, 0, 0, 0)";
  }

  const color = match[1].length <= 4 ? match[1].slice(0, 3).replace(/./g, (digit) => digit + digit) : match[1].slice(0, 6);
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0)`;
}

export function classNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

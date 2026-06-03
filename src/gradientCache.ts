type GradientFactory = () => CanvasGradient;
type PointBufferSnapshot = {
  count: number;
  points: Float32Array;
};

export class GradientCache {
  private readonly gradients = new Map<string, CanvasGradient>();
  private readonly pointBuffers = new Map<number, Float32Array>();
  private readonly staticPointBuffers = new Map<string, PointBufferSnapshot>();

  get(key: string, factory: GradientFactory) {
    const cached = this.gradients.get(key);

    if (cached) {
      return cached;
    }

    const gradient = factory();
    this.gradients.set(key, gradient);
    return gradient;
  }

  clear() {
    this.gradients.clear();
    this.pointBuffers.clear();
    this.staticPointBuffers.clear();
  }

  getPointBuffer(key: number, minimumLength: number) {
    const cached = this.pointBuffers.get(key);

    if (cached && cached.length >= minimumLength) {
      return cached;
    }

    const nextBuffer = new Float32Array(minimumLength);
    this.pointBuffers.set(key, nextBuffer);
    return nextBuffer;
  }

  getStaticPointBuffer(key: string, factory: () => PointBufferSnapshot) {
    const cached = this.staticPointBuffers.get(key);

    if (cached) {
      return cached;
    }

    const points = factory();
    this.staticPointBuffers.set(key, points);
    return points;
  }
}

export function createGradientKey(...parts: Array<boolean | number | string>) {
  return parts.map((part) => (typeof part === "number" ? String(Math.round(part * 100) / 100) : String(part))).join("|");
}

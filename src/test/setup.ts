import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Canvas Rendering Context 2D
if (typeof window !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    beginPath: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
    fill: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
  });

  // Mock Path 2D
  class MockPath2D {
    moveTo = vi.fn();
    lineTo = vi.fn();
    quadraticCurveTo = vi.fn();
    closePath = vi.fn();
  }
  globalThis.Path2D = MockPath2D as any;
}

// Mock Resize Observer
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = MockResizeObserver as any;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

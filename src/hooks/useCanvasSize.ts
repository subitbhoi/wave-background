import { useLayoutEffect, useState, type RefObject, useEffect } from "react";
import { MAX_DEVICE_PIXEL_RATIO } from "../constants";
import type { CanvasSize } from "../types";
import { clamp, finiteOr } from "../utils";

const MAX_CANVAS_PIXEL_AREA = 8_388_608;
const MAX_CANVAS_PIXEL_DIMENSION = 8192;

const INITIAL_SIZE: CanvasSize = {
  height: 1,
  pixelRatio: 1,
  width: 1,
};

function areSizesEqual(first: CanvasSize, second: CanvasSize) {
  return first.width === second.width && first.height === second.height && first.pixelRatio === second.pixelRatio;
}

function resolvePixelRatio(width: number, height: number, maxPixelRatio: number) {
  const requestedMaxPixelRatio = Math.max(0.01, finiteOr(maxPixelRatio, MAX_DEVICE_PIXEL_RATIO));
  const requestedPixelRatio = clamp(finiteOr(window.devicePixelRatio, 1), 0.5, requestedMaxPixelRatio);

  return Math.min(
    requestedPixelRatio,
    MAX_CANVAS_PIXEL_DIMENSION / width,
    MAX_CANVAS_PIXEL_DIMENSION / height,
    Math.sqrt(MAX_CANVAS_PIXEL_AREA / (width * height)),
  );
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useCanvasSize(canvasRef: RefObject<HTMLCanvasElement | null>, maxPixelRatio = MAX_DEVICE_PIXEL_RATIO) {
  const [size, setSize] = useState<CanvasSize>(INITIAL_SIZE);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let frameId: number | null = null;

    const updateSize = () => {
      frameId = null;

      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, finiteOr(rect.width, 1));
      const height = Math.max(1, finiteOr(rect.height, 1));
      const pixelRatio = resolvePixelRatio(width, height, maxPixelRatio);
      const canvasWidth = Math.max(1, Math.round(width * pixelRatio));
      const canvasHeight = Math.max(1, Math.round(height * pixelRatio));

      if (canvas.width !== canvasWidth) {
        canvas.width = canvasWidth;
      }

      if (canvas.height !== canvasHeight) {
        canvas.height = canvasHeight;
      }

      const nextSize = { height, pixelRatio, width };
      setSize((currentSize) => (areSizesEqual(currentSize, nextSize) ? currentSize : nextSize));
    };

    const scheduleSizeUpdate = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(updateSize);
    };

    const observer = "ResizeObserver" in window ? new ResizeObserver(scheduleSizeUpdate) : undefined;
    observer?.observe(canvas);
    window.addEventListener("resize", scheduleSizeUpdate);
    updateSize();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      observer?.disconnect();
      window.removeEventListener("resize", scheduleSizeUpdate);
    };
  }, [canvasRef, maxPixelRatio]);

  return size;
}

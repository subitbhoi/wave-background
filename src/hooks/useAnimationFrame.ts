import { useEffect, useRef } from "react";

type AnimationFrameCallback = (time: number) => void;

export function useAnimationFrame(callback: AnimationFrameCallback, enabled = true, frameInterval = 0) {
  const callbackRef = useRef(callback);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let frameId: number | null = null;

    const loop = (time: number) => {
      if (frameInterval <= 0 || time - lastFrameTimeRef.current >= frameInterval) {
        lastFrameTimeRef.current = time;
        callbackRef.current(time);
      }

      frameId = window.requestAnimationFrame(loop);
    };

    lastFrameTimeRef.current = 0;
    frameId = window.requestAnimationFrame(loop);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [enabled, frameInterval]);
}

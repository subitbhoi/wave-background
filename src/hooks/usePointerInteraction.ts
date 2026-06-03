import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { PointerSnapshot, PointerState } from "../types";
import { clamp } from "../utils";

type UsePointerInteractionOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  clearImmediatelyOnReset: boolean;
  interactionRadius?: number;
  interactionStrength: number;
  interactive: boolean;
  onPointerActivity?: () => void;
  pointerThrottleMs: number;
};

type PointerFrame = {
  needsAnimation: boolean;
  pointer: PointerSnapshot;
};

function createPointerState(): PointerState {
  return {
    initialized: false,
    influence: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
    targetInfluence: 0,
    targetVelocityX: 0,
    targetVelocityY: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    x: 0,
    y: 0,
  };
}

function resetPointerState(pointer: PointerState, clearImmediately: boolean) {
  const changed =
    pointer.targetInfluence !== 0 ||
    pointer.targetVelocityX !== 0 ||
    pointer.targetVelocityY !== 0 ||
    (clearImmediately &&
      (pointer.initialized || pointer.influence !== 0 || pointer.velocityX !== 0 || pointer.velocityY !== 0));

  pointer.targetInfluence = 0;
  pointer.targetVelocityX = 0;
  pointer.targetVelocityY = 0;

  if (clearImmediately) {
    pointer.initialized = false;
    pointer.influence = 0;
    pointer.velocityX = 0;
    pointer.velocityY = 0;
  }

  return changed;
}

function updatePointerState(pointer: PointerState, x: number, y: number, event: PointerEvent, boost: number) {
  const now = performance.now();

  if (!pointer.initialized) {
    pointer.initialized = true;
    pointer.x = x;
    pointer.y = y;
    pointer.targetX = x;
    pointer.targetY = y;
    pointer.lastX = x;
    pointer.lastY = y;
    pointer.lastTime = now;
  }

  const deltaTime = Math.max(16, now - pointer.lastTime);
  pointer.targetVelocityX = clamp(((x - pointer.lastX) / deltaTime) * 16, -120, 120);
  pointer.targetVelocityY = clamp(((y - pointer.lastY) / deltaTime) * 16, -120, 120);
  pointer.targetX = x;
  pointer.targetY = y;
  pointer.targetInfluence = clamp(event.pointerType === "touch" ? 0.82 * boost : boost, 0, 1.22);
  pointer.lastX = x;
  pointer.lastY = y;
  pointer.lastTime = now;
}

function readPointerSnapshot(
  pointer: PointerState,
  width: number,
  height: number,
  interactive: boolean,
  interactionRadius: number | undefined,
  interactionStrength: number,
): PointerFrame {
  if (!interactive || !pointer.initialized) {
    return { needsAnimation: false, pointer: null };
  }

  pointer.x += (pointer.targetX - pointer.x) * 0.16;
  pointer.y += (pointer.targetY - pointer.y) * 0.16;
  pointer.velocityX += (pointer.targetVelocityX - pointer.velocityX) * 0.16;
  pointer.velocityY += (pointer.targetVelocityY - pointer.velocityY) * 0.16;
  pointer.influence += (pointer.targetInfluence - pointer.influence) * 0.12;
  pointer.targetVelocityX *= 0.88;
  pointer.targetVelocityY *= 0.88;

  if (pointer.influence < 0.004 && pointer.targetInfluence === 0) {
    pointer.initialized = false;
    pointer.influence = 0;
    pointer.velocityX = 0;
    pointer.velocityY = 0;
    return { needsAnimation: false, pointer: null };
  }

  const responsiveRadius = clamp(Math.min(width, height) * 0.34, 120, 340);

  return {
    needsAnimation:
      Math.abs(pointer.targetX - pointer.x) > 0.05 ||
      Math.abs(pointer.targetY - pointer.y) > 0.05 ||
      Math.abs(pointer.targetVelocityX) > 0.05 ||
      Math.abs(pointer.targetVelocityY) > 0.05 ||
      Math.abs(pointer.velocityX) > 0.05 ||
      Math.abs(pointer.velocityY) > 0.05 ||
      Math.abs(pointer.targetInfluence - pointer.influence) > 0.001,
    pointer: {
      influence: pointer.influence,
      radius: interactionRadius ?? responsiveRadius,
      strength: interactionStrength,
      velocityX: pointer.velocityX,
      velocityY: pointer.velocityY,
      x: pointer.x,
      y: pointer.y,
    },
  };
}

export function usePointerInteraction({
  canvasRef,
  clearImmediatelyOnReset,
  interactionRadius,
  interactionStrength,
  interactive,
  onPointerActivity,
  pointerThrottleMs,
}: UsePointerInteractionOptions) {
  const pointerRef = useRef<PointerState>(createPointerState());
  const lastPointerUpdateRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const pointer = pointerRef.current;

    const resetPointer = () => {
      lastPointerUpdateRef.current = 0;

      if (resetPointerState(pointer, clearImmediatelyOnReset)) {
        onPointerActivity?.();
      }
    };

    if (!interactive) {
      resetPointer();
      return;
    }

    const updatePointer = (event: PointerEvent, boost = 1) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      if (!isInside) {
        resetPointer();
        return;
      }

      const now = performance.now();

      if (pointerThrottleMs > 0 && now - lastPointerUpdateRef.current < pointerThrottleMs) {
        return;
      }

      updatePointerState(pointer, x, y, event, boost);
      lastPointerUpdateRef.current = now;
      onPointerActivity?.();
    };

    const handlePointerMove = (event: PointerEvent) => updatePointer(event);
    const handlePointerDown = (event: PointerEvent) => updatePointer(event, 1.18);
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        resetPointer();
      }
    };
    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        resetPointer();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", resetPointer, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("blur", resetPointer);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", resetPointer);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("blur", resetPointer);
    };
  }, [canvasRef, clearImmediatelyOnReset, interactive, onPointerActivity, pointerThrottleMs]);

  return useCallback(
    (width: number, height: number) =>
      readPointerSnapshot(pointerRef.current, width, height, interactive, interactionRadius, interactionStrength),
    [interactionRadius, interactionStrength, interactive],
  );
}

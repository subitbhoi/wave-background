import { useEffect, useState, type RefObject } from "react";
import { THEME_ATTRIBUTE_NAMES } from "../constants";
import type { ResolvedColorMode, WaveColorMode } from "../types";

function elementTheme(element: Element | null): ResolvedColorMode | null {
  if (!element) {
    return null;
  }

  for (const attribute of THEME_ATTRIBUTE_NAMES) {
    const value = element.getAttribute(attribute)?.trim().toLowerCase();

    if (value === "dark" || value === "light") {
      return value;
    }
  }

  if (element.classList.contains("dark")) {
    return "dark";
  }

  if (element.classList.contains("light")) {
    return "light";
  }

  return null;
}

function resolvePageColorMode(canvas: HTMLCanvasElement | null): ResolvedColorMode {
  const elements: Element[] = [];
  let current: Element | null = canvas;

  while (current) {
    elements.push(current);
    current = current.parentElement;
  }

  elements.push(document.documentElement, document.body);

  for (const element of new Set(elements)) {
    const mode = elementTheme(element);

    if (mode) {
      return mode;
    }
  }

  const documentScheme = window.getComputedStyle(document.documentElement).colorScheme;
  const bodyScheme = window.getComputedStyle(document.body).colorScheme;
  const colorSchemes = new Set(`${documentScheme} ${bodyScheme}`.toLowerCase().match(/\b(?:dark|light)\b/g) ?? []);

  if (colorSchemes.has("dark") && !colorSchemes.has("light")) {
    return "dark";
  }

  if (colorSchemes.has("light") && !colorSchemes.has("dark")) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useResolvedTheme(colorMode: WaveColorMode, canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [resolvedColorMode, setResolvedColorMode] = useState<ResolvedColorMode>(
    colorMode === "auto" ? "light" : colorMode,
  );

  useEffect(() => {
    if (colorMode !== "auto") {
      setResolvedColorMode(colorMode);
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const canvas = canvasRef.current;
    const updateColorMode = () => setResolvedColorMode(resolvePageColorMode(canvas));
    const observer = new MutationObserver(updateColorMode);
    const observedElements = new Set<Element>();

    const observeElement = (element: Element | null) => {
      if (!element || observedElements.has(element)) {
        return;
      }

      observedElements.add(element);
      observer.observe(element, {
        attributeFilter: ["class", "data-bs-theme", "data-color-mode", "data-theme", "style"],
        attributes: true,
      });
    };

    let current: Element | null = canvas;

    while (current) {
      observeElement(current);
      current = current.parentElement;
    }

    observeElement(document.documentElement);
    observeElement(document.body);

    const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    schemeQuery.addEventListener("change", updateColorMode);
    updateColorMode();

    return () => {
      observer.disconnect();
      schemeQuery.removeEventListener("change", updateColorMode);
    };
  }, [canvasRef, colorMode]);

  return resolvedColorMode;
}

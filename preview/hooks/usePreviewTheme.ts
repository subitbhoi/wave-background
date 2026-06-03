import { useEffect, useState } from "react";

export type PreviewTheme = "light" | "dark";

const STORAGE_KEY = "wave-background-preview-theme";

function readInitialTheme(): PreviewTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);

    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function usePreviewTheme() {
  const [theme, setTheme] = useState<PreviewTheme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }

    return () => {
      delete document.documentElement.dataset.theme;
      document.documentElement.style.removeProperty("color-scheme");
    };
  }, [theme]);

  return [theme, setTheme] as const;
}

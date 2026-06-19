import { memo, useCallback, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { WaveBackground, type WaveRenderQuality } from "../src";
import "../src/WaveBackground.css";
import {
  ControlPanel,
  type BooleanPreviewSetting,
  type ControlPanelSettings,
  type NumericPreviewSetting,
} from "./components/ControlPanel";
import { usePreviewTheme } from "./hooks/usePreviewTheme";
import "./styles.css";

type PreviewSettings = ControlPanelSettings & {
  quality: WaveRenderQuality;
  seed: number;
};

const DEFAULT_SETTINGS: PreviewSettings = {
  glow: true,
  interactionRadius: 260,
  interactionStrength: 1,
  intensity: 1,
  interactive: true,
  opacity: 1,
  quality: "auto",
  responsive: true,
  seed: 182915,
  speed: 1,
  waveCount: 12,
};

function createSeed() {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }

  return Math.floor(Math.random() * 2 ** 32);
}

const LoginForm = memo(function LoginForm() {
  return (
    <section
      className="login-preview"
      aria-labelledby="login-preview-heading"
    >
      <p className="login-preview__eyebrow">PREVIEW</p>
      <h1 id="login-preview-heading">Welcome</h1>
      <form
        className="login-preview__form"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="preview-email">Email address</label>
        <input
          id="preview-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />

        <label htmlFor="preview-password">Password</label>
        <input
          id="preview-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
        />
        <div className="options">
          <label className="remember">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
          <a href="#login-preview-heading">Forgot password?</a>
        </div>

        <button type="submit">Sign in</button>
      </form>
      <p className="signup">
        New here? <a href="#login-preview-heading">Create an account</a>
      </p>
      <p className="copyright">
        © 2026 Subit Bhoi. Released under the MIT License.
      </p>
    </section>
  );
});

export default function App() {
  const [theme, setTheme] = usePreviewTheme();
  const [settings, setSettings] = useState<PreviewSettings>(DEFAULT_SETTINGS);
  const [controlPanelCollapsed, setControlPanelCollapsed] = useState(false);

  const updateNumberSetting = useCallback(
    (key: NumericPreviewSetting, value: number) => {
      setSettings((currentSettings) => ({ ...currentSettings, [key]: value }));
    },
    [],
  );

  const updateBooleanSetting = useCallback(
    (key: BooleanPreviewSetting, value: boolean) => {
      setSettings((currentSettings) => ({ ...currentSettings, [key]: value }));
    },
    [],
  );

  const updateQuality = useCallback((quality: WaveRenderQuality) => {
    setSettings((currentSettings) =>
      quality === "low-end"
        ? {
            ...currentSettings,
            glow: false,
            interactive: false,
            quality,
            speed: 0,
            waveCount: 10,
          }
        : { ...currentSettings, quality },
    );
  }, []);

  const shuffleSeed = useCallback(() => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      seed: createSeed(),
    }));
  }, []);

  return (
    <main className="preview-shell">
      <WaveBackground
        colorMode={theme}
        glow={settings.glow}
        intensity={settings.intensity}
        interactive={settings.interactive}
        interactionRadius={settings.interactionRadius}
        interactionStrength={settings.interactionStrength}
        opacity={settings.opacity}
        quality={settings.quality}
        responsive={settings.responsive}
        seed={settings.seed}
        speed={settings.speed}
        waveCount={settings.waveCount}
      />

      <LoginForm />

      <ControlPanel
        settings={settings}
        theme={theme}
        collapsed={controlPanelCollapsed}
        onBooleanChange={updateBooleanSetting}
        onCollapseChange={setControlPanelCollapsed}
        onNumberChange={updateNumberSetting}
        onQualityChange={updateQuality}
        onShuffleSeed={shuffleSeed}
        onThemeChange={setTheme}
        quality={settings.quality}
      />

      <Analytics />
    </main>
  );
}

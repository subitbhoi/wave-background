import { memo } from "react";
import type { WaveRenderQuality } from "../../src";
import type { PreviewTheme } from "../hooks/usePreviewTheme";
import { SliderControl } from "./SliderControl";
import { ToggleControl } from "./ToggleControl";

export type NumericPreviewSetting =
  | "interactionRadius"
  | "interactionStrength"
  | "intensity"
  | "opacity"
  | "speed"
  | "waveCount";

export type BooleanPreviewSetting = "glow" | "interactive" | "responsive";

export type ControlPanelSettings = Record<NumericPreviewSetting, number> &
  Record<BooleanPreviewSetting, boolean>;

type ControlPanelProps = {
  onBooleanChange: (key: BooleanPreviewSetting, value: boolean) => void;
  onCollapseChange: (collapsed: boolean) => void;
  onNumberChange: (key: NumericPreviewSetting, value: number) => void;
  onQualityChange: (quality: WaveRenderQuality) => void;
  onShuffleSeed: () => void;
  onThemeChange: (theme: PreviewTheme) => void;
  collapsed: boolean;
  quality: WaveRenderQuality;
  settings: ControlPanelSettings;
  theme: PreviewTheme;
};

export const ControlPanel = memo(function ControlPanel({
  onBooleanChange,
  onCollapseChange,
  onNumberChange,
  onQualityChange,
  onShuffleSeed,
  onThemeChange,
  collapsed,
  quality,
  settings,
  theme,
}: ControlPanelProps) {
  const lowEndLocked = quality === "low-end";

  return (
    <aside
      className={`control-panel${collapsed ? " control-panel--collapsed" : ""}`}
      aria-label="Wave background controls"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className="control-panel__header">
        <h2>Control Panel</h2>
        <div className="control-panel__header-actions">
          <button
            className="control-panel__icon-button"
            type="button"
            aria-expanded={!collapsed}
            aria-controls="wave-preview-controls"
            onClick={() => onCollapseChange(!collapsed)}
          >
            <span className="control-panel__icon" aria-hidden="true">
              {collapsed ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </span>
            <span>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
          <button
            className="control-panel__button"
            type="button"
            onClick={onShuffleSeed}
          >
            New seed
          </button>
        </div>
      </div>

      <div
        id="wave-preview-controls"
        className="control-panel__content"
        hidden={collapsed}
      >
        <div className="segmented-control" aria-label="Theme">
          <button
            type="button"
            aria-pressed={theme === "light"}
            onClick={() => onThemeChange("light")}
          >
            Light
          </button>
          <button
            type="button"
            aria-pressed={theme === "dark"}
            onClick={() => onThemeChange("dark")}
          >
            Dark
          </button>
        </div>

        <div
          className="segmented-control segmented-control--quality"
          aria-label="Render quality"
        >
          {(["auto", "low-end", "low", "medium", "high"] as const).map(
            (qualityOption) => (
              <button
                key={qualityOption}
                type="button"
                aria-pressed={quality === qualityOption}
                onClick={() => onQualityChange(qualityOption)}
              >
                {qualityOption}
              </button>
            ),
          )}
        </div>

        <div className="control-panel__group">
          <SliderControl
            disabled={lowEndLocked}
            label="Waves"
            min={1}
            max={32}
            step={1}
            value={settings.waveCount}
            formatValue={(value) => String(Math.round(value))}
            onChange={(value) => onNumberChange("waveCount", value)}
          />
          <SliderControl
            disabled={lowEndLocked}
            label="Speed"
            min={-1.5}
            max={2.5}
            step={0.1}
            value={settings.speed}
            formatValue={(value) => value.toFixed(1)}
            onChange={(value) => onNumberChange("speed", value)}
          />
          <SliderControl
            label="Intensity"
            min={0}
            max={2.4}
            step={0.1}
            value={settings.intensity}
            formatValue={(value) => value.toFixed(1)}
            onChange={(value) => onNumberChange("intensity", value)}
          />
          <SliderControl
            label="Opacity"
            min={0.1}
            max={1.5}
            step={0.05}
            value={settings.opacity}
            formatValue={(value) => `${Math.round(value * 100)}%`}
            onChange={(value) => onNumberChange("opacity", value)}
          />
        </div>

        <div className="control-panel__group">
          <ToggleControl
            checked={settings.glow}
            disabled={lowEndLocked}
            label="Glow"
            onChange={(value) => onBooleanChange("glow", value)}
          />
          <ToggleControl
            checked={settings.interactive}
            disabled={lowEndLocked}
            label="Interactive"
            onChange={(value) => onBooleanChange("interactive", value)}
          />
          <ToggleControl
            checked={settings.responsive}
            label="Responsive"
            onChange={(value) => onBooleanChange("responsive", value)}
          />
        </div>

        <div className="control-panel__group">
          <SliderControl
            disabled={!settings.interactive}
            label="Pointer radius"
            min={64}
            max={720}
            step={8}
            value={settings.interactionRadius}
            formatValue={(value) => `${Math.round(value)}px`}
            onChange={(value) => onNumberChange("interactionRadius", value)}
          />
          <SliderControl
            disabled={!settings.interactive}
            label="Pointer strength"
            min={0}
            max={2}
            step={0.1}
            value={settings.interactionStrength}
            formatValue={(value) => value.toFixed(1)}
            onChange={(value) => onNumberChange("interactionStrength", value)}
          />
        </div>
      </div>
    </aside>
  );
});

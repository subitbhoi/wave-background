type SliderControlProps = {
  disabled?: boolean;
  formatValue?: (value: number) => string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
};

export function SliderControl({
  disabled = false,
  formatValue = (value) => String(value),
  label,
  max,
  min,
  onChange,
  step,
  value,
}: SliderControlProps) {
  return (
    <label className="slider-control">
      <span className="slider-control__header">
        <span>{label}</span>
        <output>{formatValue(value)}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

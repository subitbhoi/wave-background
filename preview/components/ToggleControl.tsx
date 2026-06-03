type ToggleControlProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function ToggleControl({ checked, disabled = false, label, onChange }: ToggleControlProps) {
  return (
    <button
      className="toggle-control"
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span className="toggle-control__track" aria-hidden="true">
        <span className="toggle-control__thumb" />
      </span>
    </button>
  );
}

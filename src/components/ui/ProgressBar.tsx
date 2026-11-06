interface Props {
  value: number; // 0-100
  label: string;
  className?: string;
}

export function ProgressBar({ value, label, className = '' }: Props) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      className={`h-3 w-full overflow-hidden rounded-full bg-frost-200 ${className}`}
    >
      <div className="h-full rounded-full bg-pistachio transition-all duration-500 ease-out" style={{ width: `${v}%` }} />
    </div>
  );
}

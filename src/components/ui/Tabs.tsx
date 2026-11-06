import type { KeyboardEvent } from 'react';

interface Tab<T extends string> {
  id: T;
  label: string;
}
interface Props<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: Props<T>) {
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="inline-flex gap-1 rounded-2xl bg-frost-200 p-1">
      {tabs.map((t, i) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`rounded-xl px-4 py-2 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${
              active ? 'bg-white text-denim shadow-sm' : 'text-denim/80 hover:text-denim'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

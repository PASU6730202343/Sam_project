import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-pop rounded-2xl bg-white p-6 shadow-xl focus:outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-denim">{title}</h2>
          <button aria-label="ปิดหน้าต่าง" onClick={onClose} className="rounded-xl px-2 text-2xl leading-none text-denim hover:bg-frost-200">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

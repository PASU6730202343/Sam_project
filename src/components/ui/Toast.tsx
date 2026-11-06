/* eslint-disable react-refresh/only-export-components */
import { create } from 'zustand';

type Kind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}
interface ToastState {
  items: ToastItem[];
  push: (message: string, kind?: Kind) => void;
  dismiss: (id: number) => void;
}

let seq = 0;
export const useToast = create<ToastState>((set, get) => ({
  items: [],
  push: (message, kind = 'info') => {
    const id = ++seq;
    set((s) => ({ items: [...s.items, { id, kind, message }] }));
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

const tone: Record<Kind, string> = {
  success: 'bg-pistachio text-ink',
  error: 'bg-red-700 text-white',
  info: 'bg-denim text-white',
};

export function ToastViewport() {
  const { items, dismiss } = useToast();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex animate-slideUp items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ${tone[t.kind]}`}>
          <span>{t.message}</span>
          <button aria-label="ปิดการแจ้งเตือน" onClick={() => dismiss(t.id)} className="text-xl leading-none">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

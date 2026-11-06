import type { Lang } from '../types';
import { speak, ttsMessage } from '../services/speech';
import { useToast } from './ui';

interface Props {
  text: string;
  lang: Lang;
  label: string; // เช่น "ฟังเสียงคำว่า welcome"
}

export function AudioButton({ text, lang, label }: Props) {
  const push = useToast((s) => s.push);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        const status = speak(text, lang);
        if (status !== 'ok') push(ttsMessage(status, lang), 'error');
      }}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-frost-200 text-lg text-denim transition duration-200 hover:scale-110 hover:bg-pistachio focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
    >
      <span aria-hidden>🔊</span>
    </button>
  );
}

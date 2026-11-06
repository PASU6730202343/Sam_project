import type { Lang } from '../types';
import { useProgressStore } from '../features/learning/progressStore';

interface Props {
  wordId: string;
  lang: Lang;
  wordText: string;
}

export function StarButton({ wordId, lang, wordText }: Props) {
  const starred = useProgressStore((s) => s.progress?.starred[lang].includes(wordId) ?? false);
  const toggle = useProgressStore((s) => s.toggleStar);
  return (
    <button
      type="button"
      aria-pressed={starred}
      aria-label={starred ? `ยกเลิกดาวคำว่า ${wordText}` : `ติดดาวคำว่า ${wordText}`}
      onClick={() => void toggle(lang, wordId)}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${
        starred ? 'bg-pistachio text-ink' : 'bg-frost-200 text-denim'
      }`}
    >
      <span aria-hidden>{starred ? '★' : '☆'}</span>
    </button>
  );
}

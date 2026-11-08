import { useState } from 'react';
import { AudioButton } from '../../components/AudioButton';
import { Pinyin } from '../../components/Pinyin';
import { Button } from '../../components/ui';
import type { OrderQuestion } from './types';

interface Props {
  q: OrderQuestion;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

export function OrderView({ q, locked, onAnswer }: Props) {
  // เก็บเป็น index ของ token เพื่อรองรับคำซ้ำ
  const [placed, setPlaced] = useState<number[]>([]);
  const lang = q.lang === 'zh' ? 'zh-CN' : 'en';

  const check = () => onAnswer(placed.map((i) => q.tokens[i]).join('\u0000') === q.answer.join('\u0000'));

  return (
    <div>
      <p className="mb-1 text-lg font-semibold">{q.promptTh}</p>
      <p className="mb-3">ความหมาย: {q.translationTh}</p>

      <div
        aria-label="ประโยคของคุณ"
        lang={lang}
        className="mb-3 flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-denim/30 bg-frost p-3"
      >
        {placed.length === 0 && <span className="text-denim/70">แตะคำด้านล่างเพื่อเรียงประโยค</span>}
        {placed.map((ti, pos) => (
          <button
            key={pos}
            type="button"
            disabled={locked}
            aria-label={`เอาคำว่า ${q.tokens[ti]} ออก`}
            onClick={() => setPlaced(placed.filter((_, p) => p !== pos))}
            className="rounded-xl bg-pistachio px-3 py-2 font-semibold text-ink transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            {q.tokens[ti]}
            <Pinyin text={q.tokens[ti]} lang={q.lang} plain className="!text-xs !text-ink/80" />
          </button>
        ))}
      </div>

      <div lang={lang} className="mb-4 flex flex-wrap gap-2">
        {q.tokens.map((t, i) => (
          <button
            key={i}
            type="button"
            disabled={locked || placed.includes(i)}
            onClick={() => setPlaced([...placed, i])}
            className="rounded-xl border border-frost-200 bg-white px-3 py-2 font-semibold text-denim shadow-sm transition hover:-translate-y-0.5 hover:bg-frost-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim disabled:opacity-30 disabled:hover:translate-y-0"
          >
            {t}
            <Pinyin text={t} lang={q.lang} className="!text-xs" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={locked || placed.length !== q.tokens.length} onClick={check}>
          ตรวจคำตอบ
        </Button>
        <Button variant="ghost" disabled={locked || placed.length === 0} onClick={() => setPlaced([])}>
          ล้าง
        </Button>
        {locked && (
          <>
            <span lang={lang} className="ml-2 font-semibold">
              {q.sentence}
              <Pinyin text={q.sentence} lang={q.lang} />
            </span>
            <AudioButton text={q.sentence} lang={q.lang} label="ฟังประโยคที่ถูกต้อง" />
          </>
        )}
      </div>
    </div>
  );
}

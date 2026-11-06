import { useEffect, useState } from 'react';
import { AudioButton } from '../../components/AudioButton';
import { IconWord } from '../../components/ui';
import { speak } from '../../services/speech';
import type { ChoiceQuestion } from './types';

interface Props {
  q: ChoiceQuestion;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

export function ChoiceView({ q, locked, onAnswer }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  // โจทย์แบบฟังอย่างเดียว: เล่นเสียงให้อัตโนมัติ 1 ครั้งเมื่อขึ้นข้อใหม่ (ถ้าเบราว์เซอร์ไม่ให้เล่น ผู้ใช้กดปุ่มเอง)
  useEffect(() => {
    if (q.audio && !q.display) speak(q.audio.text, q.audio.lang);
  }, [q]);

  return (
    <div>
      <p className="mb-3 text-lg font-semibold">{q.promptTh}</p>
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-frost p-4">
        {q.icon && <IconWord icon={q.icon} size="lg" />}
        <div className="min-w-0 flex-1">
          {q.display ? (
            <p lang={q.displayLang === 'zh' ? 'zh-CN' : q.displayLang} className="text-2xl font-bold sm:text-3xl">
              {q.display}
            </p>
          ) : (
            <p className="text-lg">🎧 กดปุ่มเสียงเพื่อฟัง</p>
          )}
        </div>
        {q.audio && <AudioButton text={q.audio.text} lang={q.audio.lang} label="ฟังเสียงโจทย์อีกครั้ง" />}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2" role="list">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answerIndex;
          const isPicked = picked === i;
          const tone = !locked
            ? 'bg-white hover:bg-frost-200 hover:-translate-y-0.5'
            : isAnswer
              ? 'bg-pistachio text-ink'
              : isPicked
                ? 'bg-red-100 text-red-900 ring-2 ring-red-700'
                : 'bg-white opacity-60';
          return (
            <li key={opt}>
              <button
                type="button"
                disabled={locked}
                lang={q.optionsLang === 'zh' ? 'zh-CN' : q.optionsLang}
                onClick={() => {
                  setPicked(i);
                  onAnswer(isAnswer);
                }}
                className={`w-full rounded-2xl border border-frost-200 px-4 py-3 text-left font-medium text-denim shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${tone}`}
              >
                {locked && isAnswer && <span aria-hidden>✓ </span>}
                {locked && isPicked && !isAnswer && <span aria-hidden>✗ </span>}
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

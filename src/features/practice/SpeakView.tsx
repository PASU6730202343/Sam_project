import { useState } from 'react';
import { AudioButton } from '../../components/AudioButton';
import { MicInput } from '../../components/MicInput';
import { Pinyin } from '../../components/Pinyin';
import { IconWord } from '../../components/ui';
import { useSettings } from '../settings/settingsStore';
import { pronunciationScore } from './matching';
import type { SpeakQuestion } from './types';

interface Props {
  q: SpeakQuestion;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
  onSkip: () => void;
}

/** ออกเสียง: พูดใส่ไมค์เท่านั้น (ไม่มีช่องพิมพ์) ข้ามได้ถ้าไม่สะดวกพูด */
export function SpeakView({ q, locked, onAnswer, onSkip }: Props) {
  const showPinyin = useSettings((s) => s.showPinyin);
  const [heard, setHeard] = useState<{ text: string; score: number } | null>(null);
  const pron = q.lang === 'en' || showPinyin ? q.pron : '';

  return (
    <div>
      <p className="mb-3 text-lg font-semibold">{q.promptTh}</p>
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-frost p-4">
        <IconWord icon={q.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <p lang={q.lang === 'zh' ? 'zh-CN' : 'en'} className="text-3xl font-bold">
            {q.target}
          </p>
          {pron && <p>{pron}</p>}
          <p className="font-medium">{q.meaningTh}</p>
        </div>
        <AudioButton text={q.target} lang={q.lang} label={`ฟังเสียงต้นแบบของคำว่า ${q.target}`} />
      </div>
      {!locked && (
        <MicInput
          lang={q.lang}
          submitLabel="ตรวจคำตอบ"
          onSkip={onSkip}
          onSubmit={(text) => {
            const r = pronunciationScore(text, q.target, q.lang);
            setHeard({ text, score: r.score });
            onAnswer(r.pass);
          }}
        />
      )}
      {locked && heard && (
        <div aria-live="polite" className="mt-3 text-sm">
          <p>
            ระบบได้ยิน: “{heard.text}” · ความคล้าย {Math.round(heard.score * 100)}%
          </p>
          <Pinyin text={heard.text} lang={q.lang} />
        </div>
      )}
    </div>
  );
}

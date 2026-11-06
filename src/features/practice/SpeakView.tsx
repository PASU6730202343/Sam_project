import { useState } from 'react';
import { AudioButton } from '../../components/AudioButton';
import { IconWord } from '../../components/ui';
import { VoiceOrTypeInput } from '../../components/VoiceOrTypeInput';
import { isRecognitionSupported } from '../../services/recognition';
import { pronunciationScore } from './matching';
import type { SpeakQuestion } from './types';

interface Props {
  q: SpeakQuestion;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

export function SpeakView({ q, locked, onAnswer }: Props) {
  const [heard, setHeard] = useState<{ text: string; score: number } | null>(null);
  const micOk = isRecognitionSupported();

  return (
    <div>
      <p className="mb-3 text-lg font-semibold">{q.promptTh}</p>
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-frost p-4">
        <IconWord icon={q.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <p lang={q.lang === 'zh' ? 'zh-CN' : 'en'} className="text-3xl font-bold">
            {q.target}
          </p>
          <p>{q.pron}</p>
          <p className="font-medium">{q.meaningTh}</p>
        </div>
        <AudioButton text={q.target} lang={q.lang} label={`ฟังเสียงต้นแบบของคำว่า ${q.target}`} />
      </div>
      <VoiceOrTypeInput
        lang={q.lang}
        disabled={locked}
        submitLabel="ตรวจคำตอบ"
        placeholder={micOk ? 'กดไมค์แล้วพูด หรือพิมพ์คำที่ได้ยิน' : 'พิมพ์คำตามที่อ่าน'}
        onSubmit={(text) => {
          const r = pronunciationScore(text, q.target, q.lang);
          setHeard({ text, score: r.score });
          onAnswer(r.pass);
        }}
      />
      {!micOk && <p className="mt-2 text-sm">โหมดพิมพ์ตรวจได้แค่การสะกดคำ ไม่ได้ตรวจเสียงพูดจริง</p>}
      {locked && heard && (
        <p className="mt-3 text-sm" aria-live="polite">
          ระบบได้รับ: “{heard.text}” · ความคล้าย {Math.round(heard.score * 100)}%
        </p>
      )}
    </div>
  );
}

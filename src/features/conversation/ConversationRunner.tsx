import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AudioButton } from '../../components/AudioButton';
import { SpeechNotice } from '../../components/SpeechNotice';
import { VoiceOrTypeInput } from '../../components/VoiceOrTypeInput';
import { Badge, Button, Card, ProgressBar } from '../../components/ui';
import { getAdjacentLessons } from '../../data';
import type { Lang, Lesson } from '../../types';
import { useProgressStore, type FinishOutcome } from '../learning/progressStore';
import { PASS_RATIO_CONVERSATION } from '../learning/xp';
import { evaluator, type AnswerEvaluation } from './evaluator';

interface Props {
  lesson: Lesson;
  lang: Lang;
}

interface Turn {
  answer: string;
  evaluation: AnswerEvaluation;
}

export function ConversationRunner({ lesson, lang }: Props) {
  const finish = useProgressStore((s) => s.finishConversation);
  const { role, context, steps } = lesson.conversation;
  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<FinishOutcome | null>(null);
  const [finished, setFinished] = useState(false);
  const htmlLang = lang === 'en' ? 'en' : 'zh-CN';

  const step = steps[index];
  const current = turns[index]; // มีค่า = ตอบขั้นนี้แล้ว (กำลังดูผล)
  const last = index === steps.length - 1;

  const submit = async (answer: string) => {
    setBusy(true);
    try {
      const evaluation = await evaluator.evaluate(step, answer, lang);
      setTurns((t) => [...t, { answer, evaluation }]);
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (!last) return setIndex(index + 1);
    setOutcome(await finish(lesson, lang, turns.filter((t) => t.evaluation.appropriate).length, steps.length));
    setFinished(true);
  };

  const restart = () => {
    setIndex(0);
    setTurns([]);
    setOutcome(null);
    setFinished(false);
  };

  if (finished) {
    const good = turns.filter((t) => t.evaluation.appropriate).length;
    const { next: nextLesson } = getAdjacentLessons(lesson);
    return (
      <Card className="animate-pop text-center">
        <p className="text-5xl" aria-hidden>{outcome?.passed ? '🎉' : '💪'}</p>
        <h2 className="mt-2 text-2xl font-bold">จบสถานการณ์จำลอง</h2>
        <p className="mt-2 text-4xl font-bold">ตอบเหมาะสม {good} / {steps.length} ขั้น</p>
        <div className="mt-3">
          {outcome?.passed ? <Badge tone="green">ผ่านเกณฑ์ ✓</Badge> : <Badge>ยังไม่ผ่าน (ต้องเหมาะสม ≥ {Math.ceil(steps.length * PASS_RATIO_CONVERSATION)} ขั้น)</Badge>}
        </div>
        {outcome?.xp && (
          <p className="mt-3 font-semibold" role="status">
            {outcome.xp.awarded
              ? `ได้ ${outcome.xp.amount} XP (${lang.toUpperCase()}) 🎖️`
              : `บทนี้เคยได้ XP ใน${lang === 'en' ? 'ภาษาอังกฤษ' : 'ภาษาจีน'}แล้ว จึงไม่ได้ XP เพิ่ม`}
          </p>
        )}
        <p className="mt-3">{good === steps.length ? 'ยอดเยี่ยม! ตอบได้เหมาะสมทุกขั้น' : 'ลองทำซ้ำโดยดูคำตอบแนะนำและคำสำคัญของแต่ละขั้น'}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={restart}>ฝึกอีกรอบ</Button>
          <Link to={`/lesson/${lesson.id}/practice`}><Button variant="secondary">ไปแบบฝึก</Button></Link>
          {nextLesson && <Link to={`/lesson/${nextLesson.id}`}><Button variant="ghost">บทถัดไป →</Button></Link>}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-4 bg-pistachio-100">
        <p className="font-bold">🎭 บทบาทของคุณ: {role}</p>
        <p className="mt-1">{context}</p>
      </Card>
      <SpeechNotice lang={lang} />
      <p className="mb-2 font-semibold" aria-live="polite">ขั้นที่ {index + 1} / {steps.length}</p>
      <ProgressBar className="mb-4" value={((index + (current ? 1 : 0)) / steps.length) * 100} label="ความคืบหน้าบทสนทนา" />

      {/* ประวัติขั้นก่อนหน้า */}
      {turns.slice(0, index).map((t, i) => (
        <div key={i} className="mb-3 space-y-2 opacity-70">
          <p lang={htmlLang} className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white p-3">👤 {steps[i].prompt[lang]}</p>
          <p lang={htmlLang} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-pistachio p-3 text-ink">{t.answer}</p>
        </div>
      ))}

      <div key={index} className="animate-slideUp">
        <div className="mb-3 flex max-w-[90%] items-center gap-3 rounded-2xl rounded-bl-sm bg-white p-4 shadow-sm">
          <p lang={htmlLang} className="flex-1 text-lg font-semibold">👤 {step.prompt[lang]}</p>
          <AudioButton text={step.prompt[lang]} lang={lang} label="ฟังคำพูดของลูกค้า" />
        </div>

        {!current ? (
          <VoiceOrTypeInput
            lang={lang}
            disabled={busy}
            submitLabel="ส่งคำตอบ"
            placeholder={lang === 'en' ? 'พิมพ์คำตอบเป็นภาษาอังกฤษ…' : '用中文回答…'}
            onSubmit={(t) => void submit(t)}
          />
        ) : (
          <>
            <p lang={htmlLang} className="mb-3 ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-pistachio p-4 font-medium text-ink">
              {current.answer}
            </p>
            <Card role="status" className={current.evaluation.appropriate ? 'border-pistachio' : 'border-red-300'}>
              <p className="font-bold">{current.evaluation.appropriate ? '✅ เหมาะสม' : '⚠️ ยังไม่เหมาะสม'}</p>
              <p>{current.evaluation.feedbackTh}</p>
              {current.evaluation.matched.length > 0 && <p className="mt-1 text-sm">คำสำคัญที่ใช้ได้: {current.evaluation.matched.join(', ')}</p>}
              {current.evaluation.missing.length > 0 && <p className="text-sm">คำสำคัญที่ยังขาด: {current.evaluation.missing.join(', ')}</p>}
              <h3 className="mt-3 font-bold">ตัวอย่างคำตอบแนะนำ</h3>
              <ul className="mt-1 space-y-2">
                {step.suggestedAnswers[lang].map((a) => (
                  <li key={a} className="flex items-center gap-3 rounded-2xl bg-frost p-3">
                    <span lang={htmlLang} className="flex-1">{a}</span>
                    <AudioButton text={a} lang={lang} label={`ฟังคำตอบแนะนำ ${a}`} />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">💡 {step.tipTh}</p>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => void next()}>{last ? 'ดูผลสรุป' : 'ขั้นถัดไป →'}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

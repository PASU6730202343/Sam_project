import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AudioButton } from '../../components/AudioButton';
import { MicInput } from '../../components/MicInput';
import { Pinyin } from '../../components/Pinyin';
import { SpeechNotice } from '../../components/SpeechNotice';
import { Badge, Button, Card, ProgressBar } from '../../components/ui';
import { getAdjacentLessons } from '../../data';
import type { Lang, Lesson } from '../../types';
import { useProgressStore, type FinishOutcome } from '../learning/progressStore';
import { PASS_RATIO_CONVERSATION, XP_LESSON } from '../learning/xp';
import { evaluator, type AnswerEvaluation } from './evaluator';

interface Props {
  lesson: Lesson;
  lang: Lang;
}

type Turn = { skipped: true } | { skipped: false; answer: string; evaluation: AnswerEvaluation };

export function ConversationRunner({ lesson, lang }: Props) {
  const finishConv = useProgressStore((s) => s.finishConversation);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const { role, context, steps } = lesson.conversation;
  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ outcome: FinishOutcome | null; xp: { awarded: boolean; amount: number } | null } | null>(null);
  const htmlLang = lang === 'en' ? 'en' : 'zh-CN';

  const step = steps[index];
  const current = turns[index]; // มีค่า = ขั้นนี้ตอบ/ข้ามแล้ว (กำลังดูผล)
  const last = index === steps.length - 1;
  const answered = current && !current.skipped ? current : null;

  const submit = async (answer: string) => {
    setBusy(true);
    try {
      const evaluation = await evaluator.evaluate(step, answer, lang);
      setTurns((t) => [...t, { skipped: false, answer, evaluation }]);
    } finally {
      setBusy(false);
    }
  };
  const skip = () => setTurns((t) => [...t, { skipped: true }]);

  // จบขั้นสุดท้าย: บันทึกคะแนนสนทนา แล้วนับว่าเรียนครบทุกขั้น = จบบท (ปลดล็อกบทถัดไป + XP ครั้งแรก)
  const next = async () => {
    if (!last) return setIndex(index + 1);
    const scored = turns.filter((t): t is Extract<Turn, { skipped: false }> => !t.skipped);
    const good = scored.filter((t) => t.evaluation.appropriate).length;
    setBusy(true);
    try {
      const outcome = await finishConv(lesson, lang, good, scored.length, turns.length - scored.length);
      const xp = await completeLesson(lesson, lang);
      setResult({ outcome, xp });
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setTurns([]);
    setResult(null);
  };

  if (result) {
    const scored = turns.filter((t) => !t.skipped);
    const good = turns.filter((t) => !t.skipped && t.evaluation.appropriate).length;
    const skipped = turns.length - scored.length;
    const { next: nextLesson } = getAdjacentLessons(lesson);
    const langName = lang === 'en' ? 'ภาษาอังกฤษ' : 'ภาษาจีน';
    return (
      <Card className="animate-pop text-center">
        <p className="text-5xl" aria-hidden>{scored.length === 0 ? '⏭️' : result.outcome?.passed ? '🎉' : '💪'}</p>
        <h2 className="mt-2 text-2xl font-bold">จบบทเรียนแล้ว!</h2>
        {scored.length === 0 ? (
          <p className="mt-2 text-xl font-bold">ข้ามทุกขั้นสนทนา — ยังไม่มีคะแนน</p>
        ) : (
          <p className="mt-2 text-4xl font-bold">ตอบเหมาะสม {good} / {scored.length} ขั้น</p>
        )}
        {skipped > 0 && scored.length > 0 && <p className="mt-1 text-sm">ข้ามไป {skipped} ขั้น (ไม่นับคะแนน)</p>}
        {scored.length > 0 && (
          <div className="mt-3">
            {result.outcome?.passed ? <Badge tone="green">ผ่านเกณฑ์ ✓</Badge> : <Badge>ควรทบทวน (ต้องเหมาะสม ≥ {Math.ceil(scored.length * PASS_RATIO_CONVERSATION)} ขั้น)</Badge>}
          </div>
        )}
        <p className="mt-3 font-semibold" role="status">
          {result.xp?.awarded
            ? `เรียนครบทุกขั้น ได้ ${result.xp.amount} XP (${lang.toUpperCase()}) 🎖️ และปลดล็อกบทถัดไปแล้ว`
            : `ทบทวนบทนี้แล้ว — เคยได้ ${XP_LESSON} XP ของบทนี้ใน${langName}ไปแล้ว จึงไม่ได้เพิ่ม`}
        </p>
        <p className="mt-1 text-sm">บันทึกคะแนนไว้ที่หน้า “คะแนน” แล้ว</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={restart}>ลองสนทนาอีกรอบ</Button>
          <Link to="/scores"><Button variant="ghost">ดูคะแนน</Button></Link>
          {nextLesson ? (
            <Link to={`/lesson/${nextLesson.id}`}><Button>บทถัดไป: {nextLesson.titleTh} →</Button></Link>
          ) : (
            <Link to="/careers"><Button>จบหมวดนี้แล้ว กลับหมวดอาชีพ →</Button></Link>
          )}
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
          <div lang={htmlLang} className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white p-3">
            👤 {steps[i].prompt[lang]}
            <Pinyin text={steps[i].prompt[lang]} lang={lang} />
          </div>
          <div lang={htmlLang} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-pistachio p-3 text-ink">
            {t.skipped ? <span className="italic">(ข้ามขั้นนี้)</span> : <>{t.answer}<Pinyin text={t.answer} lang={lang} className="!text-ink/80" /></>}
          </div>
        </div>
      ))}

      <div key={index} className="animate-slideUp">
        <div className="mb-3 flex max-w-[90%] items-center gap-3 rounded-2xl rounded-bl-sm bg-white p-4 shadow-sm">
          <div lang={htmlLang} className="flex-1 text-lg font-semibold">
            👤 {step.prompt[lang]}
            <Pinyin text={step.prompt[lang]} lang={lang} />
          </div>
          <AudioButton text={step.prompt[lang]} lang={lang} label="ฟังคำพูดของลูกค้า" />
        </div>

        {/* ตัวอย่างประโยคตอบ: เห็นก่อนตอบ จะได้รู้ว่าควรพูดว่าอะไร */}
        <Card className="mb-4 border-pistachio">
          <h3 className="font-bold">💬 ตัวอย่างประโยคที่ควรตอบ (พูดตามได้เลย)</h3>
          <ul className="mt-2 space-y-2">
            {step.suggestedAnswers[lang].map((a) => (
              <li key={a} className="flex items-center gap-3 rounded-2xl bg-frost p-3">
                <div lang={htmlLang} className="flex-1">
                  {a}
                  <Pinyin text={a} lang={lang} />
                </div>
                <AudioButton text={a} lang={lang} label={`ฟังประโยคตัวอย่าง ${a}`} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">💡 {step.tipTh}</p>
        </Card>

        {!current ? (
          <MicInput lang={lang} disabled={busy} submitLabel="ส่งคำตอบ" onSubmit={(t) => void submit(t)} onSkip={skip} />
        ) : (
          <>
            {answered ? (
              <>
                <div lang={htmlLang} className="mb-3 ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-pistachio p-4 font-medium text-ink">
                  {answered.answer}
                  <Pinyin text={answered.answer} lang={lang} className="!text-ink/80" />
                </div>
                <Card role="status" className={answered.evaluation.appropriate ? 'border-pistachio' : 'border-red-300'}>
                  <p className="font-bold">{answered.evaluation.appropriate ? '✅ เหมาะสม' : '⚠️ ยังไม่เหมาะสม'}</p>
                  <p>{answered.evaluation.feedbackTh}</p>
                  {answered.evaluation.matched.length > 0 && <p className="mt-1 text-sm">คำสำคัญที่ใช้ได้: {answered.evaluation.matched.join(', ')}</p>}
                  {answered.evaluation.missing.length > 0 && <p className="text-sm">คำสำคัญที่ยังขาด: {answered.evaluation.missing.join(', ')}</p>}
                </Card>
              </>
            ) : (
              <Card role="status" className="bg-frost-200">
                <p className="font-bold">ข้ามขั้นนี้ (ไม่นับคะแนน)</p>
                <p className="text-sm">ดูตัวอย่างประโยคด้านบนไว้ฝึกพูดทีหลังได้</p>
              </Card>
            )}
            <div className="mt-4 flex justify-end">
              <Button disabled={busy} onClick={() => void next()}>{last ? 'จบบทเรียน' : 'ขั้นถัดไป →'}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

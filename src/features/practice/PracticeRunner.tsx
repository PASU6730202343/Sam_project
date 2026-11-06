import { useState } from 'react';
import { Badge, Button, Card, ProgressBar } from '../../components/ui';
import type { Lang, Lesson } from '../../types';
import { useProgressStore, type FinishOutcome } from '../learning/progressStore';
import { PASS_RATIO_PRACTICE } from '../learning/xp';
import { useSettings } from '../settings/settingsStore';
import { buildAdvice } from './advice';
import { generateQuestions } from './generators';
import { ChoiceView } from './ChoiceView';
import { OrderView } from './OrderView';
import { SpeakView } from './SpeakView';
import { PRACTICE_KINDS, scoreResults, type PracticeKind, type QuestionResult } from './types';

interface Props {
  lesson: Lesson;
  lang: Lang;
  kind: PracticeKind;
  /** guided = ทำตามลำดับในบทเรียน (ไม่มีปุ่มออก) · review = กลับมาฝึกซ้ำเมื่อเรียนครบแล้ว */
  mode: 'guided' | 'review';
  /** guided: ไปรอบถัดไป/ขั้นถัดไป */
  onNext?: () => void;
  nextLabel?: string;
  /** review: กลับไปเลือกแบบฝึก */
  onExit?: () => void;
}

type Answer = null | 'correct' | 'wrong' | 'skipped'; // null = ยังไม่ตอบ

export function PracticeRunner({ lesson, lang, kind, mode, onNext, nextLabel, onExit }: Props) {
  const finish = useProgressStore((s) => s.finishPractice);
  const showPinyin = useSettings((s) => s.showPinyin);
  const [questions, setQuestions] = useState(() => generateQuestions(lesson, lang, kind, Math.random, showPinyin));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [answered, setAnswered] = useState<Answer>(null);
  const [outcome, setOutcome] = useState<FinishOutcome | null>(null);
  const [finished, setFinished] = useState(false);
  const meta = PRACTICE_KINDS.find((k) => k.id === kind)!;

  const q = questions[index];
  const last = index === questions.length - 1;
  const locked = answered !== null;

  const record = (correct: boolean) => {
    setAnswered(correct ? 'correct' : 'wrong');
    setResults((r) => [...r, { questionId: q.id, kind: q.kind, wordId: q.wordId, correct }]);
  };
  const skip = () => {
    setAnswered('skipped');
    setResults((r) => [...r, { questionId: q.id, kind: q.kind, wordId: q.wordId, correct: false, skipped: true }]);
  };

  const next = async () => {
    if (!last) {
      setIndex(index + 1);
      setAnswered(null);
      return;
    }
    const { correct, total, skipped } = scoreResults(results);
    setOutcome(await finish(lesson, lang, kind, correct, total, skipped));
    setFinished(true);
  };

  const restart = () => {
    setQuestions(generateQuestions(lesson, lang, kind, Math.random, showPinyin));
    setIndex(0);
    setResults([]);
    setAnswered(null);
    setOutcome(null);
    setFinished(false);
  };

  if (finished) {
    const { correct, total, skipped } = scoreResults(results);
    const pct = total ? Math.round((correct / total) * 100) : null;
    const advice = buildAdvice(kind, results, lesson, lang);
    return (
      <Card className="animate-pop text-center">
        <p className="text-5xl" aria-hidden>{pct === null ? '⏭️' : outcome?.passed ? '🎉' : '💪'}</p>
        <h2 className="mt-2 text-2xl font-bold">สรุปผล: {meta.titleTh}</h2>
        {pct === null ? (
          <p className="mt-2 text-xl font-bold">ข้ามทุกข้อ — ยังไม่มีคะแนน</p>
        ) : (
          <p className="mt-2 text-5xl font-bold">
            {correct} / {total} <span className="text-2xl">({pct}%)</span>
          </p>
        )}
        {skipped > 0 && pct !== null && <p className="mt-1 text-sm">ข้ามไป {skipped} ข้อ (ไม่นับคะแนน)</p>}
        {pct !== null && (
          <div className="mt-3">
            {outcome?.passed ? <Badge tone="green">ผ่านเกณฑ์ ✓</Badge> : <Badge>ควรทบทวน (เกณฑ์ ≥ {PASS_RATIO_PRACTICE * 100}%)</Badge>}
          </div>
        )}
        <p className="mt-2 text-sm">บันทึกคะแนนไว้ที่หน้า “คะแนน” แล้ว</p>
        <ul className="mx-auto mt-4 max-w-xl space-y-1 text-left">
          {advice.map((a) => (
            <li key={a}>💡 {a}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant={mode === 'guided' ? 'secondary' : 'primary'} onClick={restart}>
            {mode === 'guided' ? 'ลองอีกรอบ' : 'ฝึกอีกรอบ'}
          </Button>
          {mode === 'guided' && onNext && <Button onClick={onNext}>{nextLabel ?? 'ไปต่อ →'}</Button>}
          {mode === 'review' && onExit && (
            <Button variant="secondary" onClick={onExit}>
              เลือกแบบฝึกอื่น
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{meta.icon} {meta.titleTh}</h2>
        {mode === 'review' && onExit && (
          <Button size="sm" variant="ghost" onClick={onExit}>
            ออก
          </Button>
        )}
      </div>
      <p className="mb-2 font-semibold" aria-live="polite">ข้อ {index + 1} / {questions.length}</p>
      <ProgressBar className="mb-4" value={((index + (locked ? 1 : 0)) / questions.length) * 100} label="ความคืบหน้าแบบฝึก" />
      <Card key={q.id} className="animate-slideUp">
        {q.type === 'choice' && <ChoiceView q={q} locked={locked} onAnswer={record} />}
        {q.type === 'speak' && <SpeakView q={q} locked={locked} onAnswer={record} onSkip={skip} />}
        {q.type === 'order' && <OrderView q={q} locked={locked} onAnswer={record} />}

        {answered !== null && (
          <div
            role="status"
            className={`mt-4 rounded-2xl p-4 ${answered === 'correct' ? 'bg-pistachio-100 text-ink' : answered === 'skipped' ? 'bg-frost-200 text-denim' : 'bg-red-50 text-red-900'}`}
          >
            <p className="font-bold">{answered === 'correct' ? 'ถูกต้อง! 🎯' : answered === 'skipped' ? 'ข้ามข้อนี้ (ไม่นับคะแนน)' : 'ยังไม่ถูก'}</p>
            <p>{q.explainTh}</p>
          </div>
        )}
      </Card>
      <div className="mt-4 flex justify-end">
        <Button disabled={!locked} onClick={() => void next()}>
          {last ? 'ดูผลคะแนน' : 'ข้อถัดไป →'}
        </Button>
      </div>
    </div>
  );
}

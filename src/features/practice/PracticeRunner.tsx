import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, ProgressBar } from '../../components/ui';
import { getAdjacentLessons } from '../../data';
import type { Lang, Lesson } from '../../types';
import { useProgressStore, type FinishOutcome } from '../learning/progressStore';
import { PASS_RATIO_PRACTICE } from '../learning/xp';
import { buildAdvice } from './advice';
import { generateQuestions } from './generators';
import { ChoiceView } from './ChoiceView';
import { OrderView } from './OrderView';
import { SpeakView } from './SpeakView';
import { PRACTICE_KINDS, type PracticeKind, type QuestionResult } from './types';

interface Props {
  lesson: Lesson;
  lang: Lang;
  kind: PracticeKind;
  onExit: () => void;
}

export function PracticeRunner({ lesson, lang, kind, onExit }: Props) {
  const finish = useProgressStore((s) => s.finishPractice);
  const [questions, setQuestions] = useState(() => generateQuestions(lesson, lang, kind));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [answered, setAnswered] = useState<boolean | null>(null); // null = ยังไม่ตอบ
  const [outcome, setOutcome] = useState<FinishOutcome | null>(null);
  const [finished, setFinished] = useState(false);
  const meta = PRACTICE_KINDS.find((k) => k.id === kind)!;

  const q = questions[index];
  const last = index === questions.length - 1;

  const record = (correct: boolean) => {
    setAnswered(correct);
    setResults((r) => [...r, { questionId: q.id, kind: q.kind, wordId: q.wordId, correct }]);
  };

  const next = async () => {
    if (!last) {
      setIndex(index + 1);
      setAnswered(null);
      return;
    }
    const correct = results.filter((r) => r.correct).length;
    setOutcome(await finish(lesson, lang, correct, results.length));
    setFinished(true);
  };

  const restart = () => {
    setQuestions(generateQuestions(lesson, lang, kind));
    setIndex(0);
    setResults([]);
    setAnswered(null);
    setOutcome(null);
    setFinished(false);
  };

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const pct = Math.round((correct / results.length) * 100);
    const advice = buildAdvice(kind, results, lesson, lang);
    const { next: nextLesson } = getAdjacentLessons(lesson);
    return (
      <Card className="animate-pop text-center">
        <p className="text-5xl" aria-hidden>{outcome?.passed ? '🎉' : '💪'}</p>
        <h2 className="mt-2 text-2xl font-bold">สรุปผล: {meta.titleTh}</h2>
        <p className="mt-2 text-5xl font-bold">
          {correct} / {results.length} <span className="text-2xl">({pct}%)</span>
        </p>
        <div className="mt-3">
          {outcome?.passed ? <Badge tone="green">ผ่านเกณฑ์ ✓</Badge> : <Badge>ยังไม่ผ่าน (ต้อง ≥ {PASS_RATIO_PRACTICE * 100}%)</Badge>}
        </div>
        {outcome?.xp && (
          <p className="mt-3 font-semibold" role="status">
            {outcome.xp.awarded
              ? `ได้ ${outcome.xp.amount} XP (${lang.toUpperCase()}) 🎖️`
              : `บทนี้เคยได้ XP ใน${lang === 'en' ? 'ภาษาอังกฤษ' : 'ภาษาจีน'}แล้ว จึงไม่ได้ XP เพิ่ม`}
          </p>
        )}
        <ul className="mx-auto mt-4 max-w-xl space-y-1 text-left">
          {advice.map((a) => (
            <li key={a}>💡 {a}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={restart}>ฝึกอีกรอบ</Button>
          <Button variant="secondary" onClick={onExit}>เลือกแบบฝึกอื่น</Button>
          <Link to={`/lesson/${lesson.id}/conversation`}><Button variant="ghost">ฝึกสนทนา</Button></Link>
          {nextLesson && <Link to={`/lesson/${nextLesson.id}`}><Button variant="ghost">บทถัดไป →</Button></Link>}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{meta.icon} {meta.titleTh}</h2>
        <Button size="sm" variant="ghost" onClick={onExit}>ออก</Button>
      </div>
      <p className="mb-2 font-semibold" aria-live="polite">ข้อ {index + 1} / {questions.length}</p>
      <ProgressBar className="mb-4" value={((index + (answered !== null ? 1 : 0)) / questions.length) * 100} label="ความคืบหน้าแบบฝึก" />
      <Card key={q.id} className="animate-slideUp">
        {q.type === 'choice' && <ChoiceView q={q} locked={answered !== null} onAnswer={record} />}
        {q.type === 'speak' && <SpeakView q={q} locked={answered !== null} onAnswer={record} />}
        {q.type === 'order' && <OrderView q={q} locked={answered !== null} onAnswer={record} />}

        {answered !== null && (
          <div role="status" className={`mt-4 rounded-2xl p-4 ${answered ? 'bg-pistachio-100 text-ink' : 'bg-red-50 text-red-900'}`}>
            <p className="font-bold">{answered ? 'ถูกต้อง! 🎯' : 'ยังไม่ถูก'}</p>
            <p>{q.explainTh}</p>
          </div>
        )}
      </Card>
      <div className="mt-4 flex justify-end">
        <Button disabled={answered === null} onClick={() => void next()}>
          {last ? 'ดูผลคะแนน' : 'ข้อถัดไป →'}
        </Button>
      </div>
    </div>
  );
}

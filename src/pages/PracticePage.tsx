import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Card } from '../components/ui';
import { LessonFrame } from '../components/layout/LessonFrame';
import { SpeechNotice } from '../components/SpeechNotice';
import { stepPath } from '../features/learning/access';
import { useJournal } from '../features/learning/journal';
import { attemptPct, summarizeLesson, type KindSummary } from '../features/learning/scores';
import { PASS_RATIO_PRACTICE } from '../features/learning/xp';
import { PracticeRunner } from '../features/practice/PracticeRunner';
import { PRACTICE_KINDS, practiceRounds, type PracticeKind } from '../features/practice/types';
import { useSettings } from '../features/settings/settingsStore';
import type { Lesson } from '../types';

const meta = (k: PracticeKind) => PRACTICE_KINDS.find((x) => x.id === k)!;

function scoreText(s?: KindSummary) {
  if (!s?.best) return 'ยังไม่ได้ทำ';
  const p = attemptPct(s.best);
  return p === null ? 'ข้ามทั้งรอบ' : `ดีที่สุด ${p}%`;
}

/** ขั้นฝึกฝนระหว่างเรียน: ทำทุกรอบตามลำดับ (ไม่เลือกข้ามเองได้) */
function GuidedPractice({ lesson, rounds }: { lesson: Lesson; rounds: PracticeKind[] }) {
  const lang = useSettings((s) => s.lang);
  const markStep = useJournal((s) => s.markStep);
  const attempts = useJournal((s) => s.data.attempts);
  const navigate = useNavigate();
  const sum = summarizeLesson(attempts, lang, lesson.id);
  // เริ่มที่รอบแรกที่ยังไม่เคยทำ (กลับมาทำต่อจากที่ค้างได้); ถ้าทำครบทุกรอบแล้วแต่ยังไม่ได้กดไปต่อ ให้อยู่ที่รอบสุดท้าย
  const [picked, setPicked] = useState<PracticeKind>(() => rounds.find((k) => !sum[k]) ?? rounds[rounds.length - 1]);
  const active = rounds.includes(picked) ? picked : rounds[0];
  const i = rounds.indexOf(active);
  const lastRound = i === rounds.length - 1;

  const next = () => {
    if (!lastRound) return setPicked(rounds[i + 1]);
    markStep(lang, lesson.id, 'practice');
    navigate(stepPath(lesson.id, 'conversation'));
  };

  return (
    <>
      <SpeechNotice lang={lang} />
      <p className="mb-3">
        ทำแบบฝึกทีละรอบตามลำดับ ({rounds.length} รอบ รอบละ {lesson.words.length} ข้อ) เกณฑ์ผ่าน ≥ {PASS_RATIO_PRACTICE * 100}% ถ้ายังไม่ผ่านลองทำซ้ำได้ ·{' '}
        <Link className="underline" to="/scores">ดูคะแนนทั้งหมด</Link>
      </p>
      <ol aria-label="รอบของแบบฝึก" className="mb-5 flex flex-wrap gap-2">
        {rounds.map((k, idx) => {
          const done = !!sum[k];
          const cur = k === active;
          return (
            <li
              key={k}
              aria-current={cur ? 'step' : undefined}
              className={`rounded-2xl px-3 py-1.5 text-sm font-semibold ${cur ? 'bg-denim text-white' : done ? 'bg-pistachio-100 text-ink' : 'bg-white text-denim/70'}`}
            >
              <span aria-hidden>{done && !cur ? '✓' : meta(k).icon}</span> {idx + 1}. {meta(k).titleTh}
              {done && <span className="font-normal"> · {scoreText(sum[k])}</span>}
            </li>
          );
        })}
      </ol>
      <PracticeRunner
        key={`${lang}:${active}`}
        lesson={lesson}
        lang={lang}
        kind={active}
        mode="guided"
        onNext={next}
        nextLabel={lastRound ? 'จบขั้นนี้ ไปต่อ: สนทนา →' : `ไปรอบถัดไป: ${meta(rounds[i + 1]).titleTh} →`}
      />
    </>
  );
}

/** เรียนขั้นนี้ครบแล้ว: กลับมาเลือกฝึกซ้ำแบบไหนก็ได้ */
function PracticeHub({ lesson, rounds }: { lesson: Lesson; rounds: PracticeKind[] }) {
  const lang = useSettings((s) => s.lang);
  const attempts = useJournal((s) => s.data.attempts);
  const sum = summarizeLesson(attempts, lang, lesson.id);
  const [kind, setKind] = useState<PracticeKind | null>(null);

  if (kind) return <PracticeRunner key={`${lang}:${kind}`} lesson={lesson} lang={lang} kind={kind} mode="review" onExit={() => setKind(null)} />;

  return (
    <>
      <SpeechNotice lang={lang} />
      <p className="mb-4">
        คุณผ่านขั้นฝึกฝนของบทนี้แล้ว เลือกแบบฝึกที่อยากฝึกซ้ำ (บันทึกคะแนนทุกรอบ) ·{' '}
        <Link className="underline" to="/scores">ดูคะแนนทั้งหมด</Link>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rounds.map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
            <Card interactive className="h-full">
              <div className="text-4xl" aria-hidden>{meta(k).icon}</div>
              <h2 className="mt-2 text-lg font-bold">{meta(k).titleTh}</h2>
              <p className="text-sm">{meta(k).descTh}</p>
              <Badge className="mt-3" tone={sum[k] ? 'green' : 'blue'}>{scoreText(sum[k])}</Badge>
            </Card>
          </button>
        ))}
      </div>
    </>
  );
}

export default function PracticePage() {
  return (
    <LessonFrame current="practice" title="ฝึกฝน">
      {(lesson, access) => <PracticeBody lesson={lesson} stepDone={access.done.practice} />}
    </LessonFrame>
  );
}

function PracticeBody({ lesson, stepDone }: { lesson: Lesson; stepDone: boolean }) {
  const { lang, showPinyin } = useSettings();
  const rounds = practiceRounds(lang, showPinyin);
  return (
    <>
      {lang === 'zh' && !showPinyin && (
        <p className="mb-3 rounded-2xl bg-frost-200 p-3 text-sm">รอบ “อ่านคำศัพท์” (เลือกพินอิน) ถูกข้ามให้ เพราะคุณเลือกไม่แสดงพินอิน — เปิดพินอินได้ที่สวิตช์ด้านบน</p>
      )}
      {stepDone ? <PracticeHub lesson={lesson} rounds={rounds} /> : <GuidedPractice lesson={lesson} rounds={rounds} />}
    </>
  );
}

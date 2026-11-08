import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, ProgressBar } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { SpeechNotice } from '../components/SpeechNotice';
import { ChoiceView } from '../features/practice/ChoiceView';
import { buildExam, EXAM_PASS_RATIO, useExam } from '../features/exam/exam';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from '../hooks/useProgress';
import { getCareer, getLessonsByCareer } from '../data';
import type { Lang } from '../types';
import type { ChoiceQuestion } from '../features/practice/types';

export default function ExamPage() {
  const { careerId = '' } = useParams();
  const lang = useSettings((s) => s.lang);
  const { progress } = useProgress();
  const career = getCareer(careerId);
  const lessons = getLessonsByCareer(careerId);
  const back = (
    <Link className="underline" to={`/careers/${careerId}`}>
      ← กลับไปหมวด
    </Link>
  );

  if (!career || lessons.length === 0) return <PageHeader title="ไม่พบหมวดอาชีพนี้">{back}</PageHeader>;
  if (!progress) return <p>กำลังโหลด…</p>;

  const doneIds = new Set(progress.completed.filter((c) => c.lang === lang).map((c) => c.lessonId));
  const left = lessons.filter((l) => !doneIds.has(l.id)).length;
  if (left > 0) {
    return (
      <>
        <PageHeader title={`สอบท้ายหมวด ${career.nameTh}`}>{back}</PageHeader>
        <Card>
          <p>🔒 ต้องเรียนจบครบทุกบทในหมวดนี้ก่อน (ภาษา {lang.toUpperCase()}) เหลืออีก {left} บท</p>
        </Card>
      </>
    );
  }
  // key ตามภาษา: สลับภาษากลางคันแล้วเริ่มข้อสอบใหม่
  return <ExamRun key={`${lang}:${careerId}`} careerId={careerId} lang={lang} title={career.nameTh} backLink={back} />;
}

function ExamRun({ careerId, lang, title, backLink }: { careerId: string; lang: Lang; title: string; backLink: ReactNode }) {
  const record = useExam((s) => s.record);
  const best = useExam((s) => s.records[`${lang}:${careerId}`]);
  const [questions, setQuestions] = useState<ChoiceQuestion[]>(() => buildExam(careerId, lang));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState<null | boolean>(null);
  const [finished, setFinished] = useState(false);

  const q = questions[index];
  const last = index === questions.length - 1;
  const total = questions.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const passed = total > 0 && correct / total >= EXAM_PASS_RATIO;

  const next = () => {
    if (!last) {
      setIndex(index + 1);
      setAnswered(null);
      return;
    }
    record(lang, careerId, correct, total);
    setFinished(true);
  };
  const restart = () => {
    setQuestions(buildExam(careerId, lang));
    setIndex(0);
    setCorrect(0);
    setAnswered(null);
    setFinished(false);
  };

  if (finished) {
    return (
      <>
        <PageHeader title={`สอบท้ายหมวด ${title}`}>{backLink}</PageHeader>
        <Card className="animate-pop text-center">
          <p className="text-5xl" aria-hidden>{passed ? '🏆' : '💪'}</p>
          <p className="mt-2 text-5xl font-bold">
            {correct} / {total} <span className="text-2xl">({pct}%)</span>
          </p>
          <div className="mt-3">
            {passed ? <Badge tone="green">สอบผ่าน ✓</Badge> : <Badge>ยังไม่ผ่าน (เกณฑ์ ≥ {EXAM_PASS_RATIO * 100}%)</Badge>}
          </div>
          {best && <p className="mt-2 text-sm">คะแนนดีที่สุดของคุณ {best.best}% · สอบแล้ว {best.attempts} ครั้ง</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={restart}>สอบอีกครั้ง</Button>
            <Link to={`/careers/${careerId}`}>
              <Button>กลับไปหมวด</Button>
            </Link>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`สอบท้ายหมวด ${title}`} subtitle={`ผ่านเมื่อได้ ≥ ${EXAM_PASS_RATIO * 100}% · ${total} ข้อ จากทุกบทในหมวด`}>
        {backLink}
      </PageHeader>
      <SpeechNotice lang={lang} />
      <p className="mb-2 font-semibold" aria-live="polite">ข้อ {index + 1} / {total}</p>
      <ProgressBar className="mb-4" value={((index + (answered !== null ? 1 : 0)) / total) * 100} label="ความคืบหน้าการสอบ" />
      <Card key={q.id} className="animate-slideUp">
        <ChoiceView
          q={q}
          locked={answered !== null}
          onAnswer={(ok) => {
            setAnswered(ok);
            if (ok) setCorrect((c) => c + 1);
          }}
        />
        {answered !== null && (
          <div role="status" className={`mt-4 rounded-2xl p-4 ${answered ? 'bg-pistachio-100 text-ink' : 'bg-red-50 text-red-900'}`}>
            <p className="font-bold">{answered ? 'ถูกต้อง! 🎯' : 'ยังไม่ถูก'}</p>
            <p>{q.explainTh}</p>
          </div>
        )}
      </Card>
      <div className="mt-4 flex justify-end">
        <Button disabled={answered === null} onClick={next}>
          {last ? 'ดูผลสอบ' : 'ข้อถัดไป →'}
        </Button>
      </div>
    </>
  );
}

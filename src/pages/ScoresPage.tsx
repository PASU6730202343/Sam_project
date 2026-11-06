import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Tabs } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { getCareer, getLesson } from '../data';
import { useJournal, type Attempt, type AttemptKind } from '../features/learning/journal';
import { attemptPct, averageBestPct, lessonsWithAttempts, summarizeLesson } from '../features/learning/scores';
import { lessonTitle } from '../features/learning/wordView';
import { PRACTICE_KINDS } from '../features/practice/types';
import { useSettings } from '../features/settings/settingsStore';
import type { Lang } from '../types';

const KINDS: { id: AttemptKind; icon: string; titleTh: string }[] = [
  ...PRACTICE_KINDS.map((k) => ({ id: k.id as AttemptKind, icon: k.icon, titleTh: k.titleTh })),
  { id: 'conversation', icon: '💬', titleTh: 'สนทนา' },
];
const kindMeta = (k: AttemptKind) => KINDS.find((x) => x.id === k)!;

const scoreLabel = (a: Pick<Attempt, 'correct' | 'total' | 'skipped'>) => {
  const p = attemptPct(a);
  return p === null ? 'ข้ามทั้งรอบ' : `${a.correct}/${a.total} (${p}%)`;
};

/** คะแนนทุกรอบของแบบฝึก/สนทนา — ดูได้ทันทีหลังทำ ไม่ต้องรอเรียนจบบท */
export default function ScoresPage() {
  const current = useSettings((s) => s.lang);
  const [tab, setTab] = useState<Lang>(current);
  const attempts = useJournal((s) => s.data.attempts);
  const lessonIds = lessonsWithAttempts(attempts, tab);
  const avg = averageBestPct(attempts, tab);
  const rounds = attempts.filter((a) => a.lang === tab).length;

  return (
    <>
      <PageHeader title="คะแนน" subtitle="คะแนนแบบฝึกและสนทนาของแต่ละบท ดูได้ทุกเมื่อ ไม่ต้องรอเรียนจบบท">
        <Tabs
          label="เลือกภาษาที่ดูคะแนน"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'en', label: 'English' },
            { id: 'zh', label: '中文' },
          ]}
        />
      </PageHeader>

      {lessonIds.length === 0 ? (
        <Card className="text-center">
          <p className="mb-3">ยังไม่มีคะแนนในภาษานี้ ทำแบบฝึกหรือสนทนาในบทเรียน แล้วคะแนนจะมาแสดงที่นี่ทันที</p>
          <Link to="/careers">
            <Button>ไปเลือกบทเรียน</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Card className="text-center">
              <p className="text-3xl font-bold">{avg === null ? '-' : `${avg}%`}</p>
              <p className="text-sm">คะแนนเฉลี่ย (รอบที่ดีที่สุดของแต่ละแบบ)</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold">{lessonIds.length}</p>
              <p className="text-sm">บทที่เริ่มทำแบบฝึก</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold">{rounds}</p>
              <p className="text-sm">รอบที่ทำทั้งหมด</p>
            </Card>
          </div>

          <ul className="space-y-3">
            {lessonIds.map((id) => {
              const lesson = getLesson(id);
              if (!lesson) return null;
              const sum = summarizeLesson(attempts, tab, id);
              const history = attempts.filter((a) => a.lang === tab && a.lessonId === id).reverse();
              return (
                <li key={id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">
                          {getCareer(lesson.careerId)?.icon} บท {lesson.order}: {lesson.titleTh}
                        </p>
                        <p lang={tab === 'en' ? 'en' : 'zh-CN'} className="text-sm">
                          {lessonTitle(lesson, tab)}
                        </p>
                      </div>
                      <Link className="text-sm underline" to={`/lesson/${id}`}>ไปที่บทนี้</Link>
                    </div>

                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="คะแนนดีที่สุดของแต่ละแบบ">
                      {KINDS.filter((k) => sum[k.id]).map((k) => {
                        const best = sum[k.id]!.best!;
                        return (
                          <li key={k.id}>
                            <Badge tone={best.passed && attemptPct(best) !== null ? 'green' : 'blue'}>
                              <span aria-hidden>{k.icon}</span> {k.titleTh}: {attemptPct(best) === null ? 'ข้าม' : `${attemptPct(best)}%`}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>

                    <details className="mt-3">
                      <summary className="cursor-pointer font-semibold">ดูรายละเอียดทุกรอบ ({history.length})</summary>
                      <ul className="mt-2 divide-y divide-frost-200">
                        {history.map((a, i) => (
                          <li key={`${a.at}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                            <div>
                              <p className="font-medium">
                                <span aria-hidden>{kindMeta(a.kind).icon}</span> {kindMeta(a.kind).titleTh}
                              </p>
                              <p className="text-sm">{new Date(a.at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{scoreLabel(a)}</p>
                              <p className="text-sm">
                                {attemptPct(a) === null ? '' : a.passed ? 'ผ่านเกณฑ์' : 'ควรทบทวน'}
                                {a.skipped > 0 && ` · ข้าม ${a.skipped} ข้อ`}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="mt-4 text-sm">คะแนนเก็บไว้ในเครื่องนี้ (เบราว์เซอร์นี้) ไม่ซิงก์ข้ามอุปกรณ์</p>
    </>
  );
}

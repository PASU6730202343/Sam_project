import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, ProgressBar } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pinyin } from '../components/Pinyin';
import { careers, getCareer, getLessonsByCareer } from '../data';
import { isLessonUnlocked } from '../features/learning/access';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from '../hooks/useProgress';
import { lessonTitle } from '../features/learning/wordView';
import { useExam } from '../features/exam/exam';

export default function CareersPage() {
  const { careerId } = useParams();
  const lang = useSettings((s) => s.lang);
  const { progress } = useProgress();
  const career = careerId ? getCareer(careerId) : undefined;
  const doneIds = new Set(progress?.completed.filter((c) => c.lang === lang).map((c) => c.lessonId));
  const examRecords = useExam((s) => s.records);

  if (careerId && !career) {
    return (
      <>
        <PageHeader title="ไม่พบหมวดอาชีพนี้" />
        <Link className="underline" to="/careers">
          กลับไปหมวดอาชีพทั้งหมด
        </Link>
      </>
    );
  }

  if (career) {
    const lessons = getLessonsByCareer(career.id);
    const done = lessons.filter((l) => doneIds.has(l.id)).length;
    return (
      <>
        <PageHeader title={`${career.icon} ${career.nameTh}`} subtitle={career.descriptionTh}>
          <Link className="underline" to="/careers">
            ← ทุกหมวด
          </Link>
        </PageHeader>
        {lessons.length === 0 ? (
          <Card>
            <p>เนื้อหาหมวดนี้กำลังจัดทำ จะเปิดให้เรียนเร็วๆ นี้</p>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <p className="mb-2 font-semibold">
                ความคืบหน้า ({lang.toUpperCase()}): {done} / {lessons.length} บท
              </p>
              <ProgressBar value={(done / lessons.length) * 100} label={`ความคืบหน้าหมวด ${career.nameTh}`} />
            </Card>
            {(() => {
              const rec = examRecords[`${lang}:${career.id}`];
              const ready = done === lessons.length;
              return (
                <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">🏆 สอบท้ายหมวด</p>
                    <p className="text-sm">
                      {rec ? `คะแนนดีที่สุด ${rec.best}% · ${rec.passed ? 'สอบผ่านแล้ว' : 'ยังไม่ผ่าน'}` : ready ? 'พร้อมสอบแล้ว' : `เรียนให้จบทุกบทเพื่อปลดล็อก (เหลือ ${lessons.length - done} บท)`}
                    </p>
                  </div>
                  {ready ? (
                    <Link to={`/careers/${career.id}/exam`}>
                      <Button>{rec ? 'สอบอีกครั้ง' : 'เริ่มสอบ'}</Button>
                    </Link>
                  ) : (
                    <Badge>🔒 ล็อก</Badge>
                  )}
                </Card>
              );
            })()}
            <p className="mb-3 text-sm">เรียนไปตามลำดับ: จบบทก่อนหน้าแล้วบทถัดไปจึงจะปลดล็อก</p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {lessons.map((l, i) => {
                const unlocked = isLessonUnlocked(l, doneIds);
                const body = (
                  <Card interactive={unlocked} className={`flex h-full items-center gap-4 ${unlocked ? '' : 'opacity-60'}`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pistachio-100 text-xl font-bold text-ink">
                      <span aria-hidden>{unlocked ? l.order : '🔒'}</span>
                      <span className="sr-only">บท {l.order}</span>
                    </span>
                    <div className="flex-1">
                      <p className="font-bold">{l.titleTh}</p>
                      <p lang={lang === 'en' ? 'en' : 'zh-CN'} className="text-sm">
                        {lessonTitle(l, lang)}
                      </p>
                      <Pinyin text={lessonTitle(l, lang)} lang={lang} />
                      {!unlocked && <p className="mt-1 text-xs">ล็อก — จบบท {lessons[i - 1].order} ก่อน</p>}
                    </div>
                    {doneIds.has(l.id) && <Badge tone="green">จบแล้ว ✓</Badge>}
                  </Card>
                );
                return <li key={l.id}>{unlocked ? <Link to={`/lesson/${l.id}`}>{body}</Link> : <div aria-disabled="true">{body}</div>}</li>;
              })}
            </ol>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="หมวดอาชีพ" subtitle="8 หมวด หมวดละ 8 บท" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {careers.map((c) => {
          const total = getLessonsByCareer(c.id).length;
          return (
            <Link key={c.id} to={`/careers/${c.id}`}>
              <Card interactive className="h-full">
                <div className="text-4xl" aria-hidden>
                  {c.icon}
                </div>
                <h2 className="mt-2 text-lg font-bold">{c.nameTh}</h2>
                <p className="text-sm">{lang === 'en' ? c.nameEn : c.nameZh}</p>
                <p className="mt-2 text-sm">{c.descriptionTh}</p>
                <Badge className="mt-3" tone={total ? 'green' : 'blue'}>
                  {total ? `${total} บท` : 'เร็วๆ นี้'}
                </Badge>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}

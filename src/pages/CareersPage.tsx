import { Link, useParams } from 'react-router-dom';
import { Badge, Card, ProgressBar } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { careers, getCareer, getLessonsByCareer } from '../data';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from '../hooks/useProgress';
import { lessonTitle } from '../features/learning/wordView';

export default function CareersPage() {
  const { careerId } = useParams();
  const lang = useSettings((s) => s.lang);
  const { progress } = useProgress();
  const career = careerId ? getCareer(careerId) : undefined;
  const doneIds = new Set(progress?.completed.filter((c) => c.lang === lang).map((c) => c.lessonId));

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
            <ol className="grid gap-3 sm:grid-cols-2">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link to={`/lesson/${l.id}`}>
                    <Card interactive className="flex h-full items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pistachio-100 text-xl font-bold text-ink">{l.order}</span>
                      <div className="flex-1">
                        <p className="font-bold">{l.titleTh}</p>
                        <p lang={lang === 'en' ? 'en' : 'zh-CN'} className="text-sm">
                          {lessonTitle(l, lang)}
                        </p>
                      </div>
                      {doneIds.has(l.id) && <Badge tone="green">จบแล้ว ✓</Badge>}
                    </Card>
                  </Link>
                </li>
              ))}
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

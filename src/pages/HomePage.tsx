import { Link } from 'react-router-dom';
import { Button, Card, ProgressBar } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../features/auth/authStore';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from '../hooks/useProgress';
import { careers, getLessonsByCareer, lessons } from '../data';
import { levelInfo, nextLessonToStudy, totalCompleted } from '../features/profile/stats';

export default function HomePage() {
  const user = useAuth((s) => s.user);
  const lang = useSettings((s) => s.lang);
  const { progress } = useProgress();
  const langName = lang === 'en' ? 'ภาษาอังกฤษ' : 'ภาษาจีน';
  const done = progress ? totalCompleted(progress, lang) : 0;
  const xp = progress?.xp[lang] ?? 0;
  const lvl = levelInfo(xp);
  const next = nextLessonToStudy(progress, lang);

  return (
    <>
      <PageHeader title={`สวัสดี ${user?.displayName} 👋`} subtitle={`กำลังเรียน${langName}`}>
        <Link to="/language">
          <Button variant="ghost">เปลี่ยนภาษา</Button>
        </Link>
      </PageHeader>

      {next ? (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-pistachio-100">
          <div>
            <p className="text-sm">{done === 0 ? 'เริ่มต้นการเรียนรู้' : 'เรียนต่อจากที่ค้างไว้'}</p>
            <p className="text-lg font-bold">บท {next.order}: {next.titleTh}</p>
          </div>
          <Link to={`/lesson/${next.id}`}>
            <Button size="lg">{done === 0 ? 'เริ่มเรียน' : 'เรียนต่อ'} →</Button>
          </Link>
        </Card>
      ) : (
        <Card className="mb-4 bg-pistachio-100 text-center">
          <p className="text-lg font-bold">🎉 คุณเรียนครบทุกบทในภาษานี้แล้ว!</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm">XP ({lang.toUpperCase()}) · เลเวล {lvl.level}</p>
          <p className="text-3xl font-bold">{xp}</p>
          <ProgressBar className="mt-2" value={lvl.percent} label="ความคืบหน้าสู่เลเวลถัดไป" />
        </Card>
        <Card>
          <p className="text-sm">บทที่เรียนจบ</p>
          <p className="text-3xl font-bold">{done} / {lessons.length}</p>
          <ProgressBar className="mt-2" value={lessons.length ? (done / lessons.length) * 100 : 0} label="ความคืบหน้ารวม" />
        </Card>
        <Card>
          <p className="text-sm">คำที่ติดดาว</p>
          <p className="text-3xl font-bold">{progress?.starred[lang].length ?? 0}</p>
          <Link className="mt-2 inline-block text-sm underline" to="/starred">ดูทั้งหมด</Link>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">เลือกหมวดอาชีพ</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {careers.map((c) => (
          <Link key={c.id} to={`/careers/${c.id}`}>
            <Card interactive className="h-full text-center">
              <div className="text-4xl" aria-hidden>{c.icon}</div>
              <p className="mt-2 font-bold">{c.nameTh}</p>
              <p className="text-sm">{lang === 'en' ? c.nameEn : c.nameZh}</p>
              <p className="mt-1 text-xs">{getLessonsByCareer(c.id).length} บท</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

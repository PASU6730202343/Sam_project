import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, ProgressBar, Tabs } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../features/auth/authStore';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from '../hooks/useProgress';
import { careers, getLesson, lessons } from '../data';
import { careerProgress, levelInfo, nextLessonToStudy, recentXp, totalCompleted } from '../features/profile/stats';
import { lessonTitle } from '../features/learning/wordView';
import type { Lang } from '../types';

const langName = { en: 'ภาษาอังกฤษ', zh: 'ภาษาจีน' } as const;
const sourceName = { lesson: 'จบบทเรียน', practice: 'ผ่านแบบฝึก', conversation: 'ผ่านสนทนา' } as const;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-frost p-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const current = useSettings((s) => s.lang);
  const [tab, setTab] = useState<Lang>(current);
  const { progress } = useProgress();

  if (!user) return null;
  if (!progress) return <p role="status">กำลังโหลดข้อมูล…</p>;

  const xp = progress.xp[tab];
  const lvl = levelInfo(xp);
  const done = totalCompleted(progress, tab);
  const stats = progress.stats[tab];
  const next = nextLessonToStudy(progress, tab);
  const history = recentXp(progress, 8, tab);
  const started = done > 0 || xp > 0 || stats.sessions > 0 || progress.starred[tab].length > 0;

  return (
    <>
      <PageHeader title="โปรไฟล์" subtitle="ข้อมูลและความก้าวหน้าแยกตามภาษา" />

      <Card className="mb-4 flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pistachio text-3xl font-bold text-ink" aria-hidden>
          {user.displayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{user.displayName}</p>
          <p className="truncate text-sm">{user.email}</p>
          <p className="text-sm">สมัครเมื่อ {new Date(user.createdAt).toLocaleDateString('th-TH')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-frost px-4 py-2">
            <p className="text-xl font-bold">{progress.xp.en}</p>
            <p className="text-xs">XP อังกฤษ</p>
          </div>
          <div className="rounded-2xl bg-frost px-4 py-2">
            <p className="text-xl font-bold">{progress.xp.zh}</p>
            <p className="text-xs">XP จีน</p>
          </div>
        </div>
      </Card>

      <div className="mb-4 flex justify-center sm:justify-start">
        <Tabs
          label="เลือกภาษาที่ดูสถิติ"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'en', label: 'English' },
            { id: 'zh', label: '中文' },
          ]}
        />
      </div>

      <Card className="mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">สถานะการเรียน{langName[tab]}</h2>
          {started ? <Badge tone="green">กำลังเรียน</Badge> : <Badge>ยังไม่เริ่ม</Badge>}
        </div>
        <div className="mb-1 flex items-baseline justify-between">
          <p className="font-semibold">เลเวล {lvl.level}</p>
          <p className="text-sm">{lvl.into} / {lvl.next} XP ถึงเลเวลถัดไป</p>
        </div>
        <ProgressBar value={lvl.percent} label={`ความคืบหน้าเลเวล${langName[tab]}`} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="XP รวม" value={xp} />
          <Stat label="บทที่จบ" value={`${done}/${lessons.length}`} />
          <Stat label="คำที่ติดดาว" value={progress.starred[tab].length} />
          <Stat label="รอบการเรียน" value={stats.sessions} />
          <Stat label="คำที่ทบทวน" value={stats.wordsReviewed} />
          <Stat label="รอบแบบฝึก" value={stats.practiceRuns} />
          <Stat label="รอบสนทนา" value={stats.conversationsDone} />
          <Stat label="เรียนล่าสุด" value={stats.lastStudyAt ? new Date(stats.lastStudyAt).toLocaleDateString('th-TH') : '-'} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {next && (
            <Link to={`/lesson/${next.id}`}>
              <Button>{started ? 'เรียนต่อ' : 'เริ่มเรียน'}: บท {next.order} {next.titleTh} →</Button>
            </Link>
          )}
          <Link to="/scores">
            <Button variant="secondary">ดูคะแนนแบบฝึกและสนทนา</Button>
          </Link>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 text-lg font-bold">ความก้าวหน้าตามหมวดอาชีพ ({tab.toUpperCase()})</h2>
        <ul className="space-y-3">
          {careerProgress(progress, tab).map((cp) => {
            const c = careers.find((x) => x.id === cp.careerId)!;
            return (
              <li key={cp.careerId}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Link className="font-medium underline" to={`/careers/${c.id}`}>
                    <span aria-hidden>{c.icon} </span>
                    {c.nameTh}
                  </Link>
                  <span className="text-sm">{cp.done} / {cp.total} บท</span>
                </div>
                <ProgressBar value={cp.total ? (cp.done / cp.total) * 100 : 0} label={`ความคืบหน้าหมวด ${c.nameTh}`} />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">ประวัติ XP ล่าสุด ({tab.toUpperCase()})</h2>
        {history.length === 0 ? (
          <p>ยังไม่มีประวัติ XP จบบทเรียนหรือผ่านแบบฝึกครั้งแรกเพื่อรับ XP</p>
        ) : (
          <ul className="divide-y divide-frost-200">
            {history.map((h) => {
              const l = getLesson(h.lessonId);
              return (
                <li key={h.key} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{l ? `บท ${l.order}: ${l.titleTh}` : h.lessonId}</p>
                    <p className="text-sm">
                      {sourceName[h.source]} · {new Date(h.at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                      {l && <span lang={tab === 'en' ? 'en' : 'zh-CN'}> · {lessonTitle(l, tab)}</span>}
                    </p>
                  </div>
                  <Badge tone="green">+{h.amount} XP</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../ui';
import { PageHeader } from './PageHeader';
import { getLesson } from '../../data';
import { useSettings } from '../../features/settings/settingsStore';
import { lessonTitle } from '../../features/learning/wordView';
import type { Lesson } from '../../types';

type Section = 'detail' | 'vocab' | 'grammar' | 'practice' | 'conversation';

interface Props {
  current: Section;
  title: string;
  children: (lesson: Lesson) => ReactNode;
}

/** โครงหน้าของบทเรียน: ค้นบทจาก URL, หัวเรื่อง, แท็บลิงก์ภายในบท, กรณีไม่พบบท */
export function LessonFrame({ current, title, children }: Props) {
  const { lessonId = '' } = useParams();
  const lang = useSettings((s) => s.lang);
  const lesson = getLesson(lessonId);

  if (!lesson) {
    return (
      <>
        <PageHeader title="ไม่พบบทเรียนนี้" subtitle="บทเรียนอาจยังไม่เปิดให้บริการ" />
        <Link to="/careers"><Button>กลับไปหมวดอาชีพ</Button></Link>
      </>
    );
  }

  const base = `/lesson/${lesson.id}`;
  const tabs: { id: Section; to: string; label: string }[] = [
    { id: 'detail', to: base, label: 'ภาพรวม' },
    { id: 'vocab', to: `${base}/vocab`, label: 'คำศัพท์' },
    { id: 'grammar', to: `${base}/grammar`, label: 'ประโยค & ไวยากรณ์' },
    { id: 'practice', to: `${base}/practice`, label: 'ฝึกฝน' },
    { id: 'conversation', to: `${base}/conversation`, label: 'สนทนา' },
  ];

  return (
    <>
      <PageHeader title={title} subtitle={`บท ${lesson.order}: ${lesson.titleTh} · ${lessonTitle(lesson, lang)}`}>
        <Link to={`/careers/${lesson.careerId}`}><Button variant="ghost">← รายการบท</Button></Link>
      </PageHeader>
      <nav aria-label="ส่วนของบทเรียน" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            to={t.to}
            aria-current={t.id === current ? 'page' : undefined}
            className={`rounded-2xl px-4 py-2 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${
              t.id === current ? 'bg-denim text-white' : 'bg-white text-denim hover:bg-frost-200'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children(lesson)}
    </>
  );
}

import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card } from '../ui';
import { Pinyin } from '../Pinyin';
import { PageHeader } from './PageHeader';
import { getLesson, getLessonsByCareer } from '../../data';
import { isStepUnlocked, previousLesson, stepPath } from '../../features/learning/access';
import { STEPS, STEP_LABEL, type StepId } from '../../features/learning/journal';
import { useSettings } from '../../features/settings/settingsStore';
import { lessonTitle } from '../../features/learning/wordView';
import { useLessonAccess, type LessonAccess } from '../../hooks/useLessonAccess';
import type { Lesson } from '../../types';

type Section = 'detail' | StepId;

interface Props {
  current: Section;
  title: string;
  children: (lesson: Lesson, access: LessonAccess) => ReactNode;
}

/** โครงหน้าของบทเรียน: ค้นบทจาก URL, หัวเรื่อง, ตัวบอกขั้น, และ "ประตู" ที่ล็อกบท/ขั้นที่ยังไม่ถึงลำดับ */
export function LessonFrame({ current, title, children }: Props) {
  const { lessonId = '' } = useParams();
  const lesson = getLesson(lessonId);

  if (!lesson) {
    return (
      <>
        <PageHeader title="ไม่พบบทเรียนนี้" subtitle="บทเรียนอาจยังไม่เปิดให้บริการ" />
        <Link to="/careers"><Button>กลับไปหมวดอาชีพ</Button></Link>
      </>
    );
  }
  return <GatedLesson lesson={lesson} current={current} title={title}>{children}</GatedLesson>;
}

function GatedLesson({ lesson, current, title, children }: Props & { lesson: Lesson }) {
  const lang = useSettings((s) => s.lang);
  const access = useLessonAccess(lesson);
  const base = `/lesson/${lesson.id}`;

  const header = (
    <PageHeader
      title={title}
      subtitle={
        <>
          บท {lesson.order}: {lesson.titleTh} · <span lang={lang === 'en' ? 'en' : 'zh-CN'}>{lessonTitle(lesson, lang)}</span>
          <Pinyin text={lessonTitle(lesson, lang)} lang={lang} />
        </>
      }
    >
      <Link to={`/careers/${lesson.careerId}`}><Button variant="ghost">← รายการบท</Button></Link>
    </PageHeader>
  );

  if (!access.ready) return <p role="status">กำลังโหลดข้อมูล…</p>;

  // บทนี้ยังล็อก: ต้องจบบทก่อนหน้าในหมวดเดียวกันก่อน
  if (!access.unlocked) {
    const prev = previousLesson(lesson)!;
    const firstOpen = getLessonsByCareer(lesson.careerId).find((l) => !access.completedIds.has(l.id)) ?? prev;
    return (
      <>
        {header}
        <Card role="status" className="text-center">
          <p className="text-5xl" aria-hidden>🔒</p>
          <h2 className="mt-2 text-xl font-bold">บทนี้ยังล็อกอยู่</h2>
          <p className="mt-1">ต้องเรียนบท {prev.order}: {prev.titleTh} ให้จบก่อน จึงจะเรียนบทนี้ได้ (เรียนไปตามลำดับทีละบท)</p>
          <Link to={`/lesson/${firstOpen.id}`} className="mt-4 inline-block">
            <Button>ไปเรียนบท {firstOpen.order}: {firstOpen.titleTh} →</Button>
          </Link>
        </Card>
      </>
    );
  }

  // ขั้นนี้ยังไม่ถึงลำดับ: ต้องเรียนขั้นก่อนหน้าให้ครบก่อน
  if (current !== 'detail' && !isStepUnlocked(current, access.done)) {
    const target = access.next ?? 'vocab';
    return (
      <>
        {header}
        <Card role="status" className="text-center">
          <p className="text-5xl" aria-hidden>🔒</p>
          <h2 className="mt-2 text-xl font-bold">ขั้น “{STEP_LABEL[current]}” ยังล็อกอยู่</h2>
          <p className="mt-1">เรียนไปตามลำดับ: ต้องจบขั้น “{STEP_LABEL[target]}” ก่อน</p>
          <Link to={stepPath(lesson.id, target)} className="mt-4 inline-block">
            <Button>ไปที่ขั้น “{STEP_LABEL[target]}” →</Button>
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      {header}
      <nav aria-label="ขั้นตอนของบทเรียน" className="mb-6">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link
              to={base}
              aria-current={current === 'detail' ? 'page' : undefined}
              className={`block rounded-2xl px-4 py-2 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${
                current === 'detail' ? 'bg-denim text-white' : 'bg-white text-denim hover:bg-frost-200'
              }`}
            >
              ภาพรวม
            </Link>
          </li>
          {STEPS.map((s, i) => {
            const open = isStepUnlocked(s, access.done);
            const done = access.done[s];
            const label = (
              <>
                <span aria-hidden>{done ? '✓' : open ? i + 1 : '🔒'}</span> {STEP_LABEL[s]}
                {!open && <span className="sr-only"> (ล็อก)</span>}
              </>
            );
            return (
              <li key={s}>
                {open ? (
                  <Link
                    to={stepPath(lesson.id, s)}
                    aria-current={s === current ? 'page' : undefined}
                    className={`block rounded-2xl px-4 py-2 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${
                      s === current ? 'bg-denim text-white' : done ? 'bg-pistachio-100 text-ink hover:bg-pistachio' : 'bg-white text-denim hover:bg-frost-200'
                    }`}
                  >
                    {label}
                  </Link>
                ) : (
                  <span aria-disabled="true" className="block cursor-not-allowed rounded-2xl bg-frost-200 px-4 py-2 font-semibold text-denim/50">
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {children(lesson, access)}
    </>
  );
}

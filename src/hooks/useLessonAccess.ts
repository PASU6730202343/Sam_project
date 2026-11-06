import { useMemo } from 'react';
import type { Lesson } from '../types';
import { useAuth } from '../features/auth/authStore';
import { isLessonUnlocked, nextStep, stepProgress } from '../features/learning/access';
import { stepKey, useJournal } from '../features/learning/journal';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from './useProgress';

/** สถานะการเข้าถึงบท (ภาษาที่กำลังเรียน): ปลดล็อกหรือยัง, ขั้นไหนเสร็จแล้ว, ขั้นถัดไปคืออะไร */
export function useLessonAccess(lesson: Lesson) {
  const lang = useSettings((s) => s.lang);
  const userId = useAuth((s) => s.user?.id ?? null);
  const { progress } = useProgress();
  const journalUser = useJournal((s) => s.userId);
  const doneSteps = useJournal((s) => s.data.steps[stepKey(lang, lesson.id)]);

  // ยังไม่พร้อม = ข้อมูลบทที่จบ/สมุดบันทึกของผู้ใช้ยังโหลดไม่เสร็จ (กันหน้าแว้บว่า "ล็อก" ชั่วขณะ)
  const ready = progress !== null && !!userId && journalUser === userId;
  const completedIds = useMemo(() => new Set(progress?.completed.filter((c) => c.lang === lang).map((c) => c.lessonId)), [progress, lang]);
  const completed = completedIds.has(lesson.id);
  const done = stepProgress(completed, doneSteps);

  return { ready, completedIds, completed, unlocked: isLessonUnlocked(lesson, completedIds), done, next: nextStep(done) };
}

export type LessonAccess = ReturnType<typeof useLessonAccess>;

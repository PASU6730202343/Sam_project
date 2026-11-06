import { getLessonsByCareer } from '../../data';
import type { Lesson } from '../../types';
import { STEPS, type StepId } from './journal';

/**
 * บทแรกของแต่ละหมวดเรียนได้ทันที บทถัดไปปลดล็อกเมื่อ "จบ" บทก่อนหน้าในหมวดเดียวกัน (ภาษาเดียวกัน)
 * completedIds = บทที่จบแล้วของภาษาที่กำลังเรียน
 */
export function previousLesson(lesson: Lesson): Lesson | undefined {
  const list = getLessonsByCareer(lesson.careerId);
  const i = list.findIndex((l) => l.id === lesson.id);
  return i > 0 ? list[i - 1] : undefined;
}

export function isLessonUnlocked(lesson: Lesson, completedIds: ReadonlySet<string>): boolean {
  const prev = previousLesson(lesson);
  return !prev || completedIds.has(prev.id);
}

export type StepDone = Record<StepId, boolean>;

/** ขั้นที่เสร็จแล้ว — บทที่จบแล้ว (เช่น จบไว้ก่อนมีระบบขั้น) ถือว่าครบทุกขั้น เพื่อกลับมาทบทวนได้อิสระ */
export function stepProgress(lessonCompleted: boolean, doneSteps?: Partial<Record<StepId, string>>): StepDone {
  return Object.fromEntries(STEPS.map((s) => [s, lessonCompleted || !!doneSteps?.[s]])) as StepDone;
}

/** เข้าขั้นนี้ได้เมื่อขั้นก่อนหน้า "ทุกขั้น" เสร็จแล้ว */
export function isStepUnlocked(step: StepId, done: StepDone): boolean {
  return STEPS.slice(0, STEPS.indexOf(step)).every((s) => done[s]);
}

/** ขั้นแรกที่ยังไม่เสร็จ (null = ครบทุกขั้น) */
export function nextStep(done: StepDone): StepId | null {
  return STEPS.find((s) => !done[s]) ?? null;
}

export const stepPath = (lessonId: string, step: StepId) => `/lesson/${lessonId}/${step}`;

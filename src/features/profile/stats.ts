import type { Lang, UserProgress, XpEntry } from '../../types';
import { careers, lessons } from '../../data';

export interface CareerProgress {
  careerId: string;
  done: number;
  total: number;
}

/** ความก้าวหน้าต่อหมวดของภาษาที่เลือก (นับเฉพาะบทที่มีอยู่จริงในข้อมูล) */
export function careerProgress(progress: UserProgress, lang: Lang): CareerProgress[] {
  const doneIds = new Set(progress.completed.filter((c) => c.lang === lang).map((c) => c.lessonId));
  return careers.map((c) => {
    const ls = lessons.filter((l) => l.careerId === c.id);
    return { careerId: c.id, total: ls.length, done: ls.filter((l) => doneIds.has(l.id)).length };
  });
}

export function totalCompleted(progress: UserProgress, lang: Lang): number {
  const ids = new Set(lessons.map((l) => l.id));
  return new Set(progress.completed.filter((c) => c.lang === lang && ids.has(c.lessonId)).map((c) => c.lessonId)).size;
}

/** เลเวล: ทุก 100 XP = 1 เลเวล (เริ่มที่เลเวล 1) */
export const XP_PER_LEVEL = 100;
export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, into, next: XP_PER_LEVEL, percent: (into / XP_PER_LEVEL) * 100 };
}

/** ประวัติ XP ล่าสุดก่อน (ทุกภาษา หรือเฉพาะภาษาที่ระบุ) */
export function recentXp(progress: UserProgress, limit = 10, lang?: Lang): XpEntry[] {
  return [...progress.xpHistory]
    .filter((x) => !lang || x.lang === lang)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

/** บทแรกที่ยังไม่จบของภาษานั้น (ใช้ทำปุ่ม "เรียนต่อ") */
export function nextLessonToStudy(progress: UserProgress | null, lang: Lang) {
  const done = new Set(progress?.completed.filter((c) => c.lang === lang).map((c) => c.lessonId));
  return lessons.find((l) => !done.has(l.id)) ?? null;
}

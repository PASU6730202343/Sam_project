import type { JournalData } from './journal';

/**
 * Streak = จำนวนวันติดต่อกันที่เรียน (ตามเวลาท้องถิ่น) นับจากสมุดบันทึกในเครื่อง:
 * วันที่มีรอบแบบฝึก/สนทนา หรือจบขั้นของบทเรียน (ทุกภาษารวมกัน)
 * ถ้าวันนี้ยังไม่ได้เรียนแต่เมื่อวานเรียน streak ยังไม่ขาด (เหลือเวลาถึงสิ้นวัน)
 */
export const dayKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function studyDays(data: JournalData): Set<string> {
  const days = new Set<string>();
  const add = (iso?: string) => {
    if (!iso) return;
    const t = new Date(iso);
    if (!Number.isNaN(t.getTime())) days.add(dayKey(t));
  };
  data.attempts.forEach((a) => add(a.at));
  Object.values(data.steps).forEach((steps) => Object.values(steps).forEach(add));
  return days;
}

export interface StreakInfo {
  /** จำนวนวันติดต่อกัน (0 = ไม่มี streak) */
  count: number;
  /** วันนี้เรียนแล้วหรือยัง */
  studiedToday: boolean;
}

export function computeStreak(days: Set<string>, now = new Date()): StreakInfo {
  const studiedToday = days.has(dayKey(now));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!studiedToday) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { count, studiedToday };
}

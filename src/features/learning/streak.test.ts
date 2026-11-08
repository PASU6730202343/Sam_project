import { describe, expect, it } from 'vitest';
import { computeStreak, studyDays } from './streak';
import { emptyJournal, type Attempt } from './journal';

const NOW = new Date(2026, 5, 10, 12, 0, 0); // 10 มิ.ย. 2026 เวลาท้องถิ่น
const at = (d: number, h = 9) => new Date(2026, 5, d, h).toISOString();
const attempt = (d: number): Attempt => ({ lang: 'en', lessonId: 'hotel-01', kind: 'memory', correct: 5, total: 5, skipped: 0, passed: true, at: at(d) });

describe('streak', () => {
  it('ไม่มีประวัติ = 0', () => {
    expect(computeStreak(studyDays(emptyJournal()), NOW)).toEqual({ count: 0, studiedToday: false });
  });
  it('นับวันติดต่อกันรวมวันนี้ และไม่นับวันเดียวกันซ้ำ', () => {
    const j = { ...emptyJournal(), attempts: [attempt(10), attempt(10), attempt(9), attempt(8)] };
    expect(computeStreak(studyDays(j), NOW)).toEqual({ count: 3, studiedToday: true });
  });
  it('วันนี้ยังไม่เรียนแต่เมื่อวานเรียน = streak ยังอยู่', () => {
    const j = { ...emptyJournal(), attempts: [attempt(9), attempt(8)] };
    expect(computeStreak(studyDays(j), NOW)).toEqual({ count: 2, studiedToday: false });
  });
  it('ขาดไปหนึ่งวัน = เริ่มใหม่', () => {
    const j = { ...emptyJournal(), attempts: [attempt(8), attempt(7)] };
    expect(computeStreak(studyDays(j), NOW).count).toBe(0);
  });
  it('นับการจบขั้นของบทด้วย และข้ามเดือนได้', () => {
    const j = { ...emptyJournal(), steps: { 'en:hotel-01': { vocab: new Date(2026, 4, 31, 20).toISOString() } }, attempts: [{ ...attempt(1), at: new Date(2026, 5, 1, 8).toISOString() }] };
    expect(computeStreak(studyDays(j), new Date(2026, 5, 1, 21))).toEqual({ count: 2, studiedToday: true });
  });
});

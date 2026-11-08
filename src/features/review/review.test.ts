import { describe, expect, it } from 'vitest';
import { BOX_DAYS, cardKey, dueWordIds, grade, isDue, MAX_BOX } from './srs';
import { toneOf } from './tones';

const NOW = Date.parse('2026-01-01T00:00:00Z');
const DAY = 86_400_000;

describe('Leitner', () => {
  it('จำได้ → ขึ้นกล่องและนัดตามช่วงวัน', () => {
    const c1 = grade(undefined, true, NOW);
    expect(c1.box).toBe(1);
    expect(Date.parse(c1.due)).toBe(NOW + BOX_DAYS[1] * DAY);
    expect(grade(c1, true, NOW).box).toBe(2);
  });
  it('จำไม่ได้ → กลับกล่อง 0 ถึงกำหนดทันที และนับ lapse', () => {
    const c = grade({ box: 4, due: new Date(NOW + DAY).toISOString(), reviews: 5, lapses: 0 }, false, NOW);
    expect(c.box).toBe(0);
    expect(isDue(c, NOW)).toBe(true);
    expect(c.lapses).toBe(1);
  });
  it('ไม่เกินกล่องสูงสุด', () => {
    let c = grade(undefined, true, NOW);
    for (let i = 0; i < 20; i++) c = grade(c, true, NOW);
    expect(c.box).toBe(MAX_BOX);
  });
  it('dueWordIds: คำใหม่มาก่อน, ข้ามคำที่ยังไม่ถึงกำหนด', () => {
    const deck = {
      [cardKey('en', 'a')]: { box: 2, due: new Date(NOW + DAY).toISOString(), reviews: 1, lapses: 0 },
      [cardKey('en', 'b')]: { box: 1, due: new Date(NOW - DAY).toISOString(), reviews: 1, lapses: 0 },
    };
    expect(dueWordIds(['a', 'b', 'c'], 'en', deck, NOW)).toEqual(['c', 'b']);
  });
});

describe('วรรณยุกต์พินอิน', () => {
  it('อ่านเสียง 1-4 และเสียงเบา', () => {
    expect(toneOf('mā')).toBe(1);
    expect(toneOf('má')).toBe(2);
    expect(toneOf('mǎ')).toBe(3);
    expect(toneOf('mà')).toBe(4);
    expect(toneOf('ma')).toBe(0);
    expect(toneOf('nǚ')).toBe(3);
  });
});

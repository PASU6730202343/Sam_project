import { describe, expect, it } from 'vitest';
import { lessons, careers, getLesson, getWord, getAdjacentLessons } from './index';
import { validateCatalog } from './validate';

describe('ข้อมูลบทเรียน', () => {
  it('ผ่านการตรวจโครงสร้างและเนื้อหา (โหมดบางส่วน)', () => {
    const { errors } = validateCatalog(lessons, false);
    expect(errors).toEqual([]);
  });
  it('ครบตามสเปก: 8 หมวด 64 บท 320 คำ 320 ขั้นสนทนา และผ่านทุกเช็ก (โหมดเต็ม)', () => {
    const r = validateCatalog(lessons, true);
    expect(r.errors).toEqual([]);
    expect(r.counts).toEqual({ careers: 8, lessons: 64, words: 320, steps: 320 });
  });
  it('ทุกหมวดมี 8 บท 40 คำ', () => {
    for (const c of careers) {
      const ls = lessons.filter((l) => l.careerId === c.id);
      expect(ls, c.id).toHaveLength(8);
      expect(ls.flatMap((l) => l.words), c.id).toHaveLength(40);
    }
  });
  it('Hotel มี 8 บท 40 คำ 40 ขั้นสนทนา', () => {
    const r = validateCatalog(lessons.filter((l) => l.careerId === 'hotel'), false);
    expect(r.counts).toMatchObject({ lessons: 8, words: 40, steps: 40 });
  });
  it('id คำเป็นรูปแบบ hotel-01-03 และหาได้จาก getWord', () => {
    expect(getWord('hotel-01-03')?.en).toBe('passport');
    expect(getLesson('hotel-08')?.order).toBe(8);
  });
  it('บทก่อนหน้า/ถัดไป', () => {
    const l = getLesson('hotel-04')!;
    const { prev, next } = getAdjacentLessons(l);
    expect([prev?.id, next?.id]).toEqual(['hotel-03', 'hotel-05']);
    expect(getAdjacentLessons(getLesson('hotel-01')!).prev).toBeUndefined();
  });
  it('ตรวจจับข้อมูลเสีย: ประโยคตัวอย่างไม่มีคำศัพท์ / จำนวนคำไม่ครบ', () => {
    const bad = structuredClone(lessons[0]);
    bad.words[0].exampleEn = 'Nothing here.';
    bad.words.pop();
    const { errors } = validateCatalog([bad], false);
    expect(errors.some((e) => e.includes('exampleEn'))).toBe(true);
    expect(errors.some((e) => e.includes('ต้อง 5'))).toBe(true);
  });
});

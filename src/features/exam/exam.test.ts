import { describe, expect, it } from 'vitest';
import { careers, getLessonsByCareer } from '../../data';
import { mulberry32 } from '../practice/generators';
import { buildExam, EXAM_PASS_RATIO, withExamResult } from './exam';

describe('ข้อสอบท้ายหมวด', () => {
  it.each(careers.map((c) => c.id))('%s: บทละ 2 ข้อ ไม่ซ้ำ และมีคำตอบถูกอยู่ในตัวเลือก', (careerId) => {
    for (const lang of ['en', 'zh'] as const) {
      const qs = buildExam(careerId, lang, mulberry32(7));
      const lessonCount = getLessonsByCareer(careerId).length;
      if (lessonCount === 0) continue;
      expect(qs).toHaveLength(lessonCount * 2);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      qs.forEach((q) => {
        expect(q.type).toBe('choice');
        expect(q.options[q.answerIndex]).toBeTruthy();
      });
    }
  });
});

describe('บันทึกผลสอบ', () => {
  it('เก็บคะแนนสูงสุด นับครั้ง และผ่านแล้วไม่ถูกถอน', () => {
    let r = withExamResult({}, 'en', 'hotel', 15, 16);
    expect(r['en:hotel']).toMatchObject({ best: 94, attempts: 1, passed: true });
    r = withExamResult(r, 'en', 'hotel', 4, 16);
    expect(r['en:hotel']).toMatchObject({ best: 94, attempts: 2, passed: true });
  });
  it('ต่ำกว่าเกณฑ์ = ไม่ผ่าน และคนละภาษาแยกกัน', () => {
    const r = withExamResult({}, 'zh', 'hotel', Math.floor(16 * EXAM_PASS_RATIO) - 1, 16);
    expect(r['zh:hotel'].passed).toBe(false);
    expect(r['en:hotel']).toBeUndefined();
  });
});

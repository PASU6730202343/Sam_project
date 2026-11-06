import { describe, expect, it } from 'vitest';
import type { UserProgress } from '../../types';
import { careerProgress, levelInfo, nextLessonToStudy, recentXp, totalCompleted } from './stats';

const base = (): UserProgress => ({
  xp: { en: 0, zh: 0 },
  xpHistory: [],
  completed: [],
  starred: { en: [], zh: [] },
  stats: {
    en: { sessions: 0, wordsReviewed: 0, practiceRuns: 0, conversationsDone: 0, lastStudyAt: null },
    zh: { sessions: 0, wordsReviewed: 0, practiceRuns: 0, conversationsDone: 0, lastStudyAt: null },
  },
});

describe('สถิติโปรไฟล์', () => {
  it('ความก้าวหน้าต่อหมวดแยกตามภาษา', () => {
    const p = base();
    p.completed = [
      { lang: 'en', lessonId: 'hotel-01', careerId: 'hotel', at: '2025-01-01' },
      { lang: 'en', lessonId: 'hotel-02', careerId: 'hotel', at: '2025-01-02' },
      { lang: 'zh', lessonId: 'spa-01', careerId: 'spa', at: '2025-01-03' },
    ];
    const en = careerProgress(p, 'en');
    expect(en).toHaveLength(8);
    expect(en.find((c) => c.careerId === 'hotel')).toEqual({ careerId: 'hotel', done: 2, total: 8 });
    expect(en.find((c) => c.careerId === 'spa')?.done).toBe(0);
    expect(careerProgress(p, 'zh').find((c) => c.careerId === 'spa')?.done).toBe(1);
    expect(totalCompleted(p, 'en')).toBe(2);
    expect(totalCompleted(p, 'zh')).toBe(1);
  });
  it('ไม่นับบทซ้ำและบทที่ไม่มีในข้อมูล', () => {
    const p = base();
    p.completed = [
      { lang: 'en', lessonId: 'hotel-01', careerId: 'hotel', at: 'a' },
      { lang: 'en', lessonId: 'hotel-01', careerId: 'hotel', at: 'b' },
      { lang: 'en', lessonId: 'ghost-99', careerId: 'hotel', at: 'c' },
    ];
    expect(totalCompleted(p, 'en')).toBe(1);
  });
  it('เลเวลทุก 100 XP', () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, into: 0, percent: 0 });
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100)).toMatchObject({ level: 2, into: 0 });
    expect(levelInfo(250)).toMatchObject({ level: 3, into: 50, percent: 50 });
  });
  it('ประวัติ XP เรียงใหม่สุดก่อนและกรองตามภาษา', () => {
    const p = base();
    const e = (lang: 'en' | 'zh', lessonId: string, at: string) => ({
      key: `u:${lang}:${lessonId}`, userId: 'u', lang, lessonId, careerId: 'hotel', source: 'lesson' as const, amount: 20, at,
    });
    p.xpHistory = [e('en', 'hotel-01', '2025-01-01'), e('zh', 'hotel-01', '2025-01-03'), e('en', 'hotel-02', '2025-01-02')];
    expect(recentXp(p, 10).map((x) => x.at)).toEqual(['2025-01-03', '2025-01-02', '2025-01-01']);
    expect(recentXp(p, 10, 'en').map((x) => x.lessonId)).toEqual(['hotel-02', 'hotel-01']);
    expect(recentXp(p, 1)).toHaveLength(1);
  });
  it('บทถัดไปที่ควรเรียน', () => {
    expect(nextLessonToStudy(null, 'en')?.id).toBe('hotel-01');
    const p = base();
    p.completed = [{ lang: 'en', lessonId: 'hotel-01', careerId: 'hotel', at: 'a' }];
    expect(nextLessonToStudy(p, 'en')?.id).toBe('hotel-02');
    expect(nextLessonToStudy(p, 'zh')?.id).toBe('hotel-01');
  });
});

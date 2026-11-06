import { create } from 'zustand';
import type { Lang, Lesson, UserProgress, XpSource } from '../../types';
import { storage, type AwardXpResult } from '../../services/storage';
import { useAuth } from '../auth/authStore';
import { PASS_RATIO_CONVERSATION, PASS_RATIO_PRACTICE, XP_CONVERSATION, XP_LESSON, XP_PRACTICE } from './xp';

export interface FinishOutcome {
  passed: boolean;
  /** null = ไม่ผ่านเกณฑ์ จึงไม่พยายามให้ XP */
  xp: AwardXpResult | null;
}

interface ProgressState {
  progress: UserProgress | null;
  load: (userId: string | null) => Promise<void>;
  toggleStar: (lang: Lang, wordId: string) => Promise<void>;
  /** จบบทเรียน: บันทึกว่าจบ + ให้ XP (service ตรวจว่าเคยได้แล้วหรือไม่) */
  completeLesson: (lesson: Lesson, lang: Lang) => Promise<AwardXpResult | null>;
  /** จบรอบแบบฝึก: ผ่านเกณฑ์ → นับบทว่าจบ + ขอ XP; ทุกรอบนับสถิติ */
  finishPractice: (lesson: Lesson, lang: Lang, correct: number, total: number) => Promise<FinishOutcome | null>;
  /** จบรอบสนทนา: ผ่านเกณฑ์ → นับบทว่าจบ + ขอ XP */
  finishConversation: (lesson: Lesson, lang: Lang, appropriate: number, total: number) => Promise<FinishOutcome | null>;
}

export const useProgressStore = create<ProgressState>((set, get) => {
  const user = () => useAuth.getState().user;

  async function award(lesson: Lesson, lang: Lang, source: XpSource, amount: number) {
    const u = user()!;
    await storage.markLessonCompleted(u.id, lang, lesson.id, lesson.careerId);
    return storage.awardXp(u.id, { lang, lessonId: lesson.id, careerId: lesson.careerId, source, amount });
  }

  return {
    progress: null,
    load: async (userId) => set({ progress: userId ? await storage.getProgress(userId) : null }),

    toggleStar: async (lang, wordId) => {
      const u = user();
      const p = get().progress;
      if (!u || !p) return;
      await storage.setStarred(u.id, lang, wordId, !p.starred[lang].includes(wordId));
      await get().load(u.id);
    },

    completeLesson: async (lesson, lang) => {
      const u = user();
      if (!u) return null;
      const result = await award(lesson, lang, 'lesson', XP_LESSON);
      if (result.awarded) await storage.recordStudy(u.id, lang, { sessions: 1, wordsReviewed: lesson.words.length });
      await get().load(u.id);
      return result;
    },

    finishPractice: async (lesson, lang, correct, total) => {
      const u = user();
      if (!u) return null;
      await storage.recordStudy(u.id, lang, { practiceRuns: 1 });
      const passed = total > 0 && correct / total >= PASS_RATIO_PRACTICE;
      const xp = passed ? await award(lesson, lang, 'practice', XP_PRACTICE) : null;
      await get().load(u.id);
      return { passed, xp };
    },

    finishConversation: async (lesson, lang, appropriate, total) => {
      const u = user();
      if (!u) return null;
      await storage.recordStudy(u.id, lang, { conversationsDone: 1 });
      const passed = total > 0 && appropriate / total >= PASS_RATIO_CONVERSATION;
      const xp = passed ? await award(lesson, lang, 'conversation', XP_CONVERSATION) : null;
      await get().load(u.id);
      return { passed, xp };
    },
  };
});

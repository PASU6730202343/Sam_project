import { create } from 'zustand';
import type { Lang, Lesson, UserProgress } from '../../types';
import { storage, type AwardXpResult } from '../../services/storage';
import { useAuth } from '../auth/authStore';
import type { PracticeKind } from '../practice/types';
import { useJournal } from './journal';
import { PASS_RATIO_CONVERSATION, PASS_RATIO_PRACTICE, XP_LESSON } from './xp';

export interface FinishOutcome {
  /** ผ่านเกณฑ์คะแนน (ถ้าข้ามทุกข้อ ถือว่าไม่มีคะแนนให้ตัดสิน = ผ่าน) */
  passed: boolean;
}

interface ProgressState {
  progress: UserProgress | null;
  load: (userId: string | null) => Promise<void>;
  toggleStar: (lang: Lang, wordId: string) => Promise<void>;
  /** จบรอบแบบฝึก 1 แบบ: บันทึกคะแนนของรอบ (ไม่ทำให้บทจบ) */
  finishPractice: (lesson: Lesson, lang: Lang, kind: PracticeKind, correct: number, total: number, skipped?: number) => Promise<FinishOutcome | null>;
  /** จบรอบสนทนา: บันทึกคะแนน (บทจบเมื่อกดจบบทเรียนผ่าน completeLesson) */
  finishConversation: (lesson: Lesson, lang: Lang, appropriate: number, total: number, skipped?: number) => Promise<FinishOutcome | null>;
  /**
   * จบบทเรียน (เรียนครบทุกขั้นแล้ว): บันทึกว่าจบ → ปลดล็อกบทถัดไป + ให้ XP ครั้งแรกต่อ (ผู้ใช้, ภาษา, บท)
   * เรียกซ้ำตอนทบทวนได้ ไม่ได้ XP เพิ่ม
   */
  completeLesson: (lesson: Lesson, lang: Lang) => Promise<AwardXpResult | null>;
}

const passes = (correct: number, total: number, ratio: number) => total === 0 || correct / total >= ratio;

export const useProgressStore = create<ProgressState>((set, get) => {
  const user = () => useAuth.getState().user;
  // สถิติฝั่งเซิร์ฟเวอร์เป็นงานเสริม: คะแนนรอบถูกบันทึกลงสมุดบันทึกในเครื่องไปแล้ว
  // ถ้าเครือข่าย/เซิร์ฟเวอร์ล้มต้องไม่ทำให้หน้าสรุปผลคะแนนไม่ขึ้น
  const syncStats = async (userId: string, lang: Lang, delta: Parameters<typeof storage.recordStudy>[2]) => {
    try {
      await storage.recordStudy(userId, lang, delta);
      await get().load(userId);
    } catch (e) {
      console.warn('บันทึกสถิติไม่สำเร็จ (คะแนนรอบยังถูกเก็บไว้ในเครื่อง)', e);
    }
  };

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

    finishPractice: async (lesson, lang, kind, correct, total, skipped = 0) => {
      const u = user();
      if (!u) return null;
      const passed = passes(correct, total, PASS_RATIO_PRACTICE);
      useJournal.getState().addAttempt({ lang, lessonId: lesson.id, kind, correct, total, skipped, passed });
      await syncStats(u.id, lang, { practiceRuns: 1 });
      return { passed };
    },

    finishConversation: async (lesson, lang, appropriate, total, skipped = 0) => {
      const u = user();
      if (!u) return null;
      const passed = passes(appropriate, total, PASS_RATIO_CONVERSATION);
      useJournal.getState().addAttempt({ lang, lessonId: lesson.id, kind: 'conversation', correct: appropriate, total, skipped, passed });
      await syncStats(u.id, lang, { conversationsDone: 1 });
      return { passed };
    },

    completeLesson: async (lesson, lang) => {
      const u = user();
      if (!u) return null;
      await storage.markLessonCompleted(u.id, lang, lesson.id, lesson.careerId);
      const result = await storage.awardXp(u.id, { lang, lessonId: lesson.id, careerId: lesson.careerId, source: 'lesson', amount: XP_LESSON });
      if (result.awarded) await storage.recordStudy(u.id, lang, { sessions: 1, wordsReviewed: lesson.words.length });
      useJournal.getState().markStep(lang, lesson.id, 'conversation');
      await get().load(u.id);
      return result;
    },
  };
});

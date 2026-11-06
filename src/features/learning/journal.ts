import { create } from 'zustand';
import type { Lang } from '../../types';
import type { PracticeKind } from '../practice/types';

/**
 * บันทึกความก้าวหน้า "รายขั้นในบท" และคะแนนแต่ละรอบ — เก็บในเครื่องต่อผู้ใช้ (localStorage)
 * ส่วน "บทที่จบ" และ XP ยังอยู่ใน StorageService (ซิงก์ผ่าน Supabase ได้) และเป็นตัวตัดสินการปลดล็อกบทถัดไป
 */
export const STEPS = ['vocab', 'grammar', 'practice', 'conversation'] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_LABEL: Record<StepId, string> = {
  vocab: 'คำศัพท์',
  grammar: 'ประโยค & ไวยากรณ์',
  practice: 'ฝึกฝน',
  conversation: 'สนทนา',
};

export type AttemptKind = PracticeKind | 'conversation';

export interface Attempt {
  lang: Lang;
  lessonId: string;
  kind: AttemptKind;
  /** ข้อที่ถูก / ข้อที่ถูกนับคะแนน (ไม่รวมข้อที่ข้าม) */
  correct: number;
  total: number;
  skipped: number;
  passed: boolean;
  at: string;
}

export interface JournalData {
  /** key = `${lang}:${lessonId}` → ขั้นที่เรียนจบแล้ว (เวลา ISO) */
  steps: Record<string, Partial<Record<StepId, string>>>;
  attempts: Attempt[];
}

const MAX_ATTEMPTS = 1000;
const storageKey = (userId: string) => `mello:v1:journal:${userId}`;
export const stepKey = (lang: Lang, lessonId: string) => `${lang}:${lessonId}`;
export const emptyJournal = (): JournalData => ({ steps: {}, attempts: [] });

/* ---------- ฟังก์ชันล้วน (ทดสอบง่าย) ---------- */
export function withStep(data: JournalData, lang: Lang, lessonId: string, step: StepId, at = new Date().toISOString()): JournalData {
  const k = stepKey(lang, lessonId);
  if (data.steps[k]?.[step]) return data;
  return { ...data, steps: { ...data.steps, [k]: { ...data.steps[k], [step]: at } } };
}

export function withAttempt(data: JournalData, attempt: Attempt): JournalData {
  return { ...data, attempts: [...data.attempts, attempt].slice(-MAX_ATTEMPTS) };
}

/* ---------- เก็บลงเครื่อง ---------- */
function read(userId: string): JournalData {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyJournal();
    const p = JSON.parse(raw) as Partial<JournalData>;
    return {
      steps: p.steps && typeof p.steps === 'object' ? p.steps : {},
      attempts: Array.isArray(p.attempts) ? p.attempts : [],
    };
  } catch {
    return emptyJournal();
  }
}

function write(userId: string, data: JournalData) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    /* พื้นที่เก็บเต็ม/ถูกปิด — ใช้ต่อในหน่วยความจำได้ แต่ไม่คงอยู่หลังรีเฟรช */
  }
}

interface JournalState {
  userId: string | null;
  data: JournalData;
  load: (userId: string | null) => void;
  markStep: (lang: Lang, lessonId: string, step: StepId) => void;
  addAttempt: (attempt: Omit<Attempt, 'at'>) => void;
}

export const useJournal = create<JournalState>((set, get) => {
  const commit = (next: JournalData) => {
    const { userId } = get();
    if (!userId || next === get().data) return;
    write(userId, next);
    set({ data: next });
  };
  return {
    userId: null,
    data: emptyJournal(),
    load: (userId) => set({ userId, data: userId ? read(userId) : emptyJournal() }),
    markStep: (lang, lessonId, step) => commit(withStep(get().data, lang, lessonId, step)),
    addAttempt: (attempt) => commit(withAttempt(get().data, { ...attempt, at: new Date().toISOString() })),
  };
});

import { create } from 'zustand';
import { getLessonsByCareer } from '../../data';
import type { Lang } from '../../types';
import { generateQuestions, shuffle, type Rng } from '../practice/generators';
import type { ChoiceQuestion } from '../practice/types';

/** เกณฑ์ผ่านการสอบท้ายหมวด */
export const EXAM_PASS_RATIO = 0.8;

const isChoice = (q: { type: string }): q is ChoiceQuestion => q.type === 'choice';

/**
 * ข้อสอบท้ายหมวด: ทุกบทในหมวดออกบทละ 2 ข้อ (จำคำศัพท์ 1 + ฟังแล้วเข้าใจ 1 คนละคำกัน)
 * ใช้เฉพาะข้อเลือกตอบ ไม่ต้องใช้ไมค์ แล้วสลับลำดับทั้งชุด
 */
export function buildExam(careerId: string, lang: Lang, rng: Rng = Math.random): ChoiceQuestion[] {
  const out: ChoiceQuestion[] = [];
  for (const lesson of getLessonsByCareer(careerId)) {
    const mem = shuffle(generateQuestions(lesson, lang, 'memory', rng).filter(isChoice), rng);
    const lis = shuffle(generateQuestions(lesson, lang, 'listening', rng).filter(isChoice), rng);
    const m = mem[0];
    const l = lis.find((q) => q.wordId !== m?.wordId) ?? lis[0];
    if (m) out.push(m);
    if (l) out.push(l);
  }
  return shuffle(out, rng);
}

export interface ExamRecord {
  best: number; // ร้อยละสูงสุด 0-100
  attempts: number;
  passed: boolean;
  at: string;
}
type Records = Record<string, ExamRecord>; // key = `${lang}:${careerId}`
export const examKey = (lang: Lang, careerId: string) => `${lang}:${careerId}`;

export function withExamResult(records: Records, lang: Lang, careerId: string, correct: number, total: number, at = new Date().toISOString()): Records {
  const k = examKey(lang, careerId);
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const passed = total > 0 && correct / total >= EXAM_PASS_RATIO;
  const prev = records[k];
  return {
    ...records,
    [k]: { best: Math.max(prev?.best ?? 0, pct), attempts: (prev?.attempts ?? 0) + 1, passed: !!prev?.passed || passed, at },
  };
}

const storageKey = (userId: string) => `mello:v1:exam:${userId}`;
function read(userId: string): Records {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const p = raw ? JSON.parse(raw) : {};
    return p && typeof p === 'object' && !Array.isArray(p) ? (p as Records) : {};
  } catch {
    return {};
  }
}

interface ExamState {
  userId: string | null;
  records: Records;
  load: (userId: string | null) => void;
  record: (lang: Lang, careerId: string, correct: number, total: number) => void;
}

export const useExam = create<ExamState>((set, get) => ({
  userId: null,
  records: {},
  load: (userId) => set({ userId, records: userId ? read(userId) : {} }),
  record: (lang, careerId, correct, total) => {
    const { userId, records } = get();
    if (!userId) return;
    const next = withExamResult(records, lang, careerId, correct, total);
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
    } catch {
      /* เก็บไม่ได้ — ใช้ต่อในหน่วยความจำ */
    }
    set({ records: next });
  },
}));

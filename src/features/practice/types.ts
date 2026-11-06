import type { Lang } from '../../types';

export type PracticeKind = 'memory' | 'reading' | 'pronunciation' | 'listening' | 'sentence' | 'scenario';

export const PRACTICE_KINDS: { id: PracticeKind; titleTh: string; descTh: string; icon: string }[] = [
  { id: 'memory', titleTh: 'จำคำศัพท์', descTh: 'เลือกความหมายหรือคำที่ถูกต้อง', icon: '🧠' },
  { id: 'reading', titleTh: 'อ่านคำศัพท์', descTh: 'ดูคำแล้วเลือกคำอ่านที่ถูก', icon: '📖' },
  { id: 'pronunciation', titleTh: 'ออกเสียง', descTh: 'พูดใส่ไมค์ให้ตรงกับคำ (ข้ามได้ถ้าไม่สะดวกพูด)', icon: '🎤' },
  { id: 'listening', titleTh: 'ฟังแล้วเข้าใจ', descTh: 'ฟังเสียงแล้วเลือกความหมาย', icon: '👂' },
  { id: 'sentence', titleTh: 'สร้างประโยค', descTh: 'เรียงคำให้เป็นประโยคที่ถูกต้อง', icon: '🧩' },
  { id: 'scenario', titleTh: 'ใช้ในสถานการณ์งาน', descTh: 'เลือกประโยคตอบลูกค้าที่เหมาะสม', icon: '💼' },
];

interface Base {
  id: string;
  kind: PracticeKind;
  wordId?: string;
  explainTh: string;
}

export interface ChoiceQuestion extends Base {
  type: 'choice';
  promptTh: string;
  /** ข้อความที่แสดงเป็นโจทย์ (ถ้าไม่มี = โจทย์เป็นเสียงอย่างเดียว) */
  display?: string;
  displayLang?: Lang;
  icon?: string;
  audio?: { text: string; lang: Lang };
  options: string[];
  optionsLang?: Lang; // ภาษาของตัวเลือก (ไม่ใส่ = ภาษาไทย)
  answerIndex: number;
}

export interface SpeakQuestion extends Base {
  type: 'speak';
  promptTh: string;
  target: string;
  lang: Lang;
  meaningTh: string;
  pron: string;
  icon: string;
}

export interface OrderQuestion extends Base {
  type: 'order';
  promptTh: string;
  lang: Lang;
  tokens: string[]; // สลับลำดับแล้ว
  answer: string[];
  sentence: string; // ประโยคเต็มที่ถูกต้อง
  translationTh: string;
}

export type Question = ChoiceQuestion | SpeakQuestion | OrderQuestion;

export interface QuestionResult {
  questionId: string;
  kind: PracticeKind;
  wordId?: string;
  correct: boolean;
  /** ข้าม (เช่น ไม่สะดวกพูดใส่ไมค์) — ไม่นับเป็นถูกหรือผิด และไม่นำไปคิดคะแนน */
  skipped?: boolean;
}

/** รอบแบบฝึกที่ต้องทำตามลำดับในบทเรียน; "อ่านคำศัพท์" ภาษาจีนคือการเลือกพินอิน จึงข้ามเมื่อผู้ใช้เลือกไม่มีพินอิน */
export function practiceRounds(lang: Lang, showPinyin: boolean): PracticeKind[] {
  return PRACTICE_KINDS.map((k) => k.id).filter((id) => !(id === 'reading' && lang === 'zh' && !showPinyin));
}

/** สรุปผลของรอบ: ไม่นับข้อที่ข้าม */
export function scoreResults(results: { correct: boolean; skipped?: boolean }[]) {
  const scored = results.filter((r) => !r.skipped);
  return { correct: scored.filter((r) => r.correct).length, total: scored.length, skipped: results.length - scored.length };
}

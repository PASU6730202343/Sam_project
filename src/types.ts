export type Lang = 'en' | 'zh';
export const LANGS: Lang[] = ['en', 'zh'];

export interface Word {
  id: string; // เช่น "hotel-01-03"
  en: string;
  enPron: string; // คำอ่านทับศัพท์ไทย (เลือกแบบเดียวทั้งโปรเจกต์)
  th: string;
  zh: string;
  pinyin: string;
  icon: string;
  category: string;
  exampleEn: string;
  exampleZh: string;
  exampleTh: string;
}

export interface GrammarNote {
  title: string;
  explanationTh: string;
  pattern: string;
  examples: { text: string; th: string }[];
}

export interface ConvStep {
  prompt: Record<Lang, string>;
  suggestedAnswers: Record<Lang, string[]>;
  keywords: Record<Lang, string[]>;
  tipTh: string;
}

export interface Lesson {
  id: string;
  careerId: string;
  order: number;
  titleTh: string;
  titleEn: string;
  titleZh: string;
  words: Word[];
  grammar: { en: GrammarNote; zh: GrammarNote };
  conversation: { role: string; context: string; steps: ConvStep[] };
}

export interface Career {
  id: string;
  nameTh: string;
  nameEn: string;
  nameZh: string;
  icon: string;
  descriptionTh: string;
}

/* ---------- ผู้ใช้ / ความก้าวหน้า ---------- */
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export type XpSource = 'lesson' | 'practice' | 'conversation';

export interface XpEntry {
  key: string; // unique: `${userId}:${lang}:${lessonId}`
  userId: string;
  lang: Lang;
  lessonId: string;
  careerId: string;
  source: XpSource;
  amount: number;
  at: string;
}

export interface CompletedLesson {
  lang: Lang;
  lessonId: string;
  careerId: string;
  at: string;
}

export interface StudyStats {
  sessions: number;
  wordsReviewed: number;
  practiceRuns: number;
  conversationsDone: number;
  lastStudyAt: string | null;
}

export interface UserProgress {
  xp: Record<Lang, number>;
  xpHistory: XpEntry[];
  completed: CompletedLesson[];
  starred: Record<Lang, string[]>;
  stats: Record<Lang, StudyStats>;
}

export interface Settings {
  lang: Lang;
  showPinyin: boolean;
}

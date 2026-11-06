import type { Lang, Settings, StudyStats, User, UserProgress, XpSource } from '../../types';

export class StorageError extends Error {
  code: 'EMAIL_TAKEN' | 'INVALID_CREDENTIALS' | 'NOT_FOUND' | 'NOT_IMPLEMENTED' | 'NOT_CONFIGURED' | 'EMAIL_NOT_CONFIRMED' | 'REQUEST_FAILED';
  constructor(code: StorageError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'StorageError';
  }
}

export interface RegisterInput {
  email: string;
  displayName: string;
  password: string;
}

export interface AwardXpInput {
  lang: Lang;
  lessonId: string;
  careerId: string;
  source: XpSource;
  amount: number;
}

export interface AwardXpResult {
  awarded: boolean; // false = เคยได้ XP ของ (user, lang, lesson) นี้แล้ว
  amount: number; // XP ที่ได้จริงในครั้งนี้
}

/** ชั้นข้อมูลเดียวที่ UI เรียกใช้ — สลับ backend ได้โดยไม่แก้ UI */
export interface StorageService {
  // สมาชิก
  register(input: RegisterInput): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getSessionUser(): Promise<User | null>;

  // ความก้าวหน้า
  getProgress(userId: string): Promise<UserProgress>;
  /**
   * ให้ XP ครั้งแรกต่อ (userId, lang, lessonId) เท่านั้น — บังคับใช้ในชั้นนี้ ไม่ใช่แค่ซ่อนปุ่ม
   * (backend ที่เชื่อถือได้ เช่น Supabase จะกำหนด amount เองและเพิกเฉยค่าที่ส่งมา)
   */
  awardXp(userId: string, input: AwardXpInput): Promise<AwardXpResult>;
  markLessonCompleted(userId: string, lang: Lang, lessonId: string, careerId: string): Promise<void>;
  recordStudy(userId: string, lang: Lang, delta: Partial<Omit<StudyStats, 'lastStudyAt'>>): Promise<void>;

  // คำที่ติดดาว
  setStarred(userId: string, lang: Lang, wordId: string, starred: boolean): Promise<void>;

  // การตั้งค่าของอุปกรณ์ (ภาษา, พินอิน)
  getSettings(): Settings;
  saveSettings(settings: Settings): void;
}

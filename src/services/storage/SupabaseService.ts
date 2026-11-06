import { createClient, type SupabaseClient, type User as AuthUser } from '@supabase/supabase-js';
import type { Lang, Settings, StudyStats, User, UserProgress } from '../../types';
import { LocalStorageService } from './LocalStorageService';
import {
  StorageError,
  type AwardXpInput,
  type AwardXpResult,
  type RegisterInput,
  type StorageService,
} from './StorageService';

/**
 * ใช้ Supabase เป็น backend จริง — โครงตารางอยู่ใน supabase/schema.sql
 * - รหัสผ่านจัดการโดย Supabase Auth (ไม่ hash เอง)
 * - กฎ "XP ครั้งแรกต่อ (ผู้ใช้, ภาษา, บทเรียน)" บังคับที่ฐานข้อมูลด้วย UNIQUE + ฟังก์ชัน award_xp (ฐานข้อมูลกำหนด amount เอง)
 * - ใช้ anon key เท่านั้น ความปลอดภัยของข้อมูลมาจาก Row Level Security
 */
export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
}

/* ---------- แปลงแถวจากฐานข้อมูลเป็น UserProgress (แยกเป็นฟังก์ชันล้วนเพื่อทดสอบ) ---------- */
export interface LedgerRow { lang: Lang; lesson_id: string; career_id: string; source: 'lesson' | 'practice' | 'conversation'; amount: number; created_at: string }
export interface CompletedRow { lang: Lang; lesson_id: string; career_id: string; completed_at: string }
export interface StarredRow { lang: Lang; word_id: string }
export interface StatsRow { lang: Lang; sessions: number; words_reviewed: number; practice_runs: number; conversations_done: number; last_study_at: string | null }

const emptyStats = (): StudyStats => ({ sessions: 0, wordsReviewed: 0, practiceRuns: 0, conversationsDone: 0, lastStudyAt: null });

export function buildProgress(
  userId: string,
  rows: { ledger: LedgerRow[]; completed: CompletedRow[]; starred: StarredRow[]; stats: StatsRow[] },
): UserProgress {
  const progress: UserProgress = {
    xp: { en: 0, zh: 0 },
    xpHistory: [],
    completed: [],
    starred: { en: [], zh: [] },
    stats: { en: emptyStats(), zh: emptyStats() },
  };
  for (const r of rows.ledger) {
    progress.xp[r.lang] += r.amount;
    progress.xpHistory.push({
      key: `${userId}:${r.lang}:${r.lesson_id}`,
      userId,
      lang: r.lang,
      lessonId: r.lesson_id,
      careerId: r.career_id,
      source: r.source,
      amount: r.amount,
      at: r.created_at,
    });
  }
  for (const r of rows.completed) progress.completed.push({ lang: r.lang, lessonId: r.lesson_id, careerId: r.career_id, at: r.completed_at });
  for (const r of rows.starred) progress.starred[r.lang].push(r.word_id);
  for (const r of rows.stats) {
    progress.stats[r.lang] = {
      sessions: r.sessions,
      wordsReviewed: r.words_reviewed,
      practiceRuns: r.practice_runs,
      conversationsDone: r.conversations_done,
      lastStudyAt: r.last_study_at,
    };
  }
  return progress;
}

/** แปลง error ของ Supabase Auth เป็น StorageError ที่ UI แสดงเป็นภาษาไทยได้ */
export function mapAuthError(err: { message?: string; status?: number; code?: string }): StorageError {
  const msg = (err.message ?? '').toLowerCase();
  if (err.code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return new StorageError('INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }
  if (err.code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return new StorageError('EMAIL_NOT_CONFIRMED', 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (ตรวจกล่องจดหมายของคุณ)');
  }
  if (err.code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already been registered')) {
    return new StorageError('EMAIL_TAKEN', 'อีเมลนี้ถูกใช้สมัครแล้ว');
  }
  if (err.status === 429 || msg.includes('rate limit')) {
    return new StorageError('REQUEST_FAILED', 'ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่');
  }
  return new StorageError('REQUEST_FAILED', 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่');
}

const toUser = (u: AuthUser): User => ({
  id: u.id,
  email: u.email ?? '',
  displayName: (u.user_metadata?.display_name as string | undefined) ?? (u.email ?? 'user').split('@')[0],
  createdAt: u.created_at,
});

const failed = () => new StorageError('REQUEST_FAILED', 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่');

export class SupabaseService implements StorageService {
  private device = new LocalStorageService(); // การตั้งค่าของอุปกรณ์ (ภาษา/พินอิน) เก็บในเครื่องเสมอ
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig, client?: SupabaseClient) {
    this.config = config;
    this.client = client ?? null;
  }

  private get db(): SupabaseClient {
    if (!this.client) {
      if (!this.config.url || !this.config.anonKey) {
        throw new StorageError('NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env');
      }
      this.client = createClient(this.config.url, this.config.anonKey);
    }
    return this.client;
  }

  async register({ email, displayName, password }: RegisterInput): Promise<User> {
    const { data, error } = await this.db.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    if (error) throw mapAuthError(error);
    // อีเมลที่มีอยู่แล้ว (เมื่อเปิด confirm email) Supabase จะตอบสำเร็จแต่ไม่มี identity เพื่อไม่เปิดเผยว่าอีเมลมีอยู่
    if (data.user && data.user.identities?.length === 0) throw new StorageError('EMAIL_TAKEN', 'อีเมลนี้ถูกใช้สมัครแล้ว');
    if (!data.user || !data.session) {
      throw new StorageError('EMAIL_NOT_CONFIRMED', 'สมัครแล้ว กรุณายืนยันอีเมลจากกล่องจดหมาย แล้วจึงเข้าสู่ระบบ');
    }
    return toUser(data.user);
  }

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await this.db.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) throw error ? mapAuthError(error) : failed();
    return toUser(data.user);
  }

  async logout() {
    const { error } = await this.db.auth.signOut();
    if (error) throw mapAuthError(error);
  }

  async getSessionUser(): Promise<User | null> {
    // ยังไม่ได้ตั้งค่า = ถือว่ายังไม่ login (จะมีข้อความแจ้งเมื่อผู้ใช้พยายามสมัคร/เข้าสู่ระบบ)
    if (!this.client && (!this.config.url || !this.config.anonKey)) return null;
    const { data } = await this.db.auth.getSession();
    return data.session ? toUser(data.session.user) : null;
  }

  async getProgress(userId: string): Promise<UserProgress> {
    // แคสต์เป็นชนิดเรียบง่าย: ชนิดข้อมูลของ query builder ใน supabase-js ซับซ้อนมากและทำให้ tsc ใช้หน่วยความจำพุ่ง
    type Res<T> = PromiseLike<{ data: T[] | null; error: unknown }>;
    const q = <T,>(table: string, cols: string) => this.db.from(table).select(cols).eq('user_id', userId) as unknown as Res<T>;
    const [ledger, completed, starred, stats] = await Promise.all([
      q<LedgerRow>('xp_ledger', 'lang, lesson_id, career_id, source, amount, created_at'),
      q<CompletedRow>('completed_lessons', 'lang, lesson_id, career_id, completed_at'),
      q<StarredRow>('starred_words', 'lang, word_id'),
      q<StatsRow>('study_stats', 'lang, sessions, words_reviewed, practice_runs, conversations_done, last_study_at'),
    ]);
    for (const r of [ledger, completed, starred, stats]) if (r.error) throw failed();
    return buildProgress(userId, {
      ledger: ledger.data ?? [],
      completed: completed.data ?? [],
      starred: starred.data ?? [],
      stats: stats.data ?? [],
    });
  }

  async awardXp(_userId: string, input: AwardXpInput): Promise<AwardXpResult> {
    // ฐานข้อมูลกำหนด amount เอง (input.amount ไม่ถูกส่งไป) และบังคับ unique key ที่ฝั่งเซิร์ฟเวอร์
    const { data, error } = await this.db.rpc('award_xp', {
      p_lang: input.lang,
      p_lesson_id: input.lessonId,
      p_career_id: input.careerId,
      p_source: input.source,
    });
    if (error) throw failed();
    const amount = Number(data ?? 0);
    return { awarded: amount > 0, amount };
  }

  async markLessonCompleted(userId: string, lang: Lang, lessonId: string, careerId: string) {
    const { error } = await this.db
      .from('completed_lessons')
      .upsert({ user_id: userId, lang, lesson_id: lessonId, career_id: careerId }, { onConflict: 'user_id,lang,lesson_id', ignoreDuplicates: true });
    if (error) throw failed();
  }

  async recordStudy(_userId: string, lang: Lang, delta: Partial<Omit<StudyStats, 'lastStudyAt'>>) {
    const { error } = await this.db.rpc('record_study', {
      p_lang: lang,
      p_sessions: delta.sessions ?? 0,
      p_words: delta.wordsReviewed ?? 0,
      p_practice: delta.practiceRuns ?? 0,
      p_conversations: delta.conversationsDone ?? 0,
    });
    if (error) throw failed();
  }

  async setStarred(userId: string, lang: Lang, wordId: string, starred: boolean) {
    const table = this.db.from('starred_words');
    const { error } = starred
      ? await table.upsert({ user_id: userId, lang, word_id: wordId }, { onConflict: 'user_id,lang,word_id', ignoreDuplicates: true })
      : await table.delete().match({ user_id: userId, lang, word_id: wordId });
    if (error) throw failed();
  }

  getSettings = (): Settings => this.device.getSettings();
  saveSettings = (s: Settings) => this.device.saveSettings(s);
}

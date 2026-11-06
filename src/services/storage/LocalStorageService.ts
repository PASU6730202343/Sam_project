import type { Lang, Settings, StudyStats, User, UserProgress } from '../../types';
import { hashPassword, generateSalt, verifyPassword, PBKDF2_ITERATIONS } from './passwordHash';
import { StorageError, type AwardXpInput, type AwardXpResult, type RegisterInput, type StorageService } from './StorageService';

interface UserRecord extends User {
  salt: string;
  passwordHash: string;
  iterations: number;
}

const K = {
  users: 'mello:v1:users',
  session: 'mello:v1:session',
  progress: (uid: string) => `mello:v1:progress:${uid}`,
  settings: 'mello:v1:settings',
};

const emptyStats = (): StudyStats => ({ sessions: 0, wordsReviewed: 0, practiceRuns: 0, conversationsDone: 0, lastStudyAt: null });
const emptyProgress = (): UserProgress => ({
  xp: { en: 0, zh: 0 },
  xpHistory: [],
  completed: [],
  starred: { en: [], zh: [] },
  stats: { en: emptyStats(), zh: emptyStats() },
});

const normEmail = (e: string) => e.trim().toLowerCase();
const publicUser = (r: UserRecord): User => ({ id: r.id, email: r.email, displayName: r.displayName, createdAt: r.createdAt });

export class LocalStorageService implements StorageService {
  private store: Storage;
  constructor(store: Storage = localStorage) {
    this.store = store;
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = this.store.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }
  private write(key: string, value: unknown) {
    this.store.setItem(key, JSON.stringify(value));
  }
  private users(): UserRecord[] {
    return this.read<UserRecord[]>(K.users, []);
  }

  async register({ email, displayName, password }: RegisterInput): Promise<User> {
    const users = this.users();
    const e = normEmail(email);
    if (users.some((u) => u.email === e)) throw new StorageError('EMAIL_TAKEN', 'อีเมลนี้ถูกใช้สมัครแล้ว');
    const salt = generateSalt();
    const rec: UserRecord = {
      id: crypto.randomUUID(),
      email: e,
      displayName: displayName.trim(),
      createdAt: new Date().toISOString(),
      salt,
      iterations: PBKDF2_ITERATIONS,
      passwordHash: await hashPassword(password, salt),
    };
    this.write(K.users, [...this.users(), rec]);
    this.write(K.progress(rec.id), emptyProgress());
    this.store.setItem(K.session, rec.id);
    return publicUser(rec);
  }

  async login(email: string, password: string): Promise<User> {
    const rec = this.users().find((u) => u.email === normEmail(email));
    // ตอบข้อความเดียวกันทั้งกรณีไม่พบผู้ใช้/รหัสผิด เพื่อไม่เปิดเผยว่าอีเมลมีอยู่หรือไม่
    if (!rec || !(await verifyPassword(password, rec.salt, rec.passwordHash, rec.iterations))) {
      throw new StorageError('INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    this.store.setItem(K.session, rec.id);
    return publicUser(rec);
  }

  async logout() {
    this.store.removeItem(K.session);
  }

  async getSessionUser(): Promise<User | null> {
    const id = this.store.getItem(K.session);
    const rec = id ? this.users().find((u) => u.id === id) : undefined;
    return rec ? publicUser(rec) : null;
  }

  private readProgress(userId: string): UserProgress {
    return { ...emptyProgress(), ...this.read<Partial<UserProgress>>(K.progress(userId), {}) };
  }

  async getProgress(userId: string): Promise<UserProgress> {
    return this.readProgress(userId);
  }

  /** อ่าน-แก้-เขียนแบบ synchronous ทั้งก้อน เพื่อไม่ให้การเรียกพร้อมกันแทรกกันจนได้ XP ซ้ำ */
  private mutate(userId: string, fn: (p: UserProgress) => void) {
    const p = this.readProgress(userId);
    fn(p);
    this.write(K.progress(userId), p);
  }

  async awardXp(userId: string, input: AwardXpInput): Promise<AwardXpResult> {
    const key = `${userId}:${input.lang}:${input.lessonId}`;
    let awarded = false;
    this.mutate(userId, (p) => {
      if (p.xpHistory.some((x) => x.key === key)) return; // unique key — ครั้งแรกเท่านั้น
      awarded = true;
      p.xpHistory.push({ key, userId, ...input, at: new Date().toISOString() });
      p.xp[input.lang] += input.amount;
    });
    return { awarded, amount: awarded ? input.amount : 0 };
  }

  async markLessonCompleted(userId: string, lang: Lang, lessonId: string, careerId: string) {
    this.mutate(userId, (p) => {
      if (p.completed.some((c) => c.lang === lang && c.lessonId === lessonId)) return;
      p.completed.push({ lang, lessonId, careerId, at: new Date().toISOString() });
    });
  }

  async recordStudy(userId: string, lang: Lang, delta: Partial<Omit<StudyStats, 'lastStudyAt'>>) {
    this.mutate(userId, (p) => {
      const s = p.stats[lang];
      (Object.keys(delta) as (keyof typeof delta)[]).forEach((k) => {
        s[k] += delta[k] ?? 0;
      });
      s.lastStudyAt = new Date().toISOString();
    });
  }

  async setStarred(userId: string, lang: Lang, wordId: string, starred: boolean) {
    this.mutate(userId, (p) => {
      const set = new Set(p.starred[lang]);
      if (starred) set.add(wordId);
      else set.delete(wordId);
      p.starred[lang] = [...set];
    });
  }

  getSettings(): Settings {
    return { lang: 'en', showPinyin: true, ...this.read<Partial<Settings>>(K.settings, {}) };
  }
  saveSettings(s: Settings) {
    this.write(K.settings, s);
  }
}

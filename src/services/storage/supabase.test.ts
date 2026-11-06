import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService, buildProgress, mapAuthError } from './SupabaseService';
import { StorageError } from './StorageService';

describe('buildProgress', () => {
  it('รวม XP แยกภาษา และแปลงแถวเป็น UserProgress', () => {
    const p = buildProgress('u1', {
      ledger: [
        { lang: 'en', lesson_id: 'hotel-01', career_id: 'hotel', source: 'lesson', amount: 20, created_at: '2025-01-01T00:00:00Z' },
        { lang: 'en', lesson_id: 'hotel-02', career_id: 'hotel', source: 'practice', amount: 30, created_at: '2025-01-02T00:00:00Z' },
        { lang: 'zh', lesson_id: 'hotel-01', career_id: 'hotel', source: 'lesson', amount: 20, created_at: '2025-01-03T00:00:00Z' },
      ],
      completed: [{ lang: 'en', lesson_id: 'hotel-01', career_id: 'hotel', completed_at: '2025-01-01T00:00:00Z' }],
      starred: [
        { lang: 'zh', word_id: 'hotel-01-01' },
        { lang: 'en', word_id: 'hotel-01-02' },
      ],
      stats: [{ lang: 'en', sessions: 2, words_reviewed: 10, practice_runs: 1, conversations_done: 0, last_study_at: '2025-01-02T00:00:00Z' }],
    });
    expect(p.xp).toEqual({ en: 50, zh: 20 });
    expect(p.xpHistory[0]).toMatchObject({ key: 'u1:en:hotel-01', lessonId: 'hotel-01', source: 'lesson', amount: 20 });
    expect(p.completed).toHaveLength(1);
    expect(p.starred).toEqual({ en: ['hotel-01-02'], zh: ['hotel-01-01'] });
    expect(p.stats.en).toMatchObject({ sessions: 2, wordsReviewed: 10, practiceRuns: 1 });
    expect(p.stats.zh.sessions).toBe(0);
  });
  it('ไม่มีข้อมูลเลย = ค่าว่างทั้งหมด', () => {
    const p = buildProgress('u1', { ledger: [], completed: [], starred: [], stats: [] });
    expect(p.xp).toEqual({ en: 0, zh: 0 });
    expect(p.starred).toEqual({ en: [], zh: [] });
  });
});

describe('mapAuthError', () => {
  it('แปลงรหัสข้อผิดพลาดของ Supabase Auth', () => {
    expect(mapAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' }).code).toBe('INVALID_CREDENTIALS');
    expect(mapAuthError({ message: 'Email not confirmed' }).code).toBe('EMAIL_NOT_CONFIRMED');
    expect(mapAuthError({ message: 'User already registered' }).code).toBe('EMAIL_TAKEN');
    expect(mapAuthError({ status: 429, message: 'x' }).code).toBe('REQUEST_FAILED');
    expect(mapAuthError({ message: 'boom' }).code).toBe('REQUEST_FAILED');
  });
});

/** client ปลอมที่บันทึกการเรียก เพื่อตรวจว่า service ส่งอะไรไปที่ Supabase */
function fakeClient(overrides: Record<string, unknown> = {}) {
  const calls: { fn: string; args: unknown }[] = [];
  const client = {
    auth: {
      signUp: async (a: unknown) => {
        calls.push({ fn: 'signUp', args: a });
        return {
          data: {
            user: { id: 'u1', email: 'a@b.co', created_at: 't', user_metadata: { display_name: 'Ann' }, identities: [{}] },
            session: { user: {} },
          },
          error: null,
        };
      },
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Invalid login credentials' } }),
      getSession: async () => ({ data: { session: null } }),
      signOut: async () => ({ error: null }),
    },
    rpc: async (fn: string, args: unknown) => {
      calls.push({ fn, args });
      return { data: fn === 'award_xp' ? 20 : null, error: null };
    },
    from: (table: string) => ({
      upsert: async (row: unknown, opts: unknown) => {
        calls.push({ fn: `upsert:${table}`, args: { row, opts } });
        return { error: null };
      },
      delete: () => ({
        match: async (m: unknown) => {
          calls.push({ fn: `delete:${table}`, args: m });
          return { error: null };
        },
      }),
    }),
    ...overrides,
  };
  return { client: client as unknown as SupabaseClient, calls };
}

describe('SupabaseService (client ปลอม)', () => {
  it('awardXp ไม่ส่ง amount ไปฝั่งเซิร์ฟเวอร์ และแปลงผลลัพธ์', async () => {
    const { client, calls } = fakeClient();
    const svc = new SupabaseService({}, client);
    const r = await svc.awardXp('u1', { lang: 'en', lessonId: 'hotel-01', careerId: 'hotel', source: 'lesson', amount: 99999 });
    expect(r).toEqual({ awarded: true, amount: 20 });
    expect(JSON.stringify(calls[0].args)).not.toContain('99999');
    expect(calls[0]).toMatchObject({ fn: 'award_xp', args: { p_lang: 'en', p_lesson_id: 'hotel-01', p_source: 'lesson' } });
  });
  it('awardXp: ฐานข้อมูลตอบ 0 = เคยได้แล้ว', async () => {
    const { client } = fakeClient({ rpc: async () => ({ data: 0, error: null }) });
    const r = await new SupabaseService({}, client).awardXp('u1', { lang: 'zh', lessonId: 'x', careerId: 'hotel', source: 'practice', amount: 30 });
    expect(r).toEqual({ awarded: false, amount: 0 });
  });
  it('register ส่ง display_name และคืนผู้ใช้', async () => {
    const { client, calls } = fakeClient();
    const u = await new SupabaseService({}, client).register({ email: ' A@B.co ', displayName: ' Ann ', password: 'Secret123' });
    expect(u).toMatchObject({ id: 'u1', email: 'a@b.co', displayName: 'Ann' });
    expect(calls[0].args).toMatchObject({ email: 'a@b.co', options: { data: { display_name: 'Ann' } } });
  });
  it('register: ไม่มี session (ต้องยืนยันอีเมล) → EMAIL_NOT_CONFIRMED', async () => {
    const { client } = fakeClient();
    (client as unknown as { auth: { signUp: unknown } }).auth.signUp = async () => ({ data: { user: { id: 'u' }, session: null }, error: null });
    await expect(new SupabaseService({}, client).register({ email: 'a@b.co', displayName: 'Ann', password: 'Secret123' })).rejects.toMatchObject({
      code: 'EMAIL_NOT_CONFIRMED',
    });
  });
  it('login รหัสผิด → INVALID_CREDENTIALS', async () => {
    const { client } = fakeClient();
    await expect(new SupabaseService({}, client).login('a@b.co', 'x')).rejects.toBeInstanceOf(StorageError);
    await expect(new SupabaseService({}, client).login('a@b.co', 'x')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
  it('setStarred ติด/ยกเลิก เรียก upsert/delete ถูกตาราง', async () => {
    const { client, calls } = fakeClient();
    const svc = new SupabaseService({}, client);
    await svc.setStarred('u1', 'zh', 'hotel-01-01', true);
    await svc.setStarred('u1', 'zh', 'hotel-01-01', false);
    expect(calls.map((c) => c.fn)).toEqual(['upsert:starred_words', 'delete:starred_words']);
    expect(calls[1].args).toEqual({ user_id: 'u1', lang: 'zh', word_id: 'hotel-01-01' });
  });
  it('ยังไม่ตั้งค่า .env → getSessionUser เป็น null และสมัครแล้วขึ้น NOT_CONFIGURED', async () => {
    const svc = new SupabaseService({});
    expect(await svc.getSessionUser()).toBeNull();
    await expect(svc.register({ email: 'a@b.co', displayName: 'Ann', password: 'Secret123' })).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
  });
});

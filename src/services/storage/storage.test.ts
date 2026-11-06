import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageService } from './LocalStorageService';
import { StorageError } from './StorageService';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
  dump() { return [...this.m.values()].join('\n'); }
}

let mem: MemStorage;
let svc: LocalStorageService;
beforeEach(() => {
  mem = new MemStorage();
  svc = new LocalStorageService(mem);
});

const reg = (email = 'a@b.co') => svc.register({ email, displayName: 'Ann', password: 'Secret123' });

describe('auth', () => {
  it('ไม่เก็บรหัสผ่านเป็นข้อความธรรมดา', async () => {
    await reg();
    expect(mem.dump()).not.toContain('Secret123');
    expect(mem.dump()).toContain('passwordHash');
  });
  it('salt ต่างกันต่อผู้ใช้ (รหัสเดียวกัน hash ไม่เหมือนกัน)', async () => {
    await reg('a@b.co');
    await reg('c@d.co');
    const users = JSON.parse(mem.getItem('mello:v1:users')!);
    expect(users[0].passwordHash).not.toBe(users[1].passwordHash);
  });
  it('login ถูก/ผิด และอีเมลซ้ำ', async () => {
    await reg();
    await svc.logout();
    await expect(svc.login('a@b.co', 'wrong')).rejects.toBeInstanceOf(StorageError);
    expect((await svc.login('A@B.co', 'Secret123')).email).toBe('a@b.co');
    await expect(reg()).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });
  it('logout ล้าง session', async () => {
    await reg();
    await svc.logout();
    expect(await svc.getSessionUser()).toBeNull();
  });
});

describe('XP', () => {
  const input = { lang: 'en' as const, lessonId: 'hotel-01', careerId: 'hotel', source: 'lesson' as const, amount: 10 };

  it('ได้ XP ครั้งแรกเท่านั้น ทำซ้ำไม่เพิ่ม', async () => {
    const u = await reg();
    expect((await svc.awardXp(u.id, input)).awarded).toBe(true);
    const again = await svc.awardXp(u.id, { ...input, source: 'practice', amount: 50 });
    expect(again).toEqual({ awarded: false, amount: 0 });
    const p = await svc.getProgress(u.id);
    expect(p.xp.en).toBe(10);
    expect(p.xpHistory).toHaveLength(1);
  });
  it('แยกตามภาษาและตามผู้ใช้', async () => {
    const u1 = await reg('a@b.co');
    const u2 = await reg('c@d.co');
    await svc.awardXp(u1.id, input);
    expect((await svc.awardXp(u1.id, { ...input, lang: 'zh' })).awarded).toBe(true);
    expect((await svc.awardXp(u2.id, input)).awarded).toBe(true);
    const p = await svc.getProgress(u1.id);
    expect(p.xp).toEqual({ en: 10, zh: 10 });
  });
  it('เรียกพร้อมกันก็ได้ XP ครั้งเดียว', async () => {
    const u = await reg();
    await Promise.all([svc.awardXp(u.id, input), svc.awardXp(u.id, input)]);
    expect((await svc.getProgress(u.id)).xp.en).toBe(10);
  });
});

describe('starred', () => {
  it('ติดดาว/ยกเลิก คงอยู่เมื่อสร้าง service ใหม่ (จำลองรีเฟรช)', async () => {
    const u = await reg();
    await svc.setStarred(u.id, 'zh', 'hotel-01-01', true);
    await svc.setStarred(u.id, 'zh', 'hotel-01-02', true);
    await svc.setStarred(u.id, 'zh', 'hotel-01-01', false);
    const p = await new LocalStorageService(mem).getProgress(u.id);
    expect(p.starred.zh).toEqual(['hotel-01-02']);
    expect(p.starred.en).toEqual([]);
  });
});

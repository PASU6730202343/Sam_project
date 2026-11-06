import { beforeEach, describe, expect, it } from 'vitest';
import { storage } from '../../services/storage';
import { useAuth } from '../auth/authStore';
import { useJournal } from './journal';
import { useProgressStore } from './progressStore';
import { getLesson } from '../../data';

const lesson = getLesson('hotel-01')!;
const lesson2 = getLesson('hotel-02')!;
let uid = '';

beforeEach(async () => {
  localStorage.clear();
  useAuth.setState({ user: null });
  await useAuth.getState().register({ email: `t${Math.random()}@x.co`, displayName: 'Tester', password: 'Secret123' });
  uid = useAuth.getState().user!.id;
  useJournal.getState().load(uid);
});

const xp = async () => (await storage.getProgress(uid)).xp;

describe('จบบทเรียน → XP ครั้งแรกต่อ (ผู้ใช้/ภาษา/บท)', () => {
  it('จบบทได้ XP ครั้งเดียว ทำซ้ำไม่เพิ่ม และบันทึกว่าจบบท', async () => {
    const s = useProgressStore.getState();
    const first = await s.completeLesson(lesson, 'en');
    expect(first?.awarded).toBe(true);
    const again = await s.completeLesson(lesson, 'en');
    expect(again?.awarded).toBe(false);
    expect((await xp()).en).toBe(20);
    const p = await storage.getProgress(uid);
    expect(p.completed.map((c) => c.lessonId)).toEqual(['hotel-01']);
  });
  it('แยกภาษาและแยกบท', async () => {
    const s = useProgressStore.getState();
    await s.completeLesson(lesson, 'en');
    await s.completeLesson(lesson, 'zh');
    await s.completeLesson(lesson2, 'en');
    expect(await xp()).toEqual({ en: 40, zh: 20 });
  });
});

describe('แบบฝึก/สนทนา: บันทึกคะแนนรอบ แต่ยังไม่ทำให้บทจบ', () => {
  it('ผ่านแบบฝึกไม่ได้ XP และไม่นับว่าจบบท แต่เก็บคะแนนและนับสถิติ', async () => {
    const r = await useProgressStore.getState().finishPractice(lesson, 'en', 'memory', 5, 5);
    expect(r).toEqual({ passed: true });
    const p = await storage.getProgress(uid);
    expect(p.xp.en).toBe(0);
    expect(p.completed).toHaveLength(0);
    expect(p.stats.en.practiceRuns).toBe(1);
    expect(useJournal.getState().data.attempts).toMatchObject([{ lang: 'en', lessonId: 'hotel-01', kind: 'memory', correct: 5, total: 5, passed: true }]);
  });
  it('เกณฑ์ผ่านแบบฝึก 70% (3/5 ไม่ผ่าน, 4/5 ผ่าน)', async () => {
    const s = useProgressStore.getState();
    expect((await s.finishPractice(lesson, 'en', 'memory', 3, 5))?.passed).toBe(false);
    expect((await s.finishPractice(lesson, 'en', 'memory', 4, 5))?.passed).toBe(true);
  });
  it('สนทนา: ผ่านที่ 3/5 ไม่ผ่านที่ 2/5 และไม่ได้ XP/ไม่จบบทเอง', async () => {
    const s = useProgressStore.getState();
    expect((await s.finishConversation(lesson, 'zh', 2, 5))?.passed).toBe(false);
    expect((await s.finishConversation(lesson, 'zh', 3, 5))?.passed).toBe(true);
    const p = await storage.getProgress(uid);
    expect(p.xp.zh).toBe(0);
    expect(p.completed).toHaveLength(0);
    expect(p.stats.zh.conversationsDone).toBe(2);
  });
  it('ข้ามทุกข้อ (ไม่มีคะแนน) ไม่ถูกตัดว่าไม่ผ่าน', async () => {
    const r = await useProgressStore.getState().finishPractice(lesson, 'en', 'pronunciation', 0, 0, 5);
    expect(r).toEqual({ passed: true });
    expect(useJournal.getState().data.attempts[0]).toMatchObject({ total: 0, skipped: 5 });
  });
  it('จบบทแล้วขั้นสนทนาถูกบันทึกในสมุดบันทึก', async () => {
    await useProgressStore.getState().completeLesson(lesson, 'en');
    expect(useJournal.getState().data.steps['en:hotel-01']?.conversation).toBeTruthy();
  });
});

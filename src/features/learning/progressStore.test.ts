import { beforeEach, describe, expect, it } from 'vitest';
import { storage } from '../../services/storage';
import { useAuth } from '../auth/authStore';
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
});

const xp = async () => (await storage.getProgress(uid)).xp;

describe('XP ผ่าน progressStore (ครั้งแรกต่อ ผู้ใช้/ภาษา/บท)', () => {
  it('ผ่านแบบฝึกได้ XP ครั้งเดียว ทำซ้ำไม่เพิ่ม', async () => {
    const s = useProgressStore.getState();
    const first = await s.finishPractice(lesson, 'en', 5, 5);
    expect(first?.xp?.awarded).toBe(true);
    const again = await s.finishPractice(lesson, 'en', 5, 5);
    expect(again?.xp?.awarded).toBe(false);
    expect((await xp()).en).toBe(30);
  });
  it('ไม่ผ่านเกณฑ์ไม่ได้ XP และไม่นับว่าจบบท แต่นับสถิติ', async () => {
    const r = await useProgressStore.getState().finishPractice(lesson, 'en', 3, 5);
    expect(r).toEqual({ passed: false, xp: null });
    const p = await storage.getProgress(uid);
    expect(p.xp.en).toBe(0);
    expect(p.completed).toHaveLength(0);
    expect(p.stats.en.practiceRuns).toBe(1);
  });
  it('ได้ XP จากแหล่งเดียวต่อบท: จบบท → ผ่านแบบฝึก → ผ่านสนทนา รวมได้แค่ครั้งแรก', async () => {
    const s = useProgressStore.getState();
    await s.completeLesson(lesson, 'en');
    await s.finishPractice(lesson, 'en', 5, 5);
    await s.finishConversation(lesson, 'en', 5, 5);
    expect((await xp()).en).toBe(20);
  });
  it('แยกภาษาและแยกบท', async () => {
    const s = useProgressStore.getState();
    await s.finishPractice(lesson, 'en', 5, 5);
    await s.finishPractice(lesson, 'zh', 5, 5);
    await s.finishConversation(lesson2, 'en', 3, 5);
    expect(await xp()).toEqual({ en: 60, zh: 30 });
  });
  it('สนทนา: ผ่านที่ 3/5 ไม่ผ่านที่ 2/5', async () => {
    const s = useProgressStore.getState();
    expect((await s.finishConversation(lesson, 'zh', 2, 5))?.passed).toBe(false);
    expect((await s.finishConversation(lesson, 'zh', 3, 5))?.passed).toBe(true);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { getLesson, getLessonsByCareer, lessons } from '../../data';
import { isLessonUnlocked, isStepUnlocked, nextStep, previousLesson, stepProgress } from './access';
import { emptyJournal, stepKey, useJournal, withAttempt, withStep, type Attempt } from './journal';
import { attemptPct, averageBestPct, lessonsWithAttempts, summarizeLesson } from './scores';
import { practiceRounds, scoreResults } from '../practice/types';
import { buildAdvice } from '../practice/advice';
import { generateQuestions, mulberry32 } from '../practice/generators';

const L1 = getLesson('hotel-01')!;
const L2 = getLesson('hotel-02')!;

describe('ล็อกบท: เรียนไปตามลำดับในหมวดเดียวกัน', () => {
  it('บทแรกของทุกหมวดเปิดอยู่เสมอ', () => {
    const firsts = [...new Set(lessons.map((l) => l.careerId))].map((c) => getLessonsByCareer(c)[0]);
    expect(firsts.length).toBeGreaterThanOrEqual(8);
    for (const l of firsts) expect(isLessonUnlocked(l, new Set())).toBe(true);
  });
  it('บทถัดไปล็อกจนกว่าจะจบบทก่อนหน้า', () => {
    expect(isLessonUnlocked(L2, new Set())).toBe(false);
    expect(isLessonUnlocked(L2, new Set(['hotel-01']))).toBe(true);
    expect(previousLesson(L2)?.id).toBe('hotel-01');
  });
  it('จบบท 1 ไม่ได้ปลดล็อกบท 3 (ต้องไล่ทีละบท)', () => {
    const L3 = getLesson('hotel-03')!;
    expect(isLessonUnlocked(L3, new Set(['hotel-01']))).toBe(false);
  });
  it('หมวดอื่นไม่ถูกล็อกด้วยความก้าวหน้าของหมวดนี้', () => {
    const other = lessons.find((l) => l.careerId !== 'hotel' && l.order === 1)!;
    expect(isLessonUnlocked(other, new Set())).toBe(true);
  });
});

describe('ขั้นในบท: คำศัพท์ → ไวยากรณ์ → ฝึกฝน → สนทนา', () => {
  it('เริ่มต้นเข้าได้แค่คำศัพท์ และขั้นถัดไปคือคำศัพท์', () => {
    const d = stepProgress(false, undefined);
    expect(isStepUnlocked('vocab', d)).toBe(true);
    expect(isStepUnlocked('grammar', d)).toBe(false);
    expect(isStepUnlocked('practice', d)).toBe(false);
    expect(isStepUnlocked('conversation', d)).toBe(false);
    expect(nextStep(d)).toBe('vocab');
  });
  it('ข้ามขั้นไม่ได้: จบแค่ไวยากรณ์โดยไม่จบคำศัพท์ ก็ยังเข้าฝึกฝนไม่ได้', () => {
    const d = stepProgress(false, { grammar: 'x' });
    expect(isStepUnlocked('practice', d)).toBe(false);
    expect(nextStep(d)).toBe('vocab');
  });
  it('ปลดล็อกทีละขั้นตามที่จบ', () => {
    const d = stepProgress(false, { vocab: 'x', grammar: 'x' });
    expect(isStepUnlocked('practice', d)).toBe(true);
    expect(isStepUnlocked('conversation', d)).toBe(false);
    expect(nextStep(d)).toBe('practice');
  });
  it('บทที่จบแล้วเปิดทุกขั้น (กลับมาทบทวนได้)', () => {
    const d = stepProgress(true, undefined);
    expect(isStepUnlocked('conversation', d)).toBe(true);
    expect(nextStep(d)).toBeNull();
  });
});

describe('สมุดบันทึกความก้าวหน้า (journal)', () => {
  beforeEach(() => localStorage.clear());

  it('withStep ไม่เขียนทับเวลาเดิม และแยกตามภาษา/บท', () => {
    let j = withStep(emptyJournal(), 'en', 'hotel-01', 'vocab', 'T1');
    j = withStep(j, 'en', 'hotel-01', 'vocab', 'T2');
    j = withStep(j, 'zh', 'hotel-01', 'vocab', 'T3');
    expect(j.steps[stepKey('en', 'hotel-01')]?.vocab).toBe('T1');
    expect(j.steps[stepKey('zh', 'hotel-01')]?.vocab).toBe('T3');
    expect(j.steps[stepKey('en', 'hotel-02')]).toBeUndefined();
  });
  it('เก็บลง localStorage ต่อผู้ใช้ และโหลดกลับมาได้ (แยกผู้ใช้)', () => {
    useJournal.getState().load('u1');
    useJournal.getState().markStep('en', 'hotel-01', 'vocab');
    useJournal.getState().addAttempt({ lang: 'en', lessonId: 'hotel-01', kind: 'memory', correct: 4, total: 5, skipped: 0, passed: true });
    useJournal.getState().load('u2');
    expect(useJournal.getState().data).toEqual(emptyJournal());
    useJournal.getState().load('u1');
    expect(useJournal.getState().data.steps['en:hotel-01']?.vocab).toBeTruthy();
    expect(useJournal.getState().data.attempts).toHaveLength(1);
  });
  it('ข้อมูลเสียหายใน localStorage ไม่ทำให้พัง', () => {
    localStorage.setItem('mello:v1:journal:bad', '{not json');
    useJournal.getState().load('bad');
    expect(useJournal.getState().data).toEqual(emptyJournal());
  });
  it('เก็บประวัติรอบไม่เกินเพดาน', () => {
    let j = emptyJournal();
    const a: Attempt = { lang: 'en', lessonId: 'hotel-01', kind: 'memory', correct: 1, total: 1, skipped: 0, passed: true, at: 'x' };
    for (let i = 0; i < 1100; i++) j = withAttempt(j, a);
    expect(j.attempts).toHaveLength(1000);
  });
});

describe('คะแนน: ดูได้ทันทีหลังทำรอบ (ไม่ต้องรอจบบท)', () => {
  const mk = (kind: Attempt['kind'], correct: number, total: number, at: string, over: Partial<Attempt> = {}): Attempt => ({
    lang: 'en', lessonId: 'hotel-01', kind, correct, total, skipped: 0, passed: total === 0 || correct / total >= 0.7, at, ...over,
  });

  it('attemptPct: ข้ามทั้งรอบ = null', () => {
    expect(attemptPct({ correct: 4, total: 5 })).toBe(80);
    expect(attemptPct({ correct: 0, total: 0 })).toBeNull();
  });
  it('summarizeLesson: รอบที่ดีที่สุด/ล่าสุด/จำนวนรอบ', () => {
    const s = summarizeLesson([mk('memory', 3, 5, '1'), mk('memory', 5, 5, '2'), mk('memory', 4, 5, '3'), mk('listening', 2, 5, '4')], 'en', 'hotel-01');
    expect(s.memory?.attempts).toBe(3);
    expect(attemptPct(s.memory!.best!)).toBe(100);
    expect(attemptPct(s.memory!.latest!)).toBe(80);
    expect(s.listening?.attempts).toBe(1);
    expect(s.reading).toBeUndefined();
  });
  it('รอบที่ข้ามทั้งหมดไม่ทับรอบที่มีคะแนน', () => {
    const s = summarizeLesson([mk('pronunciation', 4, 5, '1'), mk('pronunciation', 0, 0, '2', { skipped: 5 })], 'en', 'hotel-01');
    expect(attemptPct(s.pronunciation!.best!)).toBe(80);
  });
  it('lessonsWithAttempts เรียงล่าสุดก่อน และแยกภาษา', () => {
    const list = [mk('memory', 5, 5, '1'), mk('memory', 5, 5, '5', { lessonId: 'hotel-02' }), mk('memory', 5, 5, '9', { lang: 'zh' })];
    expect(lessonsWithAttempts(list, 'en')).toEqual(['hotel-02', 'hotel-01']);
    expect(lessonsWithAttempts(list, 'zh')).toEqual(['hotel-01']);
  });
  it('averageBestPct เฉลี่ยจากรอบที่ดีที่สุดของแต่ละแบบ ไม่นับที่ข้าม', () => {
    expect(averageBestPct([], 'en')).toBeNull();
    const list = [mk('memory', 2, 5, '1'), mk('memory', 5, 5, '2'), mk('listening', 3, 5, '3'), mk('pronunciation', 0, 0, '4', { skipped: 5 })];
    expect(averageBestPct(list, 'en')).toBe(80); // (100 + 60) / 2
  });
});

describe('พินอินและการข้ามข้อ', () => {
  it('จีนไม่มีพินอิน → ตัดรอบ "อ่านคำศัพท์" (เลือกพินอิน) ออก', () => {
    expect(practiceRounds('zh', true)).toHaveLength(6);
    expect(practiceRounds('zh', false)).not.toContain('reading');
    expect(practiceRounds('en', false)).toContain('reading');
  });
  it('โจทย์ออกเสียงภาษาจีนไม่มีพินอินเมื่อปิด และมีเมื่อเปิด', () => {
    const off = generateQuestions(L1, 'zh', 'pronunciation', mulberry32(1), false);
    const on = generateQuestions(L1, 'zh', 'pronunciation', mulberry32(1), true);
    for (const q of off) if (q.type === 'speak') { expect(q.pron).toBe(''); expect(q.explainTh).not.toMatch(/อ่านว่า/); }
    for (const q of on) if (q.type === 'speak') expect(q.pron).not.toBe('');
  });
  it('scoreResults ไม่นับข้อที่ข้าม', () => {
    expect(scoreResults([{ correct: true }, { correct: false }, { correct: false, skipped: true }, { correct: false, skipped: true }])).toEqual({ correct: 1, total: 2, skipped: 2 });
  });
  it('คำแนะนำเมื่อข้ามทุกข้อ ไม่ตัดว่าไม่ผ่าน', () => {
    const tips = buildAdvice('pronunciation', [{ questionId: 'a', kind: 'pronunciation', correct: false, skipped: true }], L1, 'en');
    expect(tips.join(' ')).toMatch(/ข้ามทุกข้อ/);
    expect(tips.join(' ')).not.toMatch(/ยังไม่ผ่าน/);
  });
});

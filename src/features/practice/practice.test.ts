import { describe, expect, it } from 'vitest';
import { lessons, getLesson } from '../../data';
import { generateQuestions, mulberry32, tokenizeSentence } from './generators';
import { hasKeyword, pronunciationScore } from './matching';
import { PRACTICE_KINDS } from './types';
import { evaluator } from '../conversation/evaluator';

describe('ตัวสร้างโจทย์', () => {
  it('ทุกบท ทุกภาษา ทุกแบบ สร้างโจทย์ได้ 5 ข้อ และตัวเลือกถูกต้อง', () => {
    for (const lesson of lessons) {
      for (const lang of ['en', 'zh'] as const) {
        for (const { id } of PRACTICE_KINDS) {
          const qs = generateQuestions(lesson, lang, id, mulberry32(42));
          expect(qs, `${lesson.id}/${lang}/${id}`).toHaveLength(5);
          for (const q of qs) {
            if (q.type === 'choice') {
              expect(new Set(q.options).size).toBe(q.options.length); // ไม่มีตัวเลือกซ้ำ
              expect(q.options.length).toBeGreaterThanOrEqual(4);
              expect(q.options[q.answerIndex]).toBeTruthy();
            }
            if (q.type === 'order') {
              expect([...q.tokens].sort()).toEqual([...q.answer].sort());
              expect(q.tokens.length).toBeGreaterThanOrEqual(3);
            }
          }
        }
      }
    }
  });
  it('id โจทย์ไม่ซ้ำภายในรอบ', () => {
    const qs = generateQuestions(getLesson('hotel-02')!, 'zh', 'memory', mulberry32(1));
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });
  it('seed เดียวกันได้โจทย์เดียวกัน', () => {
    const a = generateQuestions(getLesson('hotel-03')!, 'en', 'memory', mulberry32(7));
    const b = generateQuestions(getLesson('hotel-03')!, 'en', 'memory', mulberry32(7));
    expect(a).toEqual(b);
  });
  it('โจทย์สถานการณ์ใช้คำตอบแนะนำของขั้นนั้นเป็นคำตอบที่ถูก', () => {
    const lesson = getLesson('hotel-01')!;
    const qs = generateQuestions(lesson, 'en', 'scenario', mulberry32(3));
    qs.forEach((q, i) => {
      if (q.type === 'choice') expect(q.options[q.answerIndex]).toBe(lesson.conversation.steps[i].suggestedAnswers.en[0]);
    });
  });
  it('แยกประโยคจีนโดยคงคำศัพท์เป็นชิ้นเดียว', () => {
    const t = tokenizeSentence('欢迎光临我们的酒店,先生。', '欢迎', 'zh');
    expect(t[0]).toBe('欢迎');
    expect(t.join('')).toBe('欢迎光临我们的酒店先生');
  });
  it('แยกประโยคอังกฤษตัดวรรคตอน', () => {
    expect(tokenizeSentence('May I see your passport, please?', 'passport', 'en')).toEqual(['May', 'I', 'see', 'your', 'passport', 'please']);
  });
});

describe('เทียบเสียงพูด', () => {
  it('ยอมรับคำที่ตรงและคล้ายมาก', () => {
    expect(pronunciationScore('Passport', 'passport', 'en').pass).toBe(true);
    expect(pronunciationScore('keycard', 'key card', 'en').pass).toBe(true);
    expect(pronunciationScore('the passport please', 'passport', 'en').pass).toBe(true);
  });
  it('ปฏิเสธคำที่ต่างกัน/ว่าง', () => {
    expect(pronunciationScore('hotel', 'passport', 'en').pass).toBe(false);
    expect(pronunciationScore('', 'passport', 'en').pass).toBe(false);
  });
  it('ภาษาจีน: คำสองตัวต้องตรง, คำยาวผิดได้หนึ่งตัว', () => {
    expect(pronunciationScore('护照', '护照', 'zh').pass).toBe(true);
    expect(pronunciationScore('互照', '护照', 'zh').pass).toBe(false);
    expect(pronunciationScore('无线网路', '无线网络', 'zh').pass).toBe(true);
  });
});

describe('ตรวจคำตอบสนทนา', () => {
  it('hasKeyword รองรับพหูพจน์และขีดกลาง', () => {
    expect(hasKeyword('I will send two towels', 'towel', 'en')).toBe(true);
    expect(hasKeyword('Set a wakeup call', 'wake-up call', 'en')).toBe(true);
    expect(hasKeyword('Please accept this', 'apology', 'en')).toBe(false);
    expect(hasKeyword('请把房卡给我', '房卡', 'zh')).toBe(true);
  });
  it('คำตอบแนะนำของทุกขั้น ทุกภาษา ต้องผ่านตัวตรวจของตัวเอง', async () => {
    for (const l of lessons) {
      for (const s of l.conversation.steps) {
        for (const lang of ['en', 'zh'] as const) {
          const joined = s.suggestedAnswers[lang].join(' ');
          const r = await evaluator.evaluate(s, joined, lang);
          expect(r.appropriate, `${l.id} ${lang}: ${s.prompt[lang]}`).toBe(true);
          const first = await evaluator.evaluate(s, s.suggestedAnswers[lang][0], lang);
          expect(first.appropriate, `${l.id} ${lang} คำตอบแรก: ${s.suggestedAnswers[lang][0]}`).toBe(true);
        }
      }
    }
  });
  it('คำตอบนอกเรื่อง/ว่าง ไม่เหมาะสม', async () => {
    const step = getLesson('hotel-01')!.conversation.steps[1];
    expect((await evaluator.evaluate(step, 'I like pizza', 'en')).appropriate).toBe(false);
    expect((await evaluator.evaluate(step, '   ', 'en')).appropriate).toBe(false);
    expect((await evaluator.evaluate(step, '我喜欢披萨', 'zh')).appropriate).toBe(false);
  });
});

import type { Lesson } from '../types';
import { careers } from './careers';

export const EXPECTED = { careers: 8, lessons: 64, words: 320, lessonsPerCareer: 8, wordsPerLesson: 5, steps: 5 };

export interface ValidationResult {
  errors: string[];
  counts: { careers: number; lessons: number; words: number; steps: number };
}

const blank = (s: unknown) => typeof s !== 'string' || s.trim() === '';
const WORD_FIELDS = ['en', 'enPron', 'th', 'zh', 'pinyin', 'icon', 'category', 'exampleEn', 'exampleZh', 'exampleTh'] as const;
const TONE_MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
const PLACEHOLDER = /lorem|ipsum|placeholder|todo|xxx/i;

/** full = ต้องครบ 8 หมวด/64 บท/320 คำ; ไม่ใช่ full = ตรวจเฉพาะหมวดที่มีข้อมูล (ระหว่างพัฒนา) */
export function validateCatalog(lessons: Lesson[], full: boolean): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(m);

  const careerIds = new Set(careers.map((c) => c.id));
  const present = new Set(lessons.map((l) => l.careerId));
  const lessonIds = new Set<string>();
  const wordIds = new Set<string>();
  let words = 0;
  let steps = 0;

  for (const l of lessons) {
    if (lessonIds.has(l.id)) err(`id บทซ้ำ: ${l.id}`);
    lessonIds.add(l.id);
    if (!careerIds.has(l.careerId)) err(`${l.id}: careerId ไม่รู้จัก "${l.careerId}"`);
    for (const f of ['titleTh', 'titleEn', 'titleZh'] as const) if (blank(l[f])) err(`${l.id}: ${f} ว่าง`);

    if (l.words.length !== EXPECTED.wordsPerLesson) err(`${l.id}: มี ${l.words.length} คำ (ต้อง ${EXPECTED.wordsPerLesson})`);
    for (const w of l.words) {
      words++;
      if (wordIds.has(w.id)) err(`id คำซ้ำ: ${w.id}`);
      wordIds.add(w.id);
      for (const f of WORD_FIELDS) if (blank(w[f])) err(`${w.id}: ฟิลด์ ${f} ว่าง`);
      if (!blank(w.pinyin) && !TONE_MARK.test(w.pinyin)) err(`${w.id}: pinyin "${w.pinyin}" ไม่มีเครื่องหมายวรรณยุกต์`);
      if (!blank(w.exampleEn) && !w.exampleEn.toLowerCase().includes(w.en.toLowerCase())) err(`${w.id}: exampleEn ไม่มีคำว่า "${w.en}"`);
      if (!blank(w.exampleZh) && !w.exampleZh.includes(w.zh)) err(`${w.id}: exampleZh ไม่มีคำว่า "${w.zh}"`);
      for (const f of WORD_FIELDS) if (PLACEHOLDER.test(String(w[f]))) err(`${w.id}: ${f} ดูเป็น placeholder`);
    }

    for (const lg of ['en', 'zh'] as const) {
      const g = l.grammar?.[lg];
      if (!g || blank(g.title) || blank(g.explanationTh) || blank(g.pattern) || !g.examples?.length) err(`${l.id}: grammar.${lg} ไม่ครบ`);
    }

    const c = l.conversation;
    if (!c || blank(c.role) || blank(c.context)) err(`${l.id}: conversation ไม่มี role/context`);
    if (c?.steps.length !== EXPECTED.steps) err(`${l.id}: มี ${c?.steps.length} ขั้นสนทนา (ต้อง ${EXPECTED.steps})`);
    c?.steps.forEach((s, i) => {
      steps++;
      const at = `${l.id} step ${i + 1}`;
      if (blank(s.tipTh)) err(`${at}: tipTh ว่าง`);
      for (const lg of ['en', 'zh'] as const) {
        if (blank(s.prompt[lg])) err(`${at}: prompt.${lg} ว่าง`);
        if (!s.suggestedAnswers[lg]?.length) err(`${at}: suggestedAnswers.${lg} ว่าง`);
        if (!s.keywords[lg]?.length) err(`${at}: keywords.${lg} ว่าง`);
        // keyword ทุกตัวต้องปรากฏในคำตอบแนะนำอย่างน้อยหนึ่งข้อ ไม่งั้นระบบตรวจคำตอบจะไม่สอดคล้อง
        const joined = (s.suggestedAnswers[lg] ?? []).join(' ').toLowerCase();
        for (const k of s.keywords[lg] ?? []) if (!joined.includes(k.toLowerCase())) err(`${at}: keyword "${k}" (${lg}) ไม่อยู่ในคำตอบแนะนำ`);
      }
    });
  }

  for (const id of present) {
    const n = lessons.filter((l) => l.careerId === id).length;
    if (n !== EXPECTED.lessonsPerCareer) err(`หมวด ${id}: มี ${n} บท (ต้อง ${EXPECTED.lessonsPerCareer})`);
    const orders = lessons.filter((l) => l.careerId === id).map((l) => l.order).sort((a, b) => a - b);
    if (orders.join() !== [1, 2, 3, 4, 5, 6, 7, 8].slice(0, orders.length).join()) err(`หมวด ${id}: order ไม่เรียง 1..n`);
  }

  if (full) {
    if (present.size !== EXPECTED.careers) err(`มี ${present.size} หมวด (ต้อง ${EXPECTED.careers})`);
    if (lessons.length !== EXPECTED.lessons) err(`มี ${lessons.length} บท (ต้อง ${EXPECTED.lessons})`);
    if (words !== EXPECTED.words) err(`มี ${words} คำ (ต้อง ${EXPECTED.words})`);
  }

  return { errors, counts: { careers: present.size, lessons: lessons.length, words, steps } };
}

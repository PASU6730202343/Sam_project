import type { Lang, Lesson, Word } from '../../types';
import type { ChoiceQuestion, OrderQuestion, PracticeKind, Question, SpeakQuestion } from './types';
import { pronunciation, targetExample, targetWord } from '../learning/wordView';

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** สร้างตัวเลือก 4 ข้อ (คำตอบ + ตัวหลอกที่ไม่ซ้ำ) แล้วสลับตำแหน่ง */
function buildOptions(correct: string, pool: string[], rng: Rng, n = 4) {
  const distractors = shuffle([...new Set(pool.filter((p) => p !== correct))], rng).slice(0, n - 1);
  const options = shuffle([correct, ...distractors], rng);
  return { options, answerIndex: options.indexOf(correct) };
}

const others = (words: Word[], w: Word) => words.filter((x) => x.id !== w.id);

/** แยกประโยคเป็นชิ้นสำหรับเกมเรียงคำ; ภาษาจีนใช้ Intl.Segmenter และถือคำศัพท์เป้าหมายเป็นชิ้นเดียว */
export function tokenizeSentence(sentence: string, word: string, lang: Lang): string[] {
  if (lang === 'en') return sentence.replace(/[.,?!]/g, '').split(/\s+/).filter(Boolean);

  const seg = (text: string): string[] => {
    const clean = text.split(/[,。?!、，？！]/).filter(Boolean);
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const s = new Intl.Segmenter('zh', { granularity: 'word' });
      return clean.flatMap((c) => [...s.segment(c)].filter((x) => x.isWordLike).map((x) => x.segment));
    }
    return clean.flatMap((c) => c.match(/.{1,2}/gu) ?? []);
  };
  const idx = sentence.indexOf(word);
  if (idx < 0) return seg(sentence);
  return [...seg(sentence.slice(0, idx)), word, ...seg(sentence.slice(idx + word.length))];
}

function memory(lesson: Lesson, lang: Lang, rng: Rng): ChoiceQuestion[] {
  return lesson.words.map((w, i) => {
    const toThai = i % 2 === 0;
    const pool = others(lesson.words, w);
    const { options, answerIndex } = toThai
      ? buildOptions(w.th, pool.map((x) => x.th), rng)
      : buildOptions(targetWord(w, lang), pool.map((x) => targetWord(x, lang)), rng);
    return {
      id: `${lesson.id}:memory:${w.id}`,
      kind: 'memory',
      type: 'choice',
      wordId: w.id,
      icon: w.icon,
      promptTh: toThai ? 'คำนี้แปลว่าอะไร' : 'ข้อใดตรงกับความหมายนี้',
      display: toThai ? targetWord(w, lang) : w.th,
      displayLang: toThai ? lang : undefined,
      options,
      optionsLang: toThai ? undefined : lang,
      answerIndex,
      explainTh: `${targetWord(w, lang)} = ${w.th}`,
    };
  });
}

function reading(lesson: Lesson, lang: Lang, rng: Rng): ChoiceQuestion[] {
  const pron = (w: Word) => pronunciation(w, lang, true);
  return lesson.words.map((w) => {
    const { options, answerIndex } = buildOptions(pron(w), others(lesson.words, w).map(pron), rng);
    return {
      id: `${lesson.id}:reading:${w.id}`,
      kind: 'reading',
      type: 'choice',
      wordId: w.id,
      icon: w.icon,
      promptTh: lang === 'en' ? 'ข้อใดคือคำอ่านของคำนี้' : 'ข้อใดคือพินอินของคำนี้',
      display: targetWord(w, lang),
      displayLang: lang,
      audio: { text: targetWord(w, lang), lang },
      options,
      answerIndex,
      explainTh: `${targetWord(w, lang)} อ่านว่า ${pron(w)}`,
    };
  });
}

function listening(lesson: Lesson, lang: Lang, rng: Rng): ChoiceQuestion[] {
  return lesson.words.map((w, i) => {
    const sentence = i % 2 === 1;
    const pool = others(lesson.words, w);
    const { options, answerIndex } = sentence
      ? buildOptions(w.exampleTh, pool.map((x) => x.exampleTh), rng)
      : buildOptions(w.th, pool.map((x) => x.th), rng);
    return {
      id: `${lesson.id}:listening:${w.id}`,
      kind: 'listening',
      type: 'choice',
      wordId: w.id,
      promptTh: sentence ? 'ฟังประโยค แล้วเลือกความหมาย' : 'ฟังคำ แล้วเลือกความหมาย',
      audio: { text: sentence ? targetExample(w, lang) : targetWord(w, lang), lang },
      options,
      answerIndex,
      explainTh: sentence ? `${targetExample(w, lang)} = ${w.exampleTh}` : `${targetWord(w, lang)} = ${w.th}`,
    };
  });
}

function pronunciationQs(lesson: Lesson, lang: Lang): SpeakQuestion[] {
  return lesson.words.map((w) => ({
    id: `${lesson.id}:pronunciation:${w.id}`,
    kind: 'pronunciation',
    type: 'speak',
    wordId: w.id,
    promptTh: 'พูดคำนี้ให้ชัด',
    target: targetWord(w, lang),
    lang,
    meaningTh: w.th,
    pron: pronunciation(w, lang, true),
    icon: w.icon,
    explainTh: `${targetWord(w, lang)} อ่านว่า ${pronunciation(w, lang, true)}`,
  }));
}

function sentence(lesson: Lesson, lang: Lang, rng: Rng): OrderQuestion[] {
  return lesson.words.map((w) => {
    const text = targetExample(w, lang);
    const answer = tokenizeSentence(text, targetWord(w, lang), lang);
    let tokens = shuffle(answer, rng);
    for (let t = 0; t < 5 && tokens.join('\u0000') === answer.join('\u0000'); t++) tokens = shuffle(answer, rng);
    return {
      id: `${lesson.id}:sentence:${w.id}`,
      kind: 'sentence',
      type: 'order',
      wordId: w.id,
      promptTh: 'เรียงคำให้เป็นประโยค',
      lang,
      tokens,
      answer,
      sentence: text,
      translationTh: w.exampleTh,
      explainTh: `ประโยคที่ถูก: ${text}`,
    };
  });
}

function scenario(lesson: Lesson, lang: Lang, rng: Rng): ChoiceQuestion[] {
  const steps = lesson.conversation.steps;
  return steps.map((s, i) => {
    const correct = s.suggestedAnswers[lang][0];
    const pool = steps.filter((_, j) => j !== i).map((x) => x.suggestedAnswers[lang][0]);
    const { options, answerIndex } = buildOptions(correct, pool, rng);
    return {
      id: `${lesson.id}:scenario:${i + 1}`,
      kind: 'scenario',
      type: 'choice',
      promptTh: `คุณคือ${lesson.conversation.role} ลูกค้าพูดว่า — เลือกประโยคตอบที่เหมาะสม`,
      display: s.prompt[lang],
      displayLang: lang,
      audio: { text: s.prompt[lang], lang },
      options,
      optionsLang: lang,
      answerIndex,
      explainTh: s.tipTh,
    };
  });
}

export function generateQuestions(lesson: Lesson, lang: Lang, kind: PracticeKind, rng: Rng = Math.random): Question[] {
  switch (kind) {
    case 'memory': return memory(lesson, lang, rng);
    case 'reading': return reading(lesson, lang, rng);
    case 'listening': return listening(lesson, lang, rng);
    case 'pronunciation': return pronunciationQs(lesson, lang);
    case 'sentence': return sentence(lesson, lang, rng);
    case 'scenario': return scenario(lesson, lang, rng);
  }
}

import type { Lang, Lesson, Word } from '../../types';

export const targetWord = (w: Word, lang: Lang) => (lang === 'en' ? w.en : w.zh);
export const targetExample = (w: Word, lang: Lang) => (lang === 'en' ? w.exampleEn : w.exampleZh);
/** en = คำอ่านทับศัพท์ไทย (แสดงเสมอ) / zh = พินอิน (แสดงตามสวิตช์) */
export const pronunciation = (w: Word, lang: Lang, showPinyin: boolean) => (lang === 'en' ? w.enPron : showPinyin ? w.pinyin : '');
export const lessonTitle = (l: Lesson, lang: Lang) => (lang === 'en' ? l.titleEn : l.titleZh);

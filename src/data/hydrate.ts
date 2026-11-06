import type { Lesson, Word } from '../types';

/** รูปแบบในไฟล์ JSON — id และ category ของคำถูกเติมตอนโหลด เพื่อไม่ให้พิมพ์ซ้ำผิดพลาด */
export type RawWord = Omit<Word, 'id' | 'category'>;
export type RawLesson = Omit<Lesson, 'words'> & { words: RawWord[] };

export function hydrate(raw: RawLesson): Lesson {
  return {
    ...raw,
    words: raw.words.map((w, i) => ({
      ...w,
      id: `${raw.id}-${String(i + 1).padStart(2, '0')}`,
      category: raw.careerId,
    })),
  };
}

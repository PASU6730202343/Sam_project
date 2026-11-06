import type { Lesson, Word } from '../types';
import { hydrate, type RawLesson } from './hydrate';
import { careers } from './careers';

// เนื้อหาบทเรียนแยกโฟลเดอร์ตามหมวด: src/data/<careerId>/<lessonId>.json
const modules = import.meta.glob<RawLesson>('./*/*.json', { eager: true, import: 'default' });

export const lessons: Lesson[] = Object.values(modules)
  .map(hydrate)
  // เรียงตามลำดับหมวดใน careers.ts (Hotel ก่อน) แล้วตามลำดับบท
  .sort((a, b) => careers.findIndex((c) => c.id === a.careerId) - careers.findIndex((c) => c.id === b.careerId) || a.order - b.order);

const lessonMap = new Map(lessons.map((l) => [l.id, l]));
const wordMap = new Map<string, Word>(lessons.flatMap((l) => l.words.map((w) => [w.id, w] as const)));

export const getLesson = (id: string) => lessonMap.get(id);
export const getLessonsByCareer = (careerId: string) => lessons.filter((l) => l.careerId === careerId);
export const getWord = (id: string) => wordMap.get(id);

export function getAdjacentLessons(lesson: Lesson) {
  const list = getLessonsByCareer(lesson.careerId);
  const i = list.findIndex((l) => l.id === lesson.id);
  return { prev: list[i - 1], next: list[i + 1] };
}

export { careers, getCareer } from './careers';

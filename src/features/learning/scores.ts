import type { Lang } from '../../types';
import type { Attempt, AttemptKind } from './journal';

/** เปอร์เซ็นต์ของรอบ (null = ข้ามทุกข้อ จึงไม่มีคะแนน) */
export const attemptPct = (a: Pick<Attempt, 'correct' | 'total'>): number | null => (a.total > 0 ? Math.round((a.correct / a.total) * 100) : null);

export interface KindSummary {
  attempts: number;
  /** รอบที่คะแนนสูงสุด (ถ้าเสมอใช้รอบล่าสุด; ถ้าไม่มีรอบที่มีคะแนนเลยใช้รอบล่าสุด) */
  best: Attempt | null;
  latest: Attempt | null;
}

export function summarizeLesson(attempts: Attempt[], lang: Lang, lessonId: string): Partial<Record<AttemptKind, KindSummary>> {
  const out: Partial<Record<AttemptKind, KindSummary>> = {};
  for (const a of attempts) {
    if (a.lang !== lang || a.lessonId !== lessonId) continue;
    const s = (out[a.kind] ??= { attempts: 0, best: null, latest: null });
    s.attempts += 1;
    s.latest = a; // attempts เรียงตามเวลาที่บันทึก
    const bp = s.best ? attemptPct(s.best) : null;
    const ap = attemptPct(a);
    if (!s.best || (ap ?? -1) >= (bp ?? -1)) s.best = a;
  }
  return out;
}

/** บทที่มีคะแนนในภาษานั้น เรียงล่าสุดก่อน */
export function lessonsWithAttempts(attempts: Attempt[], lang: Lang): string[] {
  const latest = new Map<string, string>();
  for (const a of attempts) if (a.lang === lang) latest.set(a.lessonId, a.at);
  return [...latest.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([id]) => id);
}

/** คะแนนเฉลี่ยของ "รอบที่ดีที่สุด" ในแต่ละแบบฝึก/สนทนาที่มีคะแนน (null = ยังไม่มีคะแนน) */
export function averageBestPct(attempts: Attempt[], lang: Lang): number | null {
  const best = new Map<string, number>();
  for (const a of attempts) {
    const p = attemptPct(a);
    if (a.lang !== lang || p === null) continue;
    const k = `${a.lessonId}:${a.kind}`;
    best.set(k, Math.max(best.get(k) ?? 0, p));
  }
  if (best.size === 0) return null;
  return Math.round([...best.values()].reduce((x, y) => x + y, 0) / best.size);
}

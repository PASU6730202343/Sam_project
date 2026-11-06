import type { Lang } from '../../types';

/** ตัวพิมพ์เล็ก ตัดวรรคตอน; ขีดกลางเป็นช่องว่าง (wake-up → wake up) */
function spaced(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[-‐–_]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
const compact = (s: string) => spaced(s).replace(/\s/g, '');

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export const PRONUNCIATION_THRESHOLD: Record<Lang, number> = { en: 0.8, zh: 0.66 };

/** เทียบข้อความที่ได้ยิน (หรือพิมพ์) กับคำเป้าหมาย */
export function pronunciationScore(heard: string, target: string, lang: Lang) {
  const h = compact(heard);
  const t = compact(target);
  if (!h || !t) return { score: 0, pass: false };
  if (h.includes(t)) return { score: 1, pass: true };
  const score = Math.max(0, 1 - levenshtein(h, t) / Math.max(h.length, t.length));
  return { score, pass: score >= PRONUNCIATION_THRESHOLD[lang] };
}

/** keyword อยู่ในคำตอบหรือไม่ — en: ตรงคำ/ขึ้นต้นด้วยคำ (towels ตรงกับ towel), zh: มีสตริงนั้น */
export function hasKeyword(answer: string, keyword: string, lang: Lang): boolean {
  if (lang === 'zh') return compact(answer).includes(compact(keyword));
  const a = spaced(answer);
  const k = spaced(keyword);
  if (!k) return false;
  if ((' ' + a).includes(' ' + k)) return true;
  return k.includes(' ') && compact(a).includes(compact(k)); // ยอมรับ "wakeup call" แทน "wake-up call"
}

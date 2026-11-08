import { create } from 'zustand';
import type { Lang } from '../../types';

/**
 * ทบทวนแบบ Leitner: จำได้ → ขึ้นกล่อง (ช่วงห่างขึ้น), จำไม่ได้ → กลับกล่อง 0 (ทบทวนอีกครั้งในรอบเดียวกัน)
 * เก็บในเครื่องต่อผู้ใช้ (เหมือน journal) — ใช้ได้เฉพาะคำที่ติดดาวอยู่
 */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const MAX_BOX = BOX_DAYS.length - 1;
const DAY = 86_400_000;

export interface Card {
  box: number;
  /** เวลา ISO ที่ถึงกำหนดทบทวน */
  due: string;
  reviews: number;
  lapses: number;
}

export type Deck = Record<string, Card>; // key = `${lang}:${wordId}`
export const cardKey = (lang: Lang, wordId: string) => `${lang}:${wordId}`;

export function grade(card: Card | undefined, remembered: boolean, now = Date.now()): Card {
  const prev = card ?? { box: 0, due: new Date(now).toISOString(), reviews: 0, lapses: 0 };
  const box = remembered ? Math.min(prev.box + 1, MAX_BOX) : 0;
  return {
    box,
    due: new Date(now + BOX_DAYS[box] * DAY).toISOString(),
    reviews: prev.reviews + 1,
    lapses: prev.lapses + (remembered ? 0 : 1),
  };
}

export function isDue(card: Card | undefined, now = Date.now()): boolean {
  return !card || Date.parse(card.due) <= now;
}

/** รหัสคำที่ถึงกำหนดทบทวน — คำใหม่ (ยังไม่มีการ์ด) มาก่อน แล้วตามด้วยคำที่เลยกำหนดนานที่สุด */
export function dueWordIds(starred: string[], lang: Lang, deck: Deck, now = Date.now()): string[] {
  return starred
    .filter((id) => isDue(deck[cardKey(lang, id)], now))
    .sort((a, b) => {
      const ca = deck[cardKey(lang, a)];
      const cb = deck[cardKey(lang, b)];
      return (ca ? Date.parse(ca.due) : -Infinity) - (cb ? Date.parse(cb.due) : -Infinity);
    });
}

/* ---------- เก็บลงเครื่อง ---------- */
const storageKey = (userId: string) => `mello:v1:srs:${userId}`;

function read(userId: string): Deck {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const p = raw ? JSON.parse(raw) : {};
    return p && typeof p === 'object' && !Array.isArray(p) ? (p as Deck) : {};
  } catch {
    return {};
  }
}

interface SrsState {
  userId: string | null;
  deck: Deck;
  load: (userId: string | null) => void;
  review: (lang: Lang, wordId: string, remembered: boolean) => void;
}

export const useSrs = create<SrsState>((set, get) => ({
  userId: null,
  deck: {},
  load: (userId) => set({ userId, deck: userId ? read(userId) : {} }),
  review: (lang, wordId, remembered) => {
    const { userId, deck } = get();
    if (!userId) return;
    const k = cardKey(lang, wordId);
    const next = { ...deck, [k]: grade(deck[k], remembered) };
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
    } catch {
      /* เก็บไม่ได้ — ใช้ต่อในหน่วยความจำ */
    }
    set({ deck: next });
  },
}));

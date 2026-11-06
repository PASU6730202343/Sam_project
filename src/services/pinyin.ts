import { useEffect, useSyncExternalStore } from 'react';

/**
 * สร้างพินอินจากข้อความภาษาจีนทั้งประโยค (ข้อมูลบทเรียนมีพินอินเฉพาะระดับคำ)
 * โหลดไลบรารี pinyin-pro แบบ lazy เฉพาะเมื่อผู้ใช้เรียนจีนและเปิดพินอิน เพื่อไม่ให้หน้าอังกฤษหนักขึ้น
 */
type PinyinFn = (text: string, options?: Record<string, unknown>) => string;

let fn: PinyinFn | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function loadPinyin(): Promise<void> {
  if (!loading) {
    loading = import('pinyin-pro')
      .then((m) => {
        fn = m.pinyin as unknown as PinyinFn;
        listeners.forEach((l) => l());
      })
      .catch(() => {
        loading = null; // ลองใหม่ได้ครั้งหน้า
      });
  }
  return loading;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** ชิ้นที่เก็บไว้: ตัวจีนติดกัน หรือคำละติน/ตัวเลข — ตัวอักษรอื่น (ไทย, เครื่องหมายวรรคตอน) ไม่ใส่ในพินอิน */
const CHUNK = /([一-鿿]+|[A-Za-z0-9][A-Za-z0-9'-]*)/g;

/** พินอินของข้อความ ('' ถ้าไลบรารียังโหลดไม่เสร็จหรือไม่มีตัวจีน) */
export function toPinyin(text: string): string {
  if (!fn || !text) return '';
  const parts = text.match(CHUNK) ?? [];
  return parts
    .map((p) => (/[一-鿿]/.test(p) ? fn!(p, { toneType: 'symbol' }) : p))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** true เมื่อพร้อมสร้างพินอิน (ถ้า enabled จะสั่งโหลดไลบรารีให้และ re-render เมื่อเสร็จ) */
export function usePinyinReady(enabled: boolean): boolean {
  const ready = useSyncExternalStore(subscribe, () => fn !== null);
  useEffect(() => {
    if (enabled) void loadPinyin();
  }, [enabled]);
  return ready;
}

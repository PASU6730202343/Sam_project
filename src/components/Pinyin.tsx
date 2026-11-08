import { useMemo } from 'react';
import { useSettings } from '../features/settings/settingsStore';
import { splitSyllables, toneOf, TONE_CLASS } from '../features/review/tones';
import { toPinyin, usePinyinReady } from '../services/pinyin';
import type { Lang } from '../types';

/** พินอินที่ลงสีตามวรรณยุกต์ (เครื่องหมายบนสระยังอยู่ จึงไม่พึ่งสีอย่างเดียว) */
export function ToneText({ text, plain = false }: { text: string; plain?: boolean }) {
  if (plain) return <>{text}</>;
  return (
    <>
      {splitSyllables(text).map((s, i) => (
        <span key={i} className={TONE_CLASS[toneOf(s)]}>
          {s}
        </span>
      ))}
    </>
  );
}

interface Props {
  text: string;
  lang: Lang;
  className?: string;
  /** ไม่ลงสีวรรณยุกต์ (ใช้บนพื้นสีที่คอนทราสต์ไม่พอ) */
  plain?: boolean;
}

/**
 * พินอินกำกับใต้ข้อความภาษาจีน — แสดงทุกที่ที่มีตัวจีนเมื่อผู้ใช้เลือก "มีพินอิน"
 * และไม่แสดงอะไรเลยเมื่อเลือก "ไม่มีพินอิน" หรือกำลังเรียนภาษาอื่น
 */
export function Pinyin({ text, lang, className = '', plain }: Props) {
  const showPinyin = useSettings((s) => s.showPinyin);
  const on = lang === 'zh' && showPinyin && !!text;
  const ready = usePinyinReady(on);
  const py = useMemo(() => (on && ready ? toPinyin(text) : ''), [on, ready, text]);
  if (!py) return null;
  return (
    <span className={`block text-sm font-normal text-denim/80 ${className}`} data-testid="pinyin">
      <ToneText text={py} plain={plain} />
    </span>
  );
}

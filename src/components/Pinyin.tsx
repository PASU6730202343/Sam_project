import { useMemo } from 'react';
import { useSettings } from '../features/settings/settingsStore';
import { toPinyin, usePinyinReady } from '../services/pinyin';
import type { Lang } from '../types';

interface Props {
  text: string;
  lang: Lang;
  className?: string;
}

/**
 * พินอินกำกับใต้ข้อความภาษาจีน — แสดงทุกที่ที่มีตัวจีนเมื่อผู้ใช้เลือก "มีพินอิน"
 * และไม่แสดงอะไรเลยเมื่อเลือก "ไม่มีพินอิน" หรือกำลังเรียนภาษาอื่น
 */
export function Pinyin({ text, lang, className = '' }: Props) {
  const showPinyin = useSettings((s) => s.showPinyin);
  const on = lang === 'zh' && showPinyin && !!text;
  const ready = usePinyinReady(on);
  const py = useMemo(() => (on && ready ? toPinyin(text) : ''), [on, ready, text]);
  if (!py) return null;
  return (
    <span className={`block text-sm font-normal text-denim/80 ${className}`} data-testid="pinyin">
      {py}
    </span>
  );
}

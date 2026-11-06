import { useEffect, useState } from 'react';
import type { Lang } from '../types';
import { getTtsStatus, ttsSupported, type TtsStatus } from '../services/speech';

/** สถานะเสียงอ่านของภาษานั้น อัปเดตเมื่อเบราว์เซอร์โหลดรายชื่อเสียงเสร็จ */
export function useTtsStatus(lang: Lang): TtsStatus {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!ttsSupported()) return;
    const synth = window.speechSynthesis;
    const bump = () => setTick((t) => t + 1);
    synth.addEventListener('voiceschanged', bump);
    return () => synth.removeEventListener('voiceschanged', bump);
  }, []);
  void tick;
  return getTtsStatus(lang);
}

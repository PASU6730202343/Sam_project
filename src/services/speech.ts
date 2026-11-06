import type { Lang } from '../types';

export const LANG_TAG: Record<Lang, string> = { en: 'en-US', zh: 'zh-CN' };
export type TtsStatus = 'ok' | 'no-voice' | 'unsupported';

export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const tag = LANG_TAG[lang].toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();
  return voices.find((v) => norm(v) === tag) ?? voices.find((v) => norm(v).startsWith(lang));
}

export function getTtsStatus(lang: Lang): TtsStatus {
  if (!ttsSupported()) return 'unsupported';
  // บางเบราว์เซอร์ยังโหลดรายชื่อเสียงไม่เสร็จ (ว่าง) — ถือว่าลองพูดได้ ไม่ใช่ "ไม่มีเสียง"
  if (window.speechSynthesis.getVoices().length === 0) return 'ok';
  return pickVoice(lang) ? 'ok' : 'no-voice';
}

export function speak(text: string, lang: Lang): TtsStatus {
  const status = getTtsStatus(lang);
  if (status !== 'ok') return status;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_TAG[lang];
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.rate = lang === 'zh' ? 0.85 : 0.9;
  synth.speak(u);
  return 'ok';
}

export function ttsMessage(status: TtsStatus, lang: Lang): string {
  const name = lang === 'en' ? 'ภาษาอังกฤษ' : 'ภาษาจีน';
  if (status === 'unsupported') return 'เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง แนะนำให้ใช้ Chrome หรือ Edge เวอร์ชันล่าสุด';
  if (status === 'no-voice') return `ไม่พบเสียง${name}ในอุปกรณ์นี้ ลองเพิ่มเสียง ${LANG_TAG[lang]} ในการตั้งค่าระบบ — ยังเรียนจากตัวอักษรได้ตามปกติ`;
  return '';
}

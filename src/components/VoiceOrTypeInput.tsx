import { useState, type FormEvent } from 'react';
import type { Lang } from '../types';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { Button } from './ui';

interface Props {
  lang: Lang;
  onSubmit: (text: string) => void;
  submitLabel: string;
  placeholder: string;
  disabled?: boolean;
}

/** ช่องตอบ: พูดใส่ไมค์ (ถ้ารองรับ) หรือพิมพ์ — ข้อความจากไมค์เข้าช่องให้แก้ไขก่อนส่งได้ */
export function VoiceOrTypeInput({ lang, onSubmit, submitLabel, placeholder, disabled }: Props) {
  const [text, setText] = useState('');
  const mic = useSpeechInput(lang, setText);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    mic.stop();
    onSubmit(text.trim());
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      {!mic.supported && (
        <p role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
          ⚠️ เบราว์เซอร์นี้ไม่รองรับการพูดใส่ไมค์ (แนะนำ Chrome หรือ Edge) — พิมพ์คำตอบแทนได้ตามปกติ
        </p>
      )}
      <div className="flex gap-2">
        <input
          lang={lang === 'en' ? 'en' : 'zh-CN'}
          aria-label="คำตอบของคุณ"
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          placeholder={mic.listening ? 'กำลังฟัง… พูดได้เลย' : placeholder}
          className="min-w-0 flex-1 rounded-2xl border border-denim/30 bg-white px-4 py-2.5 text-denim focus:outline-none focus:ring-2 focus:ring-denim disabled:opacity-60"
        />
        {mic.supported && (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={mic.listening}
            aria-label={mic.listening ? 'หยุดฟังเสียง' : 'เริ่มพูดใส่ไมค์'}
            onClick={mic.listening ? mic.stop : mic.start}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim disabled:opacity-50 ${
              mic.listening ? 'animate-pulse bg-red-700 text-white' : 'bg-frost-200 text-denim hover:bg-pistachio'
            }`}
          >
            <span aria-hidden>{mic.listening ? '⏹' : '🎤'}</span>
          </button>
        )}
        <Button type="submit" disabled={disabled || !text.trim()}>
          {submitLabel}
        </Button>
      </div>
      {mic.error && (
        <p role="alert" className="text-sm text-red-700">
          {mic.error}
        </p>
      )}
    </form>
  );
}

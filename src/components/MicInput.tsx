import { useState } from 'react';
import type { Lang } from '../types';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { Button } from './ui';
import { Pinyin } from './Pinyin';

interface Props {
  lang: Lang;
  onSubmit: (text: string) => void;
  /** ไม่สะดวกพูด / ไม่มีไมค์ — ข้ามข้อนี้ (ไม่นับคะแนน) */
  onSkip: () => void;
  submitLabel: string;
  disabled?: boolean;
}

/** ตอบด้วย "เสียงพูดเท่านั้น" (ไม่มีช่องพิมพ์) พร้อมปุ่มข้ามสำหรับคนที่พูดไม่ได้ในตอนนั้น */
export function MicInput({ lang, onSubmit, onSkip, submitLabel, disabled }: Props) {
  const [text, setText] = useState('');
  const mic = useSpeechInput(lang, setText);
  const htmlLang = lang === 'en' ? 'en' : 'zh-CN';
  const heard = text.trim();

  return (
    <div className="space-y-3">
      {!mic.supported && (
        <p role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
          ⚠️ เบราว์เซอร์นี้ไม่รองรับการพูดใส่ไมค์ (แนะนำ Chrome หรือ Edge) — กด “ข้าม” เพื่อไปต่อได้
        </p>
      )}

      {mic.supported && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-frost p-4 text-center">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={mic.listening}
            onClick={mic.listening ? mic.stop : mic.start}
            className={`inline-flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-md transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim disabled:opacity-50 ${
              mic.listening ? 'animate-pulse bg-red-700 text-white' : 'bg-pistachio text-ink hover:-translate-y-0.5'
            }`}
          >
            <span aria-hidden>{mic.listening ? '⏹' : '🎤'}</span>
            <span className="sr-only">{mic.listening ? 'หยุดฟังเสียง' : 'เริ่มพูดใส่ไมค์'}</span>
          </button>
          <p className="text-sm">{mic.listening ? 'กำลังฟัง… พูดได้เลย แล้วกดหยุดเมื่อพูดจบ' : 'กดไมค์แล้วพูดตามตัวอย่าง'}</p>
          <div aria-live="polite" className="min-h-10">
            {heard ? (
              <>
                <p lang={htmlLang} className="text-xl font-semibold">“{heard}”</p>
                <Pinyin text={heard} lang={lang} />
              </>
            ) : (
              <p className="text-denim/70">ยังไม่ได้ยินเสียง</p>
            )}
          </div>
        </div>
      )}

      {mic.error && (
        <p role="alert" className="text-sm text-red-700">
          {mic.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {mic.supported && (
          <>
            <Button
              disabled={disabled || !heard}
              onClick={() => {
                mic.stop();
                onSubmit(heard);
              }}
            >
              {submitLabel}
            </Button>
            {heard && (
              <Button
                variant="ghost"
                disabled={disabled}
                onClick={() => {
                  setText('');
                  mic.start();
                }}
              >
                พูดใหม่
              </Button>
            )}
          </>
        )}
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() => {
            mic.stop();
            onSkip();
          }}
        >
          ข้าม (ไม่สะดวกพูด)
        </Button>
      </div>
    </div>
  );
}

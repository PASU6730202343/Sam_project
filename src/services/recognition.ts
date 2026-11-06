import type { Lang } from '../types';
import { LANG_TAG } from './speech';

/* TypeScript lib.dom ยังไม่มีชนิดของ Web Speech Recognition จึงประกาศเฉพาะที่ใช้ */
interface RecAlt { transcript: string }
interface RecResult { 0: RecAlt; isFinal: boolean }
interface RecEvent { results: ArrayLike<RecResult> }
interface RecErrorEvent { error: string }
interface Recognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: RecErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecCtor = new () => Recognizer;

function getCtor(): RecCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const isRecognitionSupported = () => !!getCtor();

export function recognitionErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณากดอนุญาตในเบราว์เซอร์แล้วลองใหม่ หรือพิมพ์คำตอบแทน';
    case 'no-speech':
      return 'ไม่ได้ยินเสียงพูด ลองพูดอีกครั้งให้ใกล้ไมค์ขึ้น หรือพิมพ์คำตอบแทน';
    case 'audio-capture':
      return 'ไม่พบไมโครโฟนในอุปกรณ์นี้ กรุณาพิมพ์คำตอบแทน';
    case 'network':
      return 'เชื่อมต่อบริการรู้จำเสียงไม่ได้ (ต้องต่ออินเทอร์เน็ต) กรุณาพิมพ์คำตอบแทน';
    case 'language-not-supported':
      return 'เบราว์เซอร์ไม่รองรับการรู้จำเสียงภาษานี้ กรุณาพิมพ์คำตอบแทน';
    case 'aborted':
      return '';
    default:
      return 'รู้จำเสียงไม่สำเร็จ กรุณาลองใหม่หรือพิมพ์คำตอบแทน';
  }
}

export interface RecognitionSession {
  stop: () => void;
}

export function startRecognition(
  lang: Lang,
  handlers: { onText: (text: string) => void; onError: (message: string) => void; onEnd: () => void },
): RecognitionSession | null {
  const Ctor = getCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = LANG_TAG[lang];
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => handlers.onText(Array.from(e.results).map((r) => r[0].transcript).join(''));
  rec.onerror = (e) => {
    const msg = recognitionErrorMessage(e.error);
    if (msg) handlers.onError(msg);
  };
  rec.onend = handlers.onEnd;
  try {
    rec.start();
  } catch {
    return null;
  }
  return { stop: () => rec.abort() };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '../types';
import { isRecognitionSupported, startRecognition, type RecognitionSession } from '../services/recognition';

/** พูดใส่ไมค์ → ข้อความ; supported=false ให้ UI ตกไปใช้การพิมพ์ */
export function useSpeechInput(lang: Lang, onText: (text: string) => void) {
  const supported = isRecognitionSupported();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const session = useRef<RecognitionSession | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  const stop = useCallback(() => {
    session.current?.stop();
    session.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    setError('');
    session.current?.stop();
    const s = startRecognition(lang, {
      onText: (t) => onTextRef.current(t),
      onError: (m) => setError(m),
      onEnd: () => setListening(false),
    });
    if (!s) {
      setError('เริ่มใช้ไมโครโฟนไม่ได้ กรุณาพิมพ์คำตอบแทน');
      return;
    }
    session.current = s;
    setListening(true);
  }, [lang]);

  useEffect(() => () => session.current?.stop(), []);

  return { supported, listening, error, start, stop };
}

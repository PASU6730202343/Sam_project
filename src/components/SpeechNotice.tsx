import type { Lang } from '../types';
import { useTtsStatus } from '../hooks/useTtsStatus';
import { ttsMessage } from '../services/speech';

/** แจ้งเตือนชัดเจนเมื่อไม่รองรับ/ไม่มีเสียงของภาษานั้น */
export function SpeechNotice({ lang }: { lang: Lang }) {
  const status = useTtsStatus(lang);
  if (status === 'ok') return null;
  return (
    <p role="status" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
      ⚠️ {ttsMessage(status, lang)}
    </p>
  );
}

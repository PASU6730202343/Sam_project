import { useSettings } from '../features/settings/settingsStore';

interface Props {
  /** ค่าเริ่มต้น: แสดงเฉพาะตอนกำลังเรียนภาษาจีน */
  visible?: boolean;
}

/** สวิตช์ "มีพินอิน/ไม่มีพินอิน" (จำค่าไว้ในอุปกรณ์) — มีผลกับทุกหน้าที่แสดงตัวจีน */
export function PinyinToggle({ visible }: Props) {
  const { lang, showPinyin, setShowPinyin } = useSettings();
  if (!(visible ?? lang === 'zh')) return null;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-frost-200 px-3 py-1 text-sm font-semibold">
      <input type="checkbox" role="switch" className="h-4 w-4 accent-denim" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
      {showPinyin ? 'มีพินอิน' : 'ไม่มีพินอิน'}
    </label>
  );
}

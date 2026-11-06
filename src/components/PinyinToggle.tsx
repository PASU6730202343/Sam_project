import { useSettings } from '../features/settings/settingsStore';

interface Props {
  /** ค่าเริ่มต้น: แสดงเฉพาะตอนกำลังเรียนภาษาจีน */
  visible?: boolean;
}

/** สวิตช์เปิด/ปิดพินอิน (จำค่าไว้ในอุปกรณ์) */
export function PinyinToggle({ visible }: Props) {
  const { lang, showPinyin, setShowPinyin } = useSettings();
  if (!(visible ?? lang === 'zh')) return null;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2 font-medium">
      <input type="checkbox" role="switch" className="h-5 w-5 accent-denim" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
      แสดงพินอิน
    </label>
  );
}

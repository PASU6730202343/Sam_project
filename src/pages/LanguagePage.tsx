import { Link } from 'react-router-dom';
import { Button, Card, Badge } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { useSettings } from '../features/settings/settingsStore';
import type { Lang } from '../types';

const options: { id: Lang; flag: string; name: string; native: string; note: string }[] = [
  { id: 'en', flag: '🇬🇧', name: 'ภาษาอังกฤษ', native: 'English', note: 'สำนวนสุภาพ เช่น May I…, Would you like…' },
  { id: 'zh', flag: '🇨🇳', name: 'ภาษาจีน', native: '中文', note: 'พร้อมพินอิน เช่น 请问…, 您好' },
];

export default function LanguagePage() {
  const { lang, setLang, showPinyin, setShowPinyin } = useSettings();
  return (
    <>
      <PageHeader title="เลือกภาษาที่ต้องการเรียน" subtitle="สลับได้ตลอดเวลา XP และความก้าวหน้าแยกตามภาษา" />
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <Card key={o.id} interactive className={lang === o.id ? 'ring-2 ring-pistachio' : ''}>
            <div className="text-5xl" aria-hidden>{o.flag}</div>
            <h2 className="mt-2 text-2xl font-bold">{o.native}</h2>
            <p>{o.name}</p>
            <p className="mb-4 mt-1 text-sm">{o.note}</p>
            {lang === o.id && <Badge tone="green">กำลังเรียนอยู่</Badge>}
            <div className="mt-3">
              <Button variant={lang === o.id ? 'secondary' : 'primary'} onClick={() => setLang(o.id)} aria-pressed={lang === o.id}>
                {lang === o.id ? 'เลือกแล้ว' : `เรียน${o.name}`}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <p className="font-bold">ภาษาจีน: ต้องการให้มีพินอินไหม?</p>
        <p className="mb-3 text-sm">
          เลือก “มีพินอิน” = ทุกที่ที่มีตัวจีน (คำศัพท์ ประโยค ไวยากรณ์ สนทนา แบบฝึก) จะมีพินอินกำกับเสมอ · เลือก “ไม่มีพินอิน” = ไม่แสดงพินอินเลย (รอบแบบฝึก “อ่านคำศัพท์” จะถูกข้าม) · เปลี่ยนได้ทุกเมื่อ ระบบจำค่าไว้
        </p>
        <div role="radiogroup" aria-label="แสดงพินอินหรือไม่" className="flex flex-wrap gap-3">
          {([true, false] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={showPinyin === v}
              onClick={() => setShowPinyin(v)}
              className={`rounded-2xl border-2 px-5 py-3 text-left font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${
                showPinyin === v ? 'border-pistachio bg-pistachio-100 text-ink' : 'border-frost-200 bg-white text-denim hover:bg-frost-200'
              }`}
            >
              <span aria-hidden>{showPinyin === v ? '● ' : '○ '}</span>
              {v ? 'มีพินอิน' : 'ไม่มีพินอิน'}
              <span className="block text-sm font-normal">{v ? 'เช่น 欢迎 — huānyíng' : 'เช่น 欢迎 (ตัวจีนล้วน)'}</span>
            </button>
          ))}
        </div>
      </Card>
      <div className="mt-6">
        <Link to="/careers">
          <Button size="lg">ไปเลือกหมวดอาชีพ →</Button>
        </Link>
      </div>
    </>
  );
}

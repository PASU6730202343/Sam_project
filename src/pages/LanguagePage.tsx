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
      <Card className="mt-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold">แสดงพินอิน (ภาษาจีน)</p>
          <p className="text-sm">ระบบจำค่าที่ตั้งไว้</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" role="switch" className="h-5 w-5 accent-denim" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
          <span>{showPinyin ? 'เปิด' : 'ปิด'}</span>
        </label>
      </Card>
      <div className="mt-6">
        <Link to="/careers">
          <Button size="lg">ไปเลือกหมวดอาชีพ →</Button>
        </Link>
      </div>
    </>
  );
}

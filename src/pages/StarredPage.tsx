import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Tabs } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { WordCard } from '../components/WordCard';
import { SpeechNotice } from '../components/SpeechNotice';
import { PinyinToggle } from '../components/PinyinToggle';
import { useProgress } from '../hooks/useProgress';
import { useSettings } from '../features/settings/settingsStore';
import { getWord } from '../data';
import type { Lang, Word } from '../types';

export default function StarredPage() {
  const { lang: current, showPinyin } = useSettings();
  const [tab, setTab] = useState<Lang>(current);
  const { progress } = useProgress();
  const words = (progress?.starred[tab] ?? []).map(getWord).filter((w): w is Word => !!w);

  return (
    <>
      <PageHeader title="คำที่ติดดาว ⭐" subtitle="แยกตามภาษา ข้อมูลคงอยู่หลังรีเฟรช">
        <div className="flex flex-wrap items-center gap-3">
          <PinyinToggle visible={tab === 'zh'} />
          <Tabs
            label="ภาษา"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'en', label: 'English' },
              { id: 'zh', label: '中文' },
            ]}
          />
        </div>
      </PageHeader>
      <SpeechNotice lang={tab} />
      {words.length === 0 ? (
        <Card className="text-center">
          <p className="mb-3">ยังไม่มีคำที่ติดดาวในภาษานี้ กดดาว ☆ ที่คำศัพท์ในบทเรียนเพื่อบันทึก</p>
          <Link to="/careers">
            <Button>ไปเลือกบทเรียน</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {words.map((w) => (
            <WordCard key={w.id} word={w} lang={tab} showPinyin={showPinyin} />
          ))}
        </div>
      )}
    </>
  );
}

import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button, Card, ProgressBar } from '../components/ui';
import { AudioButton } from '../components/AudioButton';
import { Pinyin, ToneText } from '../components/Pinyin';
import { PageHeader } from '../components/layout/PageHeader';
import { SpeechNotice } from '../components/SpeechNotice';
import { useProgress } from '../hooks/useProgress';
import { useSettings } from '../features/settings/settingsStore';
import { dueWordIds, useSrs } from '../features/review/srs';
import { pronunciation, targetExample, targetWord } from '../features/learning/wordView';
import { getWord } from '../data';
import type { Lang } from '../types';

export default function ReviewPage() {
  const { lang } = useParams<{ lang: string }>();
  if (lang !== 'en' && lang !== 'zh') return <Navigate to="/starred" replace />;
  return <ReviewSession lang={lang} />;
}

function ReviewSession({ lang }: { lang: Lang }) {
  const { progress } = useProgress();
  const deck = useSrs((s) => s.deck);
  const review = useSrs((s) => s.review);
  const showPinyin = useSettings((s) => s.showPinyin);
  const starred = progress?.starred[lang];

  // คิวตั้งต้นของรอบนี้ คำนวณครั้งเดียวเมื่อความก้าวหน้าโหลดเสร็จ (ระหว่างทบทวนไม่ให้คิวเปลี่ยนตาม deck)
  const initial = useMemo(() => (starred ? dueWordIds(starred, lang, deck) : null), [starred, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const [queue, setQueue] = useState<string[] | null>(null);
  const [done, setDone] = useState(0);
  const [missed, setMissed] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const q = queue ?? initial;
  if (!progress || !q) return <p>กำลังโหลด…</p>;

  const total = (initial?.length ?? 0) + missed;
  const title = <PageHeader title="ทบทวนคำติดดาว 🔁" subtitle={`${lang === 'en' ? 'English' : '中文'} · เหลือ ${q.length} คำ`} />;

  if (q.length === 0) {
    const none = (starred?.length ?? 0) === 0;
    return (
      <>
        {title}
        <Card className="text-center">
          <p className="mb-3 text-xl font-bold">{done > 0 ? `🎉 ทบทวนครบแล้ว (${done} ครั้ง)` : 'วันนี้ไม่มีคำที่ต้องทบทวน'}</p>
          <p className="mb-4">
            {none
              ? 'ยังไม่มีคำที่ติดดาวในภาษานี้ กดดาว ☆ ที่คำศัพท์ในบทเรียนก่อน'
              : 'ระบบจะนัดคำที่จำได้ให้กลับมาทบทวนตามช่วงเวลา (1 · 3 · 7 · 14 · 30 วัน)'}
          </p>
          <Link to="/starred" className="underline">
            ← กลับไปคำที่ติดดาว
          </Link>
        </Card>
      </>
    );
  }

  const word = getWord(q[0]);
  if (!word) {
    // คำนี้ไม่มีในข้อมูลแล้ว — ข้ามไป
    queueMicrotask(() => setQueue(q.slice(1)));
    return null;
  }

  const advance = (remembered: boolean) => {
    review(lang, word.id, remembered);
    setDone((d) => d + 1);
    setRevealed(false);
    if (remembered) setQueue(q.slice(1));
    else {
      setMissed((m) => m + 1);
      setQueue([...q.slice(1), word.id]); // ทวนอีกครั้งท้ายรอบ
    }
  };

  const text = targetWord(word, lang);
  const pron = pronunciation(word, lang, showPinyin);
  const example = targetExample(word, lang);
  const pct = total === 0 ? 0 : (Math.min(done, total) / total) * 100;

  return (
    <>
      {title}
      <SpeechNotice lang={lang} />
      <ProgressBar value={pct} label="ความคืบหน้าการทบทวน" />
      <Card className="mx-auto mt-4 max-w-xl text-center">
        <p className="mb-1 text-sm">ลองนึกความหมายของคำนี้</p>
        <p lang={lang === 'en' ? 'en' : 'zh-CN'} className="break-words text-4xl font-bold">
          {text}
        </p>
        {pron && <p className="text-lg">{lang === 'zh' ? <ToneText text={pron} /> : pron}</p>}
        <div className="my-3 flex justify-center">
          <AudioButton text={text} lang={lang} label={`ฟังเสียงคำว่า ${text}`} />
        </div>

        {!revealed ? (
          <Button size="lg" onClick={() => setRevealed(true)}>
            ดูคำตอบ
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-3xl" aria-hidden>
                {word.icon}
              </p>
              <p className="text-2xl font-bold">{word.th}</p>
            </div>
            <div className="rounded-2xl bg-frost p-3 text-left">
              <p lang={lang === 'en' ? 'en' : 'zh-CN'}>{example}</p>
              <Pinyin text={example} lang={lang} />
              <p className="text-sm">{word.exampleTh}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => advance(false)}>
                ยังจำไม่ได้
              </Button>
              <Button onClick={() => advance(true)}>จำได้ ✓</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

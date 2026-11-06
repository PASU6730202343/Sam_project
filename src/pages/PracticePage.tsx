import { useState } from 'react';
import { Card } from '../components/ui';
import { LessonFrame } from '../components/layout/LessonFrame';
import { SpeechNotice } from '../components/SpeechNotice';
import { useSettings } from '../features/settings/settingsStore';
import { PracticeRunner } from '../features/practice/PracticeRunner';
import { PRACTICE_KINDS, type PracticeKind } from '../features/practice/types';
import { PASS_RATIO_PRACTICE, XP_PRACTICE } from '../features/learning/xp';
import type { Lesson } from '../types';

function PracticeHub({ lesson }: { lesson: Lesson }) {
  const lang = useSettings((s) => s.lang);
  const [kind, setKind] = useState<PracticeKind | null>(null);

  // key ตามภาษา: สลับภาษาแล้วเริ่มรอบใหม่ เพื่อไม่ให้โจทย์ปนภาษา
  if (kind) return <PracticeRunner key={`${lang}:${kind}`} lesson={lesson} lang={lang} kind={kind} onExit={() => setKind(null)} />;

  return (
    <>
      <SpeechNotice lang={lang} />
      <p className="mb-4">
        เลือกแบบฝึก (ข้อละ {lesson.words.length} ข้อ) ตอบถูก ≥ {PASS_RATIO_PRACTICE * 100}% ถือว่าผ่าน และได้ {XP_PRACTICE} XP ครั้งแรกของบทนี้ในแต่ละภาษา
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICE_KINDS.map((k) => (
          <button key={k.id} type="button" onClick={() => setKind(k.id)} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded-2xl">
            <Card interactive className="h-full">
              <div className="text-4xl" aria-hidden>{k.icon}</div>
              <h2 className="mt-2 text-lg font-bold">{k.titleTh}</h2>
              <p className="text-sm">{k.descTh}</p>
            </Card>
          </button>
        ))}
      </div>
    </>
  );
}

export default function PracticePage() {
  return (
    <LessonFrame current="practice" title="ฝึกฝน">
      {(lesson) => <PracticeHub lesson={lesson} />}
    </LessonFrame>
  );
}

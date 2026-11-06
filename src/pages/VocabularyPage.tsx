import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ProgressBar } from '../components/ui';
import { LessonFrame } from '../components/layout/LessonFrame';
import { WordCard } from '../components/WordCard';
import { SpeechNotice } from '../components/SpeechNotice';
import { PinyinToggle } from '../components/PinyinToggle';
import { useSettings } from '../features/settings/settingsStore';
import type { Lesson } from '../types';

function VocabStepper({ lesson }: { lesson: Lesson }) {
  const { lang, showPinyin } = useSettings();
  const [i, setI] = useState(0);
  const total = lesson.words.length;
  const last = i === total - 1;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold" aria-live="polite">
          คำที่ {i + 1} / {total}
        </p>
        <PinyinToggle />
      </div>
      <ProgressBar className="mb-4" value={((i + 1) / total) * 100} label="ความคืบหน้าคำศัพท์" />
      <SpeechNotice lang={lang} />
      <div key={lesson.words[i].id} className="animate-slideUp">
        <WordCard word={lesson.words[i]} lang={lang} showPinyin={showPinyin} large />
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← ย้อนกลับ
        </Button>
        {last ? (
          <Link to={`/lesson/${lesson.id}/grammar`}>
            <Button>ไปต่อ: ประโยค & ไวยากรณ์ →</Button>
          </Link>
        ) : (
          <Button onClick={() => setI(i + 1)}>ถัดไป →</Button>
        )}
      </div>
    </>
  );
}

export default function VocabularyPage() {
  return (
    <LessonFrame current="vocab" title="เรียนคำศัพท์">
      {(lesson) => <VocabStepper lesson={lesson} />}
    </LessonFrame>
  );
}

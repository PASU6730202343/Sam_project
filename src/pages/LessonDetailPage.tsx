import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '../components/ui';
import { LessonFrame } from '../components/layout/LessonFrame';
import { getAdjacentLessons } from '../data';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from '../hooks/useProgress';
import { WordCard } from '../components/WordCard';
import { SpeechNotice } from '../components/SpeechNotice';
import { PinyinToggle } from '../components/PinyinToggle';
import { XP_LESSON } from '../features/learning/xp';

export default function LessonDetailPage() {
  const { lang, showPinyin } = useSettings();
  const { progress } = useProgress();

  return (
    <LessonFrame current="detail" title="รายละเอียดบทเรียน">
      {(lesson) => {
        const done = progress?.completed.some((c) => c.lang === lang && c.lessonId === lesson.id);
        const { prev, next } = getAdjacentLessons(lesson);
        return (
          <>
            <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">
                  คำศัพท์ {lesson.words.length} คำ · ประโยคตัวอย่าง · ไวยากรณ์ · สนทนา {lesson.conversation.steps.length} ขั้น
                </p>
                <p className="text-sm">เรียนจบบทครั้งแรกได้ {XP_LESSON} XP ({lang.toUpperCase()})</p>
              </div>
              {done ? <Badge tone="green">เรียนจบแล้ว ✓</Badge> : <Badge>ยังไม่จบบท</Badge>}
            </Card>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Link to={`/lesson/${lesson.id}/vocab`}>
                <Button size="lg">เริ่มเรียนคำศัพท์ →</Button>
              </Link>
              <PinyinToggle />
            </div>
            <SpeechNotice lang={lang} />
            <div className="grid gap-3 md:grid-cols-2">
              {lesson.words.map((w) => (
                <WordCard key={w.id} word={w} lang={lang} showPinyin={showPinyin} />
              ))}
            </div>
            <div className="mt-6 flex justify-between gap-3">
              {prev ? (
                <Link to={`/lesson/${prev.id}`}>
                  <Button variant="ghost">← บทก่อนหน้า</Button>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link to={`/lesson/${next.id}`}>
                  <Button variant="ghost">บทถัดไป →</Button>
                </Link>
              ) : (
                <span />
              )}
            </div>
          </>
        );
      }}
    </LessonFrame>
  );
}

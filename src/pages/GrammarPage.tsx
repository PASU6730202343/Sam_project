import { Link } from 'react-router-dom';
import { Badge, Button, Card, useToast } from '../components/ui';
import { LessonFrame } from '../components/layout/LessonFrame';
import { AudioButton } from '../components/AudioButton';
import { SpeechNotice } from '../components/SpeechNotice';
import { PinyinToggle } from '../components/PinyinToggle';
import { getAdjacentLessons } from '../data';
import { useSettings } from '../features/settings/settingsStore';
import { useProgress } from '../hooks/useProgress';
import { useProgressStore } from '../features/learning/progressStore';
import { targetExample, pronunciation } from '../features/learning/wordView';
import type { Lesson } from '../types';

function GrammarContent({ lesson }: { lesson: Lesson }) {
  const { lang, showPinyin } = useSettings();
  const { progress } = useProgress();
  const complete = useProgressStore((s) => s.completeLesson);
  const push = useToast((s) => s.push);
  const note = lesson.grammar[lang];
  const done = progress?.completed.some((c) => c.lang === lang && c.lessonId === lesson.id);
  const { next } = getAdjacentLessons(lesson);
  const langName = lang === 'en' ? 'ภาษาอังกฤษ' : 'ภาษาจีน';

  const finish = async () => {
    const res = await complete(lesson, lang);
    if (res?.awarded) push(`เรียนจบบทแล้ว! ได้ ${res.amount} XP (${langName})`, 'success');
    else push(`ทบทวนบทนี้แล้ว — เคยได้ XP ของบทนี้ใน${langName}ไปแล้ว จึงไม่ได้เพิ่ม`, 'info');
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <PinyinToggle />
      </div>
      <SpeechNotice lang={lang} />
      <Card className="mb-6">
        <h2 className="text-xl font-bold">{note.title}</h2>
        <p className="mt-2">{note.explanationTh}</p>
        <p className="mt-3 rounded-2xl bg-pistachio-100 p-3 font-mono text-ink">{note.pattern}</p>
        <ul className="mt-4 space-y-3">
          {note.examples.map((e) => (
            <li key={e.text} className="flex items-center gap-3 rounded-2xl bg-frost p-3">
              <div className="flex-1">
                <p lang={lang === 'en' ? 'en' : 'zh-CN'} className="text-lg font-semibold">
                  {e.text}
                </p>
                <p className="text-sm">{e.th}</p>
              </div>
              <AudioButton text={e.text} lang={lang} label={`ฟังประโยค ${e.text}`} />
            </li>
          ))}
        </ul>
      </Card>

      <h2 className="mb-3 text-xl font-bold">ประโยคตัวอย่างจากคำศัพท์ในบท</h2>
      <div className="space-y-3">
        {lesson.words.map((w) => {
          const s = targetExample(w, lang);
          const pron = pronunciation(w, lang, showPinyin);
          return (
            <Card key={w.id} className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {w.icon}
              </span>
              <div className="flex-1">
                <p lang={lang === 'en' ? 'en' : 'zh-CN'} className="text-lg">
                  {s}
                </p>
                <p className="text-sm">{w.exampleTh}</p>
                {pron && (
                  <p className="text-xs">
                    คำหลัก: {lang === 'en' ? w.en : w.zh} ({pron})
                  </p>
                )}
              </div>
              <AudioButton text={s} lang={lang} label={`ฟังประโยค ${s}`} />
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">จบบทเรียนนี้</p>
          <p className="text-sm">กดเมื่อเรียนคำศัพท์และไวยากรณ์เสร็จแล้ว</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {done && <Badge tone="green">เรียนจบแล้ว ✓</Badge>}
          <Button onClick={finish}>{done ? 'ทบทวนอีกครั้ง' : 'จบบทเรียน (รับ XP)'}</Button>
          {done && next && (
            <Link to={`/lesson/${next.id}`}>
              <Button variant="secondary">บทถัดไป →</Button>
            </Link>
          )}
          {done && !next && (
            <Link to="/careers">
              <Button variant="secondary">กลับหมวดอาชีพ</Button>
            </Link>
          )}
        </div>
      </Card>
      <div className="mt-4">
        <Link to={`/lesson/${lesson.id}/vocab`}>
          <Button variant="ghost">← กลับไปคำศัพท์</Button>
        </Link>
      </div>
    </>
  );
}

export default function GrammarPage() {
  return (
    <LessonFrame current="grammar" title="ประโยคตัวอย่างและไวยากรณ์">
      {(lesson) => <GrammarContent lesson={lesson} />}
    </LessonFrame>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { LessonFrame } from '../components/layout/LessonFrame';
import { AudioButton } from '../components/AudioButton';
import { Pinyin } from '../components/Pinyin';
import { SpeechNotice } from '../components/SpeechNotice';
import { stepPath } from '../features/learning/access';
import { useJournal } from '../features/learning/journal';
import { useSettings } from '../features/settings/settingsStore';
import { targetExample, pronunciation } from '../features/learning/wordView';
import type { Lesson } from '../types';

function GrammarContent({ lesson }: { lesson: Lesson }) {
  const { lang, showPinyin } = useSettings();
  const markStep = useJournal((s) => s.markStep);
  const navigate = useNavigate();
  const note = lesson.grammar[lang];
  const htmlLang = lang === 'en' ? 'en' : 'zh-CN';

  // อ่านครบแล้วกดไปต่อ → นับว่าจบขั้นไวยากรณ์ และปลดล็อกขั้นฝึกฝน
  const finish = () => {
    markStep(lang, lesson.id, 'grammar');
    navigate(stepPath(lesson.id, 'practice'));
  };

  return (
    <>
      <SpeechNotice lang={lang} />
      <Card className="mb-6">
        <h2 lang={htmlLang} className="text-xl font-bold">{note.title}</h2>
        <Pinyin text={note.title} lang={lang} />
        <p className="mt-2">{note.explanationTh}</p>
        <div className="mt-3 rounded-2xl bg-pistachio-100 p-3 text-ink">
          <p lang={htmlLang} className="font-mono">{note.pattern}</p>
          <Pinyin text={note.pattern} lang={lang} className="!text-ink/80" />
        </div>
        <ul className="mt-4 space-y-3">
          {note.examples.map((e) => (
            <li key={e.text} className="flex items-center gap-3 rounded-2xl bg-frost p-3">
              <div className="flex-1">
                <p lang={htmlLang} className="text-lg font-semibold">
                  {e.text}
                </p>
                <Pinyin text={e.text} lang={lang} />
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
                <p lang={htmlLang} className="text-lg">
                  {s}
                </p>
                <Pinyin text={s} lang={lang} />
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
          <p className="font-bold">อ่านครบแล้วใช่ไหม?</p>
          <p className="text-sm">ขั้นถัดไปคือแบบฝึก ทำตามลำดับทีละรอบ</p>
        </div>
        <Button size="lg" onClick={finish}>
          จบขั้นนี้ ไปต่อ: ฝึกฝน →
        </Button>
      </Card>
      <div className="mt-4">
        <Link to={stepPath(lesson.id, 'vocab')}>
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

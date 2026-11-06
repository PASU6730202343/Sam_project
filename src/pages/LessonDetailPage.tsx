import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '../components/ui';
import { LessonFrame } from '../components/layout/LessonFrame';
import { SpeechNotice } from '../components/SpeechNotice';
import { getAdjacentLessons } from '../data';
import { isStepUnlocked, stepPath } from '../features/learning/access';
import { STEPS, STEP_LABEL, useJournal, type StepId } from '../features/learning/journal';
import { attemptPct, summarizeLesson } from '../features/learning/scores';
import { XP_LESSON } from '../features/learning/xp';
import { practiceRounds } from '../features/practice/types';
import { useSettings } from '../features/settings/settingsStore';
import type { Lesson } from '../types';

const stepDesc = (s: StepId, lesson: Lesson, rounds: number) =>
  ({
    vocab: `เรียนทีละคำ ${lesson.words.length} คำ พร้อมเสียงและประโยคตัวอย่าง`,
    grammar: 'ประโยคตัวอย่างจากคำศัพท์ และโครงสร้างไวยากรณ์ของบท',
    practice: `แบบฝึก ${rounds} รอบ ทำตามลำดับ (มีรอบพูดใส่ไมค์ที่ข้ามได้)`,
    conversation: `สถานการณ์จำลอง ${lesson.conversation.steps.length} ขั้น พูดตอบลูกค้า (ข้ามได้ถ้าไม่สะดวกพูด)`,
  })[s];

export default function LessonDetailPage() {
  const { lang, showPinyin } = useSettings();
  const attempts = useJournal((s) => s.data.attempts);

  return (
    <LessonFrame current="detail" title="รายละเอียดบทเรียน">
      {(lesson, access) => {
        const { next: nextLesson } = getAdjacentLessons(lesson);
        const rounds = practiceRounds(lang, showPinyin);
        const sum = summarizeLesson(attempts, lang, lesson.id);
        const roundsDone = rounds.filter((k) => sum[k]).length;
        const convBest = sum.conversation?.best ? attemptPct(sum.conversation.best) : null;

        return (
          <>
            <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">เรียนตามลำดับ 4 ขั้น: คำศัพท์ → ประโยค & ไวยากรณ์ → ฝึกฝน → สนทนา</p>
                <p className="text-sm">เรียนครบทุกขั้นแล้วบทนี้จึงจะ “จบ” และปลดล็อกบทถัดไป · จบบทครั้งแรกได้ {XP_LESSON} XP ({lang.toUpperCase()})</p>
              </div>
              {access.completed ? <Badge tone="green">เรียนจบแล้ว ✓</Badge> : <Badge>ยังไม่จบบท</Badge>}
            </Card>

            <SpeechNotice lang={lang} />

            <ol className="space-y-3">
              {STEPS.map((s, i) => {
                const done = access.done[s];
                const open = isStepUnlocked(s, access.done);
                const isNext = access.next === s;
                return (
                  <li key={s}>
                    <Card className={`flex flex-wrap items-center gap-4 ${isNext ? 'ring-2 ring-pistachio' : ''} ${open ? '' : 'opacity-60'}`}>
                      <span
                        aria-hidden
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${done ? 'bg-pistachio text-ink' : 'bg-frost-200 text-denim'}`}
                      >
                        {done ? '✓' : open ? i + 1 : '🔒'}
                      </span>
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="font-bold">
                          ขั้น {i + 1}: {STEP_LABEL[s]} {!open && <span className="text-sm font-normal">(ล็อก — เรียนขั้นก่อนหน้าให้จบก่อน)</span>}
                        </p>
                        <p className="text-sm">{stepDesc(s, lesson, rounds.length)}</p>
                        {s === 'practice' && roundsDone > 0 && (
                          <p className="mt-1 text-sm">ทำแล้ว {roundsDone} / {rounds.length} รอบ · <Link className="underline" to="/scores">ดูคะแนน</Link></p>
                        )}
                        {s === 'conversation' && convBest !== null && (
                          <p className="mt-1 text-sm">คะแนนสนทนาสูงสุด {convBest}% · <Link className="underline" to="/scores">ดูคะแนน</Link></p>
                        )}
                      </div>
                      {open && (
                        <Link to={stepPath(lesson.id, s)}>
                          <Button variant={isNext ? 'primary' : 'ghost'} size={isNext ? 'lg' : 'md'}>
                            {isNext ? (done ? 'เริ่ม' : i === 0 ? 'เริ่มเรียน →' : 'เรียนต่อ →') : 'ทบทวน'}
                          </Button>
                        </Link>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 flex justify-end gap-3">
              {access.completed && nextLesson && (
                <Link to={`/lesson/${nextLesson.id}`}>
                  <Button>บทถัดไป: {nextLesson.titleTh} →</Button>
                </Link>
              )}
              {access.completed && !nextLesson && (
                <Link to="/careers">
                  <Button variant="secondary">จบหมวดนี้แล้ว กลับหมวดอาชีพ</Button>
                </Link>
              )}
            </div>
          </>
        );
      }}
    </LessonFrame>
  );
}

import type { Lang, Lesson } from '../../types';
import type { PracticeKind, QuestionResult } from './types';
import { targetWord } from '../learning/wordView';
import { PASS_RATIO_PRACTICE as PASS_RATIO } from '../learning/xp';


export function buildAdvice(kind: PracticeKind, results: QuestionResult[], lesson: Lesson, lang: Lang): string[] {
  const correct = results.filter((r) => r.correct).length;
  const ratio = results.length ? correct / results.length : 0;
  const tips: string[] = [];

  if (ratio >= 0.9) tips.push('ยอดเยี่ยมมาก! ลองฝึกแบบอื่นหรือไปฝึกสนทนาต่อได้เลย');
  else if (ratio >= PASS_RATIO) tips.push('ผ่านเกณฑ์แล้ว ทบทวนข้อที่พลาดอีกนิดจะแม่นขึ้น');
  else if (ratio >= 0.4) tips.push('ใกล้แล้ว ลองกลับไปอ่านคำศัพท์ในบทอีกรอบ แล้วฝึกใหม่');
  else tips.push('ยังไม่ผ่าน ไม่เป็นไร เริ่มจากทบทวนคำศัพท์และฟังเสียงตามทีละคำก่อน แล้วค่อยฝึกใหม่');

  const missed = results.filter((r) => !r.correct && r.wordId);
  if (missed.length) {
    const names = missed.map((r) => lesson.words.find((w) => w.id === r.wordId)).filter(Boolean).map((w) => targetWord(w!, lang));
    tips.push(`คำที่ควรทบทวน: ${[...new Set(names)].join(', ')}`);
  }

  if (ratio < PASS_RATIO) {
    const byKind: Record<PracticeKind, string> = {
      memory: 'ใช้การ์ดคำศัพท์ในหน้า "คำศัพท์" และติดดาวคำที่จำยาก',
      reading: 'กดฟังเสียงแล้วออกเสียงตาม โดยดูคำอ่านประกอบ',
      pronunciation: 'ฟังเสียงต้นแบบก่อน แล้วพูดช้าๆ ใกล้ไมค์ในที่เงียบ',
      listening: 'ฟังซ้ำหลายรอบและเชื่อมกับคำแปลก่อนเลือกคำตอบ',
      sentence: 'อ่านหน้า "ประโยค & ไวยากรณ์" เพื่อดูโครงสร้างประโยค',
      scenario: 'ลองทำ "ฝึกสนทนา" เพื่อดูตัวอย่างคำตอบที่เหมาะสมในสถานการณ์เดียวกัน',
    };
    tips.push(byKind[kind]);
  }
  return tips;
}

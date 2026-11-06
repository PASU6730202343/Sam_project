import type { ConvStep, Lang } from '../../types';
import { hasKeyword } from '../practice/matching';

export interface AnswerEvaluation {
  appropriate: boolean;
  matched: string[];
  missing: string[];
  feedbackTh: string;
}

/**
 * จุดเสียบ AI ภายหลัง: ทำ AnswerEvaluator ตัวใหม่ (เรียก backend ของคุณ — ห้ามฝังคีย์ในหน้าเว็บ)
 * แล้วเปลี่ยน `evaluator` ด้านล่าง UI ไม่ต้องแก้
 */
export interface AnswerEvaluator {
  evaluate(step: ConvStep, answer: string, lang: Lang): Promise<AnswerEvaluation>;
}

/** ผ่านเมื่อมี keyword ถูกอย่างน้อยครึ่งหนึ่ง (ปัดขึ้น) */
export const keywordEvaluator: AnswerEvaluator = {
  async evaluate(step, answer, lang) {
    const keywords = step.keywords[lang];
    const matched = keywords.filter((k) => hasKeyword(answer, k, lang));
    const missing = keywords.filter((k) => !matched.includes(k));
    const need = Math.ceil(keywords.length / 2);
    const appropriate = answer.trim().length > 0 && matched.length >= need;
    const feedbackTh = appropriate
      ? missing.length
        ? 'คำตอบเหมาะสม ลองเพิ่มคำสำคัญที่ยังขาดเพื่อให้สมบูรณ์ขึ้น'
        : 'คำตอบเหมาะสมและครอบคลุมใจความสำคัญ'
      : 'คำตอบยังไม่ครอบคลุมใจความสำคัญของขั้นตอนนี้ ลองดูตัวอย่างคำตอบแนะนำด้านล่าง';
    return { appropriate, matched, missing, feedbackTh };
  },
};

export const evaluator: AnswerEvaluator = keywordEvaluator;

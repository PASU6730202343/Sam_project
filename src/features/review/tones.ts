/** วรรณยุกต์ของพยางค์พินอิน (1-4, 0 = เสียงเบา/ไม่มีเครื่องหมาย) อ่านจากเครื่องหมายบนสระ */
const TONE_CHARS: Record<number, string> = {
  1: 'āēīōūǖĀĒĪŌŪǕ',
  2: 'áéíóúǘÁÉÍÓÚǗ',
  3: 'ǎěǐǒǔǚǍĚǏǑǓǙ',
  4: 'àèìòùǜÀÈÌÒÙǛ',
};

export type Tone = 0 | 1 | 2 | 3 | 4;

export function toneOf(syllable: string): Tone {
  for (const ch of syllable) {
    for (const t of [1, 2, 3, 4] as const) if (TONE_CHARS[t].includes(ch)) return t;
  }
  return 0;
}

/** ชั้น Tailwind (ตัวเข้มผ่าน AA บนพื้นขาว/frost) — เสียง 1 น้ำเงิน, 2 เขียว, 3 ม่วง, 4 แดง */
export const TONE_CLASS: Record<Tone, string> = {
  0: '',
  1: 'text-blue-700',
  2: 'text-green-700',
  3: 'text-purple-700',
  4: 'text-red-700',
};

/** แยกสตริงพินอินเป็นพยางค์/ช่องว่าง โดยคงช่องว่างไว้ */
export function splitSyllables(py: string): string[] {
  return py.split(/(\s+)/).filter((s) => s.length > 0);
}

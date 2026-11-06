import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { hydrate, type RawLesson } from '../src/data/hydrate';
import { validateCatalog } from '../src/data/validate';

const root = join(import.meta.dirname, '..', 'src', 'data');
const lessons = readdirSync(root)
  .filter((d) => statSync(join(root, d)).isDirectory())
  .flatMap((d) =>
    readdirSync(join(root, d))
      .filter((f) => f.endsWith('.json'))
      .map((f) => hydrate(JSON.parse(readFileSync(join(root, d, f), 'utf8')) as RawLesson)),
  )
  .sort((a, b) => a.careerId.localeCompare(b.careerId) || a.order - b.order);

const full = !process.argv.includes('--partial');
const { errors, counts } = validateCatalog(lessons, full);

console.log(`โหมด: ${full ? 'เต็ม (8 หมวด / 64 บท / 320 คำ)' : 'บางส่วน (เฉพาะหมวดที่มีข้อมูล)'}`);
console.log(`นับได้: ${counts.careers} หมวด, ${counts.lessons} บท, ${counts.words} คำ, ${counts.steps} ขั้นสนทนา`);
if (errors.length) {
  console.error(`\n❌ พบ ${errors.length} ปัญหา:`);
  errors.forEach((e) => console.error(' - ' + e));
  process.exit(1);
}
console.log('✅ ข้อมูลผ่านการตรวจทั้งหมด');

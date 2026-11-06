import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * ทดสอบ end-to-end ด้วยเบราว์เซอร์จริง (Chrome/Edge):  npm run build && npm run e2e
 * ตัวแปรสภาพแวดล้อม: CHROME_PATH = path ของ chrome/msedge, E2E_BASE = URL ถ้ามีเซิร์ฟเวอร์รันอยู่แล้ว
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4173;
const BASE = process.env.E2E_BASE ?? `http://localhost:${PORT}`;
const OUT = path.join(ROOT, 'e2e-shots') + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const chromePath = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && fs.existsSync(p));
if (!chromePath) {
  console.error('ไม่พบ Chrome/Edge — ตั้งค่า CHROME_PATH');
  process.exit(2);
}

let server;
if (!process.env.E2E_BASE) {
  // เรียก node ตรงๆ (ไม่ผ่าน shell) เพื่อให้ server.kill() ปิดโปรเซสจริง ไม่ทิ้งเซิร์ฟเวอร์ค้าง
  server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* เซิร์ฟเวอร์ยังไม่พร้อม */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}
const stopServer = () => server?.kill();

const results = [];
const check = (name, ok, info = '') => {
  results.push({ name, ok: !!ok, info });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  -> ' + info : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const go = async (path) => { await page.goto(BASE + path, { waitUntil: 'networkidle0' }); };
const clickText = async (text, sel = 'button, a') => {
  const ok = await page.evaluate(([text, sel]) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(text) && !e.disabled);
    if (!el) return false;
    el.click();
    return true;
  }, [text, sel]);
  if (!ok) throw new Error('ไม่พบปุ่ม/ลิงก์: ' + text);
  await sleep(250);
};
const bodyText = () => page.evaluate(() => document.body.innerText);
const storage = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));

try {
  // ---------- route guard ----------
  await go('/profile');
  check('ยังไม่ login: /profile เด้งไป /login', page.url().endsWith('/login'), page.url());

  // ---------- validate ฟอร์ม ----------
  await clickText('สมัครสมาชิก', '[role=tab]');
  await clickText('สมัครสมาชิก', 'button[type=submit]');
  let t = await bodyText();
  check('ฟอร์มสมัคร: ว่างแล้วแจ้ง error', t.includes('กรุณากรอกอีเมลให้ถูกต้อง') && t.includes('อย่างน้อย 8'));

  // ---------- สมัคร ----------
  await page.type('#displayName', 'Tester');
  await page.type('#email', 'tester@example.com');
  await page.type('#password', 'Secret123');
  await page.type('#confirm', 'Secret123');
  await clickText('สมัครสมาชิก', 'button[type=submit]');
  await page.waitForFunction(() => document.body.innerText.includes('Tester') && location.pathname !== '/login', { timeout: 15000 });
  check('สมัครสำเร็จและพากลับหน้าที่ตั้งใจเข้า (/profile)', page.url().endsWith('/profile'), page.url());
  await go('/');
  check('Home แสดงชื่อผู้ใช้และปุ่มเริ่มเรียน', (await bodyText()).includes('สวัสดี Tester') && (await bodyText()).includes('เริ่มเรียน'));

  const st = await storage();
  const raw = JSON.stringify(st);
  check('รหัสผ่านใน storage ไม่เป็นข้อความธรรมดา', !raw.includes('Secret123') && raw.includes('passwordHash'));

  // ---------- เนื้อหา EN ----------
  await go('/careers/hotel');
  t = await bodyText();
  check('หน้ารายการบท Hotel มี 8 บท', (t.match(/บท\s*\n?/g) || []).length >= 1 && (await page.$$('ol > li')).length === 8, String((await page.$$('ol > li')).length));

  await go('/lesson/hotel-01/vocab');
  t = await bodyText();
  check('หน้าคำศัพท์แสดงคำ welcome', t.includes('welcome') && t.includes('ยินดีต้อนรับ'));

  // ติดดาว + รีเฟรช
  await page.click('button[aria-label^="ติดดาวคำว่า"]');
  await sleep(300);
  let pressed = await page.$eval('button[aria-label*="ดาวคำว่า"]', (b) => b.getAttribute('aria-pressed'));
  check('กดดาวแล้ว aria-pressed=true', pressed === 'true');
  await page.reload({ waitUntil: 'networkidle0' });
  pressed = await page.$eval('button[aria-label*="ดาวคำว่า"]', (b) => b.getAttribute('aria-pressed'));
  check('รีเฟรชแล้วดาวยังอยู่', pressed === 'true');

  // เดินคำศัพท์ครบ 5 คำ
  for (let i = 0; i < 4; i++) await clickText('ถัดไป');
  t = await bodyText();
  check('คำที่ 5/5 และมีปุ่มไปต่อ', t.includes('คำที่ 5 / 5') && t.includes('ไปต่อ'));

  // ---------- จบบท ได้ XP ครั้งเดียว ----------
  await go('/lesson/hotel-01/grammar');
  await clickText('จบบทเรียน (รับ XP)');
  await page.waitForFunction(() => document.body.innerText.includes('ได้ 20 XP'), { timeout: 5000 });
  check('จบบทครั้งแรกได้ 20 XP (EN)', true);
  await clickText('ทบทวนอีกครั้ง');
  await sleep(300);
  t = await bodyText();
  check('จบบทซ้ำ: แจ้งว่าไม่ได้ XP เพิ่ม', t.includes('จึงไม่ได้เพิ่ม'));
  let prog = await page.evaluate(() => {
    const k = Object.keys(localStorage).find((k) => k.includes(':progress:'));
    return JSON.parse(localStorage.getItem(k));
  });
  check('XP EN = 20 และมีประวัติ 1 รายการ', prog.xp.en === 20 && prog.xpHistory.length === 1, JSON.stringify(prog.xp));

  // ---------- สลับเป็นจีน ----------
  await clickText('中文', 'button[aria-pressed]');
  await sleep(300);
  t = await bodyText();
  check('สลับ ZH: ไวยากรณ์เปลี่ยนเป็นจีน', t.includes('请问'));
  await clickText('จบบทเรียน (รับ XP)');
  await page.waitForFunction(() => document.body.innerText.includes('ภาษาจีน'), { timeout: 5000 });
  prog = await page.evaluate(() => {
    const k = Object.keys(localStorage).find((k) => k.includes(':progress:'));
    return JSON.parse(localStorage.getItem(k));
  });
  check('XP แยกภาษา: EN=20, ZH=20', prog.xp.en === 20 && prog.xp.zh === 20, JSON.stringify(prog.xp));

  await go('/lesson/hotel-01/vocab');
  t = await bodyText();
  check('ZH: คำศัพท์เป็นอักษรจีน + พินอิน', t.includes('欢迎') && t.includes('huānyíng'));
  // ปิดพินอิน
  await page.click('input[role=switch]');
  await sleep(200);
  t = await bodyText();
  check('ปิดสวิตช์พินอิน: พินอินหาย', !t.includes('huānyíng'));
  await page.reload({ waitUntil: 'networkidle0' });
  t = await bodyText();
  check('รีเฟรชแล้วสวิตช์พินอินยังจำค่า (ปิด)', !t.includes('huānyíng'));
  await page.click('input[role=switch]'); // เปิดคืน

  // ---------- แบบฝึก ----------
  await go('/lesson/hotel-02/practice');
  t = await bodyText();
  check('หน้าฝึกฝนมี 6 แบบ', ['จำคำศัพท์', 'อ่านคำศัพท์', 'ออกเสียง', 'ฟังแล้วเข้าใจ', 'สร้างประโยค', 'ใช้ในสถานการณ์งาน'].every((x) => t.includes(x)));
  await clickText('จำคำศัพท์', 'button');
  for (let i = 0; i < 5; i++) {
    await page.click('ul[role=list] button');
    await sleep(200);
    await clickText(i === 4 ? 'ดูผลคะแนน' : 'ข้อถัดไป');
    await sleep(200);
  }
  t = await bodyText();
  check('จบแบบฝึกแล้วขึ้นหน้าสรุปคะแนนและคำแนะนำ', t.includes('สรุปผล') && t.includes('💡'));
  await page.screenshot({ path: OUT + 'practice-summary.png' });

  // แบบฝึกสร้างประโยค
  await clickText('เลือกแบบฝึกอื่น');
  await clickText('สร้างประโยค', 'button');
  const toks = await page.$$('div[lang] button:not([aria-label])');
  check('แบบฝึกสร้างประโยคมีชิ้นคำให้เรียง', toks.length >= 3, String(toks.length));
  await go('/lesson/hotel-02/practice');
  await clickText('ออกเสียง', 'button');
  t = await bodyText();
  check('แบบฝึกออกเสียงแสดงช่องพิมพ์/ไมค์', !!(await page.$('input[aria-label="คำตอบของคุณ"]')));

  // ---------- สนทนา ----------
  await clickText('English', '[role=tab]').catch(() => {});
  await clickText('EN', 'button[aria-pressed]');
  await go('/lesson/hotel-03/conversation');
  t = await bodyText();
  check('สนทนา: แสดงบทบาทและขั้นที่ 1/5', t.includes('บทบาทของคุณ') && t.includes('ขั้นที่ 1 / 5'));
  await page.type('input[aria-label="คำตอบของคุณ"]', 'Certainly. The air conditioner remote is on the table. Press the green button.');
  await clickText('ส่งคำตอบ');
  await page.waitForFunction(() => document.body.innerText.includes('ตัวอย่างคำตอบแนะนำ'), { timeout: 5000 });
  t = await bodyText();
  check('สนทนา: ตอบถูกแสดง "เหมาะสม"', t.includes('✅ เหมาะสม'));
  await clickText('ขั้นถัดไป');
  await page.type('input[aria-label="คำตอบของคุณ"]', 'I like pizza');
  await clickText('ส่งคำตอบ');
  await page.waitForFunction(() => document.body.innerText.includes('ตัวอย่างคำตอบแนะนำ'), { timeout: 5000 });
  t = await bodyText();
  check('สนทนา: ตอบนอกเรื่องแสดง "ยังไม่เหมาะสม"', t.includes('ยังไม่เหมาะสม'));

  // ---------- โปรไฟล์ / ดาว ----------
  await go('/profile');
  t = await bodyText();
  check('โปรไฟล์: แสดงชื่อ XP ความก้าวหน้า', t.includes('Tester') && t.includes('เลเวล') && t.includes('ความก้าวหน้าตามหมวดอาชีพ') && t.includes('+20 XP'));
  await page.screenshot({ path: OUT + 'profile-1280.png', fullPage: true });
  await go('/starred');
  t = await bodyText();
  check('หน้าดาว: มีคำ welcome ในแท็บ EN', t.includes('welcome'));

  // ---------- responsive ----------
  const paths = ['/', '/language', '/careers', '/careers/hotel', '/lesson/hotel-01', '/lesson/hotel-01/vocab', '/lesson/hotel-01/grammar', '/lesson/hotel-01/practice', '/lesson/hotel-01/conversation', '/starred', '/profile'];
  for (const w of [375, 768, 1280]) {
    await page.setViewport({ width: w, height: 800 });
    const bad = [];
    for (const p of paths) {
      await go(p);
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      if (o.sw > o.iw + 1) bad.push(`${p} (${o.sw}>${o.iw})`);
    }
    check(`ไม่มี horizontal overflow ที่ ${w}px (${paths.length} หน้า)`, bad.length === 0, bad.join(', '));
    await go('/lesson/hotel-01/vocab');
    await page.screenshot({ path: OUT + `vocab-${w}.png` });
    await go('/');
    await page.screenshot({ path: OUT + `home-${w}.png`, fullPage: true });
  }

  // ---------- logout + login ใหม่ ----------
  await page.setViewport({ width: 1280, height: 900 });
  await go('/');
  await clickText('ออกจากระบบ');
  await page.waitForFunction(() => location.pathname === '/login', { timeout: 5000 });
  check('ออกจากระบบแล้วไป /login', true);
  await go('/starred');
  check('ออกจากระบบแล้วเข้า /starred ไม่ได้', page.url().endsWith('/login'));
  await page.type('#email', 'tester@example.com');
  await page.type('#password', 'wrongpass1');
  await clickText('เข้าสู่ระบบ', 'button[type=submit]');
  await sleep(1500);
  t = await bodyText();
  check('login รหัสผิดแจ้ง error', t.includes('อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
  await page.$eval('#password', (e) => (e.value = ''));
  await page.type('#password', 'Secret123');
  await clickText('เข้าสู่ระบบ', 'button[type=submit]');
  await page.waitForFunction(() => location.pathname !== '/login', { timeout: 15000 });
  check('login ถูกต้อง พากลับหน้าที่ตั้งใจเข้า (/starred)', page.url().endsWith('/starred'), page.url());
  await go('/profile');
  check('login ใหม่แล้วข้อมูล XP ยังอยู่ (EN 20)', (await bodyText()).includes('+20 XP'));
} catch (e) {
  check('สคริปต์ทดสอบรันจนจบโดยไม่พัง', false, e.message);
  await page.screenshot({ path: OUT + 'error.png' }).catch(() => {});
}

const real = consoleErrors.filter((e) => !/favicon|fonts\.g|ERR_INTERNET|net::ERR|Failed to load resource/i.test(e));
check('ไม่มี console error ในแอป', real.length === 0, real.slice(0, 3).join(' | '));
await browser.close();
stopServer();
const failed = results.filter((r) => !r.ok);
console.log(`\nสรุป: ผ่าน ${results.length - failed.length}/${results.length}`);
process.exit(failed.length ? 1 : 0);

/**
 * Hash รหัสผ่านด้วย Web Crypto PBKDF2-SHA256 + salt สุ่มต่อผู้ใช้
 * ข้อจำกัด: ทำงานฝั่ง client และเก็บใน localStorage ซึ่งผู้ที่เข้าถึงเบราว์เซอร์อ่านได้
 * จึงไม่ปลอดภัยเทียบกับ backend จริง (ไม่มี rate limit / pepper / การตรวจฝั่งเซิร์ฟเวอร์)
 */
export const PBKDF2_ITERATIONS = 150_000;

const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export function generateSalt(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(password: string, saltB64: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(saltB64), iterations },
    key,
    256,
  );
  return toB64(bits);
}

export async function verifyPassword(password: string, saltB64: string, expected: string, iterations = PBKDF2_ITERATIONS) {
  const actual = await hashPassword(password, saltB64, iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

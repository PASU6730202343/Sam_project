export interface AuthForm {
  email: string;
  password: string;
  displayName?: string;
  confirm?: string;
}

export type AuthErrors = Partial<Record<keyof AuthForm, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuth(f: AuthForm, mode: 'login' | 'register'): AuthErrors {
  const e: AuthErrors = {};
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
  if (mode === 'login') {
    if (!f.password) e.password = 'กรุณากรอกรหัสผ่าน';
    return e;
  }
  if (!f.displayName || f.displayName.trim().length < 2) e.displayName = 'ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร';
  if (f.password.length < 8) e.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข';
  if (f.confirm !== f.password) e.confirm = 'รหัสผ่านยืนยันไม่ตรงกัน';
  return e;
}

import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authStore';
import { validateAuth, type AuthErrors } from '../features/auth/validation';
import { Button, Card, Tabs } from '../components/ui';
import { StorageError } from '../services/storage';

type Mode = 'login' | 'register';

function Field({ id, label, error, ...rest }: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-denim transition focus:outline-none focus:ring-2 focus:ring-denim ${error ? 'border-red-700' : 'border-denim/30'}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ email: '', password: '', displayName: '', confirm: '' });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateAuth(form, mode);
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register({ email: form.email, displayName: form.displayName, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof StorageError ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-frost p-4 text-denim">
      <Card className="w-full max-w-md animate-pop p-8">
        <h1 className="mb-1 text-center text-4xl font-bold">Mello 🌱</h1>
        <p className="mb-6 text-center">เรียนภาษาอังกฤษและจีนสำหรับงานบริการ</p>
        <div className="mb-6 flex justify-center">
          <Tabs
            label="เข้าสู่ระบบหรือสมัครสมาชิก"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setErrors({});
              setFormError('');
            }}
            tabs={[
              { id: 'login', label: 'เข้าสู่ระบบ' },
              { id: 'register', label: 'สมัครสมาชิก' },
            ]}
          />
        </div>
        <form onSubmit={submit} noValidate className="space-y-4">
          {mode === 'register' && <Field id="displayName" label="ชื่อที่แสดง" autoComplete="nickname" value={form.displayName} onChange={set('displayName')} error={errors.displayName} />}
          <Field id="email" type="email" label="อีเมล" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
          <Field id="password" type="password" label="รหัสผ่าน" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={set('password')} error={errors.password} />
          {mode === 'register' && <Field id="confirm" type="password" label="ยืนยันรหัสผ่าน" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />}
          {formError && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-denim/80">
          โหมดทดลอง: ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น รหัสผ่านถูก hash ก่อนเก็บ แต่ไม่ปลอดภัยเท่าระบบ backend จริง
        </p>
      </Card>
    </div>
  );
}

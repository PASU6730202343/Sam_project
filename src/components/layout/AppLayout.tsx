import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/authStore';
import { useSettings } from '../../features/settings/settingsStore';
import { useProgressStore } from '../../features/learning/progressStore';
import { Button, ToastViewport } from '../ui';

const links = [
  { to: '/', label: 'หน้าหลัก', end: true },
  { to: '/careers', label: 'หมวดอาชีพ' },
  { to: '/starred', label: 'คำที่ติดดาว' },
  { to: '/profile', label: 'โปรไฟล์' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useSettings();
  const navigate = useNavigate();
  const loadProgress = useProgressStore((s) => s.load);
  useEffect(() => {
    void loadProgress(user?.id ?? null);
  }, [user, loadProgress]);

  return (
    <div className="min-h-screen bg-frost text-denim">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2">
        ข้ามไปเนื้อหา
      </a>
      <header className="sticky top-0 z-40 border-b border-frost-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="text-2xl font-bold text-denim">
            Mello <span aria-hidden>🌱</span>
          </NavLink>
          <nav aria-label="เมนูหลัก" className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-xl px-3 py-2 font-medium transition duration-200 hover:bg-frost-200 ${isActive ? 'bg-pistachio-100 text-ink' : 'text-denim'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div role="group" aria-label="ภาษาที่เรียน" className="inline-flex rounded-2xl bg-frost-200 p-1">
              {(['en', 'zh'] as const).map((l) => (
                <button
                  key={l}
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={`rounded-xl px-3 py-1 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${lang === l ? 'bg-pistachio text-ink' : 'text-denim'}`}
                >
                  {l === 'en' ? 'EN' : '中文'}
                </button>
              ))}
            </div>
            <span className="hidden text-sm sm:inline">{user?.displayName}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await logout();
                await loadProgress(null);
                navigate('/login');
              }}
            >
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <ToastViewport />
    </div>
  );
}

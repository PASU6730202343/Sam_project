import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './authStore';

export function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="p-8 text-center text-denim" role="status">กำลังโหลด…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

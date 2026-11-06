import { useProgressStore } from '../features/learning/progressStore';

/** ความก้าวหน้าของผู้ใช้ปัจจุบัน (โหลดครั้งเดียวที่ AppLayout และอัปเดตผ่าน progressStore) */
export function useProgress() {
  const progress = useProgressStore((s) => s.progress);
  const reload = useProgressStore((s) => s.load);
  return { progress, reload };
}

import { LocalStorageService } from './LocalStorageService';
import { SupabaseService } from './SupabaseService';
import type { StorageService } from './StorageService';

export * from './StorageService';

/** เลือก backend ด้วย VITE_STORAGE_BACKEND (local = ค่าเริ่มต้น | supabase) — UI ไม่ต้องแก้ */
export const storage: StorageService =
  import.meta.env.VITE_STORAGE_BACKEND === 'supabase'
    ? new SupabaseService({ url: import.meta.env.VITE_SUPABASE_URL, anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY })
    : new LocalStorageService();

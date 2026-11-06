/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_STORAGE_BACKEND?: 'local' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

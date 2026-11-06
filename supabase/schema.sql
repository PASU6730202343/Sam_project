-- Mello — โครงฐานข้อมูลสำหรับ SupabaseService
-- รันใน Supabase SQL Editor ของโปรเจกต์คุณเอง (ถ้าเคยรันฉบับเก่าไปแล้ว ให้รัน patch-001-harden-xp.sql แทนการรันไฟล์นี้ซ้ำ)
-- หลักการ: กฎ "XP ครั้งแรกต่อ (ผู้ใช้, ภาษา, บทเรียน)" ถูกบังคับที่ฐานข้อมูลด้วย UNIQUE ไม่พึ่งโค้ดฝั่ง client

create extension if not exists "pgcrypto";

-- ---------- โปรไฟล์ (ผูกกับ Supabase Auth ที่จัดการรหัสผ่านให้ จึงไม่เก็บรหัสผ่านเอง) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- บัญชี XP (immutable: ไม่มี update/delete policy) ----------
create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lang text not null check (lang in ('en', 'zh')),
  lesson_id text not null,
  career_id text not null,
  source text not null check (source in ('lesson', 'practice', 'conversation')),
  amount integer not null check (amount between 1 and 100),
  created_at timestamptz not null default now(),
  constraint xp_once_per_user_lang_lesson unique (user_id, lang, lesson_id)
);

-- ---------- บทที่จบ ----------
create table public.completed_lessons (
  user_id uuid not null references auth.users (id) on delete cascade,
  lang text not null check (lang in ('en', 'zh')),
  lesson_id text not null,
  career_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lang, lesson_id)
);

-- ---------- คำที่ติดดาว ----------
create table public.starred_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  lang text not null check (lang in ('en', 'zh')),
  word_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lang, word_id)
);

-- ---------- สถิติการเรียน ----------
create table public.study_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  lang text not null check (lang in ('en', 'zh')),
  sessions integer not null default 0,
  words_reviewed integer not null default 0,
  practice_runs integer not null default 0,
  conversations_done integer not null default 0,
  last_study_at timestamptz,
  primary key (user_id, lang)
);

-- ---------- ให้ XP แบบอะตอมมิก (ฐานข้อมูลกำหนดจำนวนเอง คืน 0 ถ้าเคยได้แล้ว) และบันทึกสถิติ ----------
create or replace function public.award_xp(p_lang text, p_lesson_id text, p_career_id text, p_source text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_amount integer;
  v_rows integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  v_amount := case p_source when 'lesson' then 20 when 'practice' then 30 when 'conversation' then 30 end;
  if v_amount is null then
    raise exception 'invalid source';
  end if;
  insert into public.xp_ledger (user_id, lang, lesson_id, career_id, source, amount)
  values (auth.uid(), p_lang, p_lesson_id, p_career_id, p_source, v_amount)
  on conflict (user_id, lang, lesson_id) do nothing;
  get diagnostics v_rows = row_count;
  return case when v_rows = 1 then v_amount else 0 end;
end $$;

revoke all on function public.award_xp(text, text, text, text) from public, anon;
grant execute on function public.award_xp(text, text, text, text) to authenticated;

create or replace function public.record_study(p_lang text, p_sessions integer, p_words integer, p_practice integer, p_conversations integer)
returns void language plpgsql security invoker set search_path = public as $$
begin
  insert into public.study_stats (user_id, lang, sessions, words_reviewed, practice_runs, conversations_done, last_study_at)
  values (auth.uid(), p_lang, greatest(p_sessions, 0), greatest(p_words, 0), greatest(p_practice, 0), greatest(p_conversations, 0), now())
  on conflict (user_id, lang) do update set
    sessions = public.study_stats.sessions + excluded.sessions,
    words_reviewed = public.study_stats.words_reviewed + excluded.words_reviewed,
    practice_runs = public.study_stats.practice_runs + excluded.practice_runs,
    conversations_done = public.study_stats.conversations_done + excluded.conversations_done,
    last_study_at = now();
end $$;

revoke all on function public.record_study(text, integer, integer, integer, integer) from public, anon;
grant execute on function public.record_study(text, integer, integer, integer, integer) to authenticated;

-- ---------- Row Level Security: ผู้ใช้เห็น/แก้ได้เฉพาะแถวของตัวเอง ----------
alter table public.profiles enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.completed_lessons enable row level security;
alter table public.starred_words enable row level security;
alter table public.study_stats enable row level security;

create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid());

-- xp_ledger: อ่านได้อย่างเดียว การเพิ่มทำผ่านฟังก์ชัน award_xp เท่านั้น (ห้าม insert/update/delete ตรง เพื่อกันการโกง XP)
create policy "xp: read own" on public.xp_ledger for select using (user_id = auth.uid());
revoke insert, update, delete on public.xp_ledger from anon, authenticated;

create policy "completed: read own" on public.completed_lessons for select using (user_id = auth.uid());
create policy "completed: insert own" on public.completed_lessons for insert with check (user_id = auth.uid());

create policy "stars: read own" on public.starred_words for select using (user_id = auth.uid());
create policy "stars: insert own" on public.starred_words for insert with check (user_id = auth.uid());
create policy "stars: delete own" on public.starred_words for delete using (user_id = auth.uid());

create policy "stats: read own" on public.study_stats for select using (user_id = auth.uid());
create policy "stats: insert own" on public.study_stats for insert with check (user_id = auth.uid());
create policy "stats: update own" on public.study_stats for update using (user_id = auth.uid());

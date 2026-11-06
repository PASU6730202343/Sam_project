-- Patch 001: ให้ "ฐานข้อมูล" เป็นผู้กำหนดจำนวน XP และห้ามเขียน xp_ledger ตรง (กันโกง XP จากฝั่งเว็บ)
-- รันใน Supabase SQL Editor ครั้งเดียว หลังรัน schema.sql ฉบับเดิมไปแล้ว (รันซ้ำได้ ไม่เสียหาย)
-- ถ้าติดตั้งใหม่จากไฟล์ schema.sql ฉบับปัจจุบัน ไม่ต้องรันไฟล์นี้

-- 1) ปิดการ insert/update/delete ตาราง xp_ledger โดยตรง
drop policy if exists "xp: insert own" on public.xp_ledger;
revoke insert, update, delete on public.xp_ledger from anon, authenticated;

-- 2) award_xp ใหม่: ไม่รับ amount จาก client — คำนวณตามประเภทที่มา; คืนจำนวน XP ที่ให้จริง (0 = เคยได้แล้ว)
drop function if exists public.award_xp(text, text, text, text, integer);

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

-- 3) บันทึกสถิติแบบอะตอมมิก (บวกค่าในฐานข้อมูล ไม่ต้องอ่านก่อนเขียน)
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

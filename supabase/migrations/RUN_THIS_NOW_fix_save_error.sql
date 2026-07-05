-- =====================================================================
-- EduVerse — شغّل الملف ده مرة واحدة في Supabase SQL Editor
-- ---------------------------------------------------------------------
-- سبب رسالة الخطأ اللي بتظهرلك ("Could not find the table
-- 'public.app_data' in the schema cache" / "فشل الحفظ، اضغط للمحاولة"):
-- الكود بيحاول يكتب في جدول اسمه app_data على مشروع Supabase بتاعك،
-- لكن الجدول ده لسه متعملش فعليًا على قاعدة البيانات (الميجريشن اللي
-- بتنشئه كانت في الكود بس، ومحدش شغّلها في SQL Editor لحد دلوقتي).
--
-- الملف ده مجمّع فيه كل الميجريشنز الناقصة (0003 + 0004 + 0006 + 0007)
-- في سكريبت واحد آمن يتنفذ أكتر من مرة من غير مشاكل (idempotent).
-- خطوات التشغيل:
--   1. افتح مشروعك على supabase.com
--   2. من القائمة الجانبية: SQL Editor → New query
--   3. الصق الكود ده كله واضغط Run
--   4. ارجع للتطبيق واضغط "حفظ التغييرات" تاني
-- =====================================================================

-- ── 0003: صف بيانات لوحة الإدارة المشترك ──────────────────────────────
create table if not exists app_data (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_data_single_row check (id = 1)
);

insert into app_data (id, data) values (1, '{}'::jsonb)
  on conflict (id) do nothing;

alter table app_data enable row level security;

drop policy if exists "app_data readable by all" on app_data;
create policy "app_data readable by all" on app_data for select using (true);
drop policy if exists "app_data insert by anyone" on app_data;
create policy "app_data insert by anyone" on app_data for insert with check (true);
drop policy if exists "app_data update by anyone" on app_data;
create policy "app_data update by anyone" on app_data for update using (true);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_data_updated_at on app_data;
create trigger app_data_updated_at
  before update on app_data
  for each row execute function set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_data'
  ) then
    alter publication supabase_realtime add table app_data;
  end if;
end $$;

-- ── 0004 + 0006: مساحة تخزين حقيقية للصور/الفيديوهات/الملفات، بدون حد أقصى للحجم ──
insert into storage.buckets (id, name, public)
  values ('eduverse-media', 'eduverse-media', true)
  on conflict (id) do update set public = true;

update storage.buckets set file_size_limit = null where id = 'eduverse-media';

drop policy if exists "eduverse-media public read" on storage.objects;
create policy "eduverse-media public read" on storage.objects
  for select using (bucket_id = 'eduverse-media');

drop policy if exists "eduverse-media public write" on storage.objects;
create policy "eduverse-media public write" on storage.objects
  for insert with check (bucket_id = 'eduverse-media');

drop policy if exists "eduverse-media public update" on storage.objects;
create policy "eduverse-media public update" on storage.objects
  for update using (bucket_id = 'eduverse-media');

drop policy if exists "eduverse-media public delete" on storage.objects;
create policy "eduverse-media public delete" on storage.objects
  for delete using (bucket_id = 'eduverse-media');

-- ── 0007: تعليقات الطلاب الحقيقية ──────────────────────────────────────
create table if not exists public_comments (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  comment_text text not null,
  reply_text text,
  is_visible boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public_comments enable row level security;

drop policy if exists "public_comments select all" on public_comments;
create policy "public_comments select all" on public_comments
  for select using (true);
drop policy if exists "public_comments insert by anyone" on public_comments;
create policy "public_comments insert by anyone" on public_comments
  for insert with check (true);
drop policy if exists "public_comments update by anyone" on public_comments;
create policy "public_comments update by anyone" on public_comments
  for update using (true);
drop policy if exists "public_comments delete by anyone" on public_comments;
create policy "public_comments delete by anyone" on public_comments
  for delete using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'public_comments'
  ) then
    alter publication supabase_realtime add table public_comments;
  end if;
end $$;

-- =====================================================================
-- خلصت! جرّب زرار "حفظ التغييرات" في التطبيق تاني — المفروض يشتغل دلوقتي.
-- =====================================================================

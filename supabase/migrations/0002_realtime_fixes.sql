-- =====================================================================
-- EduVerse — Migration 0002: Admin Service Role + Realtime for all tables
-- Run: supabase db push  أو الصق في SQL Editor
-- =====================================================================

-- أضف app_settings لـ Realtime (مش موجود في migration الأولاني)
alter publication supabase_realtime add table app_settings;

-- ─────────────────────────────────────────────────────────────────────
-- Policy: السماح لـ anon بقراءة sections و content بدون تسجيل دخول
-- (مهم للـ landing page التي تعرض الكورسات للزوار)
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists "sections visible to all" on sections;
create policy "sections visible to all"
  on sections for select
  using (is_visible = true and is_deleted = false);

drop policy if exists "content visible to authenticated users" on content;
create policy "content visible to all"
  on content for select
  using (is_deleted = false);

-- ─────────────────────────────────────────────────────────────────────
-- إضافة عمود updated_at لـ sections (لو مش موجود)
-- يُستخدم بواسطة Realtime لإرسال الـ timestamp الصحيح
-- ─────────────────────────────────────────────────────────────────────
alter table sections
  add column if not exists updated_at timestamptz not null default now();

-- Trigger لتحديث updated_at تلقائياً
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sections_updated_at on sections;
create trigger sections_updated_at
  before update on sections
  for each row execute function set_updated_at();

drop trigger if exists content_updated_at on content;
create trigger content_updated_at
  before update on content
  for each row execute function set_updated_at();

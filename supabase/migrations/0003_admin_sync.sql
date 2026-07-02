-- =====================================================================
-- EduVerse — Migration 0003: مزامنة حقيقية للوحة الإدارة لكل المستخدمين
-- Run: supabase db push  أو الصق في SQL Editor
-- ---------------------------------------------------------------------
-- المشكلة اللي بتحلها الميجريشن دي:
--   لوحة الإدارة (AdminDashboard.tsx) كانت بتحفظ كل حاجة (أقسام،
--   محتوى، ملفات، تسجيلات صوتية، تعليقات، إعدادات) في localStorage على
--   جهاز الأدمن فقط، ومفيش أي مسار كتابة حقيقي على Supabase. فأي
--   إضافة/تعديل/مسح كانت بتفضل حبيسة على نفس الجهاز/المتصفح، ومتظهرش
--   خالص عند باقي المستخدمين (أو حتى عند الأدمن نفسه على جهاز تاني).
--
-- الحل:
--   صف واحد مشترك (id = 1) في جدول app_data بيحتوي على نسخة JSON كاملة
--   من بيانات لوحة الإدارة. كل الأجهزة (لوحة الإدارة أو صفحة الطالب)
--   تسحب نفس الصف عند فتح الموقع، وتسمع لأي تغيير فيه فورًا عبر
--   Supabase Realtime — فأي إضافة أو تعديل أو حذف يظهر عند الجميع
--   بدون إعادة تحميل الصفحة.
-- =====================================================================

create table if not exists app_data (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_data_single_row check (id = 1)
);

insert into app_data (id, data) values (1, '{}'::jsonb)
  on conflict (id) do nothing;

alter table app_data enable row level security;

-- ─────────────────────────────────────────────────────────────────────
-- ⚠️ ملاحظة أمان مهمة:
-- لوحة الإدارة في هذا المشروع محمية بكلمة مرور على مستوى الواجهة فقط
-- (مش عبر Supabase Auth حقيقي)، ومفتاح anon المستخدم في المتصفح واحد
-- لكل الزوار والأدمن. عشان الأدمن يقدر يكتب فعليًا (وده أصل المشكلة
-- المطلوب حلها هنا)، لازم نفتح صلاحية الكتابة على الصف ده لأي حد معاه
-- مفتاح anon. ده تنازل أمني معقول طالما التطبيق كله بدون باك إند
-- منفصل، لكن أي حد يعرف رابط ومفتاح Supabase بتاع المشروع (موجودين في
-- كود الواجهة نفسه أصلاً) هيقدر يعدل البيانات مباشرة بدون المرور
-- بشاشة كلمة السر. الحل الأصح لاحقًا هو تفعيل Supabase Auth حقيقي
-- للأدمن وربط الـ policy بـ auth.uid()/auth.role() بدل ما تكون مفتوحة
-- للجميع.
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists "app_data readable by all" on app_data;
create policy "app_data readable by all" on app_data for select using (true);
drop policy if exists "app_data insert by anyone" on app_data;
create policy "app_data insert by anyone" on app_data for insert with check (true);
drop policy if exists "app_data update by anyone" on app_data;
create policy "app_data update by anyone" on app_data for update using (true);

-- (لو الفنكشن دي معمولة قبل كده في migration 0002 فده بيبقى no-op آمن)
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

-- (idempotent: تفادي خطأ "already member of publication" لو الميجريشن اتشغلت أكتر من مرة)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_data'
  ) then
    alter publication supabase_realtime add table app_data;
  end if;
end $$;

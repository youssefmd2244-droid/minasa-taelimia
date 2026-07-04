-- =====================================================================
-- EduVerse — Migration 0007: تعليقات الطلاب الحقيقية (موافقة/إخفاء + حذف)
-- Run: supabase db push  أو الصق في SQL Editor
-- ---------------------------------------------------------------------
-- قبل الميجريشن دي: قسم "شاركنا رأيك" في الصفحة الرئيسية كان بيانات
-- محلية وهمية فقط (useState ثابت جوه المتصفح) — أي تعليق يكتبه طالب
-- كان يختفي فور تحديث الصفحة، ولوحة تحكم الأدمن (تبويب "تعليقات") كانت
-- شغالة على بيانات تجريبية منفصلة تمامًا وليس لها أي تأثير حقيقي على
-- ما يراه الزوار.
--
-- الحل: جدول مستقل public_comments (مش حاشره جوه صف app_data المشترك)
-- لأن التعليقات بتتكتب بكثرة ومن زوار متزامنين، وحشرها في صف JSON واحد
-- كان هيزوّد فرصة ضياع تعديلات متزامنة (last write wins).
--
-- سلوك الموافقة: أي تعليق جديد من زائر بيتسجل بـ is_visible = false
-- (قيد المراجعة) تلقائيًا، ولا يظهر للعلن إلا لما الأدمن يضغط زرار
-- "إظهار" في تبويب التعليقات (Eye/EyeOff). زرار الحذف يمسح التعليق
-- نهائيًا لأي تعليق (مقبول أو قيد المراجعة).
-- =====================================================================

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

-- ⚠️ نفس ملاحظة الأمان في 0003_admin_sync.sql: لا يوجد Supabase Auth
-- حقيقي في هذا المشروع (لوحة الإدارة محمية بكلمة سرّ على مستوى الواجهة
-- فقط)، فمفتاح anon (نفسه المستخدم للزوار والأدمن) لازم يكون مفتوح
-- للقراءة/الكتابة/التحديث/الحذف عشان الزوار يبعتوا تعليق، والأدمن يوافق
-- عليه أو يحذفه. لو حبيت تشديد الأمان لاحقًا، الحل الأصح هو تفعيل
-- Supabase Auth حقيقي للأدمن وربط سياسات التحديث/الحذف بـ auth.role().
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

-- (idempotent: تفادي خطأ "already member of publication" لو الميجريشن اتشغلت أكتر من مرة)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'public_comments'
  ) then
    alter publication supabase_realtime add table public_comments;
  end if;
end $$;

-- =====================================================================
-- EduVerse — Migration 0004: مساحة تخزين حقيقية للصور والفيديوهات والملفات
-- Run: supabase db push  أو الصق في SQL Editor
-- ---------------------------------------------------------------------
-- قبل الميجريشن دي، أي صورة/فيديو/صوت يرفعه الأدمن كان بيتحول لنص
-- base64 ضخم ويتخزن جوه صف app_data المشترك نفسه — ده شغال لكنه بطيء
-- ومحدود لملفات كبيرة زي الفيديوهات. الميجريشن دي بتنشئ مساحة تخزين
-- حقيقية (bucket) بحيث الملفات نفسها تترفع على Supabase Storage
-- ويتخزن في app_data الرابط بس (نص قصير)، بدون ما يغيّر أي حاجة تانية.
-- =====================================================================

insert into storage.buckets (id, name, public)
  values ('eduverse-media', 'eduverse-media', true)
  on conflict (id) do update set public = true;

drop policy if exists "eduverse-media public read" on storage.objects;
create policy "eduverse-media public read" on storage.objects
  for select using (bucket_id = 'eduverse-media');

-- نفس ملاحظة الأمان في 0003_admin_sync.sql: مفتاح anon مفتوح للكتابة
-- عشان لوحة الإدارة (المحمية بكلمة سرّ على مستوى الواجهة بس) تقدر ترفع
-- ملفات فعليًا.
drop policy if exists "eduverse-media public write" on storage.objects;
create policy "eduverse-media public write" on storage.objects
  for insert with check (bucket_id = 'eduverse-media');

drop policy if exists "eduverse-media public update" on storage.objects;
create policy "eduverse-media public update" on storage.objects
  for update using (bucket_id = 'eduverse-media');

drop policy if exists "eduverse-media public delete" on storage.objects;
create policy "eduverse-media public delete" on storage.objects
  for delete using (bucket_id = 'eduverse-media');

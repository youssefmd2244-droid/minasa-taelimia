/**
 * Supabase Client — real connection, not a schema description.
 * -----------------------------------------------------------------------
 * يقرأ بيانات الاتصال من متغيرات بيئة Vite (`.env.local`):
 *
 *   VITE_SUPABASE_URL=https://xxxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=ey...
 *
 * إذا كانت غائبة (مثلاً أثناء التطوير المحلي بدون مشروع Supabase جاهز
 * بعد)، يعمل التطبيق في "وضع عرض توضيحي" (demo mode) تلقائياً:
 * `isSupabaseConfigured` تصبح false، وكل الـ hooks في `src/hooks/`
 * ترجع البيانات الثابتة (mock) الموجودة سابقاً بدل الانهيار بخطأ.
 * هذا يسمح بفتح المشروع وتشغيله فوراً دون إعداد، وعند ربط مشروع
 * Supabase حقيقي يتحول كل شيء للبيانات الحقيقية تلقائياً بدون تغيير كود.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[EduVerse] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY غير موجودين — ' +
      'التطبيق يعمل في وضع العرض التوضيحي (بيانات ثابتة). ' +
      'أضف ملف .env.local لربط Supabase حقيقي.'
  );
}

// ===== Typed table row shapes (mirrors SchemaPanel.tsx exactly) =====

export interface AppSettingsRow {
  id: number;
  theme_colors: Record<string, string> | null;
  app_name: string;
  logo_url: string | null;
  logo_animation_style: string;
  rgb_lighting_enabled: boolean;
  allow_download_controls_enabled: boolean; // master toggle: reveals per-item switch only
}

export interface SectionRow {
  id: number;
  title: string;
  is_visible: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  display_order: number;
}

export type ContentType =
  | 'video'
  | 'text'
  | 'pdf'
  | 'word'
  | 'powerpoint'
  | 'excel'
  | 'zip';

export interface ContentRow {
  id: number;
  section_id: number;
  title: string;
  type: ContentType;
  file_url: string | null;
  content_body: string | null;
  is_featured: boolean;
  show_on_home: boolean;
  allow_download: boolean; // per-item, default false — see hooks/useContent.ts
  is_deleted: boolean;
  deleted_at: string | null;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  level: number;
  preferred_language: 'ar' | 'en' | 'egy';
  grade_year: number | null;
}

export interface CommentRow {
  id: number;
  content_id: number;
  user_id: string;
  comment_text: string;
  reply_text: string | null;
  is_visible: boolean;
  user_grade_year: number | null;
  created_at: string;
  updated_at: string;
}

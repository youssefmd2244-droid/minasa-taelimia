/**
 * useContent — real Supabase reads/writes for the `content` table.
 *
 * يطبّق بدقة القاعدة المتفق عليها سابقاً: `allow_download` افتراضياً
 * `false` على مستوى كل عنصر منفرد — لا يوجد مفتاح عام يفتح كل التنزيلات
 * دفعة واحدة. زر التنزيل في واجهة الطالب لا يُركَّب في DOM أصلاً إلا
 * للعناصر التي `allow_download === true` تحديداً (انظر CoursesSection).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured, type ContentRow } from '../lib/supabaseClient';

const DEMO_CONTENT: ContentRow[] = [
  {
    id: 1, section_id: 1, title: 'مقدمة في التفاضل والتكامل', type: 'video',
    file_url: null, content_body: null, is_featured: true, show_on_home: true,
    allow_download: false, is_deleted: false, deleted_at: null, updated_at: new Date().toISOString(),
  },
  {
    id: 2, section_id: 1, title: 'ورقة عمل الجبر', type: 'pdf',
    file_url: null, content_body: null, is_featured: false, show_on_home: false,
    allow_download: true, is_deleted: false, deleted_at: null, updated_at: new Date().toISOString(),
  },
  {
    id: 3, section_id: 2, title: 'محاضرة علم الأحياء الخلوي', type: 'word',
    file_url: null, content_body: null, is_featured: false, show_on_home: true,
    allow_download: false, is_deleted: false, deleted_at: null, updated_at: new Date().toISOString(),
  },
  {
    id: 4, section_id: 3, title: 'نظرة عامة على القواعد العربية', type: 'text',
    file_url: null, content_body: 'محتوى نصي كامل عن النحو والصرف...', is_featured: true,
    show_on_home: true, allow_download: false, is_deleted: false, deleted_at: null,
    updated_at: new Date().toISOString(),
  },
];

export function useContent(sectionId?: number) {
  const [items, setItems] = useState<ContentRow[]>(isSupabaseConfigured ? [] : DEMO_CONTENT);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  // نفس مبدأ useSections — اسم فريد لكل نسخة عشان لا يحصل تصادم لما
  // SearchOverlay و LessonList يستخدموا useContent() في نفس اللحظة.
  const channelName = useRef(`content-changes-${Math.random().toString(36).slice(2)}`).current;

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    let query = supabase.from('content').select('*').eq('is_deleted', false);
    if (sectionId !== undefined) query = query.eq('section_id', sectionId);
    const { data, error: err } = await query.order('updated_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setItems(data as ContentRow[]);
      setError(null);
    }
    setLoading(false);
  }, [sectionId]);

  useEffect(() => {
    refresh();
    if (!isSupabaseConfigured || !supabase) return;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, channelName]);

  /** Toggles whether a single content item is allowed to show a download button. Default is always false. */
  const setAllowDownload = useCallback(async (id: number, allow: boolean) => {
    if (!isSupabaseConfigured || !supabase) {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, allow_download: allow } : c)));
      return;
    }
    await supabase.from('content').update({ allow_download: allow }).eq('id', id);
  }, []);

  const updateContent = useCallback(async (id: number, patch: Partial<ContentRow>) => {
    if (!isSupabaseConfigured || !supabase) {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      return;
    }
    await supabase.from('content').update(patch).eq('id', id);
  }, []);

  const softDeleteContent = useCallback(async (id: number) => {
    await updateContent(id, { is_deleted: true, deleted_at: new Date().toISOString() });
  }, [updateContent]);

  /**
   * Returns a short-lived signed URL (10 minutes) for a private storage file
   * instead of exposing a permanent public link — only called when
   * `allow_download` is true for that item.
   */
  const getSignedDownloadUrl = useCallback(async (storagePath: string) => {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error: err } = await supabase.storage
      .from('content-files')
      .createSignedUrl(storagePath, 60 * 10); // 10-minute expiry
    if (err) return null;
    return data.signedUrl;
  }, []);

  return { items, loading, error, refresh, setAllowDownload, updateContent, softDeleteContent, getSignedDownloadUrl };
}

/**
 * commentsBridge — تعليقات الطلاب الحقيقية (جدول public_comments)
 * ─────────────────────────────────────────────────────────────────
 * قبل الملف ده: تعليقات الصفحة الرئيسية كانت useState وهمي محلي فقط،
 * ولوحة تحكم الأدمن كانت تعمل على بيانات تجريبية منفصلة. الملف ده هو
 * نقطة الاتصال الحقيقية الوحيدة بجدول public_comments (راجع migration
 * 0007_public_comments.sql)، وبيستخدمه:
 *   - StudentComments.tsx (الصفحة الرئيسية): يعرض التعليقات المقبولة
 *     فقط (is_visible = true)، ويبعث تعليقات جديدة (تتسجل قيد المراجعة).
 *   - AdminDashboard.tsx (تبويب "تعليقات"): يشوف كل التعليقات (مقبولة
 *     وقيد المراجعة)، ويقدر يوافق/يخفي أي تعليق أو يحذفه نهائيًا أو يرد.
 *
 * لو Supabase مش متصل (وضع العرض التوضيحي)، كل الفنكشنز هنا بترجع نتيجة
 * فاضية/فاشلة بأمان بدل ما تعمل crash.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface PublicCommentRow {
  id: number;
  name: string;
  phone: string;
  comment_text: string;
  reply_text: string | null;
  is_visible: boolean;
  created_at: string;
}

const TABLE = 'public_comments';

/** كل التعليقات (مقبولة + قيد المراجعة) — تستخدمها لوحة الإدارة فقط. */
export async function fetchAllComments(): Promise<PublicCommentRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[commentsBridge] fetchAllComments failed:', error.message);
    return [];
  }
  return (data as PublicCommentRow[]) || [];
}

/** التعليقات المقبولة فقط — دي اللي تظهر للزوار في الصفحة الرئيسية. */
export async function fetchVisibleComments(): Promise<PublicCommentRow[]> {
  const all = await fetchAllComments();
  return all.filter((c) => c.is_visible);
}

/** زائر بيبعت تعليق جديد — بيتسجل قيد المراجعة (is_visible = false) تلقائيًا. */
export async function submitComment(
  name: string,
  phone: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'الموقع غير متصل بالتخزين السحابي حاليًا' };
  }
  const { error } = await supabase
    .from(TABLE)
    .insert({ name: name.trim(), phone: phone.trim(), comment_text: text.trim() });
  if (error) {
    console.error('[commentsBridge] submitComment failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** زرار "إظهار للعلن / إخفاء" في لوحة الإدارة. */
export async function setCommentVisibility(id: number, isVisible: boolean): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from(TABLE).update({ is_visible: isVisible }).eq('id', id);
  if (error) console.error('[commentsBridge] setCommentVisibility failed:', error.message);
  return !error;
}

/** زرار الرد من الأدمن. */
export async function replyToComment(id: number, reply: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from(TABLE).update({ reply_text: reply }).eq('id', id);
  if (error) console.error('[commentsBridge] replyToComment failed:', error.message);
  return !error;
}

/** زرار الحذف النهائي لأي تعليق (مقبول أو قيد المراجعة). */
export async function deleteComment(id: number): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) console.error('[commentsBridge] deleteComment failed:', error.message);
  return !error;
}

/** يسمع لأي تغيير فوري (تعليق جديد / موافقة / حذف) على أي جهاز مفتوح. */
export function subscribeComments(cb: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};
  const channel = supabase
    .channel('public-comments-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, cb)
    .subscribe();
  return () => {
    void supabase!.removeChannel(channel);
  };
}

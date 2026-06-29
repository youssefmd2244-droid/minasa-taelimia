/**
 * useDownloadControlsVisibility
 * -----------------------------------------------------------------------
 * هذا المفتاح (المُخزَّن في app_settings.allow_download_controls_enabled
 * على Supabase حين يكون متصلاً، أو localStorage في وضع العرض التوضيحي)
 * يتحكم في **ظهور** الـ toggle الفردي "إظهار زر التنزيل" بجانب كل عنصر
 * محتوى في تبويب المحتوى بلوحة الإدارة فقط.
 *
 * هو لا يفعّل التنزيل لأي محتوى تلقائياً — `ContentItem.allowDownload`
 * يبقى `false` افتراضياً على مستوى كل عنصر بشكل مستقل تماماً عن هذا
 * المفتاح. إن كان هذا المفتاح مغلقاً، الـ toggle الفردي يُخفى من واجهة
 * الأدمن (لكن أي عنصر كان مفعّلاً مسبقاً يبقى مفعّلاً فعلياً للطالب —
 * هذا المفتاح يتحكم في "إمكانية التعديل من الواجهة"، لا في القيمة نفسها).
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'eduverse_download_controls_enabled';

export function useDownloadControlsVisibility() {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (isSupabaseConfigured) return false; // will be replaced by real fetch below
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase
      .from('app_settings')
      .select('allow_download_controls_enabled')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setEnabledState(Boolean(data.allow_download_controls_enabled));
      });
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (isSupabaseConfigured && supabase) {
      supabase.from('app_settings').update({ allow_download_controls_enabled: value }).eq('id', 1);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, String(value));
      } catch {
        // localStorage unavailable (e.g. private browsing) — fail silently,
        // the toggle still works for the current session via state.
      }
    }
  }, []);

  return { enabled, setEnabled };
}

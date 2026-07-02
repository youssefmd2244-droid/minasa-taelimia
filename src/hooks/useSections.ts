/**
 * useSections — real Supabase reads/writes for the `sections` table,
 * with automatic graceful fallback to in-memory demo data when
 * Supabase isn't configured (see lib/supabaseClient.ts).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured, type SectionRow } from '../lib/supabaseClient';
import { getBridgedSections, shouldUseAdminBridge, subscribeAdminData } from '../lib/adminBridge';

const DEMO_SECTIONS: SectionRow[] = [
  { id: 1, title: 'الرياضيات — المستوى الأول', is_visible: true, is_deleted: false, deleted_at: null, display_order: 1 },
  { id: 2, title: 'العلوم — المستوى الأول', is_visible: true, is_deleted: false, deleted_at: null, display_order: 2 },
  { id: 3, title: 'اللغة العربية — المستوى الأول', is_visible: true, is_deleted: false, deleted_at: null, display_order: 3 },
  { id: 4, title: 'الفنون والتصميم — المستوى الأول', is_visible: false, is_deleted: false, deleted_at: null, display_order: 4 },
];

/**
 * أولوية القراءة: بيانات لوحة الإدارة المحلية (لو موجودة) > Supabase
 * الحقيقي (لو متصل) > بيانات تجريبية ثابتة. راجع shouldUseAdminBridge
 * في adminBridge.ts لسبب الأولوية دي.
 */
function getInitialSections(): SectionRow[] {
  if (shouldUseAdminBridge()) return getBridgedSections();
  if (isSupabaseConfigured) return [];
  return DEMO_SECTIONS;
}

export function useSections() {
  const [sections, setSections] = useState<SectionRow[]>(getInitialSections);
  const [loading, setLoading] = useState(isSupabaseConfigured && !shouldUseAdminBridge());
  const [error, setError] = useState<string | null>(null);
  // اسم فريد لكل نسخة من الـ hook — لو أكتر من مكوّن استخدم useSections()
  // في نفس الوقت (مثلاً SearchOverlay + مكوّن تاني)، كل واحد لازم يبقى
  // ليه قناة Realtime منفصلة، وإلا Supabase بيرمي:
  // "cannot add postgres_changes callbacks ... after subscribe()"
  const channelName = useRef(`sections-changes-${Math.random().toString(36).slice(2)}`).current;

  const refresh = useCallback(async () => {
    if (shouldUseAdminBridge()) {
      setSections(getBridgedSections());
      return;
    }
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('sections')
      .select('*')
      .eq('is_deleted', false)
      .order('display_order', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setSections(data as SectionRow[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // نسمع دايماً لأي تغيير يوصل عن طريق adminBridge — سواء من نفس
    // الجهاز (الأدمن بيعدّل) أو من سحب تلقائي لأحدث نسخة من Supabase
    // (app_data، انظر lib/adminBridge.ts). ده بيضمن إن أي زائر جديد،
    // حتى لو لسه ما فتحش لوحة الإدارة على جهازه أبداً، ياخد آخر تحديث
    // فور ما يوصل من السيرفر بدون أي إعادة تحميل للصفحة.
    const unsubscribeBridge = subscribeAdminData(() => {
      setSections(shouldUseAdminBridge() ? getBridgedSections() : DEMO_SECTIONS);
    });
    if (!isSupabaseConfigured || !supabase) return unsubscribeBridge;
    // Live updates: أي تغيير مباشر على جدول sections (لو استُخدم مستقبلاً) يوصل فوراً كمان.
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections' }, () => {
        refresh();
      })
      .subscribe();
    return () => {
      unsubscribeBridge();
      supabase.removeChannel(channel);
    };
  }, [refresh, channelName]);

  const createSection = useCallback(async (title: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setSections((prev) => [
        ...prev,
        { id: Date.now(), title, is_visible: true, is_deleted: false, deleted_at: null, display_order: prev.length + 1 },
      ]);
      return;
    }
    await supabase.from('sections').insert({ title, display_order: sections.length + 1 });
  }, [sections.length]);

  const updateSection = useCallback(async (id: number, patch: Partial<SectionRow>) => {
    if (!isSupabaseConfigured || !supabase) {
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      return;
    }
    await supabase.from('sections').update(patch).eq('id', id);
  }, []);

  const softDeleteSection = useCallback(async (id: number) => {
    await updateSection(id, { is_deleted: true, deleted_at: new Date().toISOString() });
  }, [updateSection]);

  const restoreSection = useCallback(async (id: number) => {
    await updateSection(id, { is_deleted: false, deleted_at: null });
  }, [updateSection]);

  return { sections, loading, error, refresh, createSection, updateSection, softDeleteSection, restoreSection };
}

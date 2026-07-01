/**
 * useSections — real Supabase reads/writes for the `sections` table,
 * with automatic graceful fallback to in-memory demo data when
 * Supabase isn't configured (see lib/supabaseClient.ts).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured, type SectionRow } from '../lib/supabaseClient';

const DEMO_SECTIONS: SectionRow[] = [
  { id: 1, title: 'الرياضيات — المستوى الأول', is_visible: true, is_deleted: false, deleted_at: null, display_order: 1 },
  { id: 2, title: 'العلوم — المستوى الأول', is_visible: true, is_deleted: false, deleted_at: null, display_order: 2 },
  { id: 3, title: 'اللغة العربية — المستوى الأول', is_visible: true, is_deleted: false, deleted_at: null, display_order: 3 },
  { id: 4, title: 'الفنون والتصميم — المستوى الأول', is_visible: false, is_deleted: false, deleted_at: null, display_order: 4 },
];

export function useSections() {
  const [sections, setSections] = useState<SectionRow[]>(isSupabaseConfigured ? [] : DEMO_SECTIONS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  // اسم فريد لكل نسخة من الـ hook — لو أكتر من مكوّن استخدم useSections()
  // في نفس الوقت (مثلاً SearchOverlay + مكوّن تاني)، كل واحد لازم يبقى
  // ليه قناة Realtime منفصلة، وإلا Supabase بيرمي:
  // "cannot add postgres_changes callbacks ... after subscribe()"
  const channelName = useRef(`sections-changes-${Math.random().toString(36).slice(2)}`).current;

  const refresh = useCallback(async () => {
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
    if (!isSupabaseConfigured || !supabase) return;
    // Live updates: any admin edit reflects instantly for every open tab/device.
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections' }, () => {
        refresh();
      })
      .subscribe();
    return () => {
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

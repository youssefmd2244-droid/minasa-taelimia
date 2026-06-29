/**
 * useAdminStorage — تخزين محلي أول + مزامنة فورية لكل المستخدمين
 * ─────────────────────────────────────────────────────────────────
 * الفكرة الجوهرية:
 *   1. لما الأدمن يضيف / يعدّل / يمسح → يُحفظ فوراً في localStorage
 *      على جهازه (لا يضيع حتى لو الإنترنت قطع).
 *   2. نفس اللحظة يُرسل للـ Supabase.
 *   3. Supabase Realtime يوصّل التغيير لكل المستخدمين المفتوحين
 *      بدون أي refresh.
 *
 * المستخدمون العاديون (بدون صلاحيات):
 *   - بيسمعوا التغييرات عبر Supabase Realtime تلقائياً (موجود أصلاً
 *     في useSections / useContent) — مش محتاج أي تعديل هناك.
 *
 * التخزين المحلي على جهاز الأدمن:
 *   - مفاتيح مسبوقة بـ  `eduverse_admin_`
 *   - تُستخدم كـ cache ورجوع offline
 *   - تنعكس فوراً على UI قبل ما Supabase يرد (optimistic update)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ── Storage keys ────────────────────────────────────────────────
const KEYS = {
  sections: 'eduverse_admin_sections',
  content: 'eduverse_admin_content',
  pendingQueue: 'eduverse_admin_pending_queue',
  lastSync: 'eduverse_admin_last_sync',
} as const;

// ── Types ───────────────────────────────────────────────────────
type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface PendingOperation {
  id: string;
  table: 'sections' | 'content';
  action: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

// ── Helpers ──────────────────────────────────────────────────────
function localGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function localSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage ممتلئ أو ممنوع في وضع خاص — نكمل بدون crash
  }
}

// ── Main hook ────────────────────────────────────────────────────
export function useAdminStorage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState<number>(
    () => localGet<PendingOperation[]>(KEYS.pendingQueue, []).length
  );
  const [lastSync, setLastSync] = useState<string | null>(
    () => localGet<string | null>(KEYS.lastSync, null)
  );
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Queue management ─────────────────────────────────────────
  const getQueue = useCallback((): PendingOperation[] =>
    localGet<PendingOperation[]>(KEYS.pendingQueue, []), []);

  const saveQueue = useCallback((queue: PendingOperation[]) => {
    localSet(KEYS.pendingQueue, queue);
    setPendingCount(queue.length);
  }, []);

  const enqueue = useCallback((op: Omit<PendingOperation, 'id' | 'createdAt' | 'retries'>) => {
    const queue = getQueue();
    const newOp: PendingOperation = {
      ...op,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    saveQueue([...queue, newOp]);
    return newOp;
  }, [getQueue, saveQueue]);

  // ── Flush pending queue to Supabase ──────────────────────────
  const flushQueue = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncStatus('syncing');
    const remaining: PendingOperation[] = [];

    for (const op of queue) {
      try {
        if (op.action === 'insert') {
          const { error } = await supabase.from(op.table).insert(op.payload);
          if (error) throw error;
        } else if (op.action === 'update') {
          const { id, ...patch } = op.payload as { id: number; [k: string]: unknown };
          const { error } = await supabase.from(op.table).update(patch).eq('id', id);
          if (error) throw error;
        } else if (op.action === 'delete') {
          const { id } = op.payload as { id: number };
          const { error } = await supabase
            .from(op.table)
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
        }
      } catch {
        // فشلت العملية — ارجّعها للـ queue مع زيادة retry count
        if (op.retries < 5) {
          remaining.push({ ...op, retries: op.retries + 1 });
        }
        // بعد 5 محاولات نتخلص منها (يمكن تسجيلها في error log مستقبلاً)
      }
    }

    saveQueue(remaining);
    const now = new Date().toISOString();
    localSet(KEYS.lastSync, now);
    setLastSync(now);
    setSyncStatus(remaining.length > 0 ? 'error' : 'synced');

    // إعادة المحاولة بعد 30 ثانية لو في عمليات فاشلة
    if (remaining.length > 0) {
      retryTimerRef.current = setTimeout(flushQueue, 30_000);
    }
  }, [getQueue, saveQueue]);

  // ── Online/offline detection ─────────────────────────────────
  useEffect(() => {
    const onOnline = () => {
      setSyncStatus('idle');
      flushQueue();
    };
    const onOffline = () => setSyncStatus('offline');

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // flush on mount if online
    if (navigator.onLine) flushQueue();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [flushQueue]);

  // ── Public API: Section operations ──────────────────────────
  const adminCreateSection = useCallback(async (title: string) => {
    const tempId = Date.now(); // مؤقت للـ optimistic UI
    const newSection = {
      id: tempId,
      title,
      is_visible: true,
      is_deleted: false,
      deleted_at: null,
      display_order: 999,
    };

    // 1. حفظ فوري في localStorage
    const cached = localGet<typeof newSection[]>(KEYS.sections, []);
    localSet(KEYS.sections, [...cached, newSection]);

    // 2. إرسال لـ Supabase (أو وضعه في queue لو offline)
    if (isSupabaseConfigured && supabase && navigator.onLine) {
      setSyncStatus('syncing');
      const { error } = await supabase
        .from('sections')
        .insert({ title, display_order: 999 });
      if (error) {
        enqueue({ table: 'sections', action: 'insert', payload: { title, display_order: 999 } });
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }
    } else {
      enqueue({ table: 'sections', action: 'insert', payload: { title, display_order: 999 } });
      setSyncStatus('offline');
    }
  }, [enqueue]);

  const adminUpdateSection = useCallback(async (id: number, patch: Record<string, unknown>) => {
    // 1. تحديث فوري في localStorage
    const cached = localGet<Array<Record<string, unknown>>>(KEYS.sections, []);
    const updated = cached.map((s) => (s.id === id ? { ...s, ...patch } : s));
    localSet(KEYS.sections, updated);

    // 2. Supabase أو queue
    if (isSupabaseConfigured && supabase && navigator.onLine) {
      setSyncStatus('syncing');
      const { error } = await supabase.from('sections').update(patch).eq('id', id);
      if (error) {
        enqueue({ table: 'sections', action: 'update', payload: { id, ...patch } });
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }
    } else {
      enqueue({ table: 'sections', action: 'update', payload: { id, ...patch } });
      setSyncStatus('offline');
    }
  }, [enqueue]);

  const adminDeleteSection = useCallback(async (id: number) => {
    // 1. إخفاء فوري من localStorage
    const cached = localGet<Array<Record<string, unknown>>>(KEYS.sections, []);
    const updated = cached.map((s) =>
      s.id === id ? { ...s, is_deleted: true, deleted_at: new Date().toISOString() } : s
    );
    localSet(KEYS.sections, updated);

    // 2. Supabase أو queue
    if (isSupabaseConfigured && supabase && navigator.onLine) {
      setSyncStatus('syncing');
      const { error } = await supabase
        .from('sections')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        enqueue({ table: 'sections', action: 'delete', payload: { id } });
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }
    } else {
      enqueue({ table: 'sections', action: 'delete', payload: { id } });
      setSyncStatus('offline');
    }
  }, [enqueue]);

  // ── Public API: Content operations ───────────────────────────
  const adminUpdateContent = useCallback(async (id: number, patch: Record<string, unknown>) => {
    // 1. فوري في localStorage
    const cached = localGet<Array<Record<string, unknown>>>(KEYS.content, []);
    const updated = cached.map((c) => (c.id === id ? { ...c, ...patch } : c));
    localSet(KEYS.content, updated);

    // 2. Supabase أو queue
    if (isSupabaseConfigured && supabase && navigator.onLine) {
      setSyncStatus('syncing');
      const { error } = await supabase.from('content').update(patch).eq('id', id);
      if (error) {
        enqueue({ table: 'content', action: 'update', payload: { id, ...patch } });
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }
    } else {
      enqueue({ table: 'content', action: 'update', payload: { id, ...patch } });
      setSyncStatus('offline');
    }
  }, [enqueue]);

  const adminDeleteContent = useCallback(async (id: number) => {
    // 1. فوري في localStorage
    const cached = localGet<Array<Record<string, unknown>>>(KEYS.content, []);
    const updated = cached.map((c) =>
      c.id === id ? { ...c, is_deleted: true, deleted_at: new Date().toISOString() } : c
    );
    localSet(KEYS.content, updated);

    // 2. Supabase أو queue
    if (isSupabaseConfigured && supabase && navigator.onLine) {
      setSyncStatus('syncing');
      const { error } = await supabase
        .from('content')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        enqueue({ table: 'content', action: 'delete', payload: { id } });
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }
    } else {
      enqueue({ table: 'content', action: 'delete', payload: { id } });
      setSyncStatus('offline');
    }
  }, [enqueue]);

  // ── Manual sync trigger (زر "مزامنة الآن" في الإعدادات) ─────
  const syncNow = useCallback(async () => {
    await flushQueue();
  }, [flushQueue]);

  // ── Status label للـ UI ──────────────────────────────────────
  const syncLabel = {
    idle: 'جاهز',
    syncing: '⏳ جاري المزامنة...',
    synced: '✅ تمت المزامنة',
    offline: '📵 غير متصل — سيُزامن عند الاتصال',
    error: `⚠️ ${pendingCount} عملية في الانتظار`,
  }[syncStatus];

  return {
    // عمليات الأقسام
    adminCreateSection,
    adminUpdateSection,
    adminDeleteSection,
    // عمليات المحتوى
    adminUpdateContent,
    adminDeleteContent,
    // حالة المزامنة
    syncStatus,
    syncLabel,
    pendingCount,
    lastSync,
    syncNow,
  };
}

/**
 * adminBridge — يوصّل بيانات لوحة الإدارة (localStorage: eduverse_admin_data)
 * بالواجهة اللي بيشوفها الطالب (useSections / useContent).
 * ─────────────────────────────────────────────────────────────────
 * قبل كده: لوحة الإدارة كانت بتحفظ كل حاجة في مخزن محلي منفصل تماماً
 * عن الـ hooks اللي بتقرأ منها الصفحة الرئيسية (useSections/useContent
 * كانوا بيرجعوا بيانات ثابتة demo لو Supabase مش متصل). فكانت أي إضافة
 * (قسم / صورة / فيديو / ملف) بتتحفظ عند الأدمن بس، وميظهرش أي أثر ليها
 * "برّه" عند الطالب.
 *
 * الحل: الملف ده بيحوّل بيانات لوحة الإدارة لنفس شكل SectionRow/ContentRow
 * اللي الـ hooks بتفهمه، وبيبعت حدث فوري (CustomEvent) كل ما الأدمن يغيّر
 * حاجة عشان أي مكوّن مفتوح (نفس التبويب) يعمل refresh على طول من غير
 * إعادة تحميل الصفحة. لو مفيش Supabase متصل، ده بقى مصدر الحقيقة الحقيقي
 * بدل الداتا الثابتة القديمة.
 */
import type { ContentRow, ContentType, SectionRow } from './supabaseClient';

const ADMIN_STORAGE_KEY = 'eduverse_admin_data';
export const ADMIN_DATA_EVENT = 'eduverse-admin-data-changed';

/** Fired by AdminDashboard.tsx every time it persists a change. */
export function notifyAdminDataChanged() {
  try {
    window.dispatchEvent(new CustomEvent(ADMIN_DATA_EVENT));
  } catch {
    // بيئة بدون window (SSR افتراضي) — تجاهل
  }
}

/** Subscribes to admin-data changes, in this tab (CustomEvent) and other tabs (storage event). */
export function subscribeAdminData(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_STORAGE_KEY) cb();
  };
  window.addEventListener(ADMIN_DATA_EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(ADMIN_DATA_EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

// ── Raw shapes as stored by AdminDashboard.tsx (kept loosely typed here
//    on purpose — this file must not break if the admin adds new fields). ──
interface RawSection {
  id: number; title: string; isVisible: boolean; isDeleted: boolean; displayOrder: number;
}
interface RawContentItem {
  id: number; sectionId: number; title: string; type: string; contentBody: string;
  fileUrl: string; isFeatured: boolean; showOnHome: boolean; allowDownload: boolean;
  isDeleted: boolean;
}
interface RawFileItem {
  id: number; title: string; fileUrl: string; fileName: string;
  fileType: 'pdf' | 'word' | 'excel' | 'ppt' | 'zip';
  sectionId: number; showOnHome: boolean; isDeleted: boolean; allowDownload: boolean;
}
interface RawRecordItem {
  id: number; title: string; audioUrl: string; sectionId: number;
  showOnHome: boolean; isDeleted: boolean;
}
interface RawAdminData {
  sections?: RawSection[];
  contentItems?: RawContentItem[];
  files?: RawFileItem[];
  records?: RawRecordItem[];
}

function readAdminData(): RawAdminData | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RawAdminData;
  } catch {
    return null;
  }
}

/** true إذا كانت لوحة الإدارة اتفتحت وحفظت أي بيانات على الجهاز ده من قبل. */
export function hasAdminData(): boolean {
  return readAdminData() !== null;
}

const FILE_TYPE_MAP: Record<RawFileItem['fileType'], ContentType> = {
  pdf: 'pdf', word: 'word', excel: 'excel', ppt: 'powerpoint', zip: 'zip',
};

export function getBridgedSections(): SectionRow[] {
  const data = readAdminData();
  if (!data?.sections) return [];
  return data.sections.map((s) => ({
    id: s.id,
    title: s.title,
    is_visible: s.isVisible,
    is_deleted: s.isDeleted,
    deleted_at: null,
    display_order: s.displayOrder,
  }));
}

export function getBridgedContent(): ContentRow[] {
  const data = readAdminData();
  if (!data) return [];
  const now = new Date().toISOString();
  const rows: ContentRow[] = [];

  for (const c of data.contentItems || []) {
    rows.push({
      id: c.id,
      section_id: c.sectionId,
      title: c.title,
      // 'image' مش موجود في الأصل في ContentType بتاع Supabase، لكن هنا
      // بنتعامل معاه فعلياً كنوع محتوى حقيقي عشان يظهر برّه كصورة.
      type: (c.type as ContentType) || 'text',
      file_url: c.fileUrl || null,
      content_body: c.contentBody || null,
      is_featured: c.isFeatured,
      show_on_home: c.showOnHome,
      allow_download: c.allowDownload,
      is_deleted: c.isDeleted,
      deleted_at: null,
      updated_at: now,
    });
  }

  // الملفات (PDF/Word/Excel/PowerPoint/ZIP) بتتحوّل لعناصر محتوى كمان
  for (const f of data.files || []) {
    rows.push({
      id: 1_000_000_000 + f.id,
      section_id: f.sectionId,
      title: f.title,
      type: FILE_TYPE_MAP[f.fileType] || 'pdf',
      file_url: f.fileUrl || null,
      content_body: null,
      is_featured: false,
      show_on_home: f.showOnHome,
      allow_download: f.allowDownload,
      is_deleted: f.isDeleted,
      deleted_at: null,
      updated_at: now,
    });
  }

  // التسجيلات الصوتية
  for (const r of data.records || []) {
    rows.push({
      id: 2_000_000_000 + r.id,
      section_id: r.sectionId,
      title: r.title,
      type: 'audio' as ContentType,
      file_url: r.audioUrl || null,
      content_body: null,
      is_featured: false,
      show_on_home: r.showOnHome,
      allow_download: false,
      is_deleted: r.isDeleted,
      deleted_at: null,
      updated_at: now,
    });
  }

  return rows.sort((a, b) => b.id - a.id);
}

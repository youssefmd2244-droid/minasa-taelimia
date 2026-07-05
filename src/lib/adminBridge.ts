/**
 * adminBridge — يوصّل بيانات لوحة الإدارة (localStorage: eduverse_admin_data)
 * بالواجهة اللي بيشوفها الطالب (useSections / useContent) — وكمان بيزامنها
 * فعليًا على Supabase عشان تظهر لكل المستخدمين على أي جهاز.
 * ─────────────────────────────────────────────────────────────────
 * قبل كده: لوحة الإدارة كانت بتحفظ كل حاجة في مخزن محلي منفصل تماماً
 * عن الـ hooks اللي بتقرأ منها الصفحة الرئيسية (useSections/useContent
 * كانوا بيرجعوا بيانات ثابتة demo لو Supabase مش متصل)، ومفيش أي مسار
 * كتابة حقيقي على Supabase. فكانت أي إضافة (قسم / صورة / فيديو / ملف)
 * بتتحفظ عند الأدمن بس، وميظهرش أي أثر ليها "برّه" عند باقي المستخدمين.
 *
 * الحل الحالي:
 *   1. الملف ده بيحوّل بيانات لوحة الإدارة لنفس شكل SectionRow/ContentRow
 *      اللي الـ hooks بتفهمه، وبيبعت حدث فوري (CustomEvent) كل ما البيانات
 *      تتغيّر عشان أي مكوّن مفتوح يعمل refresh على طول من غير إعادة تحميل.
 *   2. لو Supabase متصل، كل نسخة من البيانات بتتخزن كمان في صف مشترك
 *      واحد (جدول app_data، id=1) — ده مصدر الحقيقة المشترك بين كل
 *      الأجهزة والمستخدمين. أي جهاز (حتى لو مفتحش لوحة الإدارة قبل
 *      كده) بيسحب نفس الصف أول ما يفتح الموقع، وبيسمع لأي تغيير فيه
 *      فورًا عبر Supabase Realtime.
 *   3. لو Supabase مش متصل، بيفضل localStorage هو مصدر الحقيقة الوحيد
 *      (سلوك وضع العرض التوضيحي القديم، بدون تغيير).
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { ContentRow, ContentType, SectionRow } from './supabaseClient';
import { writeAppDataToDevice, readAppDataFromDevice } from './deviceStorage';

const ADMIN_STORAGE_KEY = 'eduverse_admin_data';
const APP_DATA_TABLE = 'app_data';
const APP_DATA_ROW_ID = 1;
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

/** يكتب نسخة جديدة من بيانات لوحة الإدارة في الكاش المحلي بدون إطلاق حدث. */
function writeAdminDataCache(data: RawAdminData): void {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage ممتلئ أو ممنوع في وضع خاص — نكمل بدون crash
  }
  // مرآة إضافية: بتتحفظ كمان كملف حقيقي على تخزين الجهاز (المكان اللي
  // اختاره الأدمن من الإعدادات) — عشان النسخة دي تعيش حتى لو localStorage
  // اتمسح (مسح بيانات التطبيق من إعدادات أندرويد، إلخ). Fire-and-forget:
  // مفيش داعي ننتظرها هنا لأنها مجرد نسخة احتياطية إضافية.
  void writeAppDataToDevice(data);
}

/**
 * محاولة أخيرة لقراءة بيانات لوحة الإدارة: بترجع نسخة من ملف حقيقي على
 * تخزين الجهاز (لو موجودة) لما يكون مفيش أي بيانات محلية في localStorage
 * ومفيش اتصال بـ Supabase وقت فتح التطبيق (وضع أوفلاين على جهاز فتح
 * التطبيق قبل كده وكان مخزّن بياناته على مستندات/تخزين خارجي مثلاً).
 */
export async function pullDeviceAppData(): Promise<RawAdminData | null> {
  const data = await readAppDataFromDevice();
  return (data as RawAdminData) || null;
}

/**
 * true إذا كانت لوحة الإدارة اتفتحت وحفظت أي بيانات على الجهاز ده من قبل،
 * أو لو تم سحب نسخة حديثة من Supabase وتخزينها محليًا كـ cache.
 */
export function hasAdminData(): boolean {
  return readAdminData() !== null;
}

/**
 * لوحة الإدارة (AdminDashboard.tsx) بتحفظ كل حاجة محلياً على الجهاز
 * (localStorage) كـ cache فوري، وبتتزامن كمان مع صف مشترك على Supabase
 * (app_data، انظر أسفل) لما يكون متصل. فلو في أي بيانات محلية (سواء من
 * تعديل الأدمن نفسه أو من سحب تلقائي من Supabase) لازم الصفحة الرئيسية
 * تاخد البيانات من نفس المكان ده. فقط لو مفيش أي بيانات محلية أصلاً
 * (أول تحميل قبل ما تكتمل عملية السحب من Supabase) بنرجع لبيانات
 * Supabase الخام (لو متصل) أو للبيانات التجريبية الثابتة.
 */
export function shouldUseAdminBridge(): boolean {
  return hasAdminData();
}

// ── Remote sync عبر Supabase (صف مشترك واحد id=1 في جدول app_data) ───
// ده اللي بيخلي أي إضافة/تعديل/مسح من لوحة الإدارة يظهر لكل المستخدمين
// على أي جهاز، مش بس على جهاز الأدمن. راجع migration 0003_admin_sync.sql.

/** يسحب أحدث نسخة من بيانات لوحة الإدارة من Supabase، أو null لو مش متصل/مفيش بيانات. */
export async function pullRemoteAppData(): Promise<RawAdminData | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: row, error } = await supabase
      .from(APP_DATA_TABLE)
      .select('data')
      .eq('id', APP_DATA_ROW_ID)
      .maybeSingle();
    if (error || !row || !row.data) return null;
    return row.data as RawAdminData;
  } catch {
    return null;
  }
}

let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/** يرفع نسخة جديدة من بيانات لوحة الإدارة على Supabase (مع debounce بسيط لتقليل الطلبات). */
export function pushAppData(data: RawAdminData): void {
  if (!isSupabaseConfigured || !supabase) return;
  if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
  pushDebounceTimer = setTimeout(() => {
    void supabase!.from(APP_DATA_TABLE).upsert({ id: APP_DATA_ROW_ID, data });
  }, 500);
}

/**
 * يرفع نسخة جديدة من بيانات لوحة الإدارة فورًا (من غير أي تأخير/debounce)
 * ويرجّع نتيجة حقيقية بنجاح العملية من عدمه — ده اللي بيستخدمه زرار
 * "حفظ الآن" في الإعدادات عشان يقدر يأكّد للأدمن إن كل حاجة اتحفظت
 * فعلاً بدل ما يفترض كده وهو مش متأكد.
 */
export async function pushAppDataNow(data: RawAdminData): Promise<{ ok: boolean; cloud: boolean; message?: string }> {
  if (pushDebounceTimer) { clearTimeout(pushDebounceTimer); pushDebounceTimer = null; }
  if (!isSupabaseConfigured || !supabase) {
    // وضع العرض التوضيحي — مفيش Supabase متصل، فالحفظ محلي بس (localStorage
    // بالفعل بيتم أول ما تتغيّر أي حاجة). نرجّع نجاح "محلي" عشان الأدمن
    // ياخد تأكيد واضح إن التغييرات محفوظة على الجهاز ده على الأقل.
    return { ok: true, cloud: false };
  }
  // فحص وقائي: لو رفع أي ملف فشل (مفيش اتصال، أو bucket eduverse-media مش
  // منشأ بعد)، readFile في AdminDashboard.tsx بترجع لتشفير base64 محلي
  // بدل ما توقف — لكن ده بيخلي الصف المشترك ضخم جدًا (خصوصًا للفيديوهات)
  // ويفشل الحفظ برسالة سيرفر مش واضحة. نكتشف الحالة دي هنا ونديله رسالة
  // مفهومة بدل ما نسيب Supabase يرفض الطلب برسالة تقنية غامضة.
  let payloadSize = 0;
  try { payloadSize = new Blob([JSON.stringify(data)]).size; } catch { /* ignore */ }
  if (payloadSize > 3_000_000) {
    return {
      ok: false, cloud: true,
      message: `حجم البيانات كبير جدًا (${(payloadSize / 1_000_000).toFixed(1)}MB) — على الأغلب صورة أو فيديو اترفع بشكل محلي بدل السحابة (فشل رفع Storage). تأكد إن bucket "eduverse-media" وسياساته منشأة (شغّل 0004_media_storage.sql)، وإن اتصالك بالإنترنت شغال وقت الرفع، ثم أعد رفع أي ملف كبير.`,
    };
  }
  try {
    const { error } = await supabase.from(APP_DATA_TABLE).upsert({ id: APP_DATA_ROW_ID, data });
    if (error) console.error('[adminBridge] pushAppDataNow failed:', error.message, error);
    return { ok: !error, cloud: true, message: error?.message };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[adminBridge] pushAppDataNow exception:', e);
    return { ok: false, cloud: true, message };
  }
}

let bridgeSyncStarted = false;

/**
 * يبدأ مزامنة ثنائية الاتجاه مع Supabase: يسحب أحدث نسخة فور فتح
 * الموقع (حتى لو الجهاز ده مفتحش لوحة الإدارة قبل كده أبدًا)، وبعدين
 * يسمع لأي تغيير جديد فورًا عبر Realtime. بيتنفذ مرة واحدة بس مهما
 * اتعمل import للملف ده من أكتر من مكان.
 */
export function initAdminBridgeSync(): void {
  if (bridgeSyncStarted || typeof window === 'undefined') return;
  bridgeSyncStarted = true;
  if (!isSupabaseConfigured || !supabase) return;

  const applyRemote = (remote: RawAdminData | null) => {
    if (!remote) return;
    writeAdminDataCache(remote);
    notifyAdminDataChanged();
  };

  pullRemoteAppData().then(async (remote) => {
    if (remote) { applyRemote(remote); return; }
    // مفيش اتصال بـ Supabase (أو الجدول لسه مش منشأ) — كملاذ أخير، لو
    // مفيش أي بيانات محلية أصلاً على الجهاز ده، نجرّب نقرأ من ملف
    // التخزين الحقيقي على الهاتف (لو المستخدم كان مخزّن بياناته هناك
    // من قبل، ده بيرجّعها بدل ما يفضل شايف البيانات التجريبية بس).
    if (!hasAdminData()) {
      const fromDevice = await readAppDataFromDevice();
      if (fromDevice) {
        writeAdminDataCache(fromDevice as RawAdminData);
        notifyAdminDataChanged();
      }
    }
  });

  supabase
    .channel('app-data-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: APP_DATA_TABLE }, () => {
      pullRemoteAppData().then(applyRemote);
    })
    .subscribe();
}

initAdminBridgeSync();

const MEDIA_BUCKET = 'eduverse-media';

/**
 * يرفع ملف فعلي (صورة/فيديو/صوت/مستند) على Supabase Storage ويرجّع رابط
 * عام دائم، بدل تحويله لنص base64 ضخم جوه صف app_data المشترك. لو
 * الرفع فشل أو Supabase مش متصل بيرجع null، وAdminDashboard.tsx بيرجع
 * تلقائيًا لتشفير base64 المحلي بدل ما يوقف الأدمن.
 */
export interface UploadResult { url: string | null; error?: string }

/**
 * يرفع أكتر من ملف مرة واحدة (بالتوازي) على Supabase Storage — بتستخدمها
 * أي شاشة رفع عايزة تسمح للأدمن يختار أكتر من صورة/فيديو/ملف/صوت مرة
 * واحدة (مجمّعين مع بعض أو كل واحد لوحده)، بدل ما يضطر يرفع كل ملف على
 * حدى. مفيش أي حد أقصى لعدد الملفات هنا (غير حدود المتصفح نفسه).
 */
export async function uploadMediaFiles(files: File[], folder: string = 'misc'): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadMediaFile(file, folder)));
}

export async function uploadMediaFile(file: File, folder: string = 'misc'): Promise<UploadResult> {
  if (!isSupabaseConfigured || !supabase) return { url: null };
  try {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${folder}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || undefined,
    });
    if (error) {
      console.error('[adminBridge] upload failed:', error.message);
      return { url: null, error: error.message };
    }
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl || null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[adminBridge] upload exception:', e);
    return { url: null, error: message };
  }
}

const FILE_TYPE_MAP: Record<RawFileItem['fileType'], ContentType> = {
  pdf: 'pdf', word: 'word', excel: 'excel', ppt: 'powerpoint', zip: 'zip',
};

export function getBridgedSections(): SectionRow[] {
  const data = readAdminData();
  if (!data?.sections) return [];
  return data.sections
    .filter((s) => !s.isDeleted)
    .map((s) => ({
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

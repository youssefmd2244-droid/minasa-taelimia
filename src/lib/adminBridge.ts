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
import { getContentSource, pullFromGithubRaw, pushToGithub, isGithubConfigured } from './githubStorage';

const ADMIN_STORAGE_KEY = 'eduverse_admin_data';
const APP_DATA_TABLE = 'app_data';
const APP_DATA_ROW_ID = 1;
export const ADMIN_DATA_EVENT = 'eduverse-admin-data-changed';

// ── حماية ضد سباق الحفظ/السحب (باگ تم اكتشافه وإصلاحه هنا) ──────────────
// المشكلة: الأدمن نفسه مشترك في قناة Realtime بتاعة app_data (نفس القناة
// اللي بتسمعها صفحة الطالب). لما الأدمن يحفظ (تلقائي أو "احفظ الآن")،
// الـ upsert نفسه بيطلق postgres_changes event على نفس صفحته، وده بيعمل
// سحب جديد (SELECT) من Supabase ويكتبه فوق localStorage — ولو أي تأخير
// شبكة بسيط حصل (شبه مؤكد يحصل أحيانًا)، ممكن يوصل سحب لبيانات "أقدم"
// (من قبل آخر تعديل) بعد الأحدث ويمسحها فورًا. كمان: فتح الصفحة من جديد
// (ريفريش) كان بيسحب نسخة remote ويطبّقها فوق البيانات المحلية بشرط وحيد
// ("هل الأدمن عدّل من وقت ما الصفحة فتحت؟") وطبعًا الإجابة لأ على طول لأن
// الصفحة لسه فاتحة جديد — فأي فارق توقيت بسيط بين الحفظ ووصول النسخة
// المحدثة فعليًا للسيرفر كان بيخلي الريفريش يرجّع نسخة أقدم فوق الأحدث.
// الحل: نسجل "نافذة حماية" (localStorage، عشان تعيش حتى بعد الريفريش)
// كل ما نبدأ أي عملية حفظ محلية، ونرفض تطبيق أي نسخة remote توصل خلالها.
const LOCAL_WRITE_GUARD_KEY = 'eduverse_local_write_guard_until';
const LOCAL_WRITE_GUARD_MS = 8000;
// باگ تم اكتشافه وإصلاحه هنا (سبب رئيسي لـ"بضيف صورة، بتظهر، وبعد ما
// أقفل التطبيق وأفتحه تاني بتختفي" — خصوصًا مع مصدر GitHub):
// الحماية القديمة كانت مؤقتة بس (8 ثواني) وبتفترض إن أي كتابة محلية
// بتوصل فعليًا للسحابة خلال المدة دي. لكن لو النشر على GitHub فشل
// فعليًا (زي Token ناقص/غلط، أو الريبو مش مضبوط) الفشل ده كان بيحصل
// بصمت في الخلفية (console.error بس)، والنسخة المحلية الجديدة تفضل
// "غير متزامنة" فعليًا لفترة أطول بكتير من 8 ثواني — أحيانًا للأبد.
// فلما التطبيق يتقفل ويتفتح تاني (الحماية المؤقتة خلصت من زمان)،
// pullRemoteAppData بيسحب نسخة GitHub القديمة (اللي ما اتحدثتش لأن
// النشر فشل) ويمسح بيها آخر تعديل محلي.
// الحل: نضيف علم دائم "فيه تغيير محلي لسه مش متأكد إنه اتزامن بنجاح"
// (PENDING_UNSYNCED_KEY) بيتمسح بس لما النشر يخلص بنجاح فعليًا على كل
// مصدر مفعّل. طول ما العلم ده موجود، مفيش أي نسخة remote هتُطبَّق فوق
// البيانات المحلية — حتى لو مرت أيام — لحد ما التغيير يتأكد إنه اتحفظ
// فعلاً على السحابة (أو الأدمن يصلّح إعدادات GitHub/Supabase وتنجح
// المحاولة اللي بعدها).
const PENDING_UNSYNCED_KEY = 'eduverse_pending_unsynced_change';

function markSyncPending() {
  try { localStorage.setItem(PENDING_UNSYNCED_KEY, '1'); } catch { /* ignore */ }
}

function markSyncConfirmed() {
  try { localStorage.removeItem(PENDING_UNSYNCED_KEY); } catch { /* ignore */ }
}

function hasPendingUnsyncedChange(): boolean {
  try { return localStorage.getItem(PENDING_UNSYNCED_KEY) === '1'; } catch { return false; }
}

function extendLocalWriteGuard() {
  try { localStorage.setItem(LOCAL_WRITE_GUARD_KEY, String(Date.now() + LOCAL_WRITE_GUARD_MS)); } catch { /* ignore */ }
  markSyncPending();
}

/** true لو في كتابة محلية حصلت أو بتحصل دلوقتي قريب (نافذة الـ8 ثواني)،
 *  أو لو آخر تعديل محلي لسه مش متأكد إنه اتزامن بنجاح مع السحابة —
 *  في الحالتين، أي نسخة remote توصل المفروض تتجاهل تمامًا عشان منمسحش
 *  تعديل حقيقي محلي بنسخة سحابية أقدم (أو ببساطة فاشلة النشر). */
export function isLocalWriteGuardActive(): boolean {
  try {
    const until = Number(localStorage.getItem(LOCAL_WRITE_GUARD_KEY) || '0');
    if (Date.now() < until) return true;
  } catch { /* ignore */ }
  return hasPendingUnsyncedChange();
}

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
  isDeleted: boolean; posterUrl?: string;
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
/** عنصر واحد في "مكتبة المواد الدراسية" — معرض الكورسات في الصفحة الرئيسية. */
export interface RawGalleryCourse {
  id: number; title: string; subtitle: string; badge?: string;
  imageUrl: string; displayOrder: number; isDeleted: boolean;
}
interface RawAdminData {
  sections?: RawSection[];
  contentItems?: RawContentItem[];
  files?: RawFileItem[];
  records?: RawRecordItem[];
  courses?: RawGalleryCourse[];
  appName?: string;
  appIconUrl?: string;
  /** تعديلات الأدمن على نصوص الموقع (تبويب "نصوص والصور" في الإعدادات) —
   *  مفتاح ثابت (راجع siteContentRegistry.ts) لكل قيمة نصية. */
  siteTexts?: Record<string, string>;
  /** نفس الفكرة بس لصور الموقع (روابط). */
  siteImages?: Record<string, string>;
  /** وقت آخر نشر فعلي (ISO)، بيتضاف تلقائيًا وقت النشر بس (مش بيتخزن في
   *  localStorage المحلي) — بيستخدمه pullRemoteAppData عشان يقارن بين
   *  نسخة Supabase ونسخة GitHub ويرجّع الأحدث فعليًا بدل ما يفترض إن
   *  Supabase دايمًا الأحدث. راجع الشرح فوق pullRemoteAppData. */
  savedAt?: string;
}

// ── In-memory cache للبيانات المفكوكة (parsed) ──────────────────────────
// المشكلة اللي كانت بتسبب "تهنيج فجأة" (لاج مفاجئ لثانية أو أكتر):
// getBridgedContent/getBridgedSections بتتنادى من كل نسخة مفتوحة من
// useSections/useContent (قسم لكل LessonList + SearchOverlay + CoursesSection
// إلخ — ممكن يبقوا 10+ نسخة في نفس الصفحة)، وكل نسخة كانت بتعمل
// JSON.parse() منفصل بالكامل لنفس الـ blob في localStorage. لما الـ blob ده
// يحتوي على صور/فيديوهات مشفّرة base64 (fallback بيحصل لما رفع Storage
// يفشل — راجع pushAppDataNow) ممكن يوصل لعدة ميجابايت، وJSON.parse لبيانات
// بالحجم ده تكلفته حقيقية (مئات المللي ثانية) وبتحصل على الـ main thread
// (بتوقف الرسم/اللمس تمامًا لحد ما تخلص). لما حدث واحد (ADMIN_DATA_EVENT
// أو storage) يطلق كل النسخ المفتوحة تعيد القراءة في نفس اللحظة، النتيجة
// عملية parse مكررة لنفس البيانات بالظبط N مرة بدل مرة واحدة — وده اللي
// بيحس المستخدم إنه "تجمّد فجأة".
// الحل: كاش بسيط في الذاكرة مربوط بمقارنة السلسلة الخام (raw string) —
// لو مفيش تغيير فعلي في localStorage من آخر قراءة، نرجّع نفس الـ object
// المفكوك من الذاكرة من غير ما نعمل JSON.parse تاني.
let cachedRaw: string | null = null;
let cachedParsed: RawAdminData | null = null;

function readAdminData(): RawAdminData | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedParsed = null;
      return null;
    }
    if (raw === cachedRaw) return cachedParsed;
    const parsed = JSON.parse(raw) as RawAdminData;
    cachedRaw = raw;
    cachedParsed = parsed;
    return parsed;
  } catch {
    return null;
  }
}

/** يكتب نسخة جديدة من بيانات لوحة الإدارة في الكاش المحلي بدون إطلاق حدث. */
function writeAdminDataCache(data: RawAdminData): void {
  try {
    const raw = JSON.stringify(data);
    localStorage.setItem(ADMIN_STORAGE_KEY, raw);
    // نحدّث الكاش في الذاكرة فورًا بنفس القيمة المكتوبة، عشان أي قراءة
    // جاية فورًا (نفس التبويب) تاخد الـ object الجاهز من غير ما تعمل
    // JSON.parse تاني لنفس البيانات اللي إحنا أصلاً عندنا نسختها الأصلية.
    cachedRaw = raw;
    cachedParsed = data;
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

async function pullFromSupabase(): Promise<RawAdminData | null> {
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

/**
 * ملحوظة مهمة (باگ تم اكتشافه وإصلاحه هنا): "مصدر المحتوى" (getContentSource)
 * بيتقرا من localStorage الخاص بكل جهاز على حدة — يعني اختيار الأدمن لـ
 * "GitHub فقط" بيتحفظ على جهاز الأدمن هو بس. أي جهاز/متصفح تاني (كل
 * المستخدمين العاديين) لسه شايف القيمة الافتراضية "supabase" في
 * localStorage بتاعه هو، لأنه أصلاً مفتحش شاشة الإعدادات دي أبداً.
 * فكانت النتيجة: الأدمن ينشر تعديل على GitHub، لكن كل الأجهزة التانية
 * تفضل تحاول تقرا من Supabase بس (اللي مفيهوش أي بيانات في وضع GitHub
 * الخالص) — فالمحتوى الجديد میظهرش عند حد إلا عند الأدمن نفسه.
 *
 * باگ تاني تم اكتشافه وإصلاحه هنا (السبب الحقيقي لـ"اخترت GitHub فقط،
 * اتحفظ للجميع ✓، وبرضه مش بيظهر"): الحل القديم كان بيجرب Supabase
 * الأول، ولو رجع بأي بيانات (حتى لو صف قديم فاضي من زمان قبل ما الأدمن
 * يحوّل لوضع "GitHub فقط") كان بيوثق بيها فورًا ومبيجربش GitHub خالص.
 * يعني: طول ما فيه أي صف قديم على Supabase (حتى لو مش محدّث من شهور)،
 * أي تحديث جديد اتنشر على GitHub بس كان بيتجاهل تمامًا للأبد — بغض
 * النظر عن قيمة "مصدر النشر" اللي الأدمن اختارها فعليًا.
 * الحل الصحيح: نجرب المصدرين مع بعض (متوازي)، وكل نشر بيسجّل وقته
 * (`savedAt`) وقت الحفظ — فلما نسحب، نقارن الوقتين ونرجّع الأحدث فعليًا
 * أيًا كان مصدره، مش بس "أول واحد رجع بيانات". لو مصدر واحد بس فيه
 * `savedAt` (بيانات قديمة اتحفظت قبل الإضافة دي)، بيتفضّل عليه تلقائيًا.
 */
let lastPullSource: 'supabase' | 'github' | null = null;

export async function pullRemoteAppData(): Promise<RawAdminData | null> {
  const [fromSupabase, fromGithub] = await Promise.all([
    pullFromSupabase(),
    isGithubConfigured() ? pullFromGithubRaw<RawAdminData>() : Promise.resolve(null),
  ]);

  if (!fromSupabase && !fromGithub) {
    lastPullSource = null;
    return null;
  }
  if (fromSupabase && !fromGithub) {
    lastPullSource = 'supabase';
    return fromSupabase;
  }
  if (fromGithub && !fromSupabase) {
    lastPullSource = 'github';
    return fromGithub;
  }

  // الاثنين رجعوا بيانات — نقارن savedAt عشان نرجّع الأحدث فعليًا. لو
  // مفيش savedAt في واحد منهم (بيانات قديمة من قبل إضافة الحقل ده)،
  // نعتبره الأقدم افتراضيًا.
  const supTime = Date.parse((fromSupabase as RawAdminData & { savedAt?: string }).savedAt || '') || 0;
  const ghTime = Date.parse((fromGithub as RawAdminData & { savedAt?: string }).savedAt || '') || 0;
  if (ghTime > supTime) {
    lastPullSource = 'github';
    return fromGithub as RawAdminData;
  }
  lastPullSource = 'supabase';
  return fromSupabase as RawAdminData;
}

export const SYNC_STATUS_EVENT = 'eduverse-sync-status';
export type SyncStatusDetail = { ok: boolean; source: 'supabase' | 'github'; message?: string };

function notifySyncStatus(detail: SyncStatusDetail) {
  try {
    window.dispatchEvent(new CustomEvent<SyncStatusDetail>(SYNC_STATUS_EVENT, { detail }));
  } catch {
    // بيئة بدون window — تجاهل
  }
}

/** يشترك في حالة آخر مزامنة خلفية (تلقائية) — عشان لوحة الإدارة تقدر
 *  تبيّن للأدمن إن آخر تغيير اتحفظ فعلاً أو لأ، حتى لو ما ضغطش "حفظ
 *  الآن" بنفسه. قبل كده الحفظ التلقائي كان fire-and-forget بالكامل
 *  (`void pushToGithub(data)`) — أي فشل (زي تعارض sha) كان بيروح في
 *  console.error بس، والأدمن يفتكر إن كل حاجة اتحفظت وهي فعليًا لأ،
 *  وده اللي كان بيخلي المستخدمين العاديين ميشوفوش آخر تعديلات. */
export function subscribeSyncStatus(cb: (detail: SyncStatusDetail) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<SyncStatusDetail>).detail);
  window.addEventListener(SYNC_STATUS_EVENT, handler);
  return () => window.removeEventListener(SYNC_STATUS_EVENT, handler);
}

let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// باگ تم اكتشافه وإصلاحه هنا (سبب رئيسي لـ"بتحفظش لما بخرج من التطبيق
// وأدخل تاني"): pushAppData بينتظر 500ms (debounce) قبل ما يبعت فعليًا
// أي حاجة لـ Supabase/GitHub. على موبايل، لو الأدمن عدّل حاجة وبعدين
// خرج من التطبيق (زرار الرجوع، تبديل تطبيق، قفل الشاشة) قبل ما الـ 500ms
// دول يعدّوا + الطلب نفسه يخلص، نظام التشغيل بيوقف/يجمّد الـ WebView
// والتايمر ده مبيتنفذش خالص — فآخر تعديل بيضيع تمامًا من غير أي تحذير.
// الحل: نحتفظ بآخر نسخة بيانات معلّقة (pendingPushData)، ونصدّر
// flushPendingPush() تقدر أي شاشة/حدث (زي تصغير التطبيق) تناديها فورًا
// عشان تجبر الحفظ يحصل دلوقتي من غير ما تستنى الـ 500ms.
let pendingPushData: RawAdminData | null = null;

/** بيرجع نسخة من البيانات مع وقت النشر الحالي (savedAt) — بيتضاف بس لحظة
 *  الإرسال الفعلي (مش بيتخزن في localStorage المحلي)، عشان pullRemoteAppData
 *  يقدر يقارن حداثة نسخة Supabase مقابل GitHub بدل ما يفترض إن واحدة
 *  منهم دايمًا الأحدث. */
function withSavedAt(data: RawAdminData): RawAdminData {
  return { ...data, savedAt: new Date().toISOString() };
}

function runGithubAndSupabasePush(data: RawAdminData): void {
  const source = getContentSource();
  const wantsSupabase = (source === 'supabase' || source === 'both') && isSupabaseConfigured && !!supabase;
  const wantsGithub = (source === 'github' || source === 'both') && isGithubConfigured();
  const stamped = withSavedAt(data);

  const tasks: Promise<boolean>[] = [];

  if (wantsSupabase) {
    tasks.push(
      supabase!.from(APP_DATA_TABLE).upsert({ id: APP_DATA_ROW_ID, data: stamped }).then(({ error }) => {
        notifySyncStatus({ ok: !error, source: 'supabase', message: error?.message });
        return !error;
      })
    );
  }
  if (wantsGithub) {
    // pushToGithub بنفسه بيدخل في طابور واحد للريبو (شوف githubStorage.ts)
    // فمفيش خطر تعارض حتى لو الحفظ التلقائي ده اشتغل في نفس اللحظة
    // اللي فيها المستخدم ضاغط "احفظ الآن" يدويًا.
    tasks.push(
      pushToGithub(stamped).then((result) => {
        if (!result.ok) console.error('[adminBridge] pushAppData (github, background) failed:', result.message);
        notifySyncStatus({ ok: result.ok, source: 'github', message: result.message });
        return result.ok;
      })
    );
  }

  if (tasks.length === 0) {
    // مفيش مصدر سحابي مفعّل خالص — مفيش حاجة نتزامن معاها، يبقى مفيش
    // خطر إن نسخة remote تمسح البيانات المحلية (مفيش remote أصلاً).
    markSyncConfirmed();
    return;
  }

  void Promise.all(tasks).then((results) => {
    // العلم بيتمسح بس لو كل المصادر المفعّلة نجحت فعلاً — لو أي واحد
    // فشل (زي GitHub Token غلط) بيفضل العلم موجود عشان نحمي البيانات
    // المحلية من أي نسخة remote قديمة لحد ما النشر ينجح فعلاً.
    if (results.every(Boolean)) markSyncConfirmed();
  });
}

/** يرفع نسخة جديدة من بيانات لوحة الإدارة (Supabase و/أو GitHub حسب مصدر المحتوى المختار)، مع debounce بسيط لتقليل الطلبات. */
export function pushAppData(data: RawAdminData): void {
  extendLocalWriteGuard();
  pendingPushData = data;
  if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
  pushDebounceTimer = setTimeout(() => {
    pushDebounceTimer = null;
    pendingPushData = null;
    runGithubAndSupabasePush(data);
  }, 200);
}

/**
 * يجبر أي حفظ معلّق (لسه مستني الـ debounce) يتنفذ فورًا من غير أي
 * تأخير. لازم تتنادى لما التطبيق هيقفل/يصغّر (background) أو الصفحة
 * هتتخبى، عشان آخر تعديل ميضيعش. آمنة تتنادى حتى لو مفيش حاجة معلّقة
 * أصلاً (no-op في الحالة دي).
 */
export function flushPendingPush(): void {
  if (!pendingPushData) return;
  extendLocalWriteGuard();
  if (pushDebounceTimer) { clearTimeout(pushDebounceTimer); pushDebounceTimer = null; }
  const data = pendingPushData;
  pendingPushData = null;
  runGithubAndSupabasePush(data);
}

/**
 * يرفع نسخة جديدة من بيانات لوحة الإدارة فورًا (من غير أي تأخير/debounce)
 * ويرجّع نتيجة حقيقية بنجاح العملية من عدمه — ده اللي بيستخدمه زرار
 * "حفظ الآن" في الإعدادات عشان يقدر يأكّد للأدمن إن كل حاجة اتحفظت
 * فعلاً بدل ما يفترض كده وهو مش متأكد.
 */
export async function pushAppDataNow(data: RawAdminData): Promise<{ ok: boolean; cloud: boolean; message?: string }> {
  extendLocalWriteGuard();
  if (pushDebounceTimer) { clearTimeout(pushDebounceTimer); pushDebounceTimer = null; }
  const source = getContentSource();
  const wantsSupabase = source === 'supabase' || source === 'both';
  const wantsGithub = source === 'github' || source === 'both';
  const stamped = withSavedAt(data);

  let supabaseOk: boolean | null = null;
  let supabaseMessage: string | undefined;
  let githubOk: boolean | null = null;
  let githubMessage: string | undefined;

  // نبني "مهمة" لكل مصدر مفعّل ونشغّلهم متوازيين (Promise.all) — مش
  // واحد بعد التاني. ده مهم جدًا في وضع "الاثنين مع بعض": لو شغّلناهم
  // بالتتابع، وقت الانتظار كان هيتضاعف (Supabase الأول، وبعدين GitHub).
  // بالتوازي، وقت الحفظ بيفضل تقريبًا نفس وقت أبطأ مصدر بس، مش مجموع الاتنين.
  const supabaseTask: Promise<void> = (async () => {
    if (!wantsSupabase || !isSupabaseConfigured || !supabase) return;
    // فحص وقائي: لو رفع أي ملف فشل (مفيش اتصال، أو bucket eduverse-media مش
    // منشأ بعد)، readFile في AdminDashboard.tsx بترجع لتشفير base64 محلي
    // بدل ما توقف — لكن ده بيخلي الصف المشترك ضخم جدًا (خصوصًا للفيديوهات)
    // ويفشل الحفظ برسالة سيرفر مش واضحة. نكتشف الحالة دي هنا ونديله رسالة
    // مفهومة بدل ما نسيب Supabase يرفض الطلب برسالة تقنية غامضة.
    let payloadSize = 0;
    try { payloadSize = new Blob([JSON.stringify(stamped)]).size; } catch { /* ignore */ }
    if (payloadSize > 3_000_000) {
      supabaseOk = false;
      supabaseMessage = `حجم البيانات كبير جدًا (${(payloadSize / 1_000_000).toFixed(1)}MB) — على الأغلب صورة أو فيديو اترفع بشكل محلي بدل السحابة (فشل رفع Storage). تأكد إن bucket "eduverse-media" وسياساته منشأة (شغّل 0004_media_storage.sql)، وإن اتصالك بالإنترنت شغال وقت الرفع، ثم أعد رفع أي ملف كبير.`;
      return;
    }
    try {
      const { error } = await supabase.from(APP_DATA_TABLE).upsert({ id: APP_DATA_ROW_ID, data: stamped });
      if (error) console.error('[adminBridge] pushAppDataNow (supabase) failed:', error.message, error);
      supabaseOk = !error;
      supabaseMessage = error?.message;
    } catch (e) {
      supabaseOk = false;
      supabaseMessage = e instanceof Error ? e.message : String(e);
      console.error('[adminBridge] pushAppDataNow (supabase) exception:', e);
    }
  })();

  const githubTask: Promise<void> = (async () => {
    if (!wantsGithub) return;
    const result = await pushToGithub(stamped);
    githubOk = result.ok;
    githubMessage = result.message;
    if (!result.ok) console.error('[adminBridge] pushAppDataNow (github) failed:', result.message);
  })();

  await Promise.all([supabaseTask, githubTask]);

  if (!wantsSupabase && !wantsGithub) {
    // مفيش مصدر سحابي مفعّل خالص (نادر) — الحفظ محلي بس، زي وضع العرض التوضيحي.
    return { ok: true, cloud: false };
  }

  const anyCloudAttempted = supabaseOk !== null || githubOk !== null;
  const allOk = (supabaseOk === null || supabaseOk) && (githubOk === null || githubOk);
  const message = [
    supabaseOk === false ? `Supabase: ${supabaseMessage}` : null,
    githubOk === false ? `GitHub: ${githubMessage}` : null,
  ].filter(Boolean).join(' | ') || undefined;

  // نفس مبدأ runGithubAndSupabasePush: العلم بيتمسح بس لو كل مصدر مفعّل
  // نجح فعلاً — عشان "حفظ الآن" يديله نفس الحماية الحقيقية بتاعة الحفظ
  // التلقائي، مش بس تأكيد بصري للأدمن وهو النسخة المحلية لسه مش متزامنة.
  if (allOk) markSyncConfirmed();

  return { ok: allOk, cloud: anyCloudAttempted, message };
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

  const applyRemote = (remote: RawAdminData | null) => {
    if (!remote) return;
    // في نافذة حماية بعد كتابة محلية حديثة — النسخة البعيدة دي ممكن
    // تكون وصلت متأخرة (سباق شبكة) وتمثل حالة أقدم من اللي على الشاشة
    // فعلاً؛ نرفض نطبّقها ونسيب البيانات المحلية زي ما هي.
    if (isLocalWriteGuardActive()) return;
    writeAdminDataCache(remote);
    notifyAdminDataChanged();
  };

  pullRemoteAppData().then(async (remote) => {
    if (remote) { applyRemote(remote); return; }
    // مفيش اتصال بأي مصدر سحابي مفعّل (أو لسه مفيش بيانات منشورة) — كملاذ
    // أخير، لو مفيش أي بيانات محلية أصلاً على الجهاز ده، نجرّب نقرأ من ملف
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

  // Supabase Realtime: بيوصّل التغييرات فورًا لما يكون في بيانات فعلية على
  // Supabase (بغض النظر عن "مصدر المحتوى" المحلي بتاع الجهاز ده — انظر
  // شرح الباگ اللي تم إصلاحه فوق pullRemoteAppData).
  if (isSupabaseConfigured && supabase) {
    supabase
      .channel('app-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: APP_DATA_TABLE }, () => {
        pullRemoteAppData().then(applyRemote);
      })
      .subscribe();
  }

  // GitHub مفيهوش آلية realtime مجانية زي Supabase — بنعمل polling بسيط
  // بدل كده. كل 10 ثوانٍ، لو GitHub متاح (owner/repo موجودين) وSupabase
  // مش هو مصدر البيانات الحالي فعليًا (يعني آخر سحب ناجح كان من GitHub،
  // أو Supabase مش متصل أصلاً)، بنقرا ملف content.json من جديد ونحدّث
  // بس لو فعلاً اتغيّر. ملحوظة: بنعتمد على `lastPullSource` (نتيجة آخر
  // pullRemoteAppData فعلي) بدل "مصدر المحتوى" المحلي، عشان الـ polling
  // يشتغل حتى لو الجهاز ده أصلاً مفتحش شاشة الإعدادات ومحفوظ عنده القيمة
  // الافتراضية supabase.
  let lastGithubSnapshot = '';
  setInterval(() => {
    if (!isGithubConfigured()) return;
    if (isSupabaseConfigured && lastPullSource === 'supabase') return; // Realtime بيتكفّل بيها بالفعل
    pullFromGithubRaw<RawAdminData>().then((remote) => {
      if (!remote) return;
      const snapshot = JSON.stringify(remote);
      if (snapshot === lastGithubSnapshot) return; // مفيش تغيير فعلي
      lastGithubSnapshot = snapshot;
      lastPullSource = 'github';
      applyRemote(remote);
    });
  }, 10_000);
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
      poster_url: c.posterUrl || null,
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

/**
 * يرجّع عناصر "مكتبة المواد الدراسية" (معرض الكورسات في الصفحة الرئيسية)
 * بنفس الشكل اللي بيفهمه CircularGallery (GalleryItem)، بعد استبعاد
 * المحذوف وترتيبها حسب displayOrder. لو الأدمن لسه ما ضافش أي كورس على
 * الإطلاق، بترجع مصفوفة فاضية — والـ hook اللي بيستخدمها (useGalleryCourses)
 * هو اللي بيقرر يرجع للكورسات التجريبية الثابتة بدل كده.
 */
export function getBridgedCourses(): RawGalleryCourse[] {
  const data = readAdminData();
  if (!data?.courses) return [];
  return data.courses
    .filter((c) => !c.isDeleted)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** يرجّع اسم التطبيق وأيقونته الخارجية كما ضبطهما الأدمن من الإعدادات (لو موجودين). */
export function getBridgedBranding(): { appName?: string; appIconUrl?: string } {
  const data = readAdminData();
  return { appName: data?.appName, appIconUrl: data?.appIconUrl };
}

/** يرجّع تعديلات الأدمن على نصوص وصور الموقع (تبويب "نصوص والصور")،
 *  فاضية لو الأدمن لسه ما عدّلش أي حاجة — راجع useSiteContent.ts. */
export function getBridgedSiteContent(): { texts: Record<string, string>; images: Record<string, string> } {
  const data = readAdminData();
  return { texts: data?.siteTexts || {}, images: data?.siteImages || {} };
}

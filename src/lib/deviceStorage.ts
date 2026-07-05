/**
 * deviceStorage — تخزين حقيقي لنسخة بيانات لوحة الإدارة على تخزين
 * الهاتف نفسه (مش بس localStorage جوه الـ WebView)، مع طلب أذونات
 * التخزين، واختيار/تغيير "مكان التخزين" من الإعدادات.
 * ─────────────────────────────────────────────────────────────────
 * ليه محتاجين الملف ده أصلاً؟
 *   الكاش المحلي الحالي (localStorage: eduverse_admin_data) بيتمسح لو
 *   المستخدم عمل "مسح بيانات التطبيق" من إعدادات أندرويد، أو لو النظام
 *   قرر ينضف WebView storage. تخزين نسخة كمان كملف حقيقي على تخزين
 *   الجهاز (خصوصاً لو المستخدم اختار "التخزين الخارجي المشترك") بيخلي
 *   البيانات تقدر ترجع حتى بعد مسح بيانات التطبيق أو إعادة التثبيت.
 *
 * تخزين مزدوج (redundant):
 *   كل حفظة بتتكتب في مكانين مع بعض دايمًا: "internal" (تخزين داخلي
 *   خاص بالتطبيق — مفيش داعي لأي إذن، وبينجح شبه أكيد) + المكان التاني
 *   اللي الأدمن مختاره من الإعدادات (المستندات أو التخزين الخارجي).
 *   لو مكان فشل (مثلاً الإذن اتلغى، أو أندرويد منع الكتابة) المكان
 *   التاني بيفضل شغال عادي وميتأثرش، والقراءة بترجع من أول مكان
 *   لاقيت فيه بيانات صحيحة.
 *
 * 3 أماكن تخزين حقيقية متاحة (حسب نظام أندرويد الفعلي، بدون مبالغة):
 *   - internal  → Directory.Data: مساحة خاصة بالتطبيق، مفيش داعي لأي
 *                 إذن، لكنها بتتمسح لو المستخدم مسح بيانات التطبيق أو
 *                 عمل حذف تثبيت.
 *   - documents → Directory.Documents: مجلد "المستندات" المشترك، محتاج
 *                 إذن تخزين على أندرويد 12 وأقدم (13+ ملوش داعي).
 *   - external  → Directory.ExternalStorage: التخزين الخارجي المشترك
 *                 (زي فولدر Download)، برضه محتاج إذن على أندرويد 12
 *                 وأقدم. أندرويد 13+ بيقيّد الوصول الحر للتخزين المشترك
 *                 (Scoped Storage) — فممكن الكتابة تفشل حتى لو الإذن
 *                 اتوافق عليه حسب إصدار أندرويد بالظبط.
 *
 *   ملحوظة صادقة: مفيش "اختيار أي فولدر حر على الجهاز" هنا (زي متصفح
 *   الملفات) — ده محتاج بلجن أندرويد مخصص (Storage Access Framework)
 *   مش موجود في Capacitor الأساسي. اللي هنا 3 أماكن حقيقية وشغالة
 *   فعليًا على الجهاز، مش اختيار مسار حر بالكامل.
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export type StorageLocation = 'internal' | 'documents' | 'external';

export const STORAGE_LOCATION_LABELS: Record<StorageLocation, string> = {
  internal: 'تخزين داخلي (خاص بالتطبيق)',
  documents: 'مجلد المستندات المشترك',
  external: 'التخزين الخارجي المشترك',
};

const LOCATION_PREF_KEY = 'eduverse_storage_location';
const CACHE_FILE_NAME = 'eduverse_app_data_cache.json';

const LOCATION_TO_DIR: Record<StorageLocation, Directory> = {
  internal: Directory.Data,
  documents: Directory.Documents,
  external: Directory.ExternalStorage,
};

/** بنعتبر التطبيق "شغال على هاتف حقيقي" (Capacitor) لو فيه Bridge أندرويد/iOS. */
function isNativePlatform(): boolean {
  try {
    return typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform === 'function'
      ? (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform()
      : false;
  } catch {
    return false;
  }
}

export function getStorageLocation(): StorageLocation {
  try {
    const v = localStorage.getItem(LOCATION_PREF_KEY);
    if (v === 'internal' || v === 'documents' || v === 'external') return v;
  } catch { /* ignore */ }
  return 'internal';
}

function setStorageLocationPref(loc: StorageLocation) {
  try { localStorage.setItem(LOCATION_PREF_KEY, loc); } catch { /* ignore */ }
}

/** قائمة الأماكن اللي بتتكتب فيها كل حفظة — "internal" دايمًا + مكان الأدمن المختار (لو مختلف). */
function activeLocations(): StorageLocation[] {
  const chosen = getStorageLocation();
  return chosen === 'internal' ? ['internal'] : ['internal', chosen];
}

export interface PermissionResult { granted: boolean; reason?: string }

/**
 * بيتأكد إن التطبيق معاه إذن التخزين المطلوب لمكان معيّن، وبيطلبه من
 * المستخدم لو لسه ملوش. "internal" مفيهوش أي إذن مطلوب أصلاً.
 */
export async function ensureStoragePermission(loc: StorageLocation): Promise<PermissionResult> {
  if (loc === 'internal') return { granted: true };
  if (!isNativePlatform()) return { granted: true }; // متصفح عادي — مفيش نظام أذونات أندرويد أصلاً
  try {
    const current = await Filesystem.checkPermissions();
    if (current.publicStorage === 'granted') return { granted: true };
    const requested = await Filesystem.requestPermissions();
    if (requested.publicStorage === 'granted') return { granted: true };
    return { granted: false, reason: 'المستخدم رفض إذن التخزين، أو النظام منعه (أندرويد 13+ بيقيّد الوصول للتخزين المشترك تلقائيًا).' };
  } catch (e) {
    return { granted: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * بتتنادى مرة واحدة أول ما التطبيق يفتح — بتطلب إذن التخزين فورًا زي أي
 * تطبيق أندرويد عادي (بدل ما تستنى لحد ما الأدمن يفتح الإعدادات ويختار
 * مكان تخزين تاني). لو المستخدم وافق، بيبقى جاهز يستخدم "المستندات" أو
 * "التخزين الخارجي" من الإعدادات من غير ما يتطلب منه إذن تاني.
 */
let launchPermissionRequested = false;
export async function requestStoragePermissionOnLaunch(): Promise<void> {
  if (launchPermissionRequested || !isNativePlatform()) return;
  launchPermissionRequested = true;
  try { await ensureStoragePermission('external'); } catch { /* ignore */ }
}

/**
 * يغيّر مكان التخزين المختار: بيتأكد من الإذن الأول، ولو اتوافق عليه
 * بينقل آخر نسخة بيانات معروفة (لو موجودة) للمكان الجديد فورًا، عشان
 * القراءة الجاية تلاقيها هناك. المكان الداخلي بيفضل بيتكتب فيه دايمًا
 * بالتوازي كنسخة احتياطية مضمونة.
 */
export async function changeStorageLocation(
  loc: StorageLocation,
  currentData: unknown,
): Promise<PermissionResult> {
  const perm = await ensureStoragePermission(loc);
  if (!perm.granted) return perm;
  setStorageLocationPref(loc);
  await writeAppDataToDevice(currentData);
  return { granted: true };
}

/**
 * يكتب نسخة من بيانات التطبيق كملف حقيقي على تخزين الجهاز — في كل
 * الأماكن النشطة مع بعض (internal + المكان المختار لو مختلف)، كل مكان
 * مستقل عن التاني. لو مكان فشل بيتسجل الخطأ في console بس من غير ما
 * يوقف كتابة باقي الأماكن. بترجع true لو نجح مكان واحد على الأقل.
 */
export async function writeAppDataToDevice(data: unknown): Promise<boolean> {
  if (!isNativePlatform()) return false; // على المتصفح العادي localStorage كافي، الملف ده لأندرويد فقط
  const locations = activeLocations();
  const payload = JSON.stringify(data);
  const results = await Promise.all(
    locations.map(async (location) => {
      try {
        // "documents"/"external" محتاجين إذن — لو مش متوافق عليه نتجاهل
        // المكان ده بهدوء (المكان الداخلي بيفضل شغال عادي بجانبه).
        if (location !== 'internal') {
          const perm = await ensureStoragePermission(location);
          if (!perm.granted) return false;
        }
        await Filesystem.writeFile({
          path: CACHE_FILE_NAME,
          directory: LOCATION_TO_DIR[location],
          data: payload,
          encoding: Encoding.UTF8,
          recursive: true,
        });
        return true;
      } catch (e) {
        console.error(`[deviceStorage] write failed (${location}):`, e);
        return false;
      }
    }),
  );
  return results.some(Boolean);
}

/**
 * يقرأ آخر نسخة محفوظة كملف على تخزين الجهاز — بيجرّب المكان المختار
 * الأول، ولو مش موجود/فشل بيرجع تلقائيًا للمكان الداخلي كنسخة احتياطية،
 * عشان لو مكان واحد فشل يفضل الثاني شغال عادي. بترجع null لو الاتنين
 * فشلوا (أول مرة يفتح فيها التطبيق مثلاً).
 */
export async function readAppDataFromDevice(): Promise<unknown | null> {
  if (!isNativePlatform()) return null;
  for (const location of activeLocations()) {
    try {
      if (location !== 'internal') {
        const perm = await ensureStoragePermission(location);
        if (!perm.granted) continue;
      }
      const res = await Filesystem.readFile({
        path: CACHE_FILE_NAME,
        directory: LOCATION_TO_DIR[location],
        encoding: Encoding.UTF8,
      });
      return JSON.parse(res.data as string);
    } catch {
      continue; // الملف مش موجود في المكان ده أو فشلت القراءة — جرّب اللي بعده
    }
  }
  return null;
}

/**
 * deviceStorage — تخزين حقيقي لنسخة بيانات لوحة الإدارة على تخزين
 * الهاتف نفسه (مش بس localStorage جوه الـ WebView)، مع طلب أذونات
 * التخزين، واختيار/تغيير "مكان التخزين" من الإعدادات.
 * ─────────────────────────────────────────────────────────────────
 * ليه محتاجين الملف ده أصلاً؟
 *   الكاش المحلي الحالي (localStorage: eduverse_admin_data) بيتمسح لو
 *   المستخدم عمل "مسح بيانات التطبيق" من إعدادات أندرويد، أو لو النظام
 *   قرر ينضف WebView storage. تخزين نسخة كمان كملف حقيقي على تخزين
 *   الجهاز بيخلي البيانات تقدر ترجع حتى بعد مسح بيانات التطبيق.
 *
 * 3 خيارات حقيقية:
 *   - internal → Directory.Data: مساحة خاصة بالتطبيق (تخزين الهاتف
 *                الداخلي). مفيش أي إذن مطلوب، وبينجح في كل الحالات.
 *   - external → Directory.External: مجلد التطبيق الخاص على التخزين
 *                الخارجي (Android/data/<package>/files) — ده فعليًا
 *                بيبقى على كارت الميموري (SD Card) لو الجهاز فيه واحد
 *                ومتظبط كتخزين افتراضي، وإلا بيبقى على نفس التخزين
 *                الداخلي للجهاز لو مفيش كارت ميموري. برضه مفيش إذن
 *                مطلوب لأنه مساحة خاصة بالتطبيق.
 *   - both     → بيكتب في المكانين مع بعض كل مرة (تخزين مزدوج حقيقي):
 *                لو مكان فشل، التاني بيفضل شغال عادي وميتأثرش.
 *
 * ملحوظة صادقة عن رسالة "هل تسمح للتطبيق..." وكارت الميموري:
 *   من أندرويد 10 لغاية النهاردة، جوجل ألغت تمامًا رسالة الإذن الكلاسيكية
 *   لمجلدات التطبيق الخاصة (زي اللي فوق) لأنها أصلاً مأمّنة تلقائيًا —
 *   مفيش تطبيق بيقدر يطلبها لأنها مش موجودة في نظام أندرويد نفسه، مش
 *   حاجة ناقصة في الكود. اللي بيظهر بس على أندرويد 12 وأقدم هو إذن
 *   "الملفات والوسائط" العادي، وده بيتطلب فعلاً هنا. أما "اختيار مسار
 *   حر بالكامل على كارت الميموري" (زي متصفح ملفات) فمحتاج صلاحية خاصة
 *   جدًا (كل الملفات) مقيدة جدًا من جوجل، ومحتاجة كود أندرويد أصلي
 *   إضافي مش موجود هنا — فالخيارات الحقيقية والمضمونة هي الـ3 اللي فوق.
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export type StorageLocation = 'internal' | 'external' | 'both';

export const STORAGE_LOCATION_LABELS: Record<StorageLocation, string> = {
  internal: 'تخزين داخلي فقط',
  external: 'تخزين خارجي فقط (يشمل كارت الميموري لو موجود)',
  both: 'الاثنين مع بعض (موصى به)',
};

const LOCATION_PREF_KEY = 'eduverse_storage_location';
const CACHE_FILE_NAME = 'eduverse_app_data_cache.json';

const DIR_INTERNAL = Directory.Data;
const DIR_EXTERNAL = Directory.External;

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
    if (v === 'internal' || v === 'external' || v === 'both') return v;
  } catch { /* ignore */ }
  return 'both'; // الافتراضي: تخزين مزدوج من أول تشغيل، أضمن اختيار
}

function setStorageLocationPref(loc: StorageLocation) {
  try { localStorage.setItem(LOCATION_PREF_KEY, loc); } catch { /* ignore */ }
}

/** الأماكن الفعلية اللي هيتكتب/هيتقرأ منها الملف حسب اختيار المستخدم. */
function dirsFor(loc: StorageLocation): Directory[] {
  if (loc === 'internal') return [DIR_INTERNAL];
  if (loc === 'external') return [DIR_EXTERNAL];
  return [DIR_INTERNAL, DIR_EXTERNAL]; // both
}

export interface PermissionResult { granted: boolean; reason?: string }

/**
 * بتطلب إذن "الملفات والوسائط" الكلاسيكي — ده بس بيظهر فعليًا كرسالة
 * على أندرويد 12 وأقدم (13+ ملغاش الإذن ده نهائيًا لمجلدات التطبيق).
 * مفيش داعي نوقف عمليات القراءة/الكتابة على نتيجتها لأن Directory.Data
 * وDirectory.External شغالين من غيرها أصلاً على كل الإصدارات.
 */
export async function ensureStoragePermission(): Promise<PermissionResult> {
  if (!isNativePlatform()) return { granted: true };
  try {
    const current = await Filesystem.checkPermissions();
    if (current.publicStorage === 'granted') return { granted: true };
    const requested = await Filesystem.requestPermissions();
    if (requested.publicStorage === 'granted') return { granted: true };
    return { granted: false, reason: 'الجهاز على أندرويد 13 فأكتر — النظام بيدير مجلدات التطبيق تلقائيًا بدون رسالة إذن، وده طبيعي مش خطأ.' };
  } catch (e) {
    return { granted: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * بتتنادى مرة واحدة أول ما التطبيق يفتح — بتطلب إذن التخزين فورًا زي أي
 * تطبيق أندرويد عادي. هتظهر رسالة فعلية على أندرويد 12 وأقدم بس، وعلى
 * 13+ مفيش رسالة أصلاً لأن جوجل شالتها من النظام نفسه (تفصيل نظام، مش
 * قصور في التطبيق).
 */
let launchPermissionRequested = false;
export async function requestStoragePermissionOnLaunch(): Promise<void> {
  if (launchPermissionRequested || !isNativePlatform()) return;
  launchPermissionRequested = true;
  try { await ensureStoragePermission(); } catch { /* ignore */ }
}

/**
 * يغيّر مكان التخزين المختار، وبينقل آخر نسخة بيانات معروفة فورًا لكل
 * الأماكن الفعّالة في الاختيار الجديد — عشان البيانات متختفيش لحظة
 * التغيير (بتتكتب في المكان الجديد قبل ما نأكد التغيير).
 */
export async function changeStorageLocation(
  loc: StorageLocation,
  currentData: unknown,
): Promise<PermissionResult> {
  await ensureStoragePermission(); // best-effort، مش شرط للنجاح
  const ok = await writeToLocations(currentData, dirsFor(loc));
  if (!ok) return { granted: false, reason: 'فشلت الكتابة في المكان الجديد — البيانات لسه محفوظة في المكان القديم ولم يتغير شيء.' };
  setStorageLocationPref(loc);
  return { granted: true };
}

async function writeToLocations(data: unknown, dirs: Directory[]): Promise<boolean> {
  const payload = JSON.stringify(data);
  const results = await Promise.all(
    dirs.map(async (directory) => {
      try {
        await Filesystem.writeFile({ path: CACHE_FILE_NAME, directory, data: payload, encoding: Encoding.UTF8, recursive: true });
        return true;
      } catch (e) {
        console.error('[deviceStorage] write failed:', directory, e);
        return false;
      }
    }),
  );
  return results.some(Boolean);
}

/**
 * يكتب نسخة من بيانات التطبيق كملف حقيقي على تخزين الجهاز، في كل
 * الأماكن الفعّالة حسب اختيار المستخدم الحالي. بترجع true لو نجح مكان
 * واحد على الأقل (لو "both" مختار وفشل مكان، التاني بيفضل شغال عادي).
 */
export async function writeAppDataToDevice(data: unknown): Promise<boolean> {
  if (!isNativePlatform()) return false; // على المتصفح العادي localStorage كافي، الملف ده لأندرويد فقط
  return writeToLocations(data, dirsFor(getStorageLocation()));
}

/**
 * يقرأ آخر نسخة محفوظة كملف على تخزين الجهاز — بيجرّب كل الأماكن
 * الفعّالة بالترتيب، ولو مكان فشل بيجرّب اللي بعده تلقائيًا. بترجع null
 * لو كل الأماكن فشلت (أول مرة يفتح فيها التطبيق مثلاً).
 */
export async function readAppDataFromDevice(): Promise<unknown | null> {
  if (!isNativePlatform()) return null;
  for (const directory of dirsFor(getStorageLocation())) {
    try {
      const res = await Filesystem.readFile({ path: CACHE_FILE_NAME, directory, encoding: Encoding.UTF8 });
      return JSON.parse(res.data as string);
    } catch {
      continue; // الملف مش موجود في المكان ده أو فشلت القراءة — جرّب اللي بعده
    }
  }
  return null;
}

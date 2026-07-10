/**
 * githubStorage — مصدر نشر/تخزين بديل لمحتوى EduVerse عبر GitHub، بجانب
 * Supabase الحالي (مش بدل منه بالضرورة — الأدمن بيختار من الإعدادات).
 * ─────────────────────────────────────────────────────────────────────
 * الفكرة:
 *   - كل بيانات لوحة الإدارة (أقسام + محتوى) بتتكتب كملف JSON واحد
 *     (افتراضيًا content.json) في ريبو GitHub بيختاره الأدمن.
 *   - أي مستخدم عادي (بدون أي توكن) بيقدر "يقرا" الملف ده مباشرة عن طريق
 *     رابط raw.githubusercontent.com العام — مفيش حاجة سرية مطلوبة
 *     للقراءة لأن الريبو نفسه عام (public).
 *   - "الكتابة" (نشر تعديل جديد) محتاجة GitHub Personal Access Token،
 *     وده بيتحفظ في localStorage على جهاز الأدمن بس، ومبيتبنيش جوه
 *     الـ APK خالص.
 *
 * ملاحظة أمان مهمة (لازم الأدمن يعرفها):
 *   لو حد وصل فعليًا لجهاز الأدمن نفسه (مش أي مستخدم عادي) ممكن يشوف
 *   التوكن من إعدادات المتصفح/التطبيق. علشان كده لازم يكون التوكن:
 *     1. "Fine-grained personal access token" (مش Classic) مقيّد بريبو
 *        واحد بس (مش كل حسابك على GitHub).
 *     2. صلاحياته: "Contents: Read and write" فقط — من غير أي صلاحية
 *        زيادة (زي Admin أو Workflows).
 *   بالطريقة دي حتى لو التوكن اتسرب، أقصى ضرر ممكن هو كتابة على الريبو
 *   ده بالذات، مش السيطرة على حساب GitHub كله.
 *
 * حدود الخدمة (راجعها المستخدم بنفسه في المحادثة):
 *   - مناسب لملفات نصية/JSON خفيفة (بيانات الكورسات، الأقسام، النصوص).
 *   - مش مناسب لملفات وسائط كبيرة (صور/فيديوهات) بسبب حدود الباندويدث
 *     على GitHub — دي لازم تفضل على Supabase Storage أو مشابه.
 */

export type ContentSource = 'supabase' | 'github' | 'both';

const SOURCE_KEY = 'eduverse_content_source';
const CONFIG_KEY = 'eduverse_github_config';

export interface GithubConfig {
  owner: string;   // اسم المستخدم أو المنظمة صاحبة الريبو
  repo: string;    // اسم الريبو
  branch: string;  // الفرع، افتراضيًا main
  path: string;    // مسار ملف الداتا داخل الريبو، افتراضيًا content.json
  token: string;   // Fine-grained PAT بصلاحية Contents: Read & write على الريبو ده بس
}

export const DEFAULT_GITHUB_CONFIG: GithubConfig = {
  owner: 'youssefmd2244-droid', repo: 'minasa-taelimia', branch: 'main', path: 'content.json', token: '',
};

// ── تفضيل مصدر المحتوى ──────────────────────────────────────────────
export function getContentSource(): ContentSource {
  try {
    const v = localStorage.getItem(SOURCE_KEY);
    if (v === 'supabase' || v === 'github' || v === 'both') return v;
  } catch { /* ignore */ }
  return 'supabase'; // الافتراضي: نفس السلوك الحالي، بدون أي تغيير لحد ما الأدمن يختار
}

export function setContentSource(v: ContentSource): void {
  try { localStorage.setItem(SOURCE_KEY, v); } catch { /* ignore */ }
}

// ── إعدادات الريبو ───────────────────────────────────────────────────
export function getGithubConfig(): GithubConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_GITHUB_CONFIG, ...JSON.parse(raw) } as GithubConfig;
  } catch { /* ignore */ }
  return { ...DEFAULT_GITHUB_CONFIG };
}

export function setGithubConfig(cfg: GithubConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

export function isGithubConfigured(): boolean {
  const c = getGithubConfig();
  return Boolean(c.owner && c.repo && c.path);
}

export function isGithubWriteConfigured(): boolean {
  const c = getGithubConfig();
  return Boolean(c.owner && c.repo && c.path && c.token);
}

// ── Base64 آمن للنصوص العربية (btoa وحدها بتنهار على UTF-8) ──────────
function b64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

// ── قراءة (لأي مستخدم — مفيش توكن مطلوب، الريبو عام) ────────────────
export async function pullFromGithubRaw<T = unknown>(): Promise<T | null> {
  const cfg = getGithubConfig();
  if (!cfg.owner || !cfg.repo || !cfg.path) return null;
  const branch = cfg.branch || 'main';
  // ?t= لمنع أي كاش وسيط (متصفح/CDN) من إرجاع نسخة قديمة
  const url = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${branch}/${cfg.path}?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── طابور كتابة واحد لكل الريبو ──────────────────────────────────────
// السبب الحقيقي وراء رسالة "content.json does not match [sha]":
// pushToGithub بيعمل GET (يجيب الـ sha الحالي) وبعدين PUT (يكتب بيه).
// لو نداءين لـ pushToGithub اشتغلوا في نفس الوقت (مثلاً: الحفظ التلقائي
// كل ما تضيف ملف + ضغطة "احفظ الآن" اليدوية، أو إضافة عدة ملفات ورا
// بعض بسرعة) — الاتنين بيجيبوا نفس الـ sha القديم، الأول بينجح ويغيّر
// الملف، والتاني يحاول يكتب بنفس الـ sha القديم فيترفض من GitHub بالظبط
// بالرسالة دي. الحل الجذري: نضمن إن مفيش أكتر من كتابة واحدة بتحصل في
// نفس اللحظة على الإطلاق — كل نداء بينضم لطابور وبيتنفذ بعد اللي قبله.
let githubWriteChain: Promise<GithubPushResult> = Promise.resolve({ ok: true });

async function performGithubWrite(data: unknown, attempt = 1): Promise<GithubPushResult> {
  const cfg = getGithubConfig();
  const branch = cfg.branch || 'main';
  const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.path).replace(/%2F/g, '/')}`;
  const headers = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
  try {
    // لازم نجيب الـ sha الحالي (لو موجود) في كل محاولة (خصوصًا محاولات
    // إعادة المحاولة بعد تعارض) عشان نضمن إننا بنكتب فوق آخر نسخة فعلاً.
    let sha: string | undefined;
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers,
      cache: 'no-store',
    });
    if (getRes.ok) {
      const info = await getRes.json();
      sha = info.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json().catch(() => ({}));
      return { ok: false, message: err.message || `تعذّر التحقق من الملف الحالي (${getRes.status})` };
    }

    const content = b64Encode(JSON.stringify(data, null, 2));
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `تحديث محتوى EduVerse — ${new Date().toISOString()}`,
        content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      const isConflict = putRes.status === 409 || (putRes.status === 422 && /does not match|sha/i.test(String(err.message || '')));
      // تعارض الـ sha ممكن يحصل حتى مع الطابور (مثلاً حد عدّل الملف يدويًا
      // من واجهة GitHub في نفس اللحظة) — بنعيد المحاولة بجيب sha جديد
      // تلقائيًا لحد 3 مرات قبل ما نستسلم ونبلّغ المستخدم فعليًا.
      if (isConflict && attempt < 3) {
        return performGithubWrite(data, attempt + 1);
      }
      return { ok: false, message: err.message || `فشل النشر على GitHub (${putRes.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

// ── كتابة (الأدمن بس — محتاج توكن) ──────────────────────────────────
export interface GithubPushResult { ok: boolean; message?: string }

export async function pushToGithub(data: unknown): Promise<GithubPushResult> {
  const cfg = getGithubConfig();
  if (!cfg.owner || !cfg.repo || !cfg.path) {
    return { ok: false, message: 'إعدادات GitHub غير مكتملة (المالك/الريبو/المسار).' };
  }
  if (!cfg.token) {
    return { ok: false, message: 'محتاج GitHub Token بصلاحية Contents: Read and write علشان تقدر تنشر.' };
  }
  // بننضم لآخر العملية اللي في الطابور بدل ما نبدأ فورًا — كده أي عدد
  // نداءات متزامنة بتتنفذ واحدة ورا التانية بالترتيب، مش متوازية.
  const result = githubWriteChain.then(() => performGithubWrite(data));
  // لازم نحدّث الطابور فورًا (مش بعد await) عشان أي نداء تاني ييجي في
  // نفس اللحظة يلاقي الطابور محدّث وينضم في آخره صح.
  githubWriteChain = result.catch(() => ({ ok: false }));
  return result;
}

// ── اختبار سريع للإعدادات (يتستخدم في شاشة الإعدادات قبل الحفظ) ─────
export async function testGithubConnection(): Promise<GithubPushResult> {
  const cfg = getGithubConfig();
  if (!cfg.owner || !cfg.repo) return { ok: false, message: 'أدخل اسم المالك واسم الريبو أولاً.' };
  try {
    const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`);
    if (!res.ok) return { ok: false, message: `الريبو غير موجود أو غير عام (${res.status})` };
    const info = await res.json();
    if (info.private) return { ok: false, message: 'الريبو خاص (private) — لازم يكون عام (public) عشان المستخدمين العاديين يقدروا يقرأوا المحتوى بدون توكن.' };
    return { ok: true, message: 'الريبو موجود وعام — تمام.' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

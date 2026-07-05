/**
 * videoThumbnail — يولّد صورة مصغّرة (poster) حقيقية من فيديو محلي، قبل
 * ما يترفع، عشان تتخزن كملف صورة منفصل على Supabase Storage.
 * ─────────────────────────────────────────────────────────────────
 * ليه محتاجين الملف ده أصلاً؟
 *   الطريقة القديمة كانت تعتمد على إن كل متصفح عند كل مستخدم شايف
 *   الفيديو يحاول يلقط أول فريم بنفسه وقت المشاهدة (canvas capture حي).
 *   ده كان بيفشل بصمت كتير جدًا في الواقع لسببين:
 *     1) `preload="metadata"` — كتير من متصفحات الموبايل (خصوصًا في وضع
 *        توفير البيانات أو شبكة موبايل) مش بتحمّل ولا فريم واحد فعليًا
 *        غير لما المستخدم يدوس تشغيل بنفسه.
 *     2) `crossOrigin="anonymous"` — أي تعارض بسيط في رفض الطلب من
 *        السيرفر بيخلي محاولة السحب على الـ canvas تفشل (SecurityError)
 *        وتتلقط في catch فاضي.
 *   النتيجة: صورة سودة ثابتة تظهر لكل المستخدمين لحد ما يدوسوا تشغيل.
 *
 * الحل: نولّد الصورة **مرة واحدة بس وقت الرفع نفسه**، من الملف المحلي
 * (blob: من نفس المصدر تمامًا — مفيش أي مشكلة CORS هنا لأنه لسه على
 * جهاز الأدمن قبل ما يترفع خالص)، ونرفعها كصورة حقيقية جنب الفيديو.
 * كده كل المستخدمين ياخدوا نفس الصورة الجاهزة فورًا من غير ما يعتمدوا
 * على تحميل أي جزء من الفيديو نفسه أصلاً.
 */
export async function captureVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    let settled = false;
    let objectUrl: string | null = null;
    let video: HTMLVideoElement | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (video) {
        video.removeAttribute('src');
        video.load();
      }
    };
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(blob);
    };

    try {
      objectUrl = URL.createObjectURL(file);
      video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = objectUrl;

      // لو الملف اتعمله corrupt أو مش نوع فيديو حقيقي مدعوم، أو أي سبب
      // تاني خلّى التحميل يعلّق، منسيبش عملية الرفع كلها واقفة تستنى.
      timeoutId = setTimeout(() => finish(null), 8000);

      video.addEventListener('error', () => finish(null));

      video.addEventListener('loadedmetadata', () => {
        if (!video) return;
        // بنلقط فريم من ثانية قصيرة (مش أول فريم بالظبط، لأنه غالبًا
        // بيبقى أسود/فاضي في أغلب الفيديوهات) — أو ربع مدة الفيديو لو
        // كان قصير جدًا.
        const seekTo = Math.min(0.3, (video.duration || 0) / 4 || 0);
        try {
          video.currentTime = seekTo;
        } catch {
          // بعض المتصفحات محتاجة تستنى الفريم الأول تلقائيًا بدل seek يدوي
        }
      });

      video.addEventListener('seeked', () => {
        if (!video) return finish(null);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (!ctx || !canvas.width || !canvas.height) return finish(null);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.72);
        } catch {
          // فشل السحب (نادر جدًا هنا لأن المصدر blob محلي مش بعيد) — نتجاهل بهدوء
          finish(null);
        }
      });

      video.load();
    } catch {
      finish(null);
    }
  });
}

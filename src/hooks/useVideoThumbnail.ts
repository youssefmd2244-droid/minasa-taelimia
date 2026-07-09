import { useEffect, useState } from 'react';

/**
 * useVideoThumbnail — بيلتقط أول فريم حقيقي من الفيديو ويرجّعه كصورة.
 * ─────────────────────────────────────────────────────────────────
 * ده fallback بس لفيديوهات قديمة اتضافت قبل ميزة poster_url (صورة
 * الغلاف اللي بتترفع مع الفيديو نفسه وقت الرفع). أي فيديو معاه
 * poster_url مش بيستخدم الهوك ده خالص (مرّر src بـ null عشان توقفه).
 *
 * ليه كان بيظهر أسود قبل كده: كنا بنعمل الفيديو بـ
 * `document.createElement('video')` من غير ما نحطه فعليًا جوه الصفحة
 * (DOM). متصفحات الموبايل (خصوصًا WebView بتاع تطبيق أندرويد المبني
 * بـ Capacitor) بترفض تحمّل أي بيانات فيديو لعنصر مش متصل بالصفحة
 * فعليًا — توفير للبيانات/الباتري — فحدث 'loadeddata' مكانش بيحصل
 * خالص، والصورة المصغّرة فضلت فاضية للأبد.
 * الحل: نضيف الفيديو فعليًا جوه الصفحة (مخفي تمامًا بـ 1px بعيد عن
 * الشاشة) عشان يتحمّل زي أي فيديو عادي، ونجرب `play()` (مكتوم الصوت،
 * فمسموح تلقائيًا) عشان نضمن فك أول فريم فعليًا حتى لو `loadeddata`
 * لوحدها مش كافية على بعض الأجهزة، وبعدين نلقط الفريم ونشيل العنصر.
 */
export function useVideoThumbnail(src: string | null | undefined): string | null {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!src) { setThumb(null); return; }
    let cancelled = false;
    let captured = false;

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    video.src = src;

    const capture = () => {
      if (captured || cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width && canvas.height) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          captured = true;
          setThumb(canvas.toDataURL('image/jpeg', 0.6));
          video.pause();
        }
      } catch {
        // فشل الالتقاط (مثلاً CORS) — تفضل الأيقونة الافتراضية بدل الصورة
      }
    };

    const onLoadedData = () => {
      // نحاول نشغّله لحظة عشان نضمن فك الفريم فعليًا (بعض متصفحات
      // الموبايل مش بترسم أي فريم إلا بعد play() حقيقي)، ثم نوقفه فورًا.
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { requestAnimationFrame(capture); }).catch(() => { capture(); });
      } else {
        requestAnimationFrame(capture);
      }
    };
    const onTimeUpdate = () => capture();
    const onError = () => { /* هيبان بالأيقونة الافتراضية بدل الصورة */ };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onError);
    document.body.appendChild(video);
    video.load();

    return () => {
      cancelled = true;
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onError);
      try { video.pause(); } catch { /* ignore */ }
      video.src = '';
      video.remove();
    };
  }, [src]);

  return thumb;
}

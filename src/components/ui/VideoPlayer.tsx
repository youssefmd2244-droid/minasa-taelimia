/**
 * VideoPlayer — مشغّل فيديو بيضيف فوق الكنترولز العادية:
 *   1) زرار "ملء الشاشة" — بيشتغل بالـ Fullscreen API، ومعاه fallback
 *      لـ iOS Safari (اللي محتاج `webkitEnterFullscreen` على عنصر
 *      الفيديو نفسه مش الحاوية).
 *   2) زرار "تصغير/عائم" — بيحوّل الفيديو لنافذة صغيرة عائمة فوق باقي
 *      الشاشة (زي وضع الصورة داخل الصورة) عشان يفضل شغال وانت بتشوف
 *      أي حاجة تانية في الصفحة أو التطبيق. الفيديو نفسه (عنصر <video>)
 *      بيفضل هو هو من غير ما يتقفل أو يعيد التحميل — بس بنغيّر مكانه
 *      وحجمه بالـ CSS فقط، فالتشغيل ما بيتوقفش. لو الأب (مثلاً نافذة
 *      عرض المحتوى) عايز يفسح المكان فعليًا عشان تقدر تستخدم باقي
 *      التطبيق وانت بتفرج، يقدر ياخد `onFloatingChange` ويشيل الخلفية
 *      المعتمة بتاعته وقت ما الفيديو يبقى عائم.
 *   3) في وضع العائم: زرار "تكبير" يرجّعه لمكانه الطبيعي، وزرار
 *      "إغلاق" يقفل الوضع العائم ويوقف الفيديو (وينده onCloseFloating
 *      لو موجودة عشان يقفل أي نافذة عرض حاضنة كمان).
 *   4) الأزرار دي متحطوطة فوق — في أعلى الفيديو — مش تحت جمب كنترولز
 *      الفيديو الأصلية. قبل كده كانت متحطوطة تحت (bottom: 44px) وده
 *      كان بيخليها تتراكب فعليًا مع شريط تحكم الفيديو الأصلي بتاع
 *      نظام أندرويد (اللي بيرسمه الـ WebView فوق كل حاجة بغض النظر عن
 *      z-index)، فكان لمس الزرار أحيانًا بيروح لشريط التحكم الأصلي
 *      بدل الزرار — يعني الزرار "موجود بس مش شغال صح". دلوقتي مفيش
 *      أي تراكب خالص لأنهم في أعلى الفيديو وشريط التحكم الأصلي في
 *      أسفله.
 *   5) بنحاول نولّد صورة مصغّرة (poster) تلقائيًا من أول فريم في
 *      الفيديو لو محدش مرّر poster جاهزة، عشان الفيديو ميظهرش مربّع
 *      أسود فاضي قبل ما تشغّله.
 *
 * ملحوظة مهمة عن `crossOrigin`: العنصر ده متعمّدش يحطّها على تشغيل
 * الفيديو نفسه. لو تخزين الملفات (Supabase Storage) مش مضبّط عليه
 * رؤوس CORS (Access-Control-Allow-Origin) بالظبط، متصفح المستخدم
 * (خصوصًا خارج جهاز الأدمن) بيرفض الاستجابة بالكامل لما يلاقي
 * `crossorigin="anonymous"` من غير رأس CORS مناسب — فيظهر الفيديو
 * أسود تمامًا وكأنه مش موجود. عشان كده الالتقاط التلقائي للفريم
 * (autoPoster) بيتم من غير ما نأثر على عنصر الفيديو الأساسي.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  borderRadius?: string;
  maxHeight?: string;
  /** بينده لما وضع العائم يتفعّل/يتلغي — يُستخدم لتفريغ خلفية أي نافذة حاضنة */
  onFloatingChange?: (floating: boolean) => void;
  /** بينده لما المستخدم يقفل الفيديو وهو في وضع عائم — لقفل أي نافذة حاضنة بالكامل */
  onCloseFloating?: () => void;
}

const btnStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.65)',
  border: '1px solid rgba(255,255,255,0.22)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
};

export default function VideoPlayer({ src, poster, autoPlay, borderRadius = '14px', maxHeight = '60vh', onFloatingChange, onCloseFloating }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  const [autoPoster, setAutoPoster] = useState<string | undefined>(undefined);

  // لو محدش مرّر poster، بنولّد واحدة من أول فريم في الفيديو نفسه
  // (بمجرد ما البيانات تحمّل) عشان الفيديو ميظهرش أسود فاضي.
  useEffect(() => {
    if (poster) return;
    const video = videoRef.current;
    if (!video) return;
    const captureFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width && canvas.height) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setAutoPoster(canvas.toDataURL('image/jpeg', 0.65));
        }
      } catch {
        // فشل التقاط الفريم (مثلاً CORS) — نتجاهل بهدوء ونسيب الفيديو من غير poster
      }
    };
    video.addEventListener('loadeddata', captureFrame, { once: true });
    return () => video.removeEventListener('loadeddata', captureFrame);
  }, [poster, src]);

  const enterFullscreen = useCallback(() => {
    const container = containerRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (container?.requestFullscreen) {
      container.requestFullscreen().catch(() => {
        // لو الحاوية رفضت (بعض متصفحات الموبايل)، جرّب الفيديو مباشرة
        video?.webkitEnterFullscreen?.();
      });
    } else if (container?.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (video?.webkitEnterFullscreen) {
      // iOS Safari — ملء الشاشة على عنصر الفيديو نفسه بس
      video.webkitEnterFullscreen();
    }
  }, []);

  const enterFloating = useCallback(() => {
    setFloating(true);
    onFloatingChange?.(true);
  }, [onFloatingChange]);

  const exitFloating = useCallback(() => {
    setFloating(false);
    onFloatingChange?.(false);
  }, [onFloatingChange]);

  const closeFloating = useCallback(() => {
    setFloating(false);
    onFloatingChange?.(false);
    videoRef.current?.pause();
    onCloseFloating?.();
  }, [onFloatingChange, onCloseFloating]);

  return (
    <div
      ref={containerRef}
      style={
        floating
          ? {
              position: 'fixed',
              bottom: '18px',
              insetInlineEnd: '18px',
              width: 'min(46vw, 220px)',
              aspectRatio: '16 / 9',
              zIndex: 99999,
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#000',
              boxShadow: '0 10px 34px rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.12)',
              pointerEvents: 'auto',
            }
          : { position: 'relative', width: '100%', borderRadius, overflow: 'hidden', background: '#000' }
      }
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || autoPoster}
        controls
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        style={{
          width: '100%',
          height: floating ? '100%' : undefined,
          maxHeight: floating ? undefined : maxHeight,
          objectFit: floating ? 'cover' : 'contain',
          display: 'block',
        }}
      />
      {/* أزرار التحكم الإضافية — في أعلى الفيديو، بعيد تمامًا عن شريط
          التحكم الأصلي اللي في الأسفل، عشان اللمس ميروحش له بالغلط */}
      <div style={{ position: 'absolute', top: '8px', insetInlineEnd: '8px', display: 'flex', gap: '6px', zIndex: 5 }}>
        {!floating && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); enterFullscreen(); }}
              title="ملء الشاشة" aria-label="ملء الشاشة" style={{ ...btnStyle, touchAction: 'manipulation' }}
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); enterFloating(); }}
              title="تصغير — نافذة عائمة" aria-label="تصغير — نافذة عائمة" style={{ ...btnStyle, touchAction: 'manipulation' }}
            >
              <Minimize2 size={14} />
            </button>
          </>
        )}
        {floating && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); exitFloating(); }}
              title="تكبير" aria-label="تكبير" style={{ ...btnStyle, touchAction: 'manipulation' }}
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeFloating(); }}
              title="إغلاق" aria-label="إغلاق" style={{ ...btnStyle, touchAction: 'manipulation' }}
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

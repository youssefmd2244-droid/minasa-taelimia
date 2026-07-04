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
 *   4) الأزرار دي متحطوطة تحت — جمب الكنترولز الأصلية للفيديو — مش
 *      فوقه، عشان متغطيش على الفيديو أو تتلخبط مع حاجة تانية.
 *   5) بنحاول نولّد صورة مصغّرة (poster) تلقائيًا من أول فريم في
 *      الفيديو لو محدش مرّر poster جاهزة، عشان الفيديو ميظهرش مربّع
 *      أسود فاضي قبل ما تشغّله.
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
        crossOrigin="anonymous"
        style={{
          width: '100%',
          height: floating ? '100%' : undefined,
          maxHeight: floating ? undefined : maxHeight,
          objectFit: floating ? 'cover' : 'contain',
          display: 'block',
        }}
      />
      {/* أزرار التحكم الإضافية — تحت جمب كنترولز الفيديو الأصلية، مش فوقه */}
      <div style={{ position: 'absolute', bottom: '44px', insetInlineEnd: '8px', display: 'flex', gap: '6px', zIndex: 2 }}>
        {!floating && (
          <>
            <button onClick={enterFullscreen} title="ملء الشاشة" aria-label="ملء الشاشة" style={btnStyle}>
              <Maximize2 size={14} />
            </button>
            <button onClick={enterFloating} title="تصغير — نافذة عائمة" aria-label="تصغير — نافذة عائمة" style={btnStyle}>
              <Minimize2 size={14} />
            </button>
          </>
        )}
        {floating && (
          <>
            <button onClick={exitFloating} title="تكبير" aria-label="تكبير" style={btnStyle}>
              <Maximize2 size={14} />
            </button>
            <button onClick={closeFloating} title="إغلاق" aria-label="إغلاق" style={btnStyle}>
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

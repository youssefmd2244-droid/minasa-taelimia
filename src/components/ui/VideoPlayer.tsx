/**
 * VideoPlayer — مشغّل فيديو بيضيف فوق الكنترولز العادية:
 *   1) زرار "ملء الشاشة" — بيشتغل بالـ Fullscreen API، ومعاه fallback
 *      لـ iOS Safari (اللي محتاج `webkitEnterFullscreen` على عنصر
 *      الفيديو نفسه مش الحاوية).
 *   2) زرار "تصغير/عائم" — بيحوّل الفيديو لنافذة صغيرة عائمة فوق باقي
 *      الشاشة (زي وضع الصورة داخل الصورة) عشان يفضل شغال وانت بتشوف
 *      أي حاجة تانية في الصفحة أو التطبيق. الفيديو نفسه (عنصر <video>)
 *      بيفضل هو هو من غير ما يتقفل أو يعيد التحميل — بس بنغيّر مكانه
 *      وحجمه بالـ CSS فقط، فالتشغيل ما بيتوقفش.
 *   3) في وضع العائم: زرار "تكبير" يرجّعه لمكانه الطبيعي، وزرار
 *      "إغلاق" يقفل الوضع العائم ويوقف الفيديو.
 */
import { useCallback, useRef, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  borderRadius?: string;
  maxHeight?: string;
}

const btnStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.22)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
};

export default function VideoPlayer({ src, poster, autoPlay, borderRadius = '14px', maxHeight = '60vh' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);

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

  const closeFloating = useCallback(() => {
    setFloating(false);
    videoRef.current?.pause();
  }, []);

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
            }
          : { position: 'relative', width: '100%', borderRadius, overflow: 'hidden', background: '#000' }
      }
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        autoPlay={autoPlay}
        playsInline
        style={{
          width: '100%',
          height: floating ? '100%' : undefined,
          maxHeight: floating ? undefined : maxHeight,
          objectFit: floating ? 'cover' : 'contain',
          display: 'block',
        }}
      />
      <div style={{ position: 'absolute', top: '8px', insetInlineEnd: '8px', display: 'flex', gap: '6px', zIndex: 2 }}>
        {!floating && (
          <>
            <button onClick={enterFullscreen} title="ملء الشاشة" aria-label="ملء الشاشة" style={btnStyle}>
              <Maximize2 size={14} />
            </button>
            <button onClick={() => setFloating(true)} title="تصغير — نافذة عائمة" aria-label="تصغير — نافذة عائمة" style={btnStyle}>
              <Minimize2 size={14} />
            </button>
          </>
        )}
        {floating && (
          <>
            <button onClick={() => setFloating(false)} title="تكبير" aria-label="تكبير" style={btnStyle}>
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

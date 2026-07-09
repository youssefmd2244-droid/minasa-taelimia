/**
 * ZoomableImage — أي صورة يستخدم المكوّن ده تكبر في نافذة كاملة الشاشة
 * لما المستخدم يدوس عليها (زي أي تطبيق صور عادي)، ومعاها زرار إغلاق
 * واضح، وبتتقفل كمان بالدوس على الخلفية.
 */
import { useState } from 'react';
import { X } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ZoomableImage({ src, alt = '', className, style }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ cursor: 'zoom-in', ...style }}
        onClick={() => setOpen(true)}
        loading="lazy"
        decoding="async"
      />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(3,3,10,0.94)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="إغلاق"
            style={{
              position: 'absolute',
              top: '16px',
              insetInlineEnd: '16px',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={17} />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            decoding="async"
            style={{ maxWidth: '100%', maxHeight: '92vh', objectFit: 'contain', borderRadius: '10px' }}
          />
        </div>
      )}
    </>
  );
}

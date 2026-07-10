/**
 * ZoomControls — زرار تكبير/تصغير التطبيق كله.
 *
 * كان قبل كده زرار عائم لوحده تحت في شمال الشاشة. دلوقتي بقى "inline"
 * (variant الافتراضي) عشان يتحط جنب زرار الأقسام فوق في الـ nav زي ما
 * اتطلب بالظبط — بيفتح popover صغير تحته فيه:
 *   - زرار +/- بخطوة نسبية (مناسبة للمدى الواسع 10%–1000%)
 *   - Slider يقدر يوصل بيه لأي نسبة في المدى كله بسحبة واحدة
 *   - قراءة رقمية للنسبة الحالية + زرار استعادة الحجم الافتراضي (100%)
 *
 * لسه فيه دعم لـ variant="floating" (نفس الشكل القديم العائم) لو
 * حبينا نرجّعه أو نستخدمه في مكان تاني بره الـ nav.
 */
import { useState } from 'react';
import { Plus, Minus, RotateCcw, ZoomIn } from 'lucide-react';
import { useAppZoom } from '../hooks/useAppZoom';

type Props = {
  variant?: 'inline' | 'floating';
};

export default function ZoomControls({ variant = 'inline' }: Props) {
  const {
    zoomPercent,
    minZoomPercent,
    maxZoomPercent,
    setZoomPercent,
    zoomIn,
    zoomOut,
    resetZoom,
    canZoomIn,
    canZoomOut,
    isDefault,
  } = useAppZoom();
  const [expanded, setExpanded] = useState(false);

  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
    cursor: disabled ? 'default' : 'pointer',
    flexShrink: 0,
  });

  const panel = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px',
        borderRadius: 16,
        background: 'rgba(10,10,20,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        width: 240,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          type="button"
          onClick={zoomOut}
          disabled={!canZoomOut}
          title="تصغير"
          aria-label="تصغير حجم عرض التطبيق"
          style={btnStyle(!canZoomOut)}
        >
          <Minus size={14} />
        </button>

        <button
          type="button"
          onClick={resetZoom}
          disabled={isDefault}
          title="استعادة الحجم الافتراضي (100%)"
          aria-label="استعادة حجم العرض الافتراضي"
          style={{
            minWidth: 64,
            height: 30,
            padding: '0 8px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 12,
            fontWeight: 700,
            cursor: isDefault ? 'default' : 'pointer',
          }}
        >
          {!isDefault && <RotateCcw size={11} />}
          {zoomPercent}%
        </button>

        <button
          type="button"
          onClick={zoomIn}
          disabled={!canZoomIn}
          title="تكبير"
          aria-label="تكبير حجم عرض التطبيق"
          style={btnStyle(!canZoomIn)}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* الـ Slider بيغطي المدى كله (10%–1000%) بسحبة واحدة، بدل ما
          تحتاج تضغط +/- عشرات المرات عشان توصل لأقصى تكبير. */}
      <input
        type="range"
        min={minZoomPercent}
        max={maxZoomPercent}
        step={10}
        value={zoomPercent}
        onChange={(e) => setZoomPercent(Number(e.target.value))}
        aria-label="اسحب لاختيار نسبة تكبير التطبيق"
        style={{ width: '100%', accentColor: '#F4845F', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
        <span>{minZoomPercent}%</span>
        <span>{maxZoomPercent}%</span>
      </div>
    </div>
  );

  if (variant === 'floating') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          left: '16px',
          zIndex: 999999,
        }}
      >
        {expanded && <div style={{ position: 'absolute', bottom: 48, left: 0 }}>{panel}</div>}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          title="تكبير/تصغير شاشة التطبيق"
          aria-label="فتح أدوات تكبير وتصغير شاشة التطبيق"
          aria-expanded={expanded}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(20,20,30,0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          {expanded ? '×' : `${zoomPercent}%`}
        </button>
      </div>
    );
  }

  // variant === 'inline' — للاستخدام جوه شريط التنقل (nav) جنب زرار
  // الأقسام. الزرار نفسه بنفس مقاس ولون أزرار الـ nav التانية (w-8 h-8)
  // عشان يبان جزء طبيعي من نفس الصف، والـ popover بيفتح تحته.
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        title="تكبير/تصغير شاشة التطبيق"
        aria-label="فتح أدوات تكبير وتصغير شاشة التطبيق"
        aria-expanded={expanded}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <ZoomIn size={16} />
      </button>

      {expanded && (
        <>
          {/* طبقة شفافة بتقفل الـ popover لما تدوس بره منه */}
          <div
            onClick={() => setExpanded(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
          />
          <div style={{ position: 'absolute', top: 'calc(100% + 10px)', insetInlineEnd: 0, zIndex: 99999 }}>
            {panel}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * ZoomControls — زرار تكبير/تصغير عائم صغير (زي اللي في كروم)، ظاهر في
 * كل شاشات التطبيق فوق أي محتوى. بيستخدم useAppZoom اللي بيحفظ المستوى
 * ويطبّقه على <html> كله، فالتكبير بيفضل ثابت حتى لو دخلت الأقسام أو
 * الإعدادات أو قفلت التطبيق وفتحته تاني.
 */
import { useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { useAppZoom } from '../hooks/useAppZoom';

export default function ZoomControls() {
  const { zoomPercent, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut, isDefault } = useAppZoom();
  const [expanded, setExpanded] = useState(false);

  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
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

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(18px + env(safe-area-inset-bottom))',
        insetInlineEnd: '16px',
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: expanded ? '6px' : '0',
        borderRadius: '999px',
        background: expanded ? 'rgba(10,10,20,0.85)' : 'transparent',
        backdropFilter: expanded ? 'blur(14px)' : undefined,
        border: expanded ? '1px solid rgba(255,255,255,0.12)' : 'none',
        transition: 'all 200ms ease',
      }}
    >
      {expanded && (
        <>
          <button
            type="button"
            onClick={zoomOut}
            disabled={!canZoomOut}
            title="تصغير"
            aria-label="تصغير حجم عرض التطبيق"
            style={btnStyle(!canZoomOut)}
          >
            <Minus size={15} />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            disabled={isDefault}
            title="استعادة الحجم الافتراضي"
            aria-label="استعادة حجم العرض الافتراضي"
            style={{
              minWidth: 46,
              height: 34,
              padding: '0 6px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
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
            <Plus size={15} />
          </button>
        </>
      )}

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
          fontSize: 13,
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

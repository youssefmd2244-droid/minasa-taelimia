/**
 * useAppZoom — تكبير/تصغير عام لكل التطبيق (نفس فكرة تكبير الصفحة في
 * متصفح Chrome). المستوى المختار بيتحفظ في localStorage، وبيتطبّق على
 * عنصر <html> نفسه (CSS zoom)، فبالتالي بيغطي كل شاشة في التطبيق —
 * الصفحة الرئيسية، الأقسام، شاشة الأدمن/الإعدادات، أي مودال — من غير
 * ما نحتاج نضيف كود في كل قسم لوحده. المستوى بيفضل ثابت لحد ما
 * المستخدم يغيّره تاني بنفسه (حتى بعد قفل وإعادة فتح التطبيق).
 */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'eduverse_app_zoom_level';
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.5;
const STEP = 0.1;
const DEFAULT_ZOOM = 1;

function clamp(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

function readStoredZoom(): number {
  if (typeof window === 'undefined') return DEFAULT_ZOOM;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseFloat(raw) : DEFAULT_ZOOM;
  return Number.isFinite(parsed) ? clamp(parsed) : DEFAULT_ZOOM;
}

function applyZoomToDocument(value: number) {
  if (typeof document === 'undefined') return;
  // 'zoom' مدعومة في محركات Chromium (اللي التطبيق شغال عليها فعلياً
  // سواء في متصفح الموبايل أو داخل WebView بتاع Capacitor/أندرويد)
  // وبتكبّر/تصغّر كل حاجة (تخطيط + خطوط + عناصر fixed) بنفس نسبة
  // تكبير الصفحة في كروم، بالظبط زي المطلوب.
  (document.documentElement.style as CSSStyleDeclaration & { zoom?: string }).zoom = String(value);
}

/**
 * لازم تتنادى مرة واحدة بس في جذر التطبيق (App.tsx) عشان تطبّق أي
 * مستوى تكبير محفوظ من قبل أول ما التطبيق يفتح، وترجّع القيمة الحالية
 * + دوال التحكم لأي مكان محتاج يعرضهم (زرار التكبير/التصغير العائم).
 */
export function useAppZoom() {
  const [zoom, setZoomState] = useState<number>(() => readStoredZoom());

  useEffect(() => {
    applyZoomToDocument(zoom);
  }, [zoom]);

  const setZoom = useCallback((value: number) => {
    const next = clamp(value);
    setZoomState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // localStorage ممكن يكون مش متاح (وضع خاص جداً) — مش هيكسر التطبيق
    }
  }, []);

  const zoomIn = useCallback(() => setZoom(zoom + STEP), [zoom, setZoom]);
  const zoomOut = useCallback(() => setZoom(zoom - STEP), [zoom, setZoom]);
  const resetZoom = useCallback(() => setZoom(DEFAULT_ZOOM), [setZoom]);

  return {
    zoom,
    zoomPercent: Math.round(zoom * 100),
    zoomIn,
    zoomOut,
    resetZoom,
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
    isDefault: zoom === DEFAULT_ZOOM,
  };
}

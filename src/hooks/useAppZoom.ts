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
// المدى كان قبل كده من 80% لـ 150%. اتوسّع دلوقتي لـ 10%–1000% زي
// المطلوب بالظبط. سبنا الحد الأدنى الحقيقي 10% مش صفر تمامًا: عند 0%
// كل عنصر في الشاشة بيبقى مقاسه صفر فعليًا (مفيش حاجة تتلمس ولا
// تتقفل بيها الشاشة تاني)، يعني التطبيق هيقفل نفسه على نفسه من غير
// رجعة. 10% لسه صغير جدًا (يقرب يبقى نقطة) لكن بيسيب زرار "استعادة
// الحجم الافتراضي" قابل للنقر عشان ترجع تكبّر تاني.
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
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

  // المدى بقى كبير جدًا (10%–1000%)، فخطوة ثابتة 10% كانت هتاخد ~99
  // ضغطة عشان توصل من الأول للآخر. بدّلناها بخطوة "نسبية" (10% من
  // القيمة الحالية، بحد أدنى STEP الأصلية) عشان زرار +/- يفضل مفيد في
  // كل المدى: خطوات صغيرة ودقيقة حوالين 100%، وقفزات أكبر كل ما نبعد.
  const dynamicStep = useCallback((value: number) => Math.max(STEP, Math.round(value * 0.1 * 10) / 10), []);

  const zoomIn = useCallback(() => setZoom(zoom + dynamicStep(zoom)), [zoom, setZoom, dynamicStep]);
  const zoomOut = useCallback(() => setZoom(zoom - dynamicStep(zoom)), [zoom, setZoom, dynamicStep]);
  const resetZoom = useCallback(() => setZoom(DEFAULT_ZOOM), [setZoom]);

  return {
    zoom,
    zoomPercent: Math.round(zoom * 100),
    minZoomPercent: Math.round(MIN_ZOOM * 100),
    maxZoomPercent: Math.round(MAX_ZOOM * 100),
    setZoomPercent: (percent: number) => setZoom(percent / 100),
    zoomIn,
    zoomOut,
    resetZoom,
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
    isDefault: zoom === DEFAULT_ZOOM,
  };
}

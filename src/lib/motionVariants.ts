/**
 * motionVariants — مجموعة موحّدة من حركات Framer Motion، عشان أي شاشة
 * جديدة (أو موجودة) تاخد نفس "الإحساس الاحترافي" (نفس التوقيت، نفس
 * منحنى الحركة، نفس مقدار الحركة) بدل ما كل مكوّن يخترع أرقامه الخاصة.
 * ─────────────────────────────────────────────────────────────────────
 * استخدمها بدل ما تكتب { opacity: 0, y: 10 } يدوي في كل مكان — لو حبينا
 * نغيّر "الإحساس" العام للتطبيق كله، بنغيّره هنا مرة واحدة بس.
 *
 * تنبيه مهم بخصوص HeroCarousel.tsx تحديدًا:
 *   الملف ده اتعمله "diagnostic build" مقصود — كل حركات framer-motion
 *   وGSAP وأي طبقة لمس (drag/gesture) اتشالت منه عمدًا لحل مشكلة حقيقية
 *   (طبقة اللمس كانت بتوقف السكرول على Android WebView). ميتضافش أي
 *   حاجة من الملف ده هنا أو أي مكان تاني من غير ما نتأكد إن السكرول
 *   لسه شغال بعدها على جهاز أندرويد حقيقي — مش بس على المتصفح.
 */
import type { Variants, Transition } from 'framer-motion';

// ── التوقيت الموحّد (نفس المنحنى في كل حركة بالتطبيق) ────────────────
export const EASE_SMOOTH: Transition['ease'] = [0.22, 1, 0.36, 1]; // "easeOutExpo"-ish، نفس الإحساس اللي شفته في الفيديو
export const DURATION_FAST = 0.25;
export const DURATION_BASE = 0.4;
export const DURATION_SLOW = 0.6;

// ── ظهور كارت واحد (fade + slide بسيط) ───────────────────────────────
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION_BASE, ease: EASE_SMOOTH } },
};

// ── حاوية بتنشر أبناءها بالتتابع (staggered reveal) — دي اللي بتدّي
//    إحساس "الكروت بتظهر واحد ورا التاني" اللي شفته في الفيديو ──────
export function staggerContainer(staggerDelay: number = 0.06): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay, delayChildren: 0.05 },
    },
  };
}

// ── تأثير الضغط/اللمس على أي عنصر قابل للنقر (كارت، زرار) ────────────
export const pressable = {
  whileTap: { scale: 0.96 },
  transition: { duration: 0.15 },
};

// ── انتقال شاشة كاملة (فتح/قفل صفحة، لايت بوكس، مودال) ───────────────
export const screenTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION_BASE, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: DURATION_FAST, ease: EASE_SMOOTH } },
};

export const screenSlideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION_SLOW, ease: EASE_SMOOTH } },
  exit: { opacity: 0, y: 24, transition: { duration: DURATION_FAST, ease: EASE_SMOOTH } },
};

// ── هيلبر جاهز لأي كارت جوّه شبكة (grid) — بيدّيله دور واضح (index)
//    عشان الـ stagger يشتغل صح من غير ما تحسب delay يدوي كل مرة. ─────
export function gridItemProps(index: number, baseDelay: number = 0.04) {
  return {
    initial: 'hidden' as const,
    animate: 'visible' as const,
    variants: fadeUpItem,
    transition: { duration: DURATION_BASE, ease: EASE_SMOOTH, delay: index * baseDelay },
    whileTap: { scale: 0.96 },
  };
}

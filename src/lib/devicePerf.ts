/**
 * devicePerf — تصنيف بسيط وسريع لقدرة الجهاز (low / mid / high) بنستخدمه
 * عشان نقلّل شغل الـ GPU/CPU تلقائيًا على الأجهزة الضعيفة (رامات قليلة/
 * معالجات قديمة) من غير ما نأثر على شكل أو خصائص التطبيق على الأجهزة
 * القوية. مفيش أي API مضمون 100% في كل المتصفحات (deviceMemory مثلاً
 * مش موجودة في Safari)، فبنعتمد على أكتر من إشارة مع fallback آمن.
 */

export type PerfTier = 'low' | 'mid' | 'high';

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

let cachedTier: PerfTier | null = null;

export function getDevicePerfTier(): PerfTier {
  if (cachedTier) return cachedTier;
  if (typeof navigator === 'undefined') return 'mid';

  // navigator.deviceMemory (جيجابايت، تقريبية) — مدعومة في Chrome/Edge/
  // WebView أندرويد (اللي التطبيق شغال عليه فعليًا)، مش مدعومة في iOS
  // Safari فبنرجع لـ fallback معقول (4) لو مش موجودة.
  const deviceMemory = readNumber((navigator as Navigator & { deviceMemory?: number }).deviceMemory, 4);
  const cores = readNumber(navigator.hardwareConcurrency, 4);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let tier: PerfTier = 'mid';
  if (prefersReducedMotion || deviceMemory <= 2 || cores <= 2) {
    tier = 'low';
  } else if (deviceMemory >= 6 && cores >= 6) {
    tier = 'high';
  }

  cachedTier = tier;
  return tier;
}

/** أقصى devicePixelRatio نسمح بيه حسب فئة الجهاز — العنصر الأكبر تأثير
 *  على أداء أي رسم GPU (كل بكسل إضافي هو شغل إضافي فعلي). */
export function getMaxDprForTier(tier: PerfTier = getDevicePerfTier()): number {
  if (tier === 'low') return 1;
  if (tier === 'mid') return 1.5;
  return 2;
}

/** هل نشغّل الرسم كل فريم ولا نتخطى فريمات (throttle) لتوفير طاقة/GPU
 *  على الأجهزة الضعيفة. بيرجع "كل قد إيه فريم نرسم" — 1 يعني كل فريم. */
export function getFrameSkipForTier(tier: PerfTier = getDevicePerfTier()): number {
  if (tier === 'low') return 2; // نص معدل الفريم (كل فريم تاني)
  return 1;
}

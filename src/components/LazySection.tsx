/**
 * LazySection — بيأجّل تركيب (mount) أي قسم تقيل لحد ما يقرب يظهر على
 * الشاشة فعليًا، بدل ما كل أقسام الصفحة (كاروسيل + كورة أرضية + جاليري
 * دائري + تعليقات + ...) تتركّب كلها مرة واحدة أول ما التطبيق يفتح.
 * ─────────────────────────────────────────────────────────────────
 * ليه ده أهم سبب في "التطبيق تقيل وبطيء أول ما بيفتح":
 *   React كان بيعمل mount لكل الأقسام السبعة/الثمانية اللي في الصفحة
 *   الرئيسية في نفس اللحظة (حتى اللي تحت خالص وميتشافش إلا بعد سكرول
 *   طويل)، وكل قسم منهم بيعمل حاجات مش رخيصة على الفور: طلبات شبكة
 *   (StudentComments بيعمل fetch + realtime subscribe فورًا)، رسم
 *   canvas/DOM تقيل (الجاليري الدائري، الكرة الأرضية)، وحسابات تخطيط
 *   إضافية. كل ده بيحصل *قبل* ما المستخدم يشوف حتى أول قسم (الكاروسيل)،
 *   وده اللي بيحس إنه "تهنيج" و"تقل" في اللحظات الأولى.
 *
 * الحل: كل قسم تحت الأول بيتلف في <LazySection>. الأقسام بتفضل تاخد
 * نفس المساحة بالظبط (min-height) عشان مفيش "قفزة" في السكرول، لكن
 * الكود الفعلي بتاعها (والطلبات/الرسم اللي جواه) ميتنفذش إلا لما
 * IntersectionObserver يقول إنها قربت تدخل الشاشة (rootMargin موجب).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  /** أقل ارتفاع للـ placeholder قبل ما القسم يتحمّل — يمنع قفزة السكرول */
  minHeight?: number | string;
  /** المسافة قبل الشاشة اللي هيبدأ يحمّل عندها (px) */
  preloadMargin?: string;
}

export default function LazySection({
  children,
  minHeight = 400,
  preloadMargin = '600px',
}: LazySectionProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldRender) return;
    const el = ref.current;
    if (!el) return;

    // لو الجهاز/المتصفح مش بيدعم IntersectionObserver لأي سبب، منعرضش
    // القسم أبدًا — بنحمّله على طول بدل ما نكسر الصفحة.
    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          io.disconnect();
        }
      },
      { rootMargin: preloadMargin, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldRender, preloadMargin]);

  if (!shouldRender) {
    return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
  }

  return <>{children}</>;
}

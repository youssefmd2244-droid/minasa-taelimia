import { useEffect, useRef } from 'react';

const REVEAL_SELECTOR =
  '.reveal, .reveal-left, .reveal-3d, .reveal-3d-left, .reveal-3d-right';

export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // يظهر العنصر وقت الدخول للشاشة ويختفي تاني وقت خروجه
          // (مع منظر ثلاثي الأبعاد للكلاسات reveal-3d*)
          entry.target.classList.toggle('visible', entry.isIntersecting);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    // العناصر الموجودة وقت أول تحميل للصفحة
    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el));

    // مراقبة أي عناصر "reveal" تتضاف للصفحة لاحقًا (تبويبات لوحة الإدارة،
    // محتوى بييجي بعد التحميل الأول من Supabase/GitHub، مودالات، إلخ).
    // من غير الجزء ده، أي عنصر reveal يتولد بعد أول مسح كان هيفضل مخفي
    // (opacity: 0) للأبد لأن حد ما راقبهوش أبدًا — مش مجرد تأخير، اختفاء دائم.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(REVEAL_SELECTOR)) observer.observe(node);
          node.querySelectorAll?.(REVEAL_SELECTOR).forEach((el) => observer.observe(el));
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

export function useRevealRef<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.classList.add('visible');
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

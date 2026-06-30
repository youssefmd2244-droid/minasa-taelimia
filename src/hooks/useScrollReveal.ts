import { useEffect, useRef } from 'react';

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

    const els = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-3d, .reveal-3d-left, .reveal-3d-right'
    );
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
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

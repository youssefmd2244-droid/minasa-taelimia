import { useRef, useCallback } from 'react';

/**
 * useTilt3D — بيدّي أي عنصر (كارت زجاجي مثلاً) إحساس "3D حقيقي" بيتحرك
 * مع لمسة الإصبع/الماوس، بدل ما يكون flat. بيشتغل عن طريق تحديث CSS
 * variables (--tilt-x, --tilt-y, --tilt-z) اللي كلاس .tilt-3d بيقراها.
 *
 * ملاحظة أداء مهمة: على أجهزة اللمس (موبايل)، أي شغل جوه touchmove
 * بيتنفذ عشرات المرات في الثانية على نفس الـ thread اللي بيحرك السكرول —
 * ده بالظبط سبب البطء اللي كان موجود في circular-gallery.tsx قبل كده
 * (نفس الملف فيه تعليق موثّق بالمشكلة دي). عشان كده هنا بنتجاهل اللمس
 * تمامًا على أجهزة اللمس (pointer: coarse) ومنسيبش غير الماوس على
 * الديسكتوب، فعليًا زيرو تكلفة على الموبايل بدل ما تتكل على CSS بس.
 */
const isCoarsePointer =
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

export function useTilt3D<T extends HTMLElement>(maxDeg: number = 10) {
  const ref = useRef<T>(null);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isCoarsePointer) return; // موبايل/تاتش: من غير أي شغل خالص
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width; // 0 -> 1
      const py = (clientY - rect.top) / rect.height; // 0 -> 1
      const tiltX = (px - 0.5) * maxDeg * 2; // rotateY
      const tiltY = (0.5 - py) * maxDeg * 2; // rotateX
      el.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
      el.style.setProperty('--tilt-z', '12px');
      el.style.setProperty('--tilt-scale', '1.02');
      el.classList.remove('tilt-idle');
    },
    [maxDeg]
  );

  const reset = useCallback(() => {
    if (isCoarsePointer) return;
    const el = ref.current;
    if (!el) return;
    el.classList.add('tilt-idle');
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--tilt-z', '0px');
    el.style.setProperty('--tilt-scale', '1');
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isCoarsePointer) return;
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    },
    [handleMove]
  );

  return { ref, onMouseMove, onMouseLeave: reset, onTouchMove, onTouchEnd: reset };
}

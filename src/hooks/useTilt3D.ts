import { useRef, useCallback } from 'react';

/**
 * useTilt3D — بيدّي أي عنصر (كارت زجاجي مثلاً) إحساس "3D حقيقي" بيتحرك
 * مع لمسة الإصبع/الماوس، بدل ما يكون flat. بيشتغل عن طريق تحديث CSS
 * variables (--tilt-x, --tilt-y, --tilt-z) اللي كلاس .tilt-3d بيقراها.
 *
 * الاستخدام:
 *   const tiltRef = useTilt3D<HTMLDivElement>();
 *   <div ref={tiltRef} className="tilt-3d glass-premium">...</div>
 */
export function useTilt3D<T extends HTMLElement>(maxDeg: number = 10) {
  const ref = useRef<T>(null);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
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
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    },
    [handleMove]
  );

  return { ref, onMouseMove, onMouseLeave: reset, onTouchMove, onTouchEnd: reset };
}

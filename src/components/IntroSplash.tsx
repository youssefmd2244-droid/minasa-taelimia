import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTRO_DURATION = 1600; // 1.6 seconds

export default function IntroSplash({ onFinish }: { onFinish: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: '#05050f' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4 }}
      >
        {/* Background subtle gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(100,100,255,0.08) 0%, transparent 60%)',
          }}
        />

        {/* 3D Book Animation */}
        <motion.div
          className="relative z-10"
          style={{ perspective: 1000 }}
          initial={{ opacity: 0, scale: 0.6, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            style={{ transformStyle: 'preserve-3d', width: '120px', height: '160px' }}
            animate={{ rotateY: 360, rotateX: [0, 8, 0, -5, 0] }}
            transition={{
              rotateY: { duration: 3, repeat: Infinity, ease: 'linear' },
              rotateX: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {/* Book Cover (front) */}
            <div
              className="absolute inset-0 rounded-lg flex flex-col items-center justify-center"
              style={{
                transform: 'translateZ(15px)',
                background: 'linear-gradient(135deg, #1a3a6a, #2a4a8a)',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <span className="text-white text-lg">📖</span>
              </div>
              <span
                className="text-white text-sm font-bold tracking-wider"
                style={{ fontFamily: "'Anton', sans-serif" }}
              >
                EDUVERSE
              </span>
              <div className="flex gap-1 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              </div>
            </div>

            {/* Book Cover (back) */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                transform: 'translateZ(-15px) rotateY(180deg)',
                background: 'linear-gradient(135deg, #2a1a4a, #3a2a5a)',
                border: '2px solid rgba(255,255,255,0.15)',
              }}
            />

            {/* Book Pages (right) */}
            <div
              className="absolute inset-1 rounded-r-md"
              style={{
                transform: 'translateZ(14px) rotateY(90deg)',
                transformOrigin: 'left center',
                background: 'linear-gradient(90deg, #e8e8e8, #f5f5f5)',
              }}
            />

            {/* Book Pages (left) */}
            <div
              className="absolute inset-1 rounded-l-md"
              style={{
                transform: 'translateZ(14px) rotateY(-90deg)',
                transformOrigin: 'right center',
                background: 'linear-gradient(90deg, #f5f5f5, #e8e8e8)',
              }}
            />

            {/* Book Spine */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                transform: 'translateZ(14px) rotateY(90deg)',
                transformOrigin: 'right center',
                width: '30px',
                left: '-15px',
                background: 'linear-gradient(180deg, #1a2a5a, #2a3a6a)',
              }}
            />

            {/* Book Top */}
            <div
              className="absolute left-0 right-0"
              style={{
                transform: 'translateZ(14px) rotateX(90deg)',
                transformOrigin: 'bottom center',
                height: '30px',
                top: '-15px',
                background: '#f0f0f0',
              }}
            />
          </motion.div>

          {/* Floating glow under book */}
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(100,150,255,0.3), transparent)',
              filter: 'blur(8px)',
            }}
            animate={{ scaleX: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Staggered EDUVERSE text */}
        <motion.div
          className="relative z-10 mt-10 flex"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.4 },
            },
          }}
        >
          {'EDUVERSE'.split('').map((char, i) => (
            <motion.span
              key={i}
              className="text-3xl sm:text-4xl"
              style={{
                fontFamily: "'Anton', sans-serif",
                color: 'white',
                letterSpacing: '0.05em',
              }}
              variants={{
                hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0)',
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="relative z-10 mt-3 text-xs text-white/40 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          منصة تعليمية شاملة
        </motion.p>

        {/* Loading dots */}
        <div className="relative z-10 mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.6)' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Auto-dismiss timer */}
        <AutoDismiss duration={INTRO_DURATION} onDone={onFinish} />
      </motion.div>
    </AnimatePresence>
  );
}

function AutoDismiss({ duration, onDone }: { duration: number; onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(onDone, 100);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, onDone]);

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-0.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.1)' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #6EB5FF, #6BBF7A, #E882B4)',
          transition: 'none',
        }}
      />
    </div>
  );
}

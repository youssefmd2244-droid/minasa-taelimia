import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroSplashProps {
  onFinish: () => void;
}

// ── Letter-stagger for "EDUVERSE" ──
const BRAND = 'EDUVERSE';

export default function IntroSplash({ onFinish }: IntroSplashProps) {
  const [started, setStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const DURATION = 1600; // ms — total splash life

  // باگ تم اكتشافه وإصلاحه هنا (سبب رئيسي لـ"تطبيق فيه لاج وتقطيع من أول
  // ما بيفتحه"): شريط التقدّم كان بيتحرك عن طريق requestAnimationFrame
  // بينادي setProgress (تحديث React state) في *كل فريم* — يعني 60 إعادة
  // رندر كاملة في الثانية، لمدة ثانية ونص، بالظبط في نفس اللحظة اللي
  // باقي التطبيق (الأقسام، الكاروسيل، مزامنة لوحة الإدارة...) بيبدأ
  // يتحمّل فيها. ده كان بيسحب معالجة الـ CPU من الرندر الأولي نفسه
  // ويسبب التهنيج والتقطيع اللي حاسس بيه من أول ثانية.
  // الحل: شريط التقدّم بقى مجرد CSS transition واحد (width بتتحرك بمعالجة
  // الـ GPU، مش React state)، وبنستخدم setTimeout واحد بس (مش RAF لكل
  // فريم) عشان نعرف امتى نبدأ الخروج — صفر إعادة رندر إضافية طول مدة
  // السبلاش.
  useEffect(() => {
    // فريم واحد تأخير بسيط قبل ما نبدأ الـ transition، عشان المتصفح
    // يقدر يطبّق الحالة الابتدائية (width: 0) قبل ما نغيّرها لـ 100%.
    const raf = requestAnimationFrame(() => setStarted(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onFinish, 550); // wait for exit animation
    }, DURATION);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#05050f',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
          }}
        >
          {/* ── Ambient glow orbs ── */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
          <motion.div
            animate={{
              opacity: [0.15, 0.35, 0.15],
              scale: [1.1, 0.9, 1.1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(110,181,255,0.15) 0%, transparent 70%)',
              top: '30%',
              left: '60%',
              pointerEvents: 'none',
            }}
          />

          {/* ── 3D Book object ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.55, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: '1000px', marginBottom: '40px' }}
          >
            {/* Outer rotating shell */}
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              style={{
                transformStyle: 'preserve-3d',
                width: '100px',
                height: '130px',
                position: 'relative',
              }}
            >
              {/* Book cover — front */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  borderRadius: '4px 12px 12px 4px',
                  transform: 'translateZ(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: '0 8px 32px rgba(249,115,22,0.5)',
                }}
              >
                {/* Lines on book cover */}
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: i === 0 ? '56px' : i === 3 ? '36px' : '50px',
                      height: '3px',
                      borderRadius: '2px',
                      background: 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
                {/* Diploma circle accent */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.7)',
                    marginTop: '4px',
                  }}
                />
              </div>

              {/* Book cover — back */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)',
                  borderRadius: '12px 4px 4px 12px',
                  transform: 'translateZ(-12px) rotateY(180deg)',
                }}
              />

              {/* Spine — left */}
              <div
                style={{
                  position: 'absolute',
                  width: '24px',
                  height: '100%',
                  background: 'linear-gradient(180deg, #ea580c, #c2410c)',
                  left: 0,
                  top: 0,
                  transform: 'rotateY(-90deg) translateZ(12px)',
                  transformOrigin: 'left center',
                  borderRadius: '4px 0 0 4px',
                }}
              />

              {/* Spine — right */}
              <div
                style={{
                  position: 'absolute',
                  width: '24px',
                  height: '100%',
                  background: 'linear-gradient(180deg, #fed7aa, #fdba74)',
                  right: 0,
                  top: 0,
                  transform: 'rotateY(90deg) translateZ(12px)',
                  transformOrigin: 'right center',
                  borderRadius: '0 4px 4px 0',
                }}
              />

              {/* Page stack — top */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '10px',
                  background: 'linear-gradient(90deg, #fef3c7, #fffbeb)',
                  top: 0,
                  left: 0,
                  transform: 'rotateX(90deg) translateZ(0px) translateY(-5px)',
                  transformOrigin: 'top center',
                }}
              />
            </motion.div>
          </motion.div>

          {/* ── EDUVERSE letters stagger ── */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              marginBottom: '32px',
            }}
          >
            {BRAND.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + i * 0.055,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 'clamp(28px, 6vw, 52px)',
                  color: 'white',
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                  display: 'inline-block',
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* ── Tagline ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '48px',
            }}
          >
            منصة تعليمية متكاملة
          </motion.p>

          {/* ── Progress bar ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              position: 'absolute',
              bottom: '48px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(320px, 70vw)',
            }}
          >
            {/* Track */}
            <div
              style={{
                height: '2px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              {/* Fill */}
              <div
                style={{
                  height: '100%',
                  width: started ? '100%' : '0%',
                  background:
                    'linear-gradient(90deg, #f97316, #fb923c)',
                  borderRadius: '999px',
                  transition: `width ${DURATION}ms linear`,
                  boxShadow: '0 0 8px rgba(249,115,22,0.6)',
                }}
              />
            </div>
            {/* Pulsing dots */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '14px',
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#f97316',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

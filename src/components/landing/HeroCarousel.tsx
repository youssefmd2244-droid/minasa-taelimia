import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SUBJECT_IMAGES } from '../../assets/subjects';

const IMAGES = [
  { src: SUBJECT_IMAGES.math,     bg: '#F4845F', panel: '#F79B7F', label: 'Mathematics',  labelAr: 'الرياضيات' },
  { src: SUBJECT_IMAGES.science,  bg: '#6BBF7A', panel: '#85CC92', label: 'Science',       labelAr: 'العلوم' },
  { src: SUBJECT_IMAGES.language, bg: '#E882B4', panel: '#ED9DC4', label: 'Language',      labelAr: 'اللغة العربية' },
  { src: SUBJECT_IMAGES.art,      bg: '#6EB5FF', panel: '#8DC4FF', label: 'Art & Design',  labelAr: 'الفنون' },
];

// Preload images on mount
const preloadImages = () => {
  IMAGES.forEach((item) => {
    const img = new Image();
    img.src = item.src;
  });
};

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`;

const DRAG_THRESHOLD = 80; // px — minimum drag distance to trigger navigation

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    preloadImages();
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimating) return;
      setIsAnimating(true);
      setActiveIndex((prev) =>
        direction === 'next' ? (prev + 1) % 4 : (prev + 3) % 4
      );
      setTimeout(() => setIsAnimating(false), 650);
    },
    [isAnimating]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  const center = activeIndex;
  const left  = (activeIndex + 3) % 4;
  const right = (activeIndex + 1) % 4;

  const getRoleStyle = (index: number): React.CSSProperties => {
    const transition =
      'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1), bottom 650ms cubic-bezier(0.4,0,0.2,1), height 650ms cubic-bezier(0.4,0,0.2,1)';
    const base: React.CSSProperties = {
      position: 'absolute',
      aspectRatio: '0.6 / 1',
      transition,
      willChange: 'transform, filter, opacity',
    };

    if (index === center) {
      return { ...base, transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`, filter: 'blur(0px)', opacity: 1, zIndex: 20, left: '50%', height: isMobile ? '60%' : '92%', bottom: isMobile ? '22%' : '0' };
    }
    if (index === left) {
      return { ...base, transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10, left: isMobile ? '20%' : '30%', height: isMobile ? '16%' : '28%', bottom: isMobile ? '32%' : '12%' };
    }
    if (index === right) {
      return { ...base, transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10, left: isMobile ? '80%' : '70%', height: isMobile ? '16%' : '28%', bottom: isMobile ? '32%' : '12%' };
    }
    // back
    return { ...base, transform: 'translateX(-50%) scale(1)', filter: 'blur(4px)', opacity: 1, zIndex: 5, left: '50%', height: isMobile ? '13%' : '22%', bottom: isMobile ? '32%' : '12%' };
  };

  return (
    <section
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        ref={constraintsRef}
        style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}
      >
        {/* Grain Overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
            backgroundImage: GRAIN_SVG, backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat', opacity: 0.4,
          }}
        />

        {/* Giant Ghost Text */}
        <div
          style={{
            position: 'absolute', insetInline: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', zIndex: 2, top: '18%',
          }}
        >
          <span
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(90px, 28vw, 380px)',
              fontWeight: 900, color: 'white', opacity: 1, lineHeight: 1,
              textTransform: 'uppercase', letterSpacing: '-0.02em', whiteSpace: 'nowrap',
            }}
          >
            LEARN MORE
          </span>
        </div>

        {/* Top-left Brand Label */}
        <div style={{ position: 'absolute', top: '24px', left: isMobile ? '16px' : '32px', zIndex: 60 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'white', opacity: 0.9, letterSpacing: '0.18em' }}>
            EDUVERSE
          </span>
        </div>

        {/* Subject counter — top right */}
        <div style={{ position: 'absolute', top: '24px', right: isMobile ? '16px' : '32px', zIndex: 60, transition: 'opacity 400ms ease' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'white', opacity: 0.75, letterSpacing: '0.14em' }}>
            {`${activeIndex + 1} / 4 — ${IMAGES[activeIndex].label}`}
          </span>
        </div>

        {/* ── Draggable carousel container ──
            Invisible full-viewport layer that captures drag/swipe gestures.
            zIndex sits between the ghost text (2) and the book items (3),
            so items are still visible but gestures are captured here. */}
        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.15}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_e, info) => {
            setIsDragging(false);
            const { offset, velocity } = info;
            // Trigger navigation if drag distance OR velocity exceeds threshold
            if (offset.x < -DRAG_THRESHOLD || velocity.x < -400) {
              navigate('next');
            } else if (offset.x > DRAG_THRESHOLD || velocity.x > 400) {
              navigate('prev');
            }
          }}
          style={{
            position: 'absolute', inset: 0, zIndex: 25,
            cursor: isDragging ? 'grabbing' : 'grab',
            // Transparent — only used for gesture capture
            background: 'transparent',
          }}
          whileDrag={{ cursor: 'grabbing' }}
        />

        {/* Carousel Items (zIndex 3 — below drag layer but visually on top of text) */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          {IMAGES.map((item, index) => (
            <div key={index} style={getRoleStyle(index)}>
              <img
                src={item.src}
                alt={item.label}
                draggable={false}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain', objectPosition: 'bottom center', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
                  userSelect: 'none', pointerEvents: 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Swipe hint (shown briefly on first load) ── */}
        <motion.div
          initial={{ opacity: 0.75 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2.2, duration: 1.2 }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 26, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'rgba(255,255,255,0.55)', fontSize: '12px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          <motion.span
            animate={{ x: [-6, 6, -6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            ←
          </motion.span>
          Swipe or drag
          <motion.span
            animate={{ x: [6, -6, 6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            →
          </motion.span>
        </motion.div>

        {/* Bottom-left Text + Nav Buttons (zIndex 60 — above drag layer) */}
        <div
          style={{
            position: 'absolute', bottom: isMobile ? '24px' : '80px',
            left: isMobile ? '16px' : '96px', zIndex: 60, maxWidth: '320px',
          }}
        >
          <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: isMobile ? '8px' : '12px', fontSize: isMobile ? '14px' : '22px', color: 'white', opacity: 0.95 }}>
            EDUVERSE — LEARN ANYTHING
          </p>

          {!isMobile && (
            <p style={{ fontSize: '13px', color: 'white', opacity: 0.85, lineHeight: 1.6, marginBottom: '20px', maxWidth: '280px' }}>
              Courses crafted by top educators, structured for real progress.
              Clear levels, real certificates, real results. Start your journey today.
            </p>
          )}

          {/* Nav Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {[
              { dir: 'prev' as const, Icon: ArrowLeft,  label: 'Previous subject' },
              { dir: 'next' as const, Icon: ArrowRight, label: 'Next subject' },
            ].map(({ dir, Icon, label }) => (
              <button
                key={dir}
                onClick={() => navigate(dir)}
                aria-label={label}
                style={{
                  width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px',
                  borderRadius: '50%', background: 'transparent',
                  border: '2px solid rgba(255,255,255,0.9)', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 150ms ease, background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={26} strokeWidth={2.25} />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom-right Explore Link */}
        <a
          href="#courses"
          style={{
            position: 'absolute', bottom: isMobile ? '24px' : '80px',
            right: isMobile ? '16px' : '40px', zIndex: 60,
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(20px, 4vw, 56px)',
            fontWeight: 400, color: 'white', opacity: 0.95,
            letterSpacing: '-0.02em', lineHeight: 1,
            textTransform: 'uppercase', textDecoration: 'none',
            transition: 'opacity 200ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.95'; }}
        >
          EXPLORE COURSES
          <ArrowRight size={isMobile ? 20 : 32} strokeWidth={2.25} />
        </a>

        {/* Progress Dots */}
        <div
          style={{
            position: 'absolute', bottom: isMobile ? '80px' : '44px',
            left: '50%', transform: 'translateX(-50%)',
            zIndex: 60, display: 'flex', gap: '8px',
          }}
        >
          {IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setActiveIndex(i);
                  setTimeout(() => setIsAnimating(false), 650);
                }
              }}
              style={{
                width: i === activeIndex ? '24px' : '8px', height: '8px',
                borderRadius: '4px',
                background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.4)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
              }}
              aria-label={`Go to ${IMAGES[i].label}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

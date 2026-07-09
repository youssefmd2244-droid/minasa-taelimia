import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SUBJECT_IMAGES } from '../../assets/subjects';

const IMAGES = [
  { src: SUBJECT_IMAGES.math,              bg: '#F4845F', label: 'Mathematics',       labelAr: 'الرياضيات' },
  { src: SUBJECT_IMAGES.science,           bg: '#6BBF7A', label: 'Science',            labelAr: 'العلوم' },
  { src: SUBJECT_IMAGES.language,          bg: '#E882B4', label: 'Language',           labelAr: 'اللغة العربية' },
  { src: SUBJECT_IMAGES.art,               bg: '#6EB5FF', label: 'Art & Design',       labelAr: 'الفنون' },
  { src: SUBJECT_IMAGES.english,           bg: '#C48F3C', label: 'English',            labelAr: 'اللغة الإنجليزية' },
  { src: SUBJECT_IMAGES.french,            bg: '#5B7FDB', label: 'French',             labelAr: 'اللغة الفرنسية' },
  { src: SUBJECT_IMAGES.psychology,        bg: '#9B6FD1', label: 'Psychology',         labelAr: 'علم النفس' },
  { src: SUBJECT_IMAGES.philosophy,        bg: '#4FA6A0', label: 'Philosophy',         labelAr: 'الفلسفة' },
  { src: SUBJECT_IMAGES.computer_science,  bg: '#3D8FBF', label: 'Computer Science',   labelAr: 'علوم الحاسب' },
  { src: SUBJECT_IMAGES.courses,           bg: '#D9635A', label: 'All Courses',        labelAr: 'كل الدورات' },
  { src: SUBJECT_IMAGES.philosophy_fr,     bg: '#2E2E2E', label: 'Philosophie',        labelAr: 'الفلسفة (فرنساوي)' },
];

const TOTAL = IMAGES.length;

// Preload images on mount
const preloadImages = () => {
  IMAGES.forEach((item) => {
    const img = new Image();
    img.src = item.src;
  });
};

/*
  ── DIAGNOSTIC BUILD ──
  This is a deliberately stripped-down version of HeroCarousel, with every
  "exotic" mechanism removed: no framer-motion drag layer, no GSAP tilt,
  no CSS blur filters, no SVG grain overlay, no preserve-3d layers, no
  nested overflow:hidden wrapper. Only: images, simple CSS transform/opacity
  transitions, and plain onClick buttons.

  Purpose: earlier fixes (removing blur, removing the drag layer, removing
  the grain texture) did not resolve the "swipe doesn't scroll, taps work"
  issue, even reproduced in plain mobile Chrome. This version exists to
  answer one question definitively: does normal touch-scroll work at all
  on this exact screen when NOTHING custom is intercepting touches?

  - If scrolling works now -> something removed here was still the cause,
    and we re-add features one at a time until it breaks again.
  - If scrolling still does NOT work -> the cause is not in this component
    at all (it's global: CSS on html/body, or something in a parent/sibling
    component), and we should look there next instead of this file.
*/
export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

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
        direction === 'next' ? (prev + 1) % TOTAL : (prev + TOTAL - 1) % TOTAL
      );
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating]
  );

  return (
    <section
      className="vh-full"
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: 'background-color 500ms ease',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Giant title text */}
      <div
        style={{
          position: 'absolute', insetInline: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', zIndex: 2, top: '10%',
        }}
      >
        <span
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(60px, 22vw, 380px)',
            fontWeight: 900, color: 'rgba(255,255,255,0.9)', lineHeight: 1,
            textTransform: 'uppercase', letterSpacing: '-0.02em',
          }}
        >
          LEARN MORE
        </span>
      </div>

      {/* Subject counter */}
      <div style={{ position: 'absolute', top: isMobile ? '76px' : '88px', insetInlineEnd: isMobile ? '16px' : '32px', zIndex: 55 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'white', opacity: 0.75, letterSpacing: '0.14em' }}>
          {`${activeIndex + 1} / ${TOTAL} — ${IMAGES[activeIndex].label}`}
        </span>
      </div>

      {/* Single centered image — no absolute-positioned side items, no 3D, no blur */}
      <div
        style={{
          position: 'relative', zIndex: 3, width: '100%', height: isMobile ? '55dvh' : '80dvh',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingTop: isMobile ? '25dvh' : '15dvh',
        }}
      >
        <img
          key={activeIndex}
          src={IMAGES[activeIndex].src}
          alt={IMAGES[activeIndex].label}
          draggable={false}
          decoding="async"
          fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
          style={{
            maxHeight: '100%', maxWidth: isMobile ? '55%' : '32%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
            userSelect: 'none', pointerEvents: 'none',
            opacity: isAnimating ? 0.4 : 1,
            transition: 'opacity 300ms ease',
          }}
        />
      </div>

      {/* Bottom-left Text + Nav Buttons */}
      <div
        style={{
          position: 'absolute', bottom: isMobile ? '120px' : '80px',
          left: isMobile ? '16px' : '96px', zIndex: 60, maxWidth: isMobile ? '70vw' : '320px',
        }}
      >
        <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: isMobile ? '10px' : '12px', fontSize: isMobile ? '13px' : '22px', color: 'white', opacity: 0.95, lineHeight: 1.3 }}>
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
                width: isMobile ? '40px' : '64px', height: isMobile ? '40px' : '64px',
                borderRadius: '50%', background: 'transparent',
                border: '2px solid rgba(255,255,255,0.9)', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={isMobile ? 18 : 26} strokeWidth={2.25} />
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
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: "'Anton', sans-serif",
          fontSize: isMobile ? '15px' : 'clamp(28px, 4vw, 56px)',
          fontWeight: 400, color: 'white', opacity: 0.95,
          letterSpacing: '-0.01em', lineHeight: 1,
          textTransform: 'uppercase', textDecoration: 'none',
        }}
      >
        EXPLORE COURSES
        <ArrowRight size={isMobile ? 16 : 32} strokeWidth={2.25} />
      </a>

      {/* Progress Dots */}
      <div
        style={{
          position: 'absolute', bottom: isMobile ? '72px' : '44px',
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
                setTimeout(() => setIsAnimating(false), 500);
              }
            }}
            style={{
              width: i === activeIndex ? '24px' : '8px', height: '8px',
              borderRadius: '4px',
              background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.4)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 300ms ease',
            }}
            aria-label={`Go to ${IMAGES[i].label}`}
          />
        ))}
      </div>
    </section>
  );
}

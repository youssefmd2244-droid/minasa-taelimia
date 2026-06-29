import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

const SUBJECTS_KEYS = [
  { key: 'hero_subject_math' as const, bg: '#F4845F', panel: '#F79B7F', icon: '∑' },
  { key: 'hero_subject_science' as const, bg: '#6BBF7A', panel: '#85CC92', icon: '⚗' },
  { key: 'hero_subject_language' as const, bg: '#E882B4', panel: '#ED9DC4', icon: 'Aا' },
  { key: 'hero_subject_art' as const, bg: '#6EB5FF', panel: '#8DC4FF', icon: '🎨' },
];

function BookSVG({ color, panelColor, icon }: { color: string; panelColor: string; icon: string }) {
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${color.slice(1)}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={panelColor} /><stop offset="100%" stopColor={color} /></linearGradient>
        <linearGradient id={`sp-${color.slice(1)}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={panelColor} /></linearGradient>
        <filter id={`sh-${color.slice(1)}`}><feDropShadow dx="4" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.3)" /></filter>
      </defs>
      <g filter={`url(#sh-${color.slice(1)})`}>
        <rect x="25" y="15" width="130" height="260" rx="6" fill={`url(#bg-${color.slice(1)})`} />
        <rect x="25" y="15" width="20" height="260" rx="4" fill={`url(#sp-${color.slice(1)})`} />
        <rect x="50" y="30" width="95" height="230" rx="2" fill="white" opacity="0.9" />
        <line x1="60" y1="55" x2="135" y2="55" stroke={color} strokeWidth="2" opacity="0.4" />
        <line x1="60" y1="70" x2="125" y2="70" stroke={color} strokeWidth="2" opacity="0.3" />
        <line x1="60" y1="85" x2="130" y2="85" stroke={color} strokeWidth="2" opacity="0.3" />
        <line x1="60" y1="100" x2="120" y2="100" stroke={color} strokeWidth="2" opacity="0.3" />
        <text x="100" y="170" textAnchor="middle" fontSize="48" fill={color} opacity="0.9">{icon}</text>
        <line x1="65" y1="195" x2="130" y2="195" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="70" y1="205" x2="125" y2="205" stroke={color} strokeWidth="1" opacity="0.3" />
        <path d="M145 15 L155 15 L155 55 L150 48 L145 55 Z" fill={panelColor} />
      </g>
    </svg>
  );
}

export default function HeroCarousel() {
  const { t, dir } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dragState, setDragState] = useState<'idle' | 'dragging'>('idle');

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    h(); window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const navigate = useCallback((d: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((p) => (d === 'next' ? (p + 1) % 4 : (p + 3) % 4));
    setTimeout(() => setIsAnimating(false), 650);
  }, [isAnimating]);

  const handleDragEnd = (_e: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setDragState('idle');
    if (info.offset.x < -80 || info.velocity.x < -400) navigate('next');
    else if (info.offset.x > 80 || info.velocity.x > 400) navigate('prev');
  };

  const getRole = (i: number) => {
    if (i === activeIndex) return 'center';
    if (i === (activeIndex + 3) % 4) return 'left';
    if (i === (activeIndex + 1) % 4) return 'right';
    return 'back';
  };

  const rs = (role: string) => {
    const m = isMobile;
    const base = { position: 'absolute' as const, aspectRatio: '0.6 / 1', willChange: 'transform, filter, opacity', transition: 'all 650ms cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none' as const };
    switch (role) {
      case 'center': return { ...base, left: '50%', bottom: m ? '18%' : '-2%', height: m ? '55%' : '85%', transform: 'translateX(-50%) scale(1.4)', filter: 'none', opacity: 1, zIndex: 20 };
      case 'left': return { ...base, left: m ? '18%' : '28%', bottom: m ? '30%' : '8%', height: m ? '20%' : '30%', transform: 'translateX(-50%) scale(0.85)', filter: 'blur(2px)', opacity: 0.75, zIndex: 10 };
      case 'right': return { ...base, left: m ? '82%' : '72%', bottom: m ? '30%' : '8%', height: m ? '20%' : '30%', transform: 'translateX(-50%) scale(0.85)', filter: 'blur(2px)', opacity: 0.75, zIndex: 10 };
      case 'back': return { ...base, left: '50%', bottom: m ? '28%' : '6%', height: m ? '16%' : '24%', transform: 'translateX(-50%) scale(0.7)', filter: 'blur(4px)', opacity: 0.6, zIndex: 5 };
      default: return { ...base };
    }
  };

  const current = SUBJECTS_KEYS[activeIndex];

  return (
    <section className="relative w-full overflow-hidden snap-section" style={{ height: '100vh', backgroundColor: current.bg, transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)' }}>
      <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ zIndex: 50, opacity: 0.3 }} />
      <motion.div className="absolute top-0 left-0 right-0 z-40 px-4 sm:px-8 pt-20 sm:pt-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <span className="text-xs font-semibold uppercase" style={{ color: 'white', opacity: 0.9, letterSpacing: '0.18em' }}>EDUVERSE</span>
      </motion.div>
      <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none" style={{ top: '10%', zIndex: 2 }}>
        <motion.span className="whitespace-nowrap" style={{ fontFamily: "'Cairo', sans-serif", fontSize: 'clamp(70px, 24vw, 320px)', fontWeight: 900, color: 'white', opacity: 0.08, lineHeight: 1 }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.08, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}>
          {t('hero_ghost')}
        </motion.span>
      </div>
      <motion.div className="absolute inset-0" style={{ zIndex: 15, cursor: dragState === 'dragging' ? 'grabbing' : 'grab' }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} dragMomentum={false} onDragEnd={handleDragEnd} onPointerDown={() => setDragState('dragging')} onPointerUp={() => setDragState('idle')} onPointerLeave={() => setDragState('idle')}>
        <AnimatePresence mode="popLayout">
          {SUBJECTS_KEYS.map((img, i) => <motion.div key={`${i}-${getRole(i)}`} className="absolute" style={rs(getRole(i))} initial={false}><BookSVG color={img.bg} panelColor={img.panel} icon={img.icon} /></motion.div>)}
        </AnimatePresence>
      </motion.div>
      <motion.div className="absolute bottom-0 z-40 px-4 sm:px-12 pb-6 sm:pb-16" style={{ maxWidth: '380px', left: dir === 'ltr' ? 0 : undefined, right: dir === 'rtl' ? undefined : undefined }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <p className="text-lg sm:text-2xl font-bold text-white mb-1">{t(current.key)}</p>
            <p className="hidden sm:block text-sm text-white/80 mb-4 leading-relaxed">{t('hero_description')}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-3 mt-3">
          <button onClick={() => navigate('prev')} className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-white flex items-center justify-center hover-scale" style={{ background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><ArrowLeft size={24} color="white" /></button>
          <button onClick={() => navigate('next')} className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-white flex items-center justify-center hover-scale" style={{ background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><ArrowRight size={24} color="white" /></button>
        </div>
      </motion.div>
      <motion.div className="absolute bottom-0 right-0 z-40 px-4 sm:px-10 pb-6 sm:pb-16" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.6 }}>
        <a href="#courses" className="flex items-center gap-2 text-white no-underline" style={{ fontFamily: "'Cairo', sans-serif", fontSize: 'clamp(16px, 3.5vw, 42px)', fontWeight: 700, lineHeight: 1.1 }}>
          {t('hero_explore')} <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7" color="white" />
        </a>
      </motion.div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
        {SUBJECTS_KEYS.map((_, i) => <div key={i} className="rounded-full transition-all duration-300" style={{ width: i === activeIndex ? 24 : 8, height: 8, background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.3)' }} />)}
      </div>
    </section>
  );
}

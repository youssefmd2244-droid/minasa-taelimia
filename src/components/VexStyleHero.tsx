import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function VexStyleHero() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [headingVisible, setHeadingVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { const h = () => setIsScrolled(window.scrollY > 100); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setHeadingVisible(true); }, { threshold: 0.3 });
    obs.observe(ref.current); return () => obs.disconnect();
  }, []);

  const headingText = 'نشكل العقول\nبالتركيز والفضول.';
  const chars = headingText.split('');

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '100vh' }}>
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #0a1a2e 60%, #0a0a1a 100%)' }} />
      <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <motion.div className="absolute rounded-full" style={{ width: 400, height: 400, top: '20%', right: '10%', background: 'radial-gradient(circle, rgba(100,100,255,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} animate={{ y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: '15%', left: '15%', background: 'radial-gradient(circle, rgba(255,100,150,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />

      <nav className={`absolute top-0 left-0 right-0 z-50 px-4 pt-6 transition-all duration-300 ${isScrolled ? 'pt-2' : ''}`}>
        <div className="max-w-5xl mx-auto liquid-glass rounded-full px-6 py-3 flex items-center gap-8">
          <span className="text-white font-bold text-xl" style={{ fontFamily: "'Cairo', sans-serif" }}>NEXA Learn</span>
          <div className="hidden md:flex items-center gap-6">{['الكورسات', 'المعلمين', 'المجتمع', 'الأسعار'].map((l) => <a key={l} href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a>)}</div>
          <a href="#start" className="pill-btn bg-white text-navy-900 hover:scale-105 transition-transform hidden sm:block">ابدأ التعلّم</a>
        </div>
      </nav>

      <div className="relative z-10 h-full flex flex-col lg:flex-row items-center justify-between px-6 sm:px-12 lg:px-20" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="flex-1 max-w-2xl text-center lg:text-right mt-8 lg:mt-0">
          <div ref={ref} className="flex flex-wrap justify-center lg:justify-start leading-tight mb-8">
            {chars.map((char, i) => (
              <motion.span key={i} className="inline-block" style={{ fontFamily: "'Cairo', sans-serif", fontSize: 'clamp(28px, 6vw, 72px)', fontWeight: 800, color: 'white', lineHeight: 1.3 }}
                initial={{ opacity: 0, y: 25, filter: 'blur(4px)' }} animate={headingVisible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.5, delay: 200 + i * 30, ease: 'easeOut' }}>
                {char === '\n' ? <br /> : char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </div>
          <motion.p className="text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0" style={{ color: 'hsl(240, 4%, 66%)' }}
            initial={{ opacity: 0, y: 30 }} animate={headingVisible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}>
            نساعد الطلاب على بناء مهارات حقيقية ومطاردتهم المشاريع التي تحدد مستقبلهم التعليمي.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start"
            initial={{ opacity: 0, y: 30 }} animate={headingVisible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}>
            <a href="#start" className="pill-btn bg-white text-navy-900 hover:scale-105 transition-transform">ابدأ التعلّم</a>
            <a href="#courses" className="pill-btn border border-white/20 text-white hover:bg-white/10 transition-colors">استكشف الكورسات</a>
          </motion.div>
        </div>
        <div className="hidden lg:flex flex-col gap-4 mt-12 lg:mt-0">
          {[{ color: '#6BBF7A', text: 'تعلّم. تنمّ. حقّق.' }, { color: '#6EB5FF', text: '+10,000 طالب نشط' }, { color: '#E882B4', text: 'شهادة معتمدة' }].map((tag, i) => (
            <motion.div key={i} className="rounded-2xl px-8 py-5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ opacity: 0, x: 40 }} animate={headingVisible ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.4 + i * 0.2, duration: 0.6, ease: 'easeOut' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: tag.color, boxShadow: `0 0 10px ${tag.color}80` }} />
              <span className="text-white text-sm font-medium">{tag.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

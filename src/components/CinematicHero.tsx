import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CinematicHero() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => { const h = () => setScrollY(window.scrollY); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);

  const navLinks = [{ label: 'الرئيسية', href: '#', active: true }, { label: 'الكورسات', href: '#courses' }, { label: 'المعلمين', href: '#instructors' }, { label: 'المدونة', href: '#journal' }, { label: 'اتصل بنا', href: '#contact' }];

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '100vh', backgroundColor: 'hsl(201, 100%, 13%)' }}>
      <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(100,150,255,0.12) 0%, transparent 50%),radial-gradient(ellipse at 80% 20%, rgba(100,200,150,0.08) 0%, transparent 50%)', transform: `translateY(${scrollY * 0.2}px)` }} />
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full" style={{ width: 2 + Math.random() * 3, height: 2 + Math.random() * 3, background: `rgba(255,255,255,${0.1 + Math.random() * 0.2})`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -15, 0], opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 3 }} />
        ))}
      </div>
      <nav className="absolute top-0 left-0 right-0 z-50 px-4 pt-6">
        <div className="max-w-5xl mx-auto liquid-glass rounded-full px-6 py-3 flex items-center gap-8">
          <div className="flex items-center gap-1"><GraduationCap size={18} className="text-white" /><span className="text-white font-bold text-lg" style={{ fontFamily: "'Cairo', sans-serif" }}>مَكْتَب</span><sup className="text-white text-[10px] opacity-60">®</sup></div>
          <div className="hidden md:flex items-center gap-6">{navLinks.map((l) => <a key={l.label} href={l.href} className="text-sm font-medium transition-colors" style={{ color: l.active ? 'white' : 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{l.label}</a>)}</div>
          <a href="#start" className="pill-btn bg-white text-navy-900 hover:scale-105 transition-transform">ابدأ التعلّم</a>
        </div>
      </nav>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 sm:px-12" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <motion.h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl" style={{ fontFamily: "'Cairo', sans-serif" }} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut' }}>
          حيث ترتقي <em className="not-italic" style={{ color: 'hsl(240, 4%, 66%)' }}>الفضول</em> من خلال <em className="not-italic" style={{ color: 'hsl(240, 4%, 66%)' }}>المعرفة</em>
        </motion.h1>
        <motion.p className="mt-6 max-w-2xl text-sm sm:text-base leading-relaxed" style={{ color: 'hsl(240, 4%, 66%)' }} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}>
          نبني أدوات للعقول الفضولية والمتعلمين المتفانين. في وسط الضجيج، ننشئ مساحات مركزة للدراسة العميقة والنمو الحقيقي.
        </motion.p>
        <motion.div className="mt-10" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}>
          <a href="#start" className="pill-btn bg-white text-navy-900 hover:scale-105 transition-transform inline-flex items-center gap-2">ابدأ التعلّم <ArrowRight size={16} /></a>
        </motion.div>
        <motion.div className="mt-14 flex flex-wrap justify-center gap-8 sm:gap-16" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}>
          {[{ icon: <BookOpen size={18} />, val: '500+', label: 'درس تفاعلي' }, { icon: <Users size={18} />, val: '10K+', label: 'طالب مسجل' }, { icon: <GraduationCap size={18} />, val: '98%', label: 'نسبة الرضا' }].map((s, i) => (
            <motion.div key={i} className="flex flex-col items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.7 + i * 0.15 }}>
              <div className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-white/80">{s.icon}</div>
              <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>{s.val}</span>
              <span className="text-xs text-white/40">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
        <span className="text-xs text-white/30">اسحب للأسفل</span>
        <div className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center pt-1.5">
          <motion.div className="w-1 h-2 rounded-full bg-white/50" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
      </motion.div>
    </section>
  );
}

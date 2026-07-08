import { useState, useEffect, useRef } from 'react';
import { Award, Zap, Globe, TrendingUp } from 'lucide-react';
import { useLang } from '../../lib/useLang';
import { translations } from '../../lib/i18n';

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatItem({ target, suffix, label, icon, color, start }: { target: number; suffix: string; label: string; icon: React.ReactNode; color: string; start: boolean }) {
  const count = useCountUp(target, 2000, start);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color }}>{icon}</div>
      <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, color: 'white', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '8px' }}>{count.toLocaleString()}{suffix}</div>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

export default function StatsSection() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const s = translations.stats;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { target: 50421, suffix: '+', label: s.activeStudents[lang], icon: <TrendingUp size={24} />, color: '#6EB5FF' },
    { target: 200,   suffix: '+', label: s.coursesAvailable[lang], icon: <Award size={24} />, color: '#6BBF7A' },
    { target: 98,    suffix: '%', label: s.completionRate[lang], icon: <Zap size={24} />, color: '#F4845F' },
    { target: 45,    suffix: '+', label: s.countriesReached[lang], icon: <Globe size={24} />, color: '#E882B4' },
  ];

  return (
    <section ref={ref} style={{ background: '#0a0a14', padding: '100px 40px', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(249,115,22,0.05), transparent)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.badge[lang]}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {s.heading[lang]}<br /><span style={{ color: 'rgba(255,255,255,0.4)' }}>{s.sub[lang]}</span>
          </h2>
        </div>
        <div className="reveal-3d" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px' }}>
          {stats.map((stat) => <StatItem key={stat.label} {...stat} start={started} />)}
        </div>
        <div className="liquid-glass reveal" style={{ marginTop: '80px', padding: '32px 40px', borderRadius: '24px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.5, maxWidth: '700px', margin: '0 auto' }}>
            {s.quote[lang]}
          </p>
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>— Albert Einstein</p>
        </div>
      </div>
    </section>
  );
}

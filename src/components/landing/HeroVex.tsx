import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../../lib/useLang';
import { translations } from '../../lib/i18n';
import { LangSwitcher } from '../LangSwitcher';

function AnimatedHeading({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(2.8rem, 6.5vw, 6rem)', fontWeight: 700, color: 'white', lineHeight: 1.08, letterSpacing: '-0.03em', WebkitFontSmoothing: 'antialiased' }}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} style={{ display: 'block' }}>
          {line.split('').map((char, charIdx) => {
            const globalIdx = lines.slice(0, lineIdx).reduce((acc, l) => acc + l.length, 0) + charIdx;
            return (
              <span key={charIdx} style={{ display: 'inline-block', opacity: 0, transform: 'translateY(30px)', filter: 'blur(4px)', animation: `char-reveal 500ms cubic-bezier(0.4,0,0.2,1) ${200 + globalIdx * 30}ms forwards`, whiteSpace: char === ' ' ? 'pre' : 'normal' }}>
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function FadeIn({ children, delay = 0, duration = 800 }: { children: React.ReactNode; delay?: number; duration?: number }) {
  return <div style={{ opacity: 0, animation: `fade-in ${duration}ms ease ${delay}ms forwards` }}>{children}</div>;
}

export default function HeroVex() {
  const [bgLoaded, setBgLoaded] = useState(false);
  const { lang, dir } = useLang();
  const nav = translations.nav;
  const hero = translations.hero;

  const NAV_LINKS = [
    { key: 'courses', label: nav.courses[lang] },
    { key: 'instructors', label: nav.instructors[lang] },
    { key: 'community', label: nav.community[lang] },
    { key: 'pricing', label: nav.pricing[lang] },
  ];

  useEffect(() => {
    const img = new Image();
    img.src = 'https://images.pexels.com/photos/9159039/pexels-photo-9159039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
    img.onload = () => setBgLoaded(true);
  }, []);

  return (
    <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }} dir={dir}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #0a1628 100%)', transition: 'opacity 1s ease' }}>
        <img src="https://images.pexels.com/photos/9159039/pexels-photo-9159039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bgLoaded ? 0.35 : 0, transition: 'opacity 1.2s ease' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,15,35,0.6) 0%, rgba(5,15,30,0.5) 50%, rgba(8,20,40,0.55) 100%)' }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '24px', fontWeight: 400, color: 'white', letterSpacing: '0.04em' }}>NEXA LEARN</span>
        <div className="liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '28px', padding: '10px 24px', borderRadius: '999px' }}>
          {NAV_LINKS.map((link) => (
            <a key={link.key} href={`#${link.key}`} style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color 200ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)'; }}>
              {link.label}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LangSwitcher compact />
          <a href="#start" className="liquid-glass" style={{ padding: '10px 22px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 200ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}>
            {nav.startLearning[lang]}
            <ArrowRight size={14} />
          </a>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: dir === 'rtl' ? '0 80px 0 40px' : '0 40px 0 80px', maxWidth: '900px' }}>
        <AnimatedHeading text={hero.heading[lang]} />
        <FadeIn delay={1200} duration={1000}>
          <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '520px', marginTop: '28px', fontWeight: 400 }}>
            {hero.subheading[lang]}
          </p>
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <div style={{ display: 'flex', gap: '16px', marginTop: '40px', flexWrap: 'wrap' }}>
            <a href="#courses" style={{ padding: '14px 32px', borderRadius: '999px', background: 'white', color: '#0a0a1a', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 200ms ease, box-shadow 200ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 16px 40px rgba(255,255,255,0.25)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}>
              {nav.startLearning[lang]}<ArrowRight size={16} />
            </a>
            <a href="#courses" className="liquid-glass" style={{ padding: '14px 32px', borderRadius: '999px', color: 'white', fontSize: '14px', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 200ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}>
              {nav.exploreCourses[lang]}
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Right glass tag */}
      <FadeIn delay={1400} duration={800}>
        <div className="liquid-glass" style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 60, padding: '24px 20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '180px' }}>
          {(hero.words[lang] as string[]).map((word: string) => (
            <div key={word} style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', fontWeight: 600, color: 'white', letterSpacing: '-0.02em' }}>{word}</div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

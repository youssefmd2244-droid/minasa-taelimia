import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#home', active: true },
  { label: 'Courses', href: '#courses' },
  { label: 'Instructors', href: '#instructors' },
  { label: 'Journal', href: '#journal' },
  { label: 'Contact Us', href: '#contact' },
];

// Fallback gradient background if video not available
const FALLBACK_BG =
  'linear-gradient(135deg, #001a2e 0%, #003355 30%, #004466 60%, #001a2e 100%)';

export default function HeroVideo() {
  const [videoError, setVideoError] = useState(true); // default to gradient since no video file

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Background */}
      {!videoError ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/assets/hero-video.mp4" type="video/mp4" />
        </video>
      ) : (
        /* Animated gradient fallback */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background: FALLBACK_BG,
          }}
        >
          {/* Animated orbs */}
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(0,120,220,0.25) 0%, transparent 70%)',
              top: '-100px',
              right: '-100px',
              animation: 'float-slow 12s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(0,180,160,0.2) 0%, transparent 70%)',
              bottom: '10%',
              left: '10%',
              animation: 'float-slow 16s ease-in-out infinite reverse',
            }}
          />
          {/* Classroom image overlay */}
          <img
            src="https://images.pexels.com/photos/7777691/pexels-photo-7777691.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
            alt="Classroom"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.25,
              mixBlendMode: 'luminosity',
            }}
          />
        </div>
      )}

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,30,60,0.5) 0%, rgba(0,20,40,0.7) 50%, rgba(0,10,25,0.85) 100%)',
          zIndex: 1,
        }}
      />

      {/* Navigation */}
      <nav
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <a
          href="#home"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '22px',
            color: 'white',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          Maktab<sup style={{ fontSize: '11px', verticalAlign: 'super' }}>®</sup>
        </a>

        {/* Desktop Nav */}
        <div
          className="liquid-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            padding: '12px 28px',
            borderRadius: '999px',
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`nav-link ${link.active ? 'active' : ''}`}
              style={{
                fontSize: '13px',
                fontWeight: link.active ? 600 : 400,
                color: link.active ? 'white' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
                display: window.innerWidth < 768 ? 'none' : 'block',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#courses"
          className="liquid-glass"
          style={{
            padding: '10px 22px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'white',
            textDecoration: 'none',
            transition: 'transform 200ms ease, background 200ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
          }}
        >
          Start Learning
          <ArrowRight size={14} strokeWidth={2} />
        </a>
      </nav>

      {/* Hero Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        {/* Badge */}
        <div
          className="liquid-glass"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            marginBottom: '28px',
            animation: 'fade-rise 0.8s cubic-bezier(0.4,0,0.2,1) both',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#4ade80',
              display: 'inline-block',
              boxShadow: '0 0 8px rgba(74,222,128,0.8)',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Maktab Academy — Now Enrolling
          </span>
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(2.8rem, 7vw, 6.5rem)',
            fontWeight: 400,
            color: 'white',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: '800px',
            marginBottom: '28px',
            animation: 'fade-rise 0.9s cubic-bezier(0.4,0,0.2,1) both',
          }}
        >
          Where{' '}
          <em
            className="not-italic"
            style={{ color: 'rgba(180,210,255,0.85)' }}
          >
            curiosity rises
          </em>{' '}
          through{' '}
          <em
            className="not-italic"
            style={{ color: 'rgba(180,210,255,0.85)' }}
          >
            knowledge.
          </em>
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.7,
            maxWidth: '560px',
            marginBottom: '40px',
            animation: 'fade-rise 0.9s 0.2s cubic-bezier(0.4,0,0.2,1) both',
          }}
        >
          We're building tools for curious minds, dedicated learners, and
          lifelong students. Amid the noise, we create focused spaces for deep
          study and real growth.
        </p>

        {/* CTA */}
        <a
          href="#courses"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 36px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 500,
            textDecoration: 'none',
            marginTop: '8px',
            transition: 'transform 200ms ease, background 200ms ease',
            animation: 'fade-rise 0.9s 0.4s cubic-bezier(0.4,0,0.2,1) both',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform =
              'scale(1.03)';
            (e.currentTarget as HTMLAnchorElement).style.background =
              'rgba(255,255,255,0.18)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLAnchorElement).style.background =
              'rgba(255,255,255,0.12)';
          }}
        >
          Start Learning
          <ArrowRight size={18} strokeWidth={2} />
        </a>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            marginTop: '64px',
            animation: 'fade-rise 0.9s 0.6s cubic-bezier(0.4,0,0.2,1) both',
          }}
        >
          {[
            { num: '50K+', label: 'Students' },
            { num: '200+', label: 'Courses' },
            { num: '98%', label: 'Completion' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  color: 'white',
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {stat.num}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: '1px',
            height: '40px',
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
            animation: 'scroll-indicator 1.5s ease infinite',
          }}
        />
      </div>
    </section>
  );
}

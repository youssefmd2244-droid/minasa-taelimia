import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Courses', href: '#courses' },
  { label: 'Instructors', href: '#instructors' },
  { label: 'About', href: '#about' },
];

export default function GlobalNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!scrolled) return null; // Hide when at top (each hero has its own nav)

  return (
    <>
      {/* Fixed global nav — appears after scrolling past first hero */}
      <nav
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          padding: '12px 28px',
          borderRadius: '999px',
          background: 'rgba(10,10,20,0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          animation: 'fade-rise 0.4s ease both',
          maxWidth: 'calc(100vw - 40px)',
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: '16px',
            color: '#f97316',
            letterSpacing: '0.06em',
          }}
        >
          EDU
        </span>

        {/* Links */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'white';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#courses"
          style={{
            padding: '8px 18px',
            borderRadius: '999px',
            background: '#f97316',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 200ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#ea580c';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#f97316';
          }}
        >
          Enroll Free
          <ArrowRight size={13} />
        </a>
      </nav>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 10000,
          display: 'none', // shown via media query workaround
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(10,10,20,0.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'white',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </>
  );
}

import { ArrowRight, BookOpen, Mail, Phone, MapPin, Settings } from 'lucide-react';
import { useLang } from '../../lib/useLang';
import { translations } from '../../lib/i18n';
import { LangSwitcher } from '../LangSwitcher';

interface FooterProps { onOpenAdmin?: () => void; }

export default function Footer({ onOpenAdmin }: FooterProps) {
  const { lang } = useLang();
  const f = translations.footer;
  const subjects = f.subjectsList[lang] as string[];
  const links = f.linksList[lang] as string[];

  return (
    <footer style={{ background: '#0a0a14', color: 'white', fontFamily: "'Inter', sans-serif", borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* CTA Banner */}
      <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '64px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 400, color: 'white', letterSpacing: '-0.01em', marginBottom: '16px', lineHeight: 1.1 }}>{f.ctaHeading[lang]}</h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.6 }}>{f.ctaSub[lang]}</p>
        <a href="#enroll" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 40px', borderRadius: '999px', background: 'white', color: '#ea580c', fontSize: '15px', fontWeight: 700, textDecoration: 'none', transition: 'all 250ms ease' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}>
          {f.ctaBtn[lang]}<ArrowRight size={18} />
        </a>
      </div>

      {/* Main Footer */}
      <div style={{ padding: '64px 40px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '28px', color: 'white', letterSpacing: '0.04em', marginBottom: '16px' }}>EDUVERSE</div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: '24px', maxWidth: '280px' }}>{f.description[lang]}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[{ icon: <Mail size={14} />, text: 'hello@eduverse.edu' }, { icon: <Phone size={14} />, text: '+20 100 123 4567' }, { icon: <MapPin size={14} />, text: lang === 'en' ? 'Cairo, Egypt' : 'القاهرة، مصر' }].map((item) => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                  <span style={{ color: '#f97316' }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
          </div>
          {/* Subjects */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>{f.subjects[lang]}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {subjects.map((label) => (
                <a key={label} href="#" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 200ms ease' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)'; }}>{label}</a>
              ))}
            </div>
          </div>
          {/* Links */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>{f.platform[lang]}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {links.map((label) => (
                <a key={label} href="#" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 200ms ease' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)'; }}>{label}</a>
              ))}
            </div>
          </div>
          {/* Newsletter */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>{f.newsletter[lang]}</h4>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '16px' }}>{f.newsletterSub[lang]}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="email" placeholder="your@email.com" dir="ltr" style={{ padding: '11px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', outline: 'none' }} />
              <button style={{ padding: '11px', borderRadius: '10px', background: '#f97316', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ea580c'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f97316'; }}>
                {f.subscribe[lang]}<ArrowRight size={14} />
              </button>
            </div>
            <div style={{ marginTop: '24px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="#f97316" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f97316' }}>{f.accredited[lang]}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{f.accreditedSub[lang]}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', marginBottom: '28px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>{f.rights[lang]}</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>{f.madeWith[lang]}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LangSwitcher compact />
            <button onClick={onOpenAdmin} title={translations.admin.dashboard[lang]} aria-label={translations.admin.openAdmin[lang]}
              style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 200ms ease, background 200ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; }}>
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

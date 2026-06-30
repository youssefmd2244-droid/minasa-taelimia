import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import LanguageSwitcher from './i18n/LanguageSwitcher';
import IntroSplash from './components/IntroSplash';
import HeroCarousel from './components/landing/HeroCarousel';
import AcademyShowcase from './components/landing/AcademyShowcase';
import AdminDashboard from './components/admin/AdminDashboard';
import DeveloperCredit from './components/landing/DeveloperCredit';
import StudentComments from './components/landing/StudentComments';
import { useScrollReveal } from './hooks/useScrollReveal';

// ===== Password gate inline =====
const ADMIN_PASS = '20042007';

function PasswordGate({ onEnter }: { onEnter: () => void }) {
  const { t, dir } = useLanguage();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (pw === ADMIN_PASS) { onEnter(); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };
  return (
    <div dir={dir} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,5,16,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '360px', padding: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '6px' }}>{t('admin_title')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px' }}>{t('admin_subtitle')}</p>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="••••••••"
          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: err ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)', border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`, color: 'white', fontSize: '16px', outline: 'none', textAlign: 'center', marginBottom: '12px', transition: 'border 200ms' }} />
        {err && <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '10px' }}>{t('admin_wrong')}</p>}
        <button onClick={submit} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f97316', border: 'none', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>{t('admin_login')}</button>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { t, dir } = useLanguage();
  // Show intro immediately — no delay
  const [showIntro, setShowIntro] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [adminPassword, setAdminPassword] = useState(ADMIN_PASS);
  const gearRef = useRef<HTMLButtonElement>(null);

  // Scroll reveal
  useScrollReveal();

  // Hash routing for /admin
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#/admin') setShowPasswordGate(true);
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setShowPasswordGate(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Persistent storage
  useEffect(() => {
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  }, []);

  // Show admin after password
  const enterAdmin = () => {
    setShowPasswordGate(false);
    setShowAdmin(true);
    window.location.hash = '/admin';
  };

  const exitAdmin = () => {
    setShowAdmin(false);
    setShowPasswordGate(false);
    window.location.hash = '';
  };

  if (showAdmin) {
    return (
      <div dir={dir}>
        <button onClick={exitAdmin} style={{ position: 'fixed', top: '16px', insetInlineStart: '16px', zIndex: 100, padding: '8px 20px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← {t('admin_exit')}
        </button>
        <AdminDashboard currentPassword={adminPassword} onPasswordChange={setAdminPassword} />
      </div>
    );
  }

  return (
    <div className="relative" dir={dir}>
      {/* Password gate */}
      <AnimatePresence>
        {showPasswordGate && <PasswordGate onEnter={enterAdmin} />}
      </AnimatePresence>

      {/* Intro Splash — renders immediately */}
      <AnimatePresence>
        {showIntro && <IntroSplash onFinish={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        padding: navScrolled ? '10px 0' : '18px 0',
        background: navScrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        transition: 'all 300ms ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', color: 'white', fontWeight: 900, letterSpacing: '0.02em' }}>
              EDUVERSE
            </span>
            <div style={{ display: 'none' }} className="md-flex">
              {[t('nav_home'), t('nav_courses'), t('nav_instructors'), t('nav_blog')].map((link) => (
                <a key={link} href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', marginInlineEnd: '20px', transition: 'color 200ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                  {link}
                </a>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              ref={gearRef}
              onClick={() => setShowPasswordGate(true)}
              title={t('admin_settings')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Settings size={16} className="gear-spin" />
            </button>
            <LanguageSwitcher />
            <a href="#start" style={{ padding: '8px 20px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', transition: 'background 200ms' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.18)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)')}>
              {t('nav_start')}
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Landing Sections ─── */}
      <div className="bottom-nav-safe">
        <HeroCarousel />
        <AcademyShowcase />
        <StudentComments />
        <DeveloperCredit />

        {/* Footer */}
        <footer style={{ background: '#050510', padding: '60px 20px 40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '32px', marginBottom: '48px' }}>
              <div>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '22px', color: 'white' }}>EDUVERSE</span>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '12px', lineHeight: 1.7 }}>{t('footer_desc')}</p>
              </div>
              <div>
                <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '16px' }}>{t('footer_quick')}</h4>
                {[t('footer_link_about'), t('footer_link_how'), t('footer_link_academic'), t('footer_link_blog'), t('footer_link_privacy'), t('footer_link_terms')].map((link) => (
                  <a key={link} href="#" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', marginBottom: '8px' }}>{link}</a>
                ))}
              </div>
              <div>
                <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '16px' }}>{t('footer_subjects')}</h4>
                {[t('footer_subject_math'), t('footer_subject_science'), t('footer_subject_arabic'), t('footer_subject_design'), t('footer_subject_physics'), t('footer_subject_cs')].map((s) => (
                  <a key={s} href="#" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', marginBottom: '8px' }}>{s}</a>
                ))}
              </div>
              <div>
                <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '16px' }}>{t('footer_contact')}</h4>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.9 }}>info@eduverse.com<br />+20 100 000 0000</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{t('footer_copy')}</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>{t('footer_made')}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import LanguageSwitcher from './i18n/LanguageSwitcher';
import IntroSplash from './components/IntroSplash';
import HeroCarousel from './components/HeroCarousel';
import CinematicHero from './components/CinematicHero';
import VexStyleHero from './components/VexStyleHero';
import AcademyShowcase from './components/AcademyShowcase';
import AdminDashboard from './components/AdminDashboard';
import DeveloperCredit from './components/DeveloperCredit';

function AppContent() {
  const { t, dir } = useLanguage();
  const [showIntro, setShowIntro] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  // Hash routing for /admin
  useEffect(() => {
    const checkHash = () => setShowAdmin(window.location.hash === '#/admin');
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+A → toggle admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setShowAdmin((prev) => {
          const next = !prev;
          if (next) window.location.hash = '/admin';
          else window.location.hash = '';
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll tracking for nav bar + section dots
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 80);
      const section1 = document.querySelector('.snap-section');
      if (section1) {
        const rect1 = section1.getBoundingClientRect();
        if (rect1.bottom < window.innerHeight / 2) {
          const coursesSection = document.getElementById('courses');
          if (coursesSection) {
            const rect2 = coursesSection.getBoundingClientRect();
            if (rect2.top < window.innerHeight / 2) setActiveSection(3);
            else setActiveSection(1);
          } else setActiveSection(1);
        } else setActiveSection(0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Request persistent storage
  useEffect(() => {
    if (navigator.storage?.persist) {
      navigator.storage.persist().then(() => {}).catch(() => {});
    }
  }, []);

  if (showAdmin) {
    return (
      <div dir={dir}>
        <button
          onClick={() => { setShowAdmin(false); window.location.hash = ''; }}
          className="fixed top-4 left-4 z-[100] px-4 py-2 rounded-full liquid-glass text-white text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <span className="text-xs">←</span>
          {dir === 'rtl' ? 'العودة للموقع' : 'Back to Site'}
        </button>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="relative" dir={dir}>
      {/* Intro Splash */}
      <AnimatePresence>
        {showIntro && <IntroSplash onFinish={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          navScrolled ? 'py-2' : 'py-4'
        }`}
        style={{
          background: navScrolled ? 'rgba(10,10,15,0.9)' : 'transparent',
          backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.span
              className="text-white font-bold text-lg tracking-wider"
              style={{ fontFamily: "'Anton', sans-serif" }}
              animate={{
                textShadow: [
                  '0 0 10px rgba(255,0,100,0.3), 0 0 20px rgba(0,255,100,0.15)',
                  '0 0 10px rgba(0,255,100,0.3), 0 0 20px rgba(0,100,255,0.15)',
                  '0 0 10px rgba(0,100,255,0.3), 0 0 20px rgba(255,0,100,0.15)',
                  '0 0 10px rgba(255,0,100,0.3), 0 0 20px rgba(0,255,100,0.15)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              EDUVERSE
            </motion.span>
            <div className="hidden md:flex items-center gap-6">
              {[t('nav_home'), t('nav_courses'), t('nav_instructors'), t('nav_blog')].map((link) => (
                <a key={link} href="#" className="text-xs text-white/50 hover:text-white transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <a href="#start" className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors border border-white/10">
              {t('nav_start')}
            </a>
          </div>
        </div>
      </nav>

      {/* Section Dot Navigation */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <a
            key={i}
            href={i === 0 ? '#' : i === 3 ? '#courses' : '#'}
            className="block w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: activeSection === i ? 'white' : 'rgba(255,255,255,0.2)',
              transform: activeSection === i ? 'scale(1.5)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Visible Settings Gear — opens admin password gate */}
      <motion.button
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={dir === 'rtl' ? 'لوحة التحكم' : 'Admin'}
        aria-label="Admin settings"
      >
        <Settings size={20} />
      </motion.button>

      {/* ─── Landing Sections ─── */}
      <HeroCarousel />
      <CinematicHero />
      <VexStyleHero />
      <AcademyShowcase />

      {/* ─── Developer Credit + Global Presence ─── */}
      <DeveloperCredit />

      {/* ─── Footer ─── */}
      <footer className="relative w-full py-16 px-4 sm:px-8" style={{ background: '#050510' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white text-xl font-bold" style={{ fontFamily: "'Anton', sans-serif" }}>EDUVERSE</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">{t('footer_desc')}</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('footer_quick')}</h4>
              <ul className="space-y-2">
                {[t('footer_link_about'), t('footer_link_how'), t('footer_link_academic'), t('footer_link_blog'), t('footer_link_privacy'), t('footer_link_terms')].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('footer_subjects')}</h4>
              <ul className="space-y-2">
                {[t('footer_subject_math'), t('footer_subject_science'), t('footer_subject_arabic'), t('footer_subject_design'), t('footer_subject_physics'), t('footer_subject_cs')].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('footer_contact')}</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li>info@eduverse.com</li>
                <li>+966 50 000 0000</li>
                <li>{dir === 'rtl' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</li>
              </ul>
            </div>
          </div>

          {/* CTA Banner with RGB pulse */}
          <motion.div
            className="rounded-2xl p-8 sm:p-10 text-center mb-12"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            animate={{
              boxShadow: [
                '0 0 0px rgba(255,0,100,0)',
                '0 0 30px rgba(255,0,100,0.08), 0 0 60px rgba(0,255,100,0.04)',
                '0 0 30px rgba(0,255,100,0.08), 0 0 60px rgba(0,100,255,0.04)',
                '0 0 30px rgba(0,100,255,0.08), 0 0 60px rgba(255,0,100,0.04)',
                '0 0 0px rgba(255,0,100,0)',
              ],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{t('footer_cta_title')}</h3>
            <p className="text-sm text-white/40 mb-6 max-w-lg mx-auto">{t('footer_cta_desc')}</p>
            <motion.a
              href="#start"
              className="inline-block pill-btn bg-white text-navy-900 font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  '0 0 0px rgba(255,255,255,0)',
                  '0 0 15px rgba(255,0,100,0.2), 0 0 30px rgba(0,255,100,0.1)',
                  '0 0 15px rgba(0,100,255,0.2), 0 0 30px rgba(255,0,100,0.1)',
                  '0 0 0px rgba(255,255,255,0)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {t('footer_cta_btn')}
            </motion.a>
          </motion.div>

          <div
            className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs text-white/30">{t('footer_copy')}</p>
            <p className="text-xs text-white/20 flex items-center gap-1">
              {t('footer_made')}
              <span className="text-[8px] text-white/8 px-1 select-none">·</span>
              <a href="#/admin" className="text-[8px] text-white/5 hover:text-white/20 transition-colors select-none cursor-default" title="">•</a>
            </p>
          </div>
        </div>
      </footer>
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

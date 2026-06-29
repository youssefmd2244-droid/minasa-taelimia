import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/landing/LandingPage';
import AdminDashboard from './components/admin/AdminDashboard';
import PasswordGate from './components/admin/PasswordGate';
import IntroSplash from './components/IntroSplash';

type View = 'landing' | 'admin-gate' | 'admin';

// ── Global admin password — lives here so PasswordGate + Settings both share it ──
const STORED_KEY = 'edu_admin_pw';
function loadPassword(): string {
  return localStorage.getItem(STORED_KEY) || '20042007';
}

function App() {
  const [view, setView] = useState<View>('landing');
  const [showIntro, setShowIntro] = useState(true);
  const [adminPassword, setAdminPassword] = useState<string>(loadPassword);

  // Persist whenever password changes
  useEffect(() => {
    localStorage.setItem(STORED_KEY, adminPassword);
  }, [adminPassword]);

  // Check URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin' || hash === '#/admin') {
      setView('admin-gate');
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (p === '/admin' || h === '#/admin') {
        setView('admin-gate');
      } else {
        setView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ctrl+Shift+A keyboard shortcut → admin gate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setView('admin-gate');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hidden footer link /admin click handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const href = target.getAttribute('href');
      if (href === '/admin') {
        e.preventDefault();
        setView('admin-gate');
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ── Render ──
  if (view === 'admin-gate') {
    return (
      <PasswordGate
        currentPassword={adminPassword}
        onSuccess={() => setView('admin')}
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminDashboard
        currentPassword={adminPassword}
        onPasswordChange={(pw: string) => setAdminPassword(pw)}
      />
    );
  }

  // Landing — always show IntroSplash first on every page load
  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <IntroSplash onFinish={() => setShowIntro(false)} />
        )}
      </AnimatePresence>
      {/* LandingPage loads behind the splash */}
      <LandingPage onOpenAdmin={() => setView('admin-gate')} />
    </>
  );
}

export default App;

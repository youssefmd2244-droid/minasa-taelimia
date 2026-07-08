import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Search as SearchIcon, BookOpen, Share2, ArrowRight, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { requestStoragePermissionOnLaunch } from './lib/deviceStorage';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import LanguageSwitcher from './i18n/LanguageSwitcher';
import IntroSplash from './components/IntroSplash';
import SearchOverlay from './components/SearchOverlay';
import SectionsExplorer from './components/SectionsExplorer';
import HeroCarousel from './components/landing/HeroCarousel';
import AcademyShowcase from './components/landing/AcademyShowcase';
import AdminDashboard from './components/admin/AdminDashboard';
import DeveloperCredit from './components/landing/DeveloperCredit';
import StudentComments from './components/landing/StudentComments';
import GlobalPresence from './components/landing/GlobalPresence';
import CoursesGallerySection from './components/landing/CoursesGallerySection';
import LessonsPreviewSection from './components/landing/LessonsPreviewSection';
import { useScrollReveal } from './hooks/useScrollReveal';
import { useAppBranding } from './hooks/useAppBranding';

// ===== Password gate inline =====
const ADMIN_PASS = '20042007';

function PasswordGate({ onEnter, onClose }: { onEnter: () => void; onClose: () => void }) {
  const { t, dir } = useLanguage();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    // يدعم تغيير الباسورد من الإعدادات
    const saved = localStorage.getItem('admin_password') || ADMIN_PASS;
    if (pw === saved) { onEnter(); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };
  return (
    <div dir={dir} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,5,16,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* زرار رجوع (يمين/شمال حسب اتجاه اللغة) وزرار إغلاق فوق الشاشة —
          عشان تقدر تقفل شاشة كلمة المرور وترجع للصفحة الرئيسية من غير
          ما تحتاج تستخدم زرار الرجوع بتاع النظام. */}
      <button
        onClick={onClose}
        aria-label={dir === 'rtl' ? 'رجوع' : 'Back'}
        title={dir === 'rtl' ? 'رجوع' : 'Back'}
        style={{
          position: 'fixed', top: '18px', [dir === 'rtl' ? 'right' : 'left']: '18px', zIndex: 10000,
          width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer',
        }}
      >
        <ArrowRight size={17} style={{ transform: dir === 'rtl' ? 'none' : 'scaleX(-1)' }} />
      </button>
      <button
        onClick={onClose}
        aria-label={dir === 'rtl' ? 'إغلاق' : 'Close'}
        title={dir === 'rtl' ? 'إغلاق' : 'Close'}
        style={{
          position: 'fixed', top: '18px', [dir === 'rtl' ? 'left' : 'right']: '18px', zIndex: 10000,
          width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer',
        }}
      >
        <X size={18} />
      </button>
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

// بيحول ملف (Blob) لنص base64 عادي (من غير بادئة "data:...;base64,")
// عشان نقدر نكتبه كملف حقيقي على تخزين الجهاز عن طريق Filesystem.
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function AppContent() {
  const { t, dir } = useLanguage();
  // Show intro immediately — no delay
  const [showIntro, setShowIntro] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [adminPassword, setAdminPassword] = useState(ADMIN_PASS);
  const gearRef = useRef<HTMLButtonElement>(null);

  // Scroll reveal
  useScrollReveal();
  // اسم/أيقونة التطبيق المتزامنة من لوحة الإدارة (تبويب المتصفح + فافيكون)
  useAppBranding();

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

  // Keyboard shortcut: Ctrl+K opens search (common convention, also handy on desktop)
  useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
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

  // طلب إذن التخزين فورًا أول ما التطبيق يفتح — زي أي تطبيق أندرويد
  // عادي، بدل ما نستنى لحد ما الأدمن يفتح الإعدادات ويغيّر مكان التخزين.
  useEffect(() => {
    void requestStoragePermissionOnLaunch();
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

  // مشاركة ملف التطبيق (APK) — أو على الأقل رابط تحميل مباشر ليه —
  // عشان اللي هيستلمه في واتساب/تليجرام يقدر يحمّله ويثبّته.
  //
  // ملحوظة مهمة اتعلمناها من التجربة اللي فاتت: نداء navigator.share
  // لازم يحصل *جوه* حدث الضغطة على الزرار بسرعة، من غير ما ننتظر
  // طلبات شبكة (fetch) قبله — المتصفح بيعتبر "إذن اللمسة" (user
  // gesture) انتهى لو استنينا كتير قبل ما نناديه، فيرفض المشاركة
  // بصمت من غير أي رسالة، وده اللي كان بيخلّي الزرار "مايعملش حاجة".
  // فدلوقتي بنتأكد الأول (من غير أي شبكة) هل المتصفح أصلاً بيقبل
  // مشاركة ملف APK، ولو لأ (وده الغالب — كروم وغيره بيمنعوا مشاركة
  // ملفات .apk كملفات تنفيذية لأسباب أمنية) بنشارك رابط تحميل مباشر
  // للملف على طول من غير أي تأخير.
  const APK_URL = '/app-release.apk';
  const APK_FILENAME = 'EDUVERSE.apk';
  const apkDownloadUrl = `${window.location.origin}${APK_URL}`;

  const handleShareApp = async () => {
    // التطبيق المثبّت على الموبايل بيشتغل جوه WebView أندرويد، وده مش
    // بيدعم navigator.share خالص، وكمان لو شاركنا رابط زي
    // "https://localhost/app-release.apk" مش هيفتح عند حد تاني — لأن
    // "localhost" هنا معناها "التطبيق نفسه جوه الجهاز ده بس"، مش سيرفر
    // حقيقي على الإنترنت. عشان كده بدل ما نشارك رابط، بناخد ملف الـ
    // APK المرفق جوه التطبيق نفسه ونكتبه كملف حقيقي على تخزين الجهاز
    // (Filesystem)، وبعدين نشاركه كملف فعلي (مش رابط) عن طريق أندرويد
    // — وده اللي هيخلّي واتساب/تليجرام يبعتوا الملف الحقيقي القابل
    // للتثبيت لأي حد.
    if (Capacitor.isNativePlatform()) {
      try {
        // لو كتبنا الملف قبل كده على الجهاز (من مشاركة سابقة)، بنشاركه
        // على طول من غير ما نعيد التحميل/الكتابة التقيلة تاني.
        let fileUri: string | null = null;
        try {
          const stat = await Filesystem.stat({ path: APK_FILENAME, directory: Directory.Cache });
          if (stat && stat.size > 0) {
            const existing = await Filesystem.getUri({ path: APK_FILENAME, directory: Directory.Cache });
            fileUri = existing.uri;
          }
        } catch {
          // الملف مش موجود لسه، هنكتبه تحت.
        }

        if (!fileUri) {
          const res = await fetch(APK_URL);
          const blob = await res.blob();
          const base64 = await blobToBase64(blob);

          // مهم جداً: ممنوع نبعت الـ base64 كله (~١٦ ميجا حرف) دفعة واحدة
          // عبر جسر Capacitor (bridge) — ده اللي كان بيسبب "هنج" (ANR)
          // يخلي أندرويد يقفل التطبيق بالقوة على الأجهزة الأضعف. بدل كده
          // بنقسّمه لأجزاء صغيرة (لازم يكون حجم كل جزء من مضاعفات ٤ عشان
          // فك تشفير base64 يفضل صحيح) ونكتبها بالتتابع.
          const CHUNK_SIZE = 300_000; // ~225 كيلوبايت فعلية لكل جزء
          const firstChunk = base64.slice(0, CHUNK_SIZE);
          const written = await Filesystem.writeFile({
            path: APK_FILENAME,
            directory: Directory.Cache,
            data: firstChunk,
            recursive: true,
          });
          fileUri = written.uri;

          for (let offset = CHUNK_SIZE; offset < base64.length; offset += CHUNK_SIZE) {
            const chunk = base64.slice(offset, offset + CHUNK_SIZE);
            await Filesystem.appendFile({
              path: APK_FILENAME,
              directory: Directory.Cache,
              data: chunk,
            });
            // فرصة صغيرة لخيط الواجهة يتنفس بين كل جزء وجزء.
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        await Share.share({
          title: 'EDUVERSE',
          text: t('nav_start'),
          dialogTitle: t('share_app'),
          files: [fileUri as string],
        });
        return;
      } catch (err) {
        if ((err as { message?: string })?.message?.toLowerCase().includes('cancel')) return;
        window.alert(t('share_app_failed'));
        return;
      }
    }

    // لو التطبيق شغال كموقع عادي في متصفح (مش جوه النسخة المثبّتة)
    // بنستخدم Web Share API العادية بنفس الترتيب اللي كان شغال قبل كده.
    const dummyFile = new File([new Uint8Array(1)], APK_FILENAME, {
      type: 'application/vnd.android.package-archive',
    });
    const canShareApkFile =
      typeof navigator.canShare === 'function' && navigator.canShare({ files: [dummyFile] });

    if (navigator.share && canShareApkFile) {
      try {
        const res = await fetch(APK_URL);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], APK_FILENAME, { type: 'application/vnd.android.package-archive' });
          await navigator.share({ files: [file], title: 'EDUVERSE', text: t('nav_start') });
          return;
        }
      } catch {
        // نكمل على البديل تحت
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: 'EDUVERSE', text: t('nav_start'), url: apkDownloadUrl });
        return;
      } catch {
        // نكمل على البديل تحت
      }
    }

    try {
      await navigator.clipboard.writeText(apkDownloadUrl);
      window.alert(t('share_app_copied'));
    } catch {
      window.prompt(t('share_app'), apkDownloadUrl);
    }
  };

  if (showAdmin) {
    return (
      <div dir={dir} style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', background: '#0a0a1a' }}>
        <AdminDashboard
          currentPassword={adminPassword}
          onPasswordChange={setAdminPassword}
          onExit={exitAdmin}
        />
      </div>
    );
  }

  return (
    <div className="relative" dir={dir}>
      {/* Password gate */}
      <AnimatePresence>
        {showPasswordGate && <PasswordGate onEnter={enterAdmin} onClose={() => { setShowPasswordGate(false); if (window.location.hash === '#/admin') window.location.hash = ''; }} />}
      </AnimatePresence>

      {/* Real, functional search — reads the same live sections/content data as the rest of the app */}
      <SearchOverlay open={showSearch} onClose={() => setShowSearch(false)} />

      {/* شريط/نافذة الأقسام — بيقرأ نفس بيانات useSections/useContent الحية */}
      <SectionsExplorer open={showSections} onClose={() => setShowSections(false)} />

      {/* Intro Splash — renders immediately */}
      <AnimatePresence>
        {showIntro && <IntroSplash onFinish={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <nav className={navScrolled ? 'glass-premium' : ''} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        padding: navScrolled ? '10px 0' : '18px 0',
        background: navScrolled ? undefined : 'transparent',
        borderRadius: 0, borderInline: 'none', borderTop: 'none',
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
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowSections(true)}
              title={t('sections_open')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <BookOpen size={16} />
            </button>
            <button
              onClick={handleShareApp}
              title={t('share_app')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setShowSearch(true)}
              title={t('search_open')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <SearchIcon size={16} />
            </button>
            <button
              ref={gearRef}
              onClick={() => setShowPasswordGate(true)}
              title={t('admin_settings')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Settings size={16} className="gear-spin" />
            </button>
            <LanguageSwitcher />
            <a href="#start" className="nav-start-badge" style={{ padding: '8px 20px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', transition: 'background 200ms', whiteSpace: 'nowrap' }}
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

        {/* معرض الكورسات الدائري ثلاثي الأبعاد */}
        <CoursesGallerySection />

        {/* دروس مختارة — الميزة الفعلية لتنزيل الملفات (تظهر فقط للعناصر
            التي يفعّلها المعلّم من لوحة الإدارة، عبر useContent الحقيقي) */}
        <LessonsPreviewSection />

        {/* الانتشار الجغرافي مع الكرة الأرضية */}
        <GlobalPresence />

        <StudentComments />
        <DeveloperCredit />

        {/* Footer */}
        <footer style={{ background: '#050510', padding: '60px 20px 40px' }}>
          <div className="reveal" style={{ maxWidth: '1200px', margin: '0 auto' }}>
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

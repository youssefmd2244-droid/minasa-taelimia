import { useState, useEffect } from 'react';
import {
  Lock,
  Settings,
  BookOpen,
  FileText,
  MessageSquare,
  BarChart3,
  Trash2,
  Plus,
  Edit3,
  X,
  Check,
  Eye,
  EyeOff,
  Palette,
  Globe,
  Save,
  ArrowLeft,
  Home,
  Star,
  Shield,
  Power,
  Lightbulb,
  Bell,
  Image as ImageIcon,
  Video,
  UploadCloud,
  Type,
} from 'lucide-react';

const DEFAULT_PASSWORD = '20042007';
const REQUIRED_AUTH_CODE = 'Yy2004//';

type Tab = 'dashboard' | 'settings' | 'sections' | 'content' | 'comments' | 'analytics' | 'trash';

interface Section {
  id: number;
  title: string;
  isVisible: boolean;
  isDeleted: boolean;
  displayOrder: number;
}

interface ContentItem {
  id: number;
  sectionId: number;
  title: string;
  type: string; // 'video','image','text','pdf','word','powerpoint','excel','zip'
  contentBody: string; // description text (optional)
  fileUrl: string; // data URL for uploaded media (empty for text-only)
  isFeatured: boolean;
  showOnHome: boolean;
  allowDownload: boolean; // default false — per-item download control
  isDeleted: boolean;
}

interface Comment {
  id: number;
  contentId: number;
  userId: string;
  commentText: string;
  replyText: string | null;
  isVisible: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  // Load password from localStorage or use default
  const [currentPassword] = useState(() => {
    const stored = localStorage.getItem('admin_password');
    return stored || DEFAULT_PASSWORD;
  });
  const [accessed, setAccessed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Settings state
  const [appName, setAppName] = useState('EduVerse');
  const [themeColors, setThemeColors] = useState(['#F4845F', '#6BBF7A', '#E882B4', '#6EB5FF']);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rgbLighting, setRgbLighting] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [downloadFeatureEnabled, setDownloadFeatureEnabled] = useState(false); // Master toggle: reveals per-item download toggles in content tab
  const [storageInfo, setStorageInfo] = useState<{ used: string; total: string; percent: number }>({ used: '0 MB', total: '—', percent: 0 });
  const [cacheCleared, setCacheCleared] = useState(false);

  // Load storage info
  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((estimate) => {
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usedMB = (used / (1024 * 1024)).toFixed(1);
        const quotaGB = (quota / (1024 * 1024 * 1024)).toFixed(1);
        const percent = quota > 0 ? (used / quota * 100) : 0;
        setStorageInfo({ used: `${usedMB} MB`, total: `${quotaGB} GB`, percent });
      }).catch(() => {});
    }
  }, []);

  // Password change state (inside Settings tab)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Sections CRUD
  const [sections, setSections] = useState<Section[]>([
    { id: 1, title: 'المستوى الأول — رياضيات', isVisible: true, isDeleted: false, displayOrder: 1 },
    { id: 2, title: 'المستوى الثاني — علوم', isVisible: true, isDeleted: false, displayOrder: 2 },
    { id: 3, title: 'المستوى الأول — لغة عربية', isVisible: true, isDeleted: false, displayOrder: 3 },
    { id: 4, title: 'المستوى الثاني — فنون', isVisible: true, isDeleted: false, displayOrder: 4 },
  ]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Content CRUD
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    { id: 1, sectionId: 1, title: 'أساسيات الجبر', type: 'video', contentBody: 'شرح مبسط لأساسيات الجبر للمبتدئين', fileUrl: '', isFeatured: true, showOnHome: true, allowDownload: false, isDeleted: false },
    { id: 2, sectionId: 1, title: 'الهندسة التحليلية', type: 'text', contentBody: 'ملاحظات على الهندسة التحليلية والمستوى الإحداثي', fileUrl: '', isFeatured: false, showOnHome: false, allowDownload: false, isDeleted: false },
    { id: 3, sectionId: 2, title: 'التجارب العلمية', type: 'pdf', contentBody: 'ملف شامل للتجارب العلمية', fileUrl: '', isFeatured: true, showOnHome: true, allowDownload: false, isDeleted: false },
    { id: 4, sectionId: 3, title: 'النحو والصرف', type: 'video', contentBody: '', fileUrl: '', isFeatured: false, showOnHome: true, allowDownload: false, isDeleted: false },
  ]);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([
    { id: 1, contentId: 1, userId: 'user1', commentText: 'شرح رائع! هل يمكن توضيح أكثر؟', replyText: 'بالتأكيد، سأضيف شرحاً إضافياً.', isVisible: true, createdAt: '2025-01-15' },
    { id: 2, contentId: 3, userId: 'user2', commentText: 'هل يوجد ملف PDF للتجربة؟', replyText: null, isVisible: true, createdAt: '2025-01-16' },
    { id: 3, contentId: 4, userId: 'user3', commentText: 'محتوى ممتاز جداً', replyText: 'شكراً لك!', isVisible: true, createdAt: '2025-01-17' },
  ]);

  // Check URL for admin access
  useEffect(() => {
    if (window.location.hash === '#/admin') {
      // Don't auto-access, let the password gate handle it
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentPassword) {
      setAccessed(true);
      setError('');
    } else {
      setError('كلمة المرور غير صحيحة');
      setPassword('');
    }
  };

  const canSavePassword =
    newPassword.length > 0 &&
    newPassword === confirmPassword &&
    authCode === REQUIRED_AUTH_CODE;

  const handleSavePassword = () => {
    if (!canSavePassword) return;
    localStorage.setItem('admin_password', newPassword);
    setPasswordSuccess(true);
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
    setAuthCode('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  if (!accessed) {
    return (
      <section className="relative w-full flex items-center justify-center" style={{ height: '100vh', background: '#0a0a1a' }}>
        <div
          className="rounded-3xl p-8 sm:p-12 w-full max-w-md mx-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 rgb-pulse">
              <Lock size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">لوحة التحكم</h2>
            <p className="text-sm text-white/50 mb-8 text-center">أدخل كلمة المرور للوصول إلى لوحة إدارة المحتوى</p>

            <form onSubmit={handleLogin} className="w-full">
              <div className="relative mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white text-navy-900 font-bold hover:scale-[1.02] transition-transform duration-200"
              >
                دخول
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const activeSections = sections.filter((s) => !s.isDeleted);
  const deletedSections = sections.filter((s) => s.isDeleted);
  const activeContent = contentItems.filter((c) => !c.isDeleted);
  const deletedContent = contentItems.filter((c) => c.isDeleted);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <Home size={16} /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings size={16} /> },
    { id: 'sections', label: 'الأقسام', icon: <BookOpen size={16} /> },
    { id: 'content', label: 'المحتوى', icon: <FileText size={16} /> },
    { id: 'comments', label: 'التعليقات', icon: <MessageSquare size={16} /> },
    { id: 'analytics', label: 'الإحصائيات', icon: <BarChart3 size={16} /> },
    { id: 'trash', label: 'سلة المحذوفات', icon: <Trash2 size={16} /> },
  ];

  return (
    <section className="relative w-full min-h-screen" style={{ background: '#0a0a1a' }}>
      {/* Admin Header */}
      <div
        className="sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center rgb-pulse">
            <Settings size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white hidden sm:block">لوحة التحكم</h1>
        </div>
        <button
          onClick={() => { setAccessed(false); setPassword(''); window.history.replaceState(null, '', window.location.pathname); }}
          className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          خروج
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        className="sticky top-[65px] z-40 px-4 sm:px-8 py-3 overflow-x-auto"
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
              }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardTab sections={activeSections} content={activeContent} comments={comments} />
        )}
        {activeTab === 'settings' && (
          <SettingsTabFull
            appName={appName} setAppName={setAppName}
            themeColors={themeColors} setThemeColors={setThemeColors}
            maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode}
            rgbLighting={rgbLighting} setRgbLighting={setRgbLighting}
            notifications={notifications} setNotifications={setNotifications}
            downloadFeatureEnabled={downloadFeatureEnabled} setDownloadFeatureEnabled={setDownloadFeatureEnabled}
            storageInfo={storageInfo} cacheCleared={cacheCleared} setCacheCleared={setCacheCleared}
            newPassword={newPassword} setNewPassword={setNewPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            authCode={authCode} setAuthCode={setAuthCode}
            showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword}
            canSavePassword={canSavePassword}
            handleSavePassword={handleSavePassword}
            passwordSuccess={passwordSuccess}
            passwordError={passwordError} setPasswordError={setPasswordError}
          />
        )}
        {activeTab === 'sections' && (
          <SectionsTab
            sections={sections} setSections={setSections}
            editingSection={editingSection} setEditingSection={setEditingSection}
            newSectionTitle={newSectionTitle} setNewSectionTitle={setNewSectionTitle}
          />
        )}
        {activeTab === 'content' && (
          <ContentTab
            content={contentItems} setContent={setContentItems}
            editingContent={editingContent} setEditingContent={setEditingContent}
            sections={activeSections}
          />
        )}
        {activeTab === 'comments' && (
          <CommentsTab comments={comments} setComments={setComments} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab comments={comments} content={activeContent} />
        )}
        {activeTab === 'trash' && (
          <TrashTab
            deletedSections={deletedSections} deletedContent={deletedContent}
            setSections={setSections} setContent={setContentItems}
          />
        )}
      </div>
    </section>
  );
}

/* ─── Dashboard Tab ─── */
function DashboardTab({ sections, content, comments }: { sections: Section[]; content: ContentItem[]; comments: Comment[] }) {
  const stats = [
    { label: 'الأقسام النشطة', value: sections.length, icon: <BookOpen size={20} />, color: '#F4845F' },
    { label: 'عناصر المحتوى', value: content.length, icon: <FileText size={20} />, color: '#6BBF7A' },
    { label: 'التعليقات', value: comments.length, icon: <MessageSquare size={20} />, color: '#E882B4' },
    { label: 'بدون رد', value: comments.filter((c) => !c.replyText).length, icon: <MessageSquare size={20} />, color: '#6EB5FF' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-8">مرحباً بك في لوحة التحكم</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: `${stat.color}20` }}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Anton', sans-serif" }}>{stat.value}</p>
            <p className="text-sm text-white/50 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <h3 className="text-lg font-bold text-white mb-4">آخر التعليقات</h3>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${c.id * 90}, 60%, 50%)`, color: 'white' }}>
                {c.userId.slice(-3)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{c.commentText}</p>
                {c.replyText && <p className="text-xs text-white/40 mt-1 pr-3 border-r-2 border-white/10">{c.replyText}</p>}
              </div>
              <span className="text-xs text-white/30 flex-shrink-0">{c.createdAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Full Settings Tab with password change ─── */
function SettingsTabFull({
  appName, setAppName,
  themeColors, setThemeColors,
  maintenanceMode, setMaintenanceMode,
  rgbLighting, setRgbLighting,
  notifications, setNotifications,
  downloadFeatureEnabled, setDownloadFeatureEnabled,
  storageInfo, cacheCleared, setCacheCleared,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  authCode, setAuthCode,
  showNewPassword, setShowNewPassword,
  canSavePassword,
  handleSavePassword,
  passwordSuccess,
  passwordError, setPasswordError,
}: {
  appName: string; setAppName: (v: string) => void;
  themeColors: string[]; setThemeColors: (v: string[]) => void;
  maintenanceMode: boolean; setMaintenanceMode: (v: boolean) => void;
  rgbLighting: boolean; setRgbLighting: (v: boolean) => void;
  notifications: boolean; setNotifications: (v: boolean) => void;
  downloadFeatureEnabled: boolean; setDownloadFeatureEnabled: (v: boolean) => void;
  storageInfo: { used: string; total: string; percent: number };
  cacheCleared: boolean; setCacheCleared: (v: boolean) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  authCode: string; setAuthCode: (v: string) => void;
  showNewPassword: boolean; setShowNewPassword: (v: boolean) => void;
  canSavePassword: boolean;
  handleSavePassword: () => void;
  passwordSuccess: boolean;
  passwordError: string; setPasswordError: (v: string) => void;
}) {
  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }
    handleSavePassword();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-8">الإعدادات العامة</h2>

      {/* App Name */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Globe size={20} className="text-white/60" />
          <h3 className="text-lg font-bold text-white">اسم التطبيق</h3>
        </div>
        <div className="flex gap-3">
          <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <button className="px-6 py-3 rounded-xl bg-white text-navy-900 font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform">
            <Save size={16} /> حفظ
          </button>
        </div>
        <p className="mt-4 text-2xl font-bold text-center rgb-pulse rounded-xl py-4" style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 900, color: 'white' }}>
          {appName}
        </p>
      </div>

      {/* Theme Colors */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Palette size={20} className="text-white/60" />
          <h3 className="text-lg font-bold text-white">ألوان الثيم</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          {themeColors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <input type="color" value={color} onChange={(e) => {
                const newColors = [...themeColors]; newColors[i] = e.target.value; setThemeColors(newColors);
              }} className="w-16 h-16 rounded-xl cursor-pointer border-0" style={{ background: 'transparent' }} />
              <span className="text-xs text-white/40 font-mono">{color}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          {themeColors.map((color, i) => (
            <div key={i} className="flex-1 h-12 rounded-lg" style={{ background: color, opacity: 0.8 + i * 0.05 }} />
          ))}
        </div>
      </div>

      {/* System Toggles */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold text-white mb-4">إعدادات النظام</h3>
        <div className="space-y-4">
          {/* Maintenance Mode */}
          <ToggleRow
            icon={<Power size={18} />}
            label="وضع الصيانة"
            description="عند التفعيل، يظهر صفحة صيانة للزوار"
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
            danger
          />
          {/* RGB Lighting */}
          <ToggleRow
            icon={<Lightbulb size={18} />}
            label="إضاءة RGB"
            description="تأثير نبض الألوان على العناصر المميزة"
            checked={rgbLighting}
            onChange={setRgbLighting}
          />
          {/* Notifications */}
          <ToggleRow
            icon={<Bell size={18} />}
            label="الإشعارات"
            description="إرسال إشعارات للطلاب عند تحديث المحتوى"
            checked={notifications}
            onChange={setNotifications}
          />
          {/* Download Feature Toggle */}
          <ToggleRow
            icon={<Save size={18} />}
            label="إتاحة ميزة أزرار التنزيل"
            description="عند التفعيل، يمكن تفعيل زر التنزيل لكل عنصر محتوى بشكل منفرد"
            checked={downloadFeatureEnabled}
            onChange={setDownloadFeatureEnabled}
          />
        </div>
      </div>

      {/* Storage Management */}
      {/* Note: Web apps cannot change disk storage paths (sandbox security).
          Storage is managed within the browser via IndexedDB + Cache API. */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold text-white mb-4">إدارة مساحة التخزين</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs text-white/40">المساحة المستخدمة</p>
            <p className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Anton', sans-serif" }}>{storageInfo.used}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs text-white/40">الحد الأقصى</p>
            <p className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Anton', sans-serif" }}>{storageInfo.total}</p>
          </div>
        </div>
        {/* Usage bar */}
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(storageInfo.percent, 100)}%`, background: storageInfo.percent > 80 ? '#ef4444' : '#6BBF7A' }} />
        </div>
        <p className="text-xs text-white/30 mb-4">يتم التخزين محلياً في المتصفح. لا يمكن تغيير مسار التخزين على القرص من تطبيق ويب لأسباب أمنية.</p>
        {cacheCleared && (
          <div className="mb-3 px-4 py-2 rounded-xl text-sm text-green-400 flex items-center gap-2" style={{ background: 'rgba(107,191,122,0.1)' }}>
            <Check size={14} /> تم مسح ذاكرة التخزين المؤقت بنجاح
          </div>
        )}
        <button
          onClick={async () => {
            try {
              if (caches) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
              }
              setCacheCleared(true);
              setTimeout(() => setCacheCleared(false), 3000);
            } catch {}
          }}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          مسح ذاكرة التخزين المؤقت
        </button>
      </div>

      {/* Password Change */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-white/60" />
          <h3 className="text-lg font-bold text-white">تغيير كلمة المرور</h3>
        </div>

        {/* Success Message */}
        {passwordSuccess && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-green-400 flex items-center gap-2" style={{ background: 'rgba(107,191,122,0.1)', border: '1px solid rgba(107,191,122,0.2)' }}>
            <Check size={16} />
            تم تحديث كلمة المرور بنجاح
          </div>
        )}

        {/* Error Message */}
        {passwordError && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)' }}>
            {passwordError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/50 mb-1.5 block">تأكيد كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/50 mb-1.5 block">الرقم السري للتفويض</label>
            <input
              type="password"
              value={authCode}
              onChange={(e) => { setAuthCode(e.target.value); setPasswordError(''); }}
              placeholder="أدخل رقم التفويض..."
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: authCode.length > 0 && authCode !== REQUIRED_AUTH_CODE ? '1px solid rgba(255,80,80,0.3)' : '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <button
            onClick={handlePasswordSave}
            disabled={!canSavePassword}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: canSavePassword ? 'white' : 'rgba(255,255,255,0.1)',
              color: canSavePassword ? '#0a0a1a' : 'rgba(255,255,255,0.3)',
              cursor: canSavePassword ? 'pointer' : 'not-allowed',
            }}
          >
            <Save size={16} />
            حفظ كلمة المرور الجديدة
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon, label, description, checked, onChange, danger,
}: {
  icon: React.ReactNode; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: danger && checked ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.06)' }}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-white font-medium">{label}</p>
          <p className="text-xs text-white/30">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors duration-200"
        style={{
          background: checked ? (danger ? '#ef4444' : '#6BBF7A') : 'rgba(255,255,255,0.15)',
        }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

/* ─── Sections Tab ─── */
function SectionsTab({
  sections, setSections, editingSection, setEditingSection, newSectionTitle, setNewSectionTitle,
}: {
  sections: Section[]; setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  editingSection: Section | null; setEditingSection: (s: Section | null) => void;
  newSectionTitle: string; setNewSectionTitle: (s: string) => void;
}) {
  const activeSections = sections.filter((s) => !s.isDeleted);

  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSection: Section = { id: Date.now(), title: newSectionTitle, isVisible: true, isDeleted: false, displayOrder: activeSections.length + 1 };
    setSections((prev) => [...prev, newSection]);
    setNewSectionTitle('');
  };

  const deleteSection = (id: number) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, isDeleted: true } : s)));

  const saveEdit = () => {
    if (!editingSection) return;
    setSections((prev) => prev.map((s) => (s.id === editingSection.id ? editingSection : s)));
    setEditingSection(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">الأقسام</h2>
        <span className="text-sm text-white/40">{activeSections.length} قسم</span>
      </div>
      <div className="rounded-2xl p-4 mb-6 flex gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <input type="text" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="اسم القسم الجديد..."
          className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          onKeyDown={(e) => e.key === 'Enter' && addSection()} />
        <button onClick={addSection} className="px-5 py-3 rounded-xl bg-white/10 text-white font-medium flex items-center gap-2 hover:bg-white/20 transition-colors">
          <Plus size={16} /> إضافة
        </button>
      </div>
      <div className="space-y-3">
        {activeSections.map((section) => (
          <div key={section.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">{section.displayOrder}</div>
            <div className="flex-1">
              {editingSection?.id === section.id ? (
                <input type="text" value={editingSection.title} onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)' }} autoFocus />
              ) : <p className="text-white font-medium">{section.title}</p>}
            </div>
            <div className="flex items-center gap-2">
              {editingSection?.id === section.id ? (
                <button onClick={saveEdit} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Check size={16} className="text-green-400" /></button>
              ) : (
                <button onClick={() => setEditingSection(section)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Edit3 size={16} className="text-white/50" /></button>
              )}
              <button onClick={() => deleteSection(section.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Trash2 size={16} className="text-red-400" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Content Tab ─── */
function ContentTab({
  content, setContent, editingContent, setEditingContent, sections,
}: {
  content: ContentItem[]; setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  editingContent: ContentItem | null; setEditingContent: (c: ContentItem | null) => void;
  sections: Section[];
}) {
  // Add-content form state
  const [addMode, setAddMode] = useState<'media' | 'text'>('media');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [showOnHome, setShowOnHome] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const activeContent = content.filter((c) => !c.isDeleted);

  const typeLabels: Record<string, string> = {
    video: '🎬 فيديو', image: '🖼️ صورة', text: '📝 نص', pdf: '📄 PDF', word: '📝 Word',
    powerpoint: '📊 PowerPoint', excel: '📈 Excel', zip: '📦 ZIP',
  };

  // Convert file to data URL (so it persists in state / can be previewed & downloaded)
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await readFileAsDataURL(file);
      setUploadedFile({ url, name: file.name });
    } catch {
      /* ignore */
    }
    setUploading(false);
  };

  const resetForm = () => {
    setTitle(''); setDesc(''); setShowOnHome(false);
    setUploadedFile(null); setMediaType('image');
    setSectionId(sections[0]?.id || 1);
  };

  const addContent = () => {
    // Validate: media mode requires a file OR (title/desc). Text mode requires title or desc.
    if (addMode === 'media' && !uploadedFile && !title.trim() && !desc.trim()) return;
    if (addMode === 'text' && !title.trim() && !desc.trim()) return;

    const type = addMode === 'text' ? 'text' : mediaType;
    const item: ContentItem = {
      id: Date.now(),
      sectionId,
      title: title.trim() || (uploadedFile ? uploadedFile.name : (addMode === 'text' ? 'محتوى نصي' : 'وسائط')),
      type,
      contentBody: desc.trim(),
      fileUrl: uploadedFile?.url || '',
      isFeatured: false,
      showOnHome,
      allowDownload: false,
      isDeleted: false,
    };
    setContent((prev) => [...prev, item]);
    resetForm();
  };

  const deleteContent = (id: number) => setContent((prev) => prev.map((c) => (c.id === id ? { ...c, isDeleted: true } : c)));
  const toggleFeatured = (id: number) => setContent((prev) => prev.map((c) => (c.id === id ? { ...c, isFeatured: !c.isFeatured } : c)));
  const toggleHome = (id: number) => setContent((prev) => prev.map((c) => (c.id === id ? { ...c, showOnHome: !c.showOnHome } : c)));

  const saveEdit = () => {
    if (!editingContent) return;
    setContent((prev) => prev.map((c) => (c.id === editingContent.id ? editingContent : c)));
    setEditingContent(null);
  };

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">المحتوى</h2>
        <span className="text-sm text-white/40">{activeContent.length} عنصر</span>
      </div>

      {/* ───── Add Content Card ───── */}
      <div className="rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
        {/* Mode switcher */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setAddMode('media'); setUploadedFile(null); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: addMode === 'media' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: addMode === 'media' ? 'white' : 'rgba(255,255,255,0.4)',
              border: addMode === 'media' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <UploadCloud size={16} /> فيديو / صورة
          </button>
          <button
            onClick={() => { setAddMode('text'); setUploadedFile(null); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: addMode === 'text' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: addMode === 'text' ? 'white' : 'rgba(255,255,255,0.4)',
              border: addMode === 'text' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Type size={16} /> نص فقط
          </button>
        </div>

        {/* Media upload UI */}
        {addMode === 'media' && (
          <div className="mb-5">
            {/* Image / Video selector */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setMediaType('image'); setUploadedFile(null); }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ background: mediaType === 'image' ? 'rgba(110,181,255,0.15)' : 'transparent', color: mediaType === 'image' ? '#6EB5FF' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ImageIcon size={14} /> صورة
              </button>
              <button onClick={() => { setMediaType('video'); setUploadedFile(null); }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ background: mediaType === 'video' ? 'rgba(107,191,122,0.15)' : 'transparent', color: mediaType === 'video' ? '#6BBF7A' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Video size={14} /> فيديو
              </button>
            </div>

            {/* Upload dropzone / preview */}
            {!uploadedFile ? (
              <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
                style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
                {uploading ? (
                  <div className="text-sm text-white/40">جاري الرفع...</div>
                ) : (
                  <>
                    <UploadCloud size={28} className="text-white/40" />
                    <span className="text-sm text-white/50">{mediaType === 'image' ? 'اختر صورة من الجهاز' : 'اختر فيديو من الجهاز'}</span>
                    <span className="text-xs text-white/30">{mediaType === 'image' ? 'PNG, JPG, WebP' : 'MP4, WebM'}</span>
                  </>
                )}
                <input type="file" accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileSelect} className="hidden" />
              </label>
            ) : (
              <div className="rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {mediaType === 'image' ? (
                  <img src={uploadedFile.url} alt="معاينة" className="w-full max-h-64 object-contain" style={{ background: '#000' }} />
                ) : (
                  <video src={uploadedFile.url} controls className="w-full max-h-64" />
                )}
                <button onClick={() => setUploadedFile(null)}
                  className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
                  <X size={16} className="text-white" />
                </button>
                <p className="absolute bottom-0 left-0 right-0 text-xs text-white/70 px-3 py-1.5 truncate" style={{ background: 'rgba(0,0,0,0.6)' }}>{uploadedFile.name}</p>
              </div>
            )}
          </div>
        )}

        {/* Title (optional) */}
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="العنوان (اختياري)" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3"
          style={inputStyle} />

        {/* Description (optional) */}
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="الوصف (اختياري)..." rows={2}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3 resize-none"
          style={inputStyle} />

        {/* Section + Show on home row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">القسم</label>
            <select value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-white outline-none" style={inputStyle}>
              {sections.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-900">{s.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => setShowOnHome((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
              style={{ background: showOnHome ? 'rgba(107,191,122,0.12)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-sm text-white/80 flex items-center gap-2"><Home size={14} /> إظهار في الرئيسية</span>
              <span className="relative w-10 h-5 rounded-full transition-colors" style={{ background: showOnHome ? '#6BBF7A' : 'rgba(255,255,255,0.15)' }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: showOnHome ? 'translateX(20px)' : 'translateX(2px)' }} />
              </span>
            </button>
          </div>
        </div>

        <button onClick={addContent} className="w-full px-5 py-3 rounded-xl bg-white text-navy-900 font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform">
          <Plus size={16} /> إضافة المحتوى
        </button>
      </div>

      {/* ───── Content List ───── */}
      <div className="space-y-3">
        {activeContent.map((item) => (
          <div key={item.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {item.type === 'image' && item.fileUrl ? (
                <img src={item.fileUrl} alt="" className="w-full h-full object-cover" />
              ) : item.type === 'video' && item.fileUrl ? (
                <Video size={18} className="text-green-400" />
              ) : (
                <span className="text-lg">{typeLabels[item.type]?.split(' ')[0]}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {editingContent?.id === item.id ? (
                <input type="text" value={editingContent.title} onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} autoFocus />
              ) : (
                <p className="text-white font-medium truncate">{item.title}</p>
              )}
              {editingContent?.id === item.id ? (
                <textarea value={editingContent.contentBody} onChange={(e) => setEditingContent({ ...editingContent, contentBody: e.target.value })}
                  placeholder="الوصف..." rows={1} className="w-full px-3 py-2 rounded-lg text-sm text-white/70 outline-none resize-none" style={{ background: 'rgba(255,255,255,0.08)' }} />
              ) : item.contentBody ? (
                <p className="text-xs text-white/40 mt-0.5 truncate">{item.contentBody}</p>
              ) : null}
              <p className="text-xs text-white/30 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{typeLabels[item.type]}</span>
                <span>·</span>
                <span>{sections.find((s) => s.id === item.sectionId)?.title || 'غير محدد'}</span>
                {item.showOnHome && <span className="px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">رئيسية</span>}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {editingContent?.id === item.id ? (
                <button onClick={saveEdit} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Check size={16} className="text-green-400" /></button>
              ) : (
                <button onClick={() => setEditingContent(item)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Edit3 size={16} className="text-white/50" /></button>
              )}
              <button onClick={() => toggleFeatured(item.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="مميز">
                <Star size={16} className={item.isFeatured ? 'text-yellow-400' : 'text-white/30'} />
              </button>
              <button onClick={() => toggleHome(item.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="عرض في الصفحة الرئيسية">
                {item.showOnHome ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-white/30" />}
              </button>
              <button onClick={() => deleteContent(item.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="حذف">
                <Trash2 size={16} className="text-red-400" />
              </button>
              {/* Per-item download toggle */}
              <button
                onClick={() => setContent((prev) => prev.map((c) => c.id === item.id ? { ...c, allowDownload: !c.allowDownload } : c))}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="إظهار زر التنزيل"
              >
                <Save size={16} className={item.allowDownload ? 'text-blue-400' : 'text-white/30'} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comments Tab ─── */
function CommentsTab({ comments, setComments }: { comments: Comment[]; setComments: React.Dispatch<React.SetStateAction<Comment[]>> }) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const submitReply = (id: number) => {
    if (!replyText.trim()) return;
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, replyText } : c)));
    setReplyingTo(null); setReplyText('');
  };

  const toggleVisibility = (id: number) => setComments((prev) => prev.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c)));
  const deleteComment = (id: number) => setComments((prev) => prev.filter((c) => c.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">التعليقات</h2>
        <div className="flex gap-4 text-sm text-white/40">
          <span>الكل: {comments.length}</span>
          <span>بدون رد: {comments.filter((c) => !c.replyText).length}</span>
          <span>مخفي: {comments.filter((c) => !c.isVisible).length}</span>
        </div>
      </div>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl p-4" style={{
            background: 'rgba(255,255,255,0.03)',
            border: c.isVisible ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,0,0,0.2)',
            opacity: c.isVisible ? 1 : 0.5,
          }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${c.id * 90}, 60%, 50%)`, color: 'white' }}>
                {c.userId.slice(-3)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{c.commentText}</p>
                <span className="text-xs text-white/30">{c.createdAt}</span>
                {c.replyText && <div className="mt-2 pr-4 border-r-2 border-white/10"><p className="text-xs text-white/50">{c.replyText}</p></div>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleVisibility(c.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  {c.isVisible ? <Eye size={14} className="text-white/50" /> : <EyeOff size={14} className="text-yellow-400" />}
                </button>
                <button onClick={() => deleteComment(c.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
            {replyingTo === c.id ? (
              <div className="flex gap-2 mt-3 pr-11">
                <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="اكتب ردك..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none" style={{ background: 'rgba(255,255,255,0.06)' }} autoFocus />
                <button onClick={() => submitReply(c.id)} className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"><Check size={14} /></button>
                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-colors"><X size={14} /></button>
              </div>
            ) : !c.replyText ? (
              <button onClick={() => setReplyingTo(c.id)} className="mt-2 mr-11 text-xs text-white/30 hover:text-white/60 transition-colors">رد...</button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Analytics Tab ─── */
function AnalyticsTab({ comments, content }: { comments: Comment[]; content: ContentItem[] }) {
  const stats = [
    { label: 'تعليقات اليوم', value: comments.length, color: '#F4845F' },
    { label: 'بدون رد', value: comments.filter((c) => !c.replyText).length, color: '#E882B4' },
    { label: 'محتوى مميز', value: content.filter((c) => c.isFeatured).length, color: '#6BBF7A' },
    { label: 'محتوى في الرئيسية', value: content.filter((c) => c.showOnHome).length, color: '#6EB5FF' },
  ];

  const typeLabels: Record<string, string> = { video: 'فيديو', image: 'صورة', text: 'نص', pdf: 'PDF', word: 'Word', powerpoint: 'PowerPoint', excel: 'Excel', zip: 'ZIP' };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-8">الإحصائيات</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Anton', sans-serif", color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold text-white mb-6">توزيع المحتوى حسب القسم</h3>
        <div className="space-y-4">
          {content.map((item, i) => {
            const barWidth = 30 + Math.random() * 70;
            const colors = ['#F4845F', '#6BBF7A', '#E882B4', '#6EB5FF'];
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/70 truncate">{item.title}</span>
                  <span className="text-xs text-white/40 mr-2">{typeLabels[item.type]}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: colors[i % colors.length], transition: 'width 1000ms ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Trash Tab ─── */
function TrashTab({
  deletedSections, deletedContent, setSections, setContent,
}: {
  deletedSections: Section[]; deletedContent: ContentItem[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>;
}) {
  const restoreSection = (id: number) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, isDeleted: false } : s)));
  const restoreContent = (id: number) => setContent((prev) => prev.map((c) => (c.id === id ? { ...c, isDeleted: false } : c)));
  const permanentDeleteSection = (id: number) => setSections((prev) => prev.filter((s) => s.id !== id));
  const permanentDeleteContent = (id: number) => setContent((prev) => prev.filter((c) => c.id !== id));
  const restoreAll = () => {
    setSections((prev) => prev.map((s) => (s.isDeleted ? { ...s, isDeleted: false } : s)));
    setContent((prev) => prev.map((c) => (c.isDeleted ? { ...c, isDeleted: false } : c)));
  };
  const emptyTrash = () => {
    setSections((prev) => prev.filter((s) => !s.isDeleted));
    setContent((prev) => prev.filter((c) => !c.isDeleted));
  };
  const totalDeleted = deletedSections.length + deletedContent.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">سلة المحذوفات</h2>
        <div className="flex gap-2">
          {totalDeleted > 0 && (
            <>
              <button onClick={restoreAll} className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">استعادة الكل</button>
              <button onClick={emptyTrash} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">تفريغ السلة</button>
            </>
          )}
        </div>
      </div>
      {totalDeleted === 0 ? (
        <div className="text-center py-16">
          <Trash2 size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30">لا توجد عناصر محذوفة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deletedSections.map((section) => (
            <div key={section.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
              <span className="text-white/30 text-sm">قسم</span>
              <p className="flex-1 text-white/60 font-medium">{section.title}</p>
              <div className="flex gap-2">
                <button onClick={() => restoreSection(section.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">استعادة</button>
                <button onClick={() => permanentDeleteSection(section.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">حذف نهائي</button>
              </div>
            </div>
          ))}
          {deletedContent.map((item) => (
            <div key={item.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
              <span className="text-white/30 text-sm">محتوى</span>
              <p className="flex-1 text-white/60 font-medium">{item.title}</p>
              <div className="flex gap-2">
                <button onClick={() => restoreContent(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">استعادة</button>
                <button onClick={() => permanentDeleteContent(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">حذف نهائي</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

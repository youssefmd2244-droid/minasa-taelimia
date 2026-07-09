import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Settings, BookOpen, FileText, MessageSquare, BarChart3, Trash2, Plus, Edit3, X,
  Check, Eye, EyeOff, Palette, Globe, Save, ArrowLeft, Home, Star, Shield, Power,
  Lightbulb, Bell, Image as ImageIcon, Video, UploadCloud, Type, Mic, MicOff, Download,
  File, Music, StopCircle, ZoomIn, Monitor, Loader2, AlertCircle, GraduationCap, ArrowUp, ArrowDown,
  RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { SITE_TEXT_FIELDS, SITE_IMAGE_FIELDS } from '../../lib/siteContentRegistry';
import DisplayScreen from './DisplayScreen';
import ContentSourcePanel from './ContentSourcePanel';
import { SUPABASE_SCHEMA } from './SchemaPanel';
import { notifyAdminDataChanged, pullRemoteAppData, pushAppData, pushAppDataNow, uploadMediaFile } from '../../lib/adminBridge';
import { EDUCATIONAL_COURSES } from '../ui/circular-gallery';
import { writeAppDataToDevice, getStorageLocation, changeStorageLocation, STORAGE_LOCATION_LABELS, type StorageLocation } from '../../lib/deviceStorage';
import {
  fetchAllComments, setCommentVisibility, replyToComment, deleteComment, subscribeComments,
  type PublicCommentRow,
} from '../../lib/commentsBridge';
import { genId } from '../../utils/id';

// ─── Auth code for password change only ───
const REQUIRED_AUTH_CODE = 'Yy2004//';
const STORAGE_KEY = 'eduverse_admin_data';

type Tab = 'dashboard' | 'settings' | 'sections' | 'content' | 'record' | 'files' | 'comments' | 'analytics' | 'trash' | 'display' | 'gallery' | 'texts';

interface Section { id: number; title: string; isVisible: boolean; isDeleted: boolean; displayOrder: number; }
interface Attachment { url: string; name: string; type: 'image' | 'video' | 'audio'; }
interface ContentItem {
  id: number; sectionId: number; title: string; type: string; contentBody: string;
  fileUrl: string; isFeatured: boolean; showOnHome: boolean; allowDownload: boolean;
  isDeleted: boolean; attachments?: Attachment[];
  /** صورة مصغّرة حقيقية للفيديو، متولّدة ومرفوعة وقت الرفع نفسه — بتحل
   *  مشكلة "الفيديو بيظهر بمربع أسود لكل المستخدمين قبل ما يشغّلوه"،
   *  راجع src/lib/videoThumbnail.ts. */
  posterUrl?: string;
}
interface RecordItem {
  id: number; title: string; audioUrl: string; sectionId: number;
  showOnHome: boolean; isDeleted: boolean; text?: string;
  attachments?: Attachment[]; section?: string;
}
interface FileItem {
  id: number; title: string; fileUrl: string; fileName: string;
  fileType: 'pdf' | 'word' | 'excel' | 'ppt' | 'zip';
  description?: string; sectionId: number; showOnHome: boolean;
  isDeleted: boolean; allowDownload: boolean; attachments?: Attachment[];
}
/** عنصر واحد في "مكتبة المواد الدراسية" — كارت الكورس اللي بيظهر في معرض
 *  الصفحة الرئيسية (CoursesGallerySection). قبل كده كانت الكروت دي ثابتة
 *  في الكود (EDUCATIONAL_COURSES) ومفيش أي طريقة لتعديلها إلا بتعديل
 *  الكود نفسه؛ دلوقتي بقت جزء من بيانات لوحة الإدارة زي أي محتوى تاني،
 *  يعني بتتزامن تلقائيًا لكل المستخدمين بمجرد ما الأدمن يحفظ. */
interface GalleryCourse {
  id: number; title: string; subtitle: string; badge?: string;
  imageUrl: string; displayOrder: number; isDeleted: boolean;
}
// ملاحظة: التعليقات مش جزء من AdminData بقى — بقت متخزنة في جدول حقيقي
// مستقل (public_comments، راجع src/lib/commentsBridge.ts) بدل ما تكون
// بيانات وهمية جوه صف app_data المشترك، عشان تعليقات الزوار المتزامنة
// ما تتعارضش مع تعديلات الأدمن التانية.
interface AdminData {
  sections: Section[]; contentItems: ContentItem[]; records: RecordItem[];
  files: FileItem[]; appName: string;
  /** رابط أيقونة التطبيق (الشعار) اللي بيظهر جوه الموقع نفسه (هيدر/فافيكون/
   *  أيقونة PWA للتثبيت الجديد على المتصفح) — راجع ملاحظة "الهوية البصرية"
   *  في SettingsTab لتوضيح إن ده مختلف عن أيقونة التطبيق الأصلية المثبّتة
   *  فعلاً على هاتف كل مستخدم (تلك بتتغير فقط بتحديث حقيقي للتطبيق). */
  appIconUrl: string;
  courses: GalleryCourse[];
  themeColors: string[]; maintenanceMode: boolean; rgbLighting: boolean;
  notifications: boolean; downloadFeatureEnabled: boolean;
  /** تعديلات "نصوص والصور" — راجع src/lib/siteContentRegistry.ts للمفاتيح المتاحة. */
  siteTexts: Record<string, string>;
  siteImages: Record<string, string>;
}

// ─── Props interface ───
interface AdminDashboardProps {
  currentPassword?: string;
  onPasswordChange?: (pw: string) => void;
  onExit?: () => void;
}

/** بذرة أولية لمكتبة المواد الدراسية: نفس الكروت الثمانية اللي كانت ثابتة
 *  في الكود قبل كده (EDUCATIONAL_COURSES) — بنحوّلها هنا لصيغة GalleryCourse
 *  عشان أول ما الأدمن يفتح اللوحة يلاقي بالظبط نفس اللي شايفه الطالب
 *  حاليًا، من غير أي قفزة أو اختفاء للكروت الموجودة فعلاً. */
const DEFAULT_GALLERY_COURSES: GalleryCourse[] = EDUCATIONAL_COURSES.map((c, i) => ({
  id: i + 1,
  title: c.title,
  subtitle: c.subtitle || '',
  badge: c.badge,
  imageUrl: c.photo.url,
  displayOrder: i + 1,
  isDeleted: false,
}));

const DEFAULT_DATA: AdminData = {
  appName: 'EduVerse',
  appIconUrl: '',
  courses: DEFAULT_GALLERY_COURSES,
  themeColors: ['#F4845F', '#6BBF7A', '#E882B4', '#6EB5FF'],
  maintenanceMode: false, rgbLighting: true, notifications: true, downloadFeatureEnabled: false,
  sections: [
    { id: 1, title: 'المستوى الأول — رياضيات', isVisible: true, isDeleted: false, displayOrder: 1 },
    { id: 2, title: 'المستوى الثاني — علوم', isVisible: true, isDeleted: false, displayOrder: 2 },
    { id: 3, title: 'المستوى الأول — لغة عربية', isVisible: true, isDeleted: false, displayOrder: 3 },
    { id: 4, title: 'المستوى الثاني — فنون', isVisible: true, isDeleted: false, displayOrder: 4 },
  ],
  // ملحوظة: هنا كان فيه عنصرين تجريبيين ("أساسيات الجبر" فيديو،
  // و"التجارب العلمية" PDF) بملف فارغ (fileUrl: '') — يعني كانا هيظهروا
  // للطلاب كأنهم محتوى حقيقي بس من غير أي فيديو/ملف فعلي وراهم. شيلناهم
  // نهائيًا؛ لوحة الإدارة دلوقتي بتبدأ بأقسام بس من غير أي محتوى وهمي.
  contentItems: [],
  records: [], files: [],
  siteTexts: {}, siteImages: {},
};

/**
 * تنظيف تلقائي لأي عناصر تجريبية قديمة كانت اتحفظت فعلاً في بيانات
 * المستخدم قبل هذا التحديث (لو كانت لوحة الإدارة اتفتحت قبل كده لما كان
 * DEFAULT_DATA لسه فيه العنصرين التجريبيين دول، يبقوا اتحفظوا مع باقي
 * المحتوى الحقيقي وبقوا جزء من البيانات المتزامنة). بيشيلهم بس لو
 * تطابقوا بالظبط مع بصمة العنصر التجريبي (نفس العنوان + النوع + ملف
 * فارغ) — عشان محتوى حقيقي بنفس العنوان بالصدفة (ومعاه ملف فعلي) ميتأثرش.
 */
function stripKnownDemoSeed(items: ContentItem[]): ContentItem[] {
  return items.filter((item) => {
    const isFakeAlgebraVideo = item.title === 'أساسيات الجبر' && item.type === 'video' && !item.fileUrl;
    const isFakeExperimentsPdf = item.title === 'التجارب العلمية' && item.type === 'pdf' && !item.fileUrl;
    return !isFakeAlgebraVideo && !isFakeExperimentsPdf;
  });
}

function loadData(): AdminData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const merged = { ...DEFAULT_DATA, ...JSON.parse(raw) };
      return { ...merged, contentItems: stripKnownDemoSeed(merged.contentItems) };
    }
  } catch {}
  return DEFAULT_DATA;
}
function saveData(data: AdminData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); if (navigator.storage?.persist) navigator.storage.persist(); } catch {}
  // يبلّغ بقية التطبيق (الصفحة الرئيسية عند الطالب) إن في تغيير جديد،
  // عشان أي إضافة/تعديل/مسح من لوحة الإدارة يظهر فوراً "برّه" بدون
  // إعادة تحميل الصفحة.
  notifyAdminDataChanged();
  // وبيرفعها كمان على Supabase (صف app_data المشترك) عشان تظهر لكل
  // المستخدمين على أي جهاز — مش بس جهاز الأدمن. لو Supabase مش متصل
  // الفنكشن دي بترجع فورًا من غير أي تأثير (نفس سلوك وضع العرض التوضيحي).
  pushAppData(data);
  // ونسخة كمان كملف حقيقي على تخزين الهاتف (مكان الأدمن المختار من
  // الإعدادات) — fire-and-forget، مفيش داعي ننتظرها في الحفظ التلقائي.
  void writeAppDataToDevice(data);
}

/**
 * نسخة "احفظ الآن" — بتستخدمها زرار الحفظ اليدوي في الإعدادات. بترجّع
 * نتيجة حقيقية (نجح ولا فشل، ومحلي ولا على السحابة) بدل ما تفترض
 * النجاح زي saveData العادية (اللي بتتنفذ تلقائيًا مع كل تغيير).
 */
async function saveDataNow(data: AdminData): Promise<{ ok: boolean; cloud: boolean; message?: string }> {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); if (navigator.storage?.persist) navigator.storage.persist(); } catch {}
  notifyAdminDataChanged();
  // نحاول نكتب على تخزين الهاتف الحقيقي كمان — لو فشلت (مثلاً الإذن لسه
  // مش متوافق عليه) مش بنوقف عملية الحفظ الأساسية بسببها، لأن Supabase/
  // localStorage هما مصدر الحقيقة الأساسي، ودي مجرد نسخة احتياطية إضافية.
  try { await writeAppDataToDevice(data); } catch { /* ignore */ }
  return pushAppDataNow(data);
}

const readFile = async (file: File, folder: string = 'misc'): Promise<string> => {
  const result = await uploadMediaFile(file, folder);
  if (result.url) return result.url;
  if (result.error) {
    // بيوريك سبب فشل الرفع الحقيقي فورًا (بدل ما يفضل يترفع محليًا بصمت
    // وتكتشف المشكلة بس وانت بتحفظ لاحقًا). كده تقدر تبعتلي نص الرسالة
    // بالظبط وأعرف أظبط الصلاحيات/الـ bucket على طول.
    window.alert(`تنبيه: فشل رفع الملف على التخزين السحابي وهيتحفظ محليًا مؤقتًا بدل كده.\n\nسبب الفشل: ${result.error}\n\nابعت النص ده لو محتاج مساعدة.`);
  }
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
};

/**
 * نسخة رفع أكتر من ملف مرة واحدة (بالتوازي) — بتستخدمها أي شاشة رفع
 * عايزة تسمح للأدمن يختار أكتر من صورة/فيديو/ملف/صوت مرة واحدة، مجمّعين
 * مع بعض أو كل واحد لوحده. مفيش أي حد أقصى لعدد الملفات المختارة.
 */
const readFiles = async (files: File[], folder: string = 'misc'): Promise<{ url: string; name: string }[]> =>
  Promise.all(files.map(async (file) => ({ url: await readFile(file, folder), name: file.name })));

/**
 * زي readFile العادية، بس مبقاش بيولّد أي صورة poster تلقائيًا خالص —
 * الفيديو بيترفع لوحده وبس، أسرع ما يمكن، من غير أي معالجة فيديو
 * إضافية في المتصفح (فك تشفير الفيديو محليًا لالتقاط فريم كان بياخد
 * وقت فعلي أطول من الرفع نفسه على شبكة سريعة، وده كان سبب البطء
 * الملحوظ). صورة الغلاف بقت اختيار يدوي بالكامل من المعرض (زرار
 * "اختيار صورة غلاف يدويًا") — انظر pickCustomPoster / pickCustomPosterForEdit.
 */
const readMediaFile = async (file: File, folder: string = 'content'): Promise<{ url: string; name: string }> => {
  const url = await readFile(file, folder);
  return { url, name: file.name };
};

const readMediaFiles = async (files: File[], folder: string = 'content'): Promise<{ url: string; name: string }[]> =>
  Promise.all(files.map((file) => readMediaFile(file, folder)));

const fileTypeIcon: Record<string, string> = { pdf: '📄', word: '📝', excel: '📊', ppt: '📋', zip: '📦' };
const fileTypeLabel: Record<string, string> = { pdf: 'PDF', word: 'Word', excel: 'Excel', ppt: 'PowerPoint', zip: 'ZIP' };

/* ─── Media Viewer ─── */
function MediaViewer({ src, type, onClose }: { src: string; type: 'image' | 'video'; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white"
        style={{ background: 'rgba(255,255,255,0.15)' }} onClick={onClose}>
        <X size={20} />
      </button>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        {type === 'image'
          ? <img src={src} alt="" className="max-w-full max-h-[85vh] rounded-2xl object-contain" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
          : <video src={src} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl" />}
      </motion.div>
    </motion.div>
  );
}

/* ─── Toggle Row ─── */
function ToggleRow({ icon, label, description, checked, onChange, danger }: {
  icon: React.ReactNode; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: danger && checked ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.06)' }}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{label}</p>
          <p className="text-xs text-white/30 truncate">{description}</p>
        </div>
      </div>
      <button onClick={() => onChange(!checked)} className="relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ml-3"
        style={{ background: checked ? (danger ? '#ef4444' : '#6BBF7A') : 'rgba(255,255,255,0.15)' }}>
        <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200"
          style={{ transform: checked ? 'translateX(21px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}

/* ─── Attachment Picker ─── */
function AttachmentPicker({ attachments, onChange, onView }: {
  attachments: Attachment[]; onChange: (a: Attachment[]) => void;
  onView?: (src: string, type: 'image' | 'video') => void;
}) {
  const addAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    // بيقبل أكتر من صورة/فيديو/صوت مرة واحدة (مجمّعين مع بعض جوه نفس العنصر)
    const uploaded = await readFiles(files);
    const newAttachments: Attachment[] = uploaded.map((u, i) => {
      const f = files[i];
      const type: Attachment['type'] = f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : 'audio';
      return { url: u.url, name: u.name, type };
    });
    onChange([...attachments, ...newAttachments]);
    e.target.value = '';
  };
  const remove = (i: number) => onChange(attachments.filter((_, idx) => idx !== i));
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {attachments.map((a, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden group cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {a.type === 'image' ? (
              <div onClick={() => onView?.(a.url, 'image')}>
                <img src={a.url} alt="" className="w-16 h-16 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ZoomIn size={14} className="text-white" />
                </div>
              </div>
            ) : a.type === 'video' ? (
              <div className="w-16 h-16 flex items-center justify-center bg-black/40" onClick={() => onView?.(a.url, 'video')}>
                <Video size={20} className="text-green-400" />
              </div>
            ) : (
              <div className="w-16 h-16 flex items-center justify-center bg-black/40"><Music size={20} className="text-purple-400" /></div>
            )}
            <button onClick={() => remove(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center z-10">
              <X size={10} className="text-white" />
            </button>
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs text-white/50 hover:text-white/80 transition-colors"
        style={{ border: '1px dashed rgba(255,255,255,0.12)' }}>
        <Plus size={12} /> إضافة صورة / فيديو / صوت (يمكن اختيار أكتر من ملف)
        <input type="file" multiple accept="image/*,video/*,audio/*" onChange={addAttachment} className="hidden" />
      </label>
    </div>
  );
}

/* ─── Sections Tab ─── */
function SectionsTab({ sections, setSections }: { sections: Section[]; setSections: React.Dispatch<React.SetStateAction<Section[]>> }) {
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const activeSections = sections.filter(s => !s.isDeleted);
  const addSection = () => {
    if (!newTitle.trim()) return;
    setSections(prev => [...prev, { id: genId(), title: newTitle, isVisible: true, isDeleted: false, displayOrder: activeSections.length + 1 }]);
    setNewTitle('');
  };
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">الأقسام</h2>
        <span className="text-sm text-white/40">{activeSections.length} قسم</span>
      </div>
      <div className="rounded-2xl p-4 mb-5 flex gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="اسم القسم الجديد..."
          className="flex-1 px-3 py-2.5 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={inp}
          onKeyDown={e => e.key === 'Enter' && addSection()} />
        <button onClick={addSection} className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium flex items-center gap-1 hover:bg-white/20 transition-colors">
          <Plus size={14} /> إضافة
        </button>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {activeSections.map(section => (
            <motion.div key={section.id}
              layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: section.isVisible ? 1 : 0.5 }}>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {section.displayOrder}
              </div>
              <div className="flex-1 min-w-0">
                {editingSection?.id === section.id
                  ? <input type="text" value={editingSection.title} onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-white outline-none text-sm" style={{ background: 'rgba(255,255,255,0.08)' }} autoFocus />
                  : <p className="text-white font-medium text-sm truncate">{section.title}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setSections(prev => prev.map(s => s.id === section.id ? { ...s, isVisible: !s.isVisible } : s))}
                  className="p-1.5 rounded-lg hover:bg-white/10">
                  {section.isVisible ? <Eye size={14} className="text-green-400" /> : <EyeOff size={14} className="text-yellow-400" />}
                </button>
                {editingSection?.id === section.id
                  ? <button onClick={() => { setSections(prev => prev.map(s => s.id === editingSection.id ? editingSection : s)); setEditingSection(null); }} className="p-1.5 rounded-lg hover:bg-white/10"><Check size={14} className="text-green-400" /></button>
                  : <button onClick={() => setEditingSection(section)} className="p-1.5 rounded-lg hover:bg-white/10"><Edit3 size={14} className="text-white/50" /></button>}
                <button onClick={() => setSections(prev => prev.map(s => s.id === section.id ? { ...s, isDeleted: true } : s))} className="p-1.5 rounded-lg hover:bg-white/10">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Gallery Tab (مكتبة المواد الدراسية) ─── */
function GalleryTab({ courses, setCourses }: { courses: GalleryCourse[]; setCourses: React.Dispatch<React.SetStateAction<GalleryCourse[]>> }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const active = courses.filter(c => !c.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  const resetForm = () => { setTitle(''); setSubtitle(''); setBadge(''); setImageUrl(''); setUploadError(null); setEditingId(null); setShowAdd(false); };

  const pickImage = async (file: File) => {
    setUploading(true); setUploadError(null);
    try {
      const result = await uploadMediaFile(file, 'gallery_courses');
      if (result.url) setImageUrl(result.url);
      else if (result.error) setUploadError(result.error);
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (course: GalleryCourse) => {
    setEditingId(course.id); setTitle(course.title); setSubtitle(course.subtitle);
    setBadge(course.badge || ''); setImageUrl(course.imageUrl); setShowAdd(true);
  };

  const saveCourse = () => {
    if (!title.trim() || !imageUrl) return;
    if (editingId !== null) {
      setCourses(prev => prev.map(c => c.id === editingId
        ? { ...c, title: title.trim(), subtitle: subtitle.trim(), badge: badge.trim() || undefined, imageUrl }
        : c));
    } else {
      setCourses(prev => [...prev, {
        id: genId(), title: title.trim(), subtitle: subtitle.trim(), badge: badge.trim() || undefined,
        imageUrl, displayOrder: active.length + 1, isDeleted: false,
      }]);
    }
    resetForm();
  };

  const removeCourse = (id: number) => setCourses(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));

  const move = (id: number, dir: -1 | 1) => {
    const idx = active.findIndex(c => c.id === id);
    const swapIdx = idx + dir;
    if (idx === -1 || swapIdx < 0 || swapIdx >= active.length) return;
    const a = active[idx], b = active[swapIdx];
    setCourses(prev => prev.map(c => {
      if (c.id === a.id) return { ...c, displayOrder: b.displayOrder };
      if (c.id === b.id) return { ...c, displayOrder: a.displayOrder };
      return c;
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">مكتبة المواد الدراسية</h2>
        <span className="text-sm text-white/40">{active.length} كورس</span>
      </div>
      <p className="text-xs text-white/40 mb-5">
        الكروت اللي بتظهر في معرض "مكتبة المواد الدراسية" بالصفحة الرئيسية. أي إضافة أو تعديل أو حذف هنا بيتزامن تلقائيًا لكل المستخدمين بمجرد الحفظ.
      </p>

      {!showAdd && (
        <button onClick={() => setShowAdd(true)}
          className="w-full mb-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-white"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}>
          <Plus size={15} /> إضافة كورس جديد
        </button>
      )}

      {showAdd && (
        <div className="rounded-2xl p-4 mb-5 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{editingId !== null ? 'تعديل الكورس' : 'كورس جديد'}</h3>
            <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10"><X size={14} className="text-white/50" /></button>
          </div>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الكورس (مثال: رياضيات متقدمة)"
            className="w-full px-3 py-2.5 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={inp} />
          <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="الوصف الفرعي (مثال: المستوى الثالث · 24 درس)"
            className="w-full px-3 py-2.5 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={inp} />
          <input type="text" value={badge} onChange={e => setBadge(e.target.value)} placeholder="شارة اختيارية (مثال: جديد / مميز / شعبي)"
            className="w-full px-3 py-2.5 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={inp} />
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-white/25" />}
            </div>
            <label className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-white/20 transition-colors">
              {uploading ? <><Loader2 size={14} className="animate-spin" /> جاري الرفع...</> : <><UploadCloud size={14} /> رفع صورة الكورس</>}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) pickImage(f); e.target.value = ''; }} />
            </label>
          </div>
          {uploadError && <p className="text-xs text-red-400">فشل رفع الصورة: {uploadError}</p>}
          <button onClick={saveCourse} disabled={!title.trim() || !imageUrl}
            className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: (!title.trim() || !imageUrl) ? 'rgba(255,255,255,0.1)' : 'white', color: (!title.trim() || !imageUrl) ? 'rgba(255,255,255,0.3)' : '#0a0a1a' }}>
            <Save size={14} /> {editingId !== null ? 'حفظ التعديل' : 'إضافة الكورس'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {active.map((course, i) => (
            <motion.div key={course.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <img src={course.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{course.title} {course.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-md ml-1" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>{course.badge}</span>}</p>
                <p className="text-white/40 text-xs truncate">{course.subtitle}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => move(course.id, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20"><ArrowUp size={14} className="text-white/50" /></button>
                <button onClick={() => move(course.id, 1)} disabled={i === active.length - 1} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20"><ArrowDown size={14} className="text-white/50" /></button>
                <button onClick={() => startEdit(course)} className="p-1.5 rounded-lg hover:bg-white/10"><Edit3 size={14} className="text-white/50" /></button>
                <button onClick={() => removeCourse(course.id)} className="p-1.5 rounded-lg hover:bg-white/10"><Trash2 size={14} className="text-red-400" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {active.length === 0 && (
          <p className="text-center text-white/30 text-sm py-8">لسه مفيش كورسات — دوس "إضافة كورس جديد" لتبدأ.</p>
        )}
      </div>
    </div>
  );
}

/* ─── Content Tab ─── */
function ContentTab({ content, setContent, sections, downloadFeatureEnabled, onMediaView }: {
  content: ContentItem[]; setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  sections: Section[]; downloadFeatureEnabled: boolean;
  onMediaView: (src: string, type: 'image' | 'video') => void;
}) {
  const [addMode, setAddMode] = useState<'media' | 'text'>('media');
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [showOnHome, setShowOnHome] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; posterUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const activeSections = sections.filter(s => !s.isDeleted);
  const activeContent = content.filter(c => !c.isDeleted);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const typeLabels: Record<string, string> = { video: '🎬', image: '🖼️', text: '📝', pdf: '📄', word: '📝', powerpoint: '📊', excel: '📈', zip: '📦' };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await readMediaFiles(files, 'content');
      // أول ملف بيتحط كمعاينة/عنصر المحتوى الحالي اللي بتضيفه دلوقتي —
      // الرفع خلص فعليًا هنا، مش مستنيين أي حاجة تانية. مفيش توليد
      // تلقائي لصورة الغلاف خالص دلوقتي — اختيارها بقى يدوي بس من
      // المعرض (زرار "اختيار صورة غلاف يدويًا") عشان الرفع يفضل أسرع
      // ما يمكن من غير أي معالجة فيديو إضافية.
      setUploadedFile(uploaded[0]);
      // أي ملفات زيادة (اختيار أكتر من صورة/فيديو مرة واحدة) بتتحول
      // كل واحدة لعنصر محتوى مستقل بنفس القسم/الإعدادات المختارة —
      // بدون أي توليد تلقائي لصورة غلاف؛ ممكن تتعدّل لاحقًا وتُختار
      // صورتها يدويًا من شاشة التعديل.
      if (uploaded.length > 1) {
        setContent(prev => [...prev, ...uploaded.slice(1).map(u => ({
          id: genId(), sectionId, title: u.name, type: mediaType, contentBody: desc.trim(),
          fileUrl: u.url, posterUrl: undefined as string | undefined, isFeatured: false, showOnHome, allowDownload: false, isDeleted: false,
          attachments: [] as Attachment[],
        }))]);
      }
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };
  /**
   * بيسمح للأدمن يختار صورة غلاف يدويًا من معرض الصور للفيديو المرفوع.
   * اختياري تمامًا — لو محدش اختار حاجة، الفيديو بيفضل شغال عادي بدون
   * صورة غلاف مصغّرة.
   */
  const pickCustomPoster = async (file: File) => {
    setPosterUploading(true);
    try {
      const result = await uploadMediaFile(file, 'content_posters');
      if (result.url) setUploadedFile(prev => prev ? { ...prev, posterUrl: result.url as string } : prev);
      else if (result.error) window.alert(`فشل رفع صورة الغلاف: ${result.error}`);
    } finally {
      setPosterUploading(false);
    }
  };
  const addContent = () => {
    if (addMode === 'media' && !uploadedFile && !title.trim()) return;
    if (addMode === 'text' && !title.trim() && !desc.trim()) return;
    setContent(prev => [...prev, {
      id: genId(), sectionId, title: title.trim() || (uploadedFile?.name || 'محتوى'),
      type: addMode === 'text' ? 'text' : mediaType, contentBody: desc.trim(),
      fileUrl: uploadedFile?.url || '', posterUrl: uploadedFile?.posterUrl, isFeatured: false, showOnHome,
      allowDownload: false, isDeleted: false, attachments,
    }]);
    setTitle(''); setDesc(''); setUploadedFile(null); setShowOnHome(false); setAttachments([]);
  };
  const [editingUpload, setEditingUpload] = useState<{ url: string; name: string; posterUrl?: string } | null>(null);
  const [editPosterUploading, setEditPosterUploading] = useState(false);
  const pickCustomPosterForEdit = async (file: File) => {
    if (!editingContent) return;
    setEditPosterUploading(true);
    try {
      const result = await uploadMediaFile(file, 'content_posters');
      if (result.url) {
        setEditingUpload(prev => ({ url: prev?.url || editingContent.fileUrl, name: prev?.name || editingContent.title, posterUrl: result.url as string }));
      } else if (result.error) {
        window.alert(`فشل رفع صورة الغلاف: ${result.error}`);
      }
    } finally {
      setEditPosterUploading(false);
    }
  };
  const saveEdit = () => {
    if (!editingContent) return;
    setContent(prev => prev.map(c => c.id === editingContent.id
      ? { ...editingContent, fileUrl: editingUpload?.url || editingContent.fileUrl, posterUrl: editingUpload?.posterUrl ?? editingContent.posterUrl }
      : c));
    setEditingContent(null); setEditingUpload(null);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">المحتوى</h2>
        <span className="text-sm text-white/40">{activeContent.length} عنصر</span>
      </div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
        <div className="flex gap-2 mb-4">
          {(['media', 'text'] as const).map(m => (
            <button key={m} onClick={() => { setAddMode(m); setUploadedFile(null); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: addMode === m ? 'rgba(255,255,255,0.12)' : 'transparent', color: addMode === m ? 'white' : 'rgba(255,255,255,0.4)', border: addMode === m ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
              {m === 'media' ? <><UploadCloud size={13} /> فيديو/صورة</> : <><Type size={13} /> نص</>}
            </button>
          ))}
        </div>
        {addMode === 'media' && (
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              {(['image', 'video'] as const).map(mt => (
                <button key={mt} onClick={() => { setMediaType(mt); setUploadedFile(null); }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: mediaType === mt ? (mt === 'image' ? 'rgba(110,181,255,0.15)' : 'rgba(107,191,122,0.15)') : 'transparent', color: mediaType === mt ? (mt === 'image' ? '#6EB5FF' : '#6BBF7A') : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {mt === 'image' ? <><ImageIcon size={12} /> صورة</> : <><Video size={12} /> فيديو</>}
                </button>
              ))}
            </div>
            {!uploadedFile ? (
              uploading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
                  <Loader2 size={24} className="text-white/50 animate-spin" />
                  <span className="text-xs text-white/60">جاري رفع {mediaType === 'image' ? 'الصورة' : 'الفيديو'}...</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
                  <UploadCloud size={24} className="text-white/40" />
                  <span className="text-xs text-white/50">{mediaType === 'image' ? 'اختر صورة (أو أكتر)' : 'اختر فيديو (أو أكتر)'}</span>
                  <input type="file" multiple accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileSelect} className="hidden" />
                </label>
              )
            ) : (
              <div className="rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {mediaType === 'image' ? <img src={uploadedFile.url} alt="" className="w-full max-h-48 object-contain" style={{ background: '#000' }} /> : <video src={uploadedFile.url} controls className="w-full max-h-48" />}
                <button onClick={() => setUploadedFile(null)} className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
            {/* صورة غلاف الفيديو (poster) — اختيار يدوي بالكامل من المعرض،
                مفيش أي توليد تلقائي من الفيديو نفسه */}
            {mediaType === 'video' && uploadedFile && (
              <div className="mt-2 flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#000' }}>
                  {posterUploading ? (
                    <Loader2 size={16} className="text-white/50 animate-spin" />
                  ) : uploadedFile.posterUrl ? (
                    <img src={uploadedFile.posterUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Video size={16} className="text-white/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 mb-1">
                    {posterUploading ? 'جاري رفع صورة الغلاف...' : uploadedFile.posterUrl ? 'صورة الغلاف جاهزة' : 'من غير صورة غلاف — اختياري'}
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer" style={{ background: 'rgba(107,191,122,0.12)', border: '1px solid rgba(107,191,122,0.3)', color: '#6BBF7A' }}>
                    <ImageIcon size={12} /> اختيار صورة غلاف من المعرض
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) void pickCustomPoster(f); e.target.value = ''; }} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان..."
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3 text-sm" style={inp} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="الوصف..." rows={2}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3 resize-none text-sm" style={inp} />
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl text-white outline-none text-sm" style={inp}>
            {activeSections.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.title}</option>)}
          </select>
          <button onClick={() => setShowOnHome(v => !v)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-sm"
            style={{ background: showOnHome ? 'rgba(107,191,122,0.12)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-white/80 flex items-center gap-1.5"><Home size={12} /> رئيسية</span>
            <span className="relative w-9 h-5 rounded-full" style={{ background: showOnHome ? '#6BBF7A' : 'rgba(255,255,255,0.15)' }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: showOnHome ? 'translateX(18px)' : 'translateX(2px)' }} />
            </span>
          </button>
        </div>
        <AttachmentPicker attachments={attachments} onChange={setAttachments} onView={onMediaView} />
        <button onClick={addContent} className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 font-bold flex items-center justify-center gap-2 mt-3 text-sm hover:scale-[1.01] transition-transform">
          <Plus size={14} /> إضافة
        </button>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {activeContent.map(item => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden text-lg cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  onClick={() => item.fileUrl && (item.type === 'image' || item.type === 'video') && onMediaView(item.fileUrl, item.type as 'image' | 'video')}>
                  {item.type === 'image' && item.fileUrl ? <img src={item.fileUrl} alt="" className="w-full h-full object-cover" /> : typeLabels[item.type] || '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  {editingContent?.id === item.id
                    ? <input type="text" value={editingContent.title} onChange={e => setEditingContent({ ...editingContent, title: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg text-white outline-none text-sm mb-1" style={{ background: 'rgba(255,255,255,0.08)' }} autoFocus />
                    : <p className="text-white font-medium text-sm truncate" style={{ unicodeBidi: 'plaintext' }}>{item.title}</p>}
                  <p className="text-xs text-white/30 truncate">{sections.find(s => s.id === item.sectionId)?.title}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingContent?.id === item.id
                    ? <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-white/10"><Check size={13} className="text-green-400" /></button>
                    : <button onClick={() => setEditingContent(item)} className="p-1.5 rounded-lg hover:bg-white/10"><Edit3 size={13} className="text-white/50" /></button>}
                  <button onClick={() => setContent(prev => prev.map(c => c.id === item.id ? { ...c, isFeatured: !c.isFeatured } : c))} className="p-1.5 rounded-lg hover:bg-white/10">
                    <Star size={13} className={item.isFeatured ? 'text-yellow-400' : 'text-white/30'} />
                  </button>
                  <button onClick={() => setContent(prev => prev.map(c => c.id === item.id ? { ...c, showOnHome: !c.showOnHome } : c))} className="p-1.5 rounded-lg hover:bg-white/10">
                    {item.showOnHome ? <Eye size={13} className="text-green-400" /> : <EyeOff size={13} className="text-white/30" />}
                  </button>
                  {downloadFeatureEnabled && (
                    <button onClick={() => setContent(prev => prev.map(c => c.id === item.id ? { ...c, allowDownload: !c.allowDownload } : c))} className="p-1.5 rounded-lg hover:bg-white/10">
                      <Download size={13} className={item.allowDownload ? 'text-blue-400' : 'text-white/30'} />
                    </button>
                  )}
                  <button onClick={() => setContent(prev => prev.map(c => c.id === item.id ? { ...c, isDeleted: true } : c))} className="p-1.5 rounded-lg hover:bg-white/10">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
              {editingContent?.id === item.id && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <select value={editingContent.sectionId} onChange={e => setEditingContent({ ...editingContent, sectionId: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={inp}>
                    {activeSections.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.title}</option>)}
                  </select>
                  {(editingContent.type === 'text') ? (
                    <textarea value={editingContent.contentBody} onChange={e => setEditingContent({ ...editingContent, contentBody: e.target.value })} rows={2}
                      placeholder="النص..." className="w-full px-3 py-2 rounded-lg text-white placeholder-white/30 outline-none resize-none text-sm" style={inp} />
                  ) : (
                    <>
                      {(editingUpload?.url || editingContent.fileUrl) && (
                        editingContent.type === 'image'
                          ? <img src={editingUpload?.url || editingContent.fileUrl} alt="" className="w-full max-h-40 object-contain rounded-lg" style={{ background: '#000' }} />
                          : <video src={editingUpload?.url || editingContent.fileUrl} controls className="w-full max-h-40 rounded-lg" />
                      )}
                      <label className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium cursor-pointer" style={{ background: 'rgba(107,191,122,0.12)', border: '1px solid rgba(107,191,122,0.3)', color: '#6BBF7A' }}>
                        <UploadCloud size={12} /> استبدال {editingContent.type === 'image' ? 'الصورة' : 'الفيديو'}
                        <input type="file" accept={editingContent.type === 'image' ? 'image/*' : 'video/*'} onChange={async e => { const nf = e.target.files?.[0]; if (!nf) return; const r = await readMediaFile(nf, 'content'); setEditingUpload({ url: r.url, name: r.name }); }} className="hidden" />
                      </label>
                      {editingContent.type === 'video' && (
                        <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#000' }}>
                            {editPosterUploading ? (
                              <Loader2 size={14} className="text-white/50 animate-spin" />
                            ) : (editingUpload?.posterUrl || editingContent.posterUrl) ? (
                              <img src={editingUpload?.posterUrl || editingContent.posterUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Video size={14} className="text-white/30" />
                            )}
                          </div>
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer" style={{ background: 'rgba(107,191,122,0.12)', border: '1px solid rgba(107,191,122,0.3)', color: '#6BBF7A' }}>
                            <ImageIcon size={12} /> تغيير صورة الغلاف يدويًا
                            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) void pickCustomPosterForEdit(f); e.target.value = ''; }} className="hidden" />
                          </label>
                        </div>
                      )}
                    </>
                  )}
                  <button onClick={() => { setEditingContent(null); setEditingUpload(null); }} className="w-full py-2 rounded-lg text-xs font-bold bg-white/10 text-white flex items-center justify-center gap-1"><X size={13} /> إلغاء</button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Record Tab ─── */
function RecordTab({ records, setRecords, sections, onMediaView }: {
  records: RecordItem[]; setRecords: React.Dispatch<React.SetStateAction<RecordItem[]>>;
  sections: Section[]; onMediaView: (src: string, type: 'image' | 'video') => void;
}) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<{ url: string; name: string } | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [title, setTitle] = useState(''); const [text, setText] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [showOnHome, setShowOnHome] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [editingAudio, setEditingAudio] = useState<{ url: string; name: string } | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const activeSections = sections.filter(s => !s.isDeleted);
  const activeRecords = records.filter(r => !r.isDeleted);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => { const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); setAudioUrl(URL.createObjectURL(blob)); stream.getTracks().forEach(t => t.stop()); };
      mr.start(); mediaRef.current = mr; setRecording(true);
    } catch { alert('لم يتم السماح بالميكروفون'); }
  };
  const addRecord = () => {
    const finalUrl = uploadedAudio?.url || audioUrl;
    if (!finalUrl) return;
    setRecords(prev => [...prev, {
      id: genId(), title: title.trim() || 'تعليق صوتي', audioUrl: finalUrl,
      sectionId, section: sections.find(s => s.id === sectionId)?.title || '',
      showOnHome, isDeleted: false, text: text.trim(), attachments,
    }]);
    setTitle(''); setText(''); setAudioUrl(null); setUploadedAudio(null); setShowOnHome(false); setAttachments([]);
  };
  const startEdit = (r: RecordItem) => { setEditingRecord(r); setEditingAudio(null); };
  const saveEdit = () => {
    if (!editingRecord) return;
    setRecords(prev => prev.map(r => r.id === editingRecord.id
      ? { ...editingRecord, audioUrl: editingAudio?.url || editingRecord.audioUrl, section: sections.find(s => s.id === editingRecord.sectionId)?.title || '' }
      : r));
    setEditingRecord(null); setEditingAudio(null);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">التعليقات الصوتية</h2>
        <span className="text-sm text-white/40">{activeRecords.length} تعليق</span>
      </div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
        <div className="flex gap-2 mb-3">
          {!recording
            ? <button onClick={startRecording} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                <Mic size={14} /> تسجيل
              </button>
            : <button onClick={() => { mediaRef.current?.stop(); setRecording(false); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171' }}>
                <StopCircle size={14} /> إيقاف
              </button>}
          <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer" style={{ background: uploadingAudio ? 'rgba(255,255,255,0.05)' : 'rgba(107,191,122,0.12)', border: uploadingAudio ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(107,191,122,0.3)', color: uploadingAudio ? 'rgba(255,255,255,0.4)' : '#6BBF7A' }}>
            {uploadingAudio ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} {uploadingAudio ? 'جاري الرفع...' : 'رفع صوت (أو أكتر من ملف)'}
            <input type="file" multiple accept="audio/*" disabled={uploadingAudio} onChange={async e => {
              const fs = Array.from(e.target.files || []); if (!fs.length) return;
              setUploadingAudio(true);
              try {
                const uploaded = await readFiles(fs, 'audio');
                setUploadedAudio(uploaded[0]); setAudioUrl(null);
                // أي ملفات صوتية زيادة بتتضاف مباشرة كتعليقات صوتية مستقلة
                if (uploaded.length > 1) {
                  setRecords(prev => [...prev, ...uploaded.slice(1).map(u => ({
                    id: genId(), title: u.name, audioUrl: u.url,
                    sectionId, section: sections.find(s => s.id === sectionId)?.title || '',
                    showOnHome: false, isDeleted: false, text: '', attachments: [] as Attachment[],
                  }))]);
                }
              } finally { setUploadingAudio(false); }
              e.target.value = '';
            }} className="hidden" />
          </label>
        </div>
        {(audioUrl || uploadedAudio) && (
          <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <audio src={uploadedAudio?.url || audioUrl!} controls className="w-full" />
          </div>
        )}
        <select value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl text-white outline-none mb-2 text-sm" style={inp}>
          {activeSections.map(s => <option key={s.id} value={s.id} style={{ background: '#0a0a1a' }}>{s.title}</option>)}
        </select>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان (اختياري)"
          className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/30 outline-none mb-2 text-sm" style={inp} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="نص توضيحي..." rows={2}
          className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/30 outline-none mb-2 resize-none text-sm" style={inp} />
        <AttachmentPicker attachments={attachments} onChange={setAttachments} onView={onMediaView} />
        <label className="flex items-center gap-2 mt-2 mb-1 cursor-pointer select-none">
          <input type="checkbox" checked={showOnHome} onChange={e => setShowOnHome(e.target.checked)} />
          <span className="text-xs text-white/50">إظهار في الصفحة الرئيسية</span>
        </label>
        <button onClick={addRecord} disabled={!audioUrl && !uploadedAudio}
          className="w-full px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-3 text-sm transition-all"
          style={{ background: (audioUrl || uploadedAudio) ? 'white' : 'rgba(255,255,255,0.1)', color: (audioUrl || uploadedAudio) ? '#0a0a1a' : 'rgba(255,255,255,0.3)' }}>
          <Plus size={14} /> إضافة التعليق
        </button>
      </div>
      <div className="space-y-2">
        {activeRecords.map(r => (
          <motion.div key={r.id} layout className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {editingRecord?.id === r.id ? (
              <div className="space-y-2">
                <input type="text" value={editingRecord.title} onChange={e => setEditingRecord({ ...editingRecord, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={inp} />
                <select value={editingRecord.sectionId} onChange={e => setEditingRecord({ ...editingRecord, sectionId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={inp}>
                  {activeSections.map(s => <option key={s.id} value={s.id} style={{ background: '#0a0a1a' }}>{s.title}</option>)}
                </select>
                <audio src={editingAudio?.url || editingRecord.audioUrl} controls className="w-full" style={{ height: 32 }} />
                <label className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium cursor-pointer" style={{ background: 'rgba(107,191,122,0.12)', border: '1px solid rgba(107,191,122,0.3)', color: '#6BBF7A' }}>
                  <UploadCloud size={12} /> استبدال الصوت
                  <input type="file" accept="audio/*" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setEditingAudio({ url: await readFile(f, 'audio'), name: f.name }); }} className="hidden" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={editingRecord.showOnHome} onChange={e => setEditingRecord({ ...editingRecord, showOnHome: e.target.checked })} />
                  <span className="text-xs text-white/50">إظهار في الصفحة الرئيسية</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 py-2 rounded-lg text-xs font-bold bg-white text-gray-900 flex items-center justify-center gap-1"><Check size={13} /> حفظ</button>
                  <button onClick={() => { setEditingRecord(null); setEditingAudio(null); }} className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/10 text-white flex items-center justify-center gap-1"><X size={13} /> إلغاء</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <Mic size={16} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate" style={{ unicodeBidi: 'plaintext' }}>{r.title}</p>
                    <p className="text-xs text-white/30">{sections.find(s => s.id === r.sectionId)?.title || r.section}</p>
                  </div>
                  <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-white/10"><Edit3 size={13} className="text-white/50" /></button>
                  <button onClick={() => setRecords(prev => prev.map(x => x.id === r.id ? { ...x, isDeleted: true } : x))} className="p-1.5 rounded-lg hover:bg-white/10">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
                <audio src={r.audioUrl} controls className="w-full" style={{ height: 32 }} />
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Files Tab ─── */
function FilesTab({ files, setFiles, sections, onMediaView }: {
  files: FileItem[]; setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  sections: Section[]; onMediaView: (src: string, type: 'image' | 'video') => void;
}) {
  const [title, setTitle] = useState(''); const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [fileType, setFileType] = useState<FileItem['fileType']>('pdf');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editingUpload, setEditingUpload] = useState<{ url: string; name: string } | null>(null);
  const activeSections = sections.filter(s => !s.isDeleted);
  const activeFiles = files.filter(f => !f.isDeleted);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const fileAccept: Record<string, string> = { pdf: '.pdf', word: '.doc,.docx', excel: '.xls,.xlsx', ppt: '.ppt,.pptx', zip: '.zip,.rar' };
  const addFile = () => {
    if (!uploadedFile) return;
    setFiles(prev => [...prev, {
      id: genId(), title: title.trim() || uploadedFile.name, fileUrl: uploadedFile.url,
      fileName: uploadedFile.name, fileType, sectionId, showOnHome: false,
      isDeleted: false, allowDownload: true, attachments,
    }]);
    setTitle(''); setUploadedFile(null); setAttachments([]);
  };
  const startEdit = (f: FileItem) => { setEditingFile(f); setEditingUpload(null); };
  const saveEdit = () => {
    if (!editingFile) return;
    setFiles(prev => prev.map(f => f.id === editingFile.id
      ? { ...editingFile, fileUrl: editingUpload?.url || editingFile.fileUrl, fileName: editingUpload?.name || editingFile.fileName }
      : f));
    setEditingFile(null); setEditingUpload(null);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">الملفات</h2>
        <span className="text-sm text-white/40">{activeFiles.length} ملف</span>
      </div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(['pdf', 'word', 'excel', 'ppt', 'zip'] as const).map(t => (
            <button key={t} onClick={() => { setFileType(t); setUploadedFile(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: fileType === t ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)', color: fileType === t ? 'white' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {fileTypeIcon[t]} {fileTypeLabel[t]}
            </button>
          ))}
        </div>
        {!uploadedFile ? (
          uploading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl mb-3" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
              <Loader2 size={24} className="text-white/50 animate-spin" />
              <span className="text-xs text-white/60">جاري رفع الملف...</span>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer hover:bg-white/5 mb-3" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
              <File size={24} className="text-white/40" />
              <span className="text-xs text-white/50">اختر ملف {fileTypeLabel[fileType]} (أو أكتر من ملف مرة واحدة)</span>
              <input type="file" multiple accept={fileAccept[fileType]} onChange={async e => {
                const fs = Array.from(e.target.files || []); if (!fs.length) return;
                setUploading(true);
                try {
                  const uploaded = await readFiles(fs, 'files');
                  setUploadedFile(uploaded[0]);
                  // أي ملفات زيادة بتتضاف مباشرة كعناصر ملفات مستقلة بنفس القسم
                  if (uploaded.length > 1) {
                    setFiles(prev => [...prev, ...uploaded.slice(1).map(u => ({
                      id: genId(), title: u.name, fileUrl: u.url, fileName: u.name,
                      fileType, sectionId, showOnHome: false, isDeleted: false, allowDownload: true,
                      attachments: [] as Attachment[],
                    }))]);
                  }
                } finally { setUploading(false); }
                e.target.value = '';
              }} className="hidden" />
            </label>
          )
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-xl">{fileTypeIcon[fileType]}</span>
            <p className="flex-1 text-sm text-white/70 truncate">{uploadedFile.name}</p>
            <button onClick={() => setUploadedFile(null)}><X size={14} className="text-white/40" /></button>
          </div>
        )}
        <select value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl text-white outline-none mb-2 text-sm" style={inp}>
          {activeSections.map(s => <option key={s.id} value={s.id} style={{ background: '#0a0a1a' }}>{s.title}</option>)}
        </select>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان (اختياري)"
          className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/30 outline-none mb-2 text-sm" style={inp} />
        <AttachmentPicker attachments={attachments} onChange={setAttachments} onView={onMediaView} />
        <button onClick={addFile} disabled={!uploadedFile}
          className="w-full px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-3 text-sm"
          style={{ background: uploadedFile ? 'white' : 'rgba(255,255,255,0.1)', color: uploadedFile ? '#0a0a1a' : 'rgba(255,255,255,0.3)' }}>
          <Plus size={14} /> رفع الملف
        </button>
      </div>
      <div className="space-y-2">
        {activeFiles.map(f => (
          <div key={f.id} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {editingFile?.id === f.id ? (
              <div className="space-y-2">
                <input type="text" value={editingFile.title} onChange={e => setEditingFile({ ...editingFile, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={inp} />
                <select value={editingFile.sectionId} onChange={e => setEditingFile({ ...editingFile, sectionId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={inp}>
                  {activeSections.map(s => <option key={s.id} value={s.id} style={{ background: '#0a0a1a' }}>{s.title}</option>)}
                </select>
                <div className="flex items-center gap-2 text-xs text-white/50 truncate">
                  <span>{fileTypeIcon[editingFile.fileType]}</span> {editingUpload?.name || editingFile.fileName}
                </div>
                <label className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium cursor-pointer" style={{ background: 'rgba(107,191,122,0.12)', border: '1px solid rgba(107,191,122,0.3)', color: '#6BBF7A' }}>
                  <UploadCloud size={12} /> استبدال الملف
                  <input type="file" accept={fileAccept[editingFile.fileType]} onChange={async e => { const nf = e.target.files?.[0]; if (!nf) return; setEditingUpload({ url: await readFile(nf, 'files'), name: nf.name }); }} className="hidden" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={editingFile.showOnHome} onChange={e => setEditingFile({ ...editingFile, showOnHome: e.target.checked })} />
                  <span className="text-xs text-white/50">إظهار في الصفحة الرئيسية</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 py-2 rounded-lg text-xs font-bold bg-white text-gray-900 flex items-center justify-center gap-1"><Check size={13} /> حفظ</button>
                  <button onClick={() => { setEditingFile(null); setEditingUpload(null); }} className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/10 text-white flex items-center justify-center gap-1"><X size={13} /> إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{fileTypeIcon[f.fileType]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate" style={{ unicodeBidi: 'plaintext' }}>{f.title}</p>
                  <p className="text-xs text-white/30">{fileTypeLabel[f.fileType]} · {sections.find(s => s.id === f.sectionId)?.title}</p>
                </div>
                <button onClick={() => startEdit(f)} className="p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0"><Edit3 size={13} className="text-white/50" /></button>
                <button onClick={() => setFiles(prev => prev.map(x => x.id === f.id ? { ...x, isDeleted: true } : x))} className="p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comments Tab ─── */
function CommentsTab() {
  const [comments, setComments] = useState<PublicCommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const refresh = useCallback(() => {
    fetchAllComments().then(rows => { setComments(rows); setLoading(false); });
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeComments(refresh);
    return unsubscribe;
  }, [refresh]);

  const toggleVisible = async (c: PublicCommentRow) => {
    // تحديث فوري في الواجهة (optimistic) ثم تأكيد فعلي مع Supabase
    setComments(prev => prev.map(x => x.id === c.id ? { ...x, is_visible: !x.is_visible } : x));
    await setCommentVisibility(c.id, !c.is_visible);
  };

  const remove = async (id: number) => {
    setComments(prev => prev.filter(x => x.id !== id));
    await deleteComment(id);
  };

  const sendReply = async (id: number) => {
    if (!replyText.trim()) return;
    setComments(prev => prev.map(x => x.id === id ? { ...x, reply_text: replyText } : x));
    await replyToComment(id, replyText);
    setReplyingTo(null); setReplyText('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">التعليقات</h2>
        <span className="text-sm text-white/40">{comments.filter(c => !c.is_visible).length} قيد المراجعة</span>
      </div>
      <p className="text-xs text-white/30 mb-4">
        أي تعليق جديد من زائر بيوصل هنا "قيد المراجعة" تلقائيًا. اضغط زر العين لإظهاره للعلن في الصفحة الرئيسية أو إخفائه، أو زر السلة لحذفه نهائيًا.
      </p>
      {loading && <p className="text-sm text-white/30">جاري التحميل...</p>}
      {!loading && comments.length === 0 && <p className="text-sm text-white/30">لا توجد تعليقات بعد.</p>}
      <div className="space-y-2">
        {comments.map(c => (
          <div key={c.id} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: c.is_visible ? '1px solid rgba(107,191,122,0.25)' : '1px solid rgba(255,200,0,0.25)' }}>
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${c.id * 47}, 60%, 50%)`, color: 'white' }}>{c.name.slice(0, 2)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{c.name} <span className="text-xs text-white/30 font-normal" style={{ direction: 'ltr' }}>· {c.phone}</span></p>
                <p className="text-sm text-white/80 mt-0.5">{c.comment_text}</p>
                <p className="text-xs text-white/30 mt-0.5">{new Date(c.created_at).toLocaleString('ar-EG')}</p>
                {c.reply_text && <div className="mt-1.5 pr-3 border-r-2 border-white/10"><p className="text-xs text-white/50">{c.reply_text}</p></div>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggleVisible(c)} className="p-1.5 rounded-lg hover:bg-white/10" title={c.is_visible ? 'إخفاء عن العلن' : 'إظهار للعلن'}>
                  {c.is_visible ? <Eye size={12} className="text-green-400" /> : <EyeOff size={12} className="text-yellow-400" />}
                </button>
                <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-white/10" title="حذف نهائي">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>
            {replyingTo === c.id ? (
              <div className="flex gap-2 mt-2 pr-9">
                <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="ردك..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none" style={{ background: 'rgba(255,255,255,0.06)' }} autoFocus />
                <button onClick={() => sendReply(c.id)} className="px-2 py-2 rounded-lg bg-white/10 text-white"><Check size={12} /></button>
                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-2 py-2 rounded-lg bg-white/5 text-white/50"><X size={12} /></button>
              </div>
            ) : (
              <button onClick={() => { setReplyingTo(c.id); setReplyText(c.reply_text || ''); }} className="mt-1 mr-9 text-xs text-white/30 hover:text-white/60">{c.reply_text ? 'تعديل الرد...' : 'رد...'}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Analytics Tab ─── */
function AnalyticsTab({ content, records, files }: { content: ContentItem[]; records: RecordItem[]; files: FileItem[] }) {
  const [pendingComments, setPendingComments] = useState(0);
  useEffect(() => {
    const refresh = () => fetchAllComments().then(rows => setPendingComments(rows.filter(c => !c.is_visible).length));
    refresh();
    return subscribeComments(refresh);
  }, []);
  const stats = [
    { label: 'المحتوى', value: content.filter(c => !c.isDeleted).length, color: '#F4845F' },
    { label: 'الصوتيات', value: records.filter(r => !r.isDeleted).length, color: '#E882B4' },
    { label: 'الملفات', value: files.filter(f => !f.isDeleted).length, color: '#6BBF7A' },
    { label: 'تعليقات قيد المراجعة', value: pendingComments, color: '#6EB5FF' },
  ];
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-5">الإحصائيات</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={i} className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className="text-4xl font-black" style={{ color: stat.color }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Trash Tab ─── */
function TrashTab({ sections, setSections, content, setContent, records, setRecords, files, setFiles }: {
  sections: Section[]; setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  content: ContentItem[]; setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  records: RecordItem[]; setRecords: React.Dispatch<React.SetStateAction<RecordItem[]>>;
  files: FileItem[]; setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}) {
  const del = [...sections.filter(s => s.isDeleted), ...content.filter(c => c.isDeleted), ...records.filter(r => r.isDeleted), ...files.filter(f => f.isDeleted)];
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">المحذوفات</h2>
        {del.length > 0 && (
          <button onClick={() => { setSections(p => p.filter(s => !s.isDeleted)); setContent(p => p.filter(c => !c.isDeleted)); setRecords(p => p.filter(r => !r.isDeleted)); setFiles(p => p.filter(f => !f.isDeleted)); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30">تفريغ</button>
        )}
      </div>
      {del.length === 0 ? (
        <div className="text-center py-12"><Trash2 size={40} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">السلة فارغة</p></div>
      ) : (
        <div className="space-y-2">
          {sections.filter(s => s.isDeleted).map(s => (
            <div key={s.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
              <span className="text-xs text-white/30 flex-shrink-0">قسم</span>
              <p className="flex-1 text-white/60 text-sm truncate">{s.title}</p>
              <button onClick={() => setSections(p => p.map(x => x.id === s.id ? { ...x, isDeleted: false } : x))} className="px-2.5 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">استعادة</button>
            </div>
          ))}
          {content.filter(c => c.isDeleted).map(c => (
            <div key={c.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
              <span className="text-xs text-white/30 flex-shrink-0">محتوى</span>
              <p className="flex-1 text-white/60 text-sm truncate">{c.title}</p>
              <button onClick={() => setContent(p => p.map(x => x.id === c.id ? { ...x, isDeleted: false } : x))} className="px-2.5 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">استعادة</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Settings Tab ─── */
/**
 * TextsImagesPanel — قسم "نصوص والصور" جوه الإعدادات: بيسمح للأدمن يعدّل
 * (أو يرجّع للأصل) أي نص أو صورة من كتالوج siteContentRegistry.ts.
 * التعديلات دي بتتحفظ وبتتزامن بنفس آلية باقي بيانات لوحة الإدارة
 * (localStorage + Supabase/GitHub)، وبتظهر فورًا لكل المستخدمين — راجع
 * useSiteText/useSiteImage في src/hooks/useSiteContent.ts.
 */
function TextsImagesPanel({ siteTexts, setSiteTexts, siteImages, setSiteImages, startExpanded }: {
  siteTexts: Record<string, string>; setSiteTexts: (v: Record<string, string>) => void;
  siteImages: Record<string, string>; setSiteImages: (v: Record<string, string>) => void;
  /** لما تتفتح كـ تبويب مستقل (وليها الشاشة كلها) يبقى منطقي إنها تبدأ مفتوحة بدل ما تتطلب ضغطة زيادة. */
  startExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(!!startExpanded);
  const [query, setQuery] = useState('');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  const q = query.trim().toLowerCase();
  const textFields = SITE_TEXT_FIELDS.filter(f => !q || f.label.toLowerCase().includes(q) || f.group.toLowerCase().includes(q) || f.default.toLowerCase().includes(q));
  const imageFields = SITE_IMAGE_FIELDS.filter(f => !q || f.label.toLowerCase().includes(q) || f.group.toLowerCase().includes(q));

  const groupBy = <T extends { group: string }>(arr: T[]) => {
    const map = new Map<string, T[]>();
    for (const item of arr) { const list = map.get(item.group) || []; list.push(item); map.set(item.group, list); }
    return Array.from(map.entries());
  };

  const editedCount = Object.keys(siteTexts).length + Object.keys(siteImages).length;

  const setText = (key: string, value: string, def: string) => {
    const next = { ...siteTexts };
    if (value === def) delete next[key]; else next[key] = value;
    setSiteTexts(next);
  };
  const resetText = (key: string) => { const next = { ...siteTexts }; delete next[key]; setSiteTexts(next); };
  const resetImage = (key: string) => { const next = { ...siteImages }; delete next[key]; setSiteImages(next); };
  const setImage = (key: string, value: string) => setSiteImages({ ...siteImages, [key]: value });

  const pickImage = async (key: string, file: File) => {
    setUploadingKey(key);
    try {
      const result = await uploadMediaFile(file, 'site-content');
      if (result.url) setImage(key, result.url);
      else if (result.error) window.alert(`فشل رفع الصورة: ${result.error}`);
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type size={16} className="text-white/60" />
          <h3 className="text-base font-bold text-white">نصوص والصور</h3>
          {editedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(249,115,22,0.18)', color: '#f97316' }}>{editedCount} معدّل</span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>
      <p className="text-xs text-white/40 mt-2">
        تعديل أو حذف أي نص أو صورة ظاهرة في التطبيق مباشرة — من غير ما تلمس الكود. أي تغيير هنا بيوصل فورًا لكل المستخدمين.
      </p>

      {expanded && (
        <div className="mt-4 space-y-5">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="دوّر على نص أو صورة..."
            className="w-full px-3 py-2.5 rounded-xl text-white placeholder-white/25 outline-none text-sm" style={inp} />

          {/* النصوص */}
          {textFields.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Type size={12} /> النصوص</h4>
              <div className="space-y-4">
                {groupBy(textFields).map(([group, fields]) => (
                  <div key={group}>
                    <p className="text-[11px] font-bold text-orange-400/80 mb-1.5">{group}</p>
                    <div className="space-y-2">
                      {fields.map(f => {
                        const current = siteTexts[f.key] ?? f.default;
                        const isEdited = f.key in siteTexts;
                        return (
                          <div key={f.key} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-white/55">{f.label}</span>
                              {isEdited && (
                                <button onClick={() => resetText(f.key)} className="text-[10px] flex items-center gap-1 text-white/35 hover:text-white/70">
                                  <RotateCcw size={10} /> رجّع الأصلي
                                </button>
                              )}
                            </div>
                            {f.multiline ? (
                              <textarea value={current} onChange={e => setText(f.key, e.target.value, f.default)} rows={2}
                                className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm resize-none" style={inp} />
                            ) : (
                              <input type="text" value={current} onChange={e => setText(f.key, e.target.value, f.default)}
                                className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={inp} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الصور */}
          {imageFields.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2 flex items-center gap-1.5"><ImageIcon size={12} /> الصور</h4>
              <div className="space-y-3">
                {groupBy(imageFields).map(([group, fields]) => (
                  <div key={group}>
                    <p className="text-[11px] font-bold text-orange-400/80 mb-1.5">{group}</p>
                    <div className="space-y-2">
                      {fields.map(f => {
                        const current = siteImages[f.key] ?? f.default;
                        const isEdited = f.key in siteImages;
                        return (
                          <div key={f.key} className="rounded-xl p-2.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              {current ? <img src={current} alt={f.label} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-white/20" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white/55 truncate">{f.label}</span>
                                {isEdited && (
                                  <button onClick={() => resetImage(f.key)} className="text-[10px] flex items-center gap-1 text-white/35 hover:text-white/70 flex-shrink-0">
                                    <RotateCcw size={10} /> رجّع الأصلي
                                  </button>
                                )}
                              </div>
                              <label className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:bg-white/20 transition-colors w-fit">
                                {uploadingKey === f.key ? <><Loader2 size={12} className="animate-spin" /> جاري الرفع...</> : <><UploadCloud size={12} /> رفع صورة جديدة</>}
                                <input type="file" accept="image/*" className="hidden" disabled={uploadingKey === f.key}
                                  onChange={e => { const file = e.target.files?.[0]; if (file) pickImage(f.key, file); e.target.value = ''; }} />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {textFields.length === 0 && imageFields.length === 0 && (
            <p className="text-xs text-white/30 text-center py-4">مفيش نتائج مطابقة للبحث</p>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ appName, setAppName, appIconUrl, setAppIconUrl, themeColors, setThemeColors, maintenanceMode, setMaintenanceMode, rgbLighting, setRgbLighting, notifications, setNotifications, downloadFeatureEnabled, setDownloadFeatureEnabled, siteTexts, setSiteTexts, siteImages, setSiteImages, onPasswordChange, onSaveNow, saveStatus, saveWasCloud, saveErrorMessage, getCurrentDataSnapshot }: {
  appName: string; setAppName: (v: string) => void; appIconUrl: string; setAppIconUrl: (v: string) => void; themeColors: string[]; setThemeColors: (v: string[]) => void;
  maintenanceMode: boolean; setMaintenanceMode: (v: boolean) => void; rgbLighting: boolean; setRgbLighting: (v: boolean) => void;
  notifications: boolean; setNotifications: (v: boolean) => void; downloadFeatureEnabled: boolean; setDownloadFeatureEnabled: (v: boolean) => void;
  siteTexts: Record<string, string>; setSiteTexts: (v: Record<string, string>) => void;
  siteImages: Record<string, string>; setSiteImages: (v: Record<string, string>) => void;
  onPasswordChange?: (pw: string) => void;
  onSaveNow: () => void; saveStatus: 'idle' | 'saving' | 'saved' | 'error'; saveWasCloud: boolean; saveErrorMessage: string | null;
  /** بيرجّع أحدث نسخة من كل بيانات لوحة الإدارة — بنستخدمها لحظة تغيير
   *  مكان التخزين عشان ننقل آخر نسخة فورًا للمكان الجديد. */
  getCurrentDataSnapshot: () => unknown;
}) {
  const [newPassword, setNewPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [iconUploading, setIconUploading] = useState(false);
  const [iconUploadError, setIconUploadError] = useState<string | null>(null);
  const pickAppIcon = async (file: File) => {
    setIconUploading(true); setIconUploadError(null);
    try {
      const result = await uploadMediaFile(file, 'branding');
      if (result.url) setAppIconUrl(result.url);
      else if (result.error) setIconUploadError(result.error);
    } finally {
      setIconUploading(false);
    }
  };
  const [authCode, setAuthCode] = useState(''); const [showPw, setShowPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false); const [pwError, setPwError] = useState('');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);
  const [storageLocation, setStorageLocationState] = useState<StorageLocation>(() => getStorageLocation());
  const [storageStatus, setStorageStatus] = useState<'idle' | 'working' | 'done' | 'denied'>('idle');
  const [storageError, setStorageError] = useState<string | null>(null);
  const handlePickStorageLocation = async (loc: StorageLocation) => {
    if (loc === storageLocation) return;
    setStorageStatus('working'); setStorageError(null);
    const result = await changeStorageLocation(loc, getCurrentDataSnapshot());
    if (result.granted) {
      setStorageLocationState(loc);
      setStorageStatus('done');
      setTimeout(() => setStorageStatus('idle'), 3000);
    } else {
      setStorageStatus('denied');
      setStorageError(result.reason || 'الإذن مرفوض');
    }
  };
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const canSave = newPassword.length > 0 && newPassword === confirmPassword && authCode === REQUIRED_AUTH_CODE;
  const handleSavePw = () => {
    if (newPassword !== confirmPassword) { setPwError('كلمتا المرور غير متطابقتين'); return; }
    localStorage.setItem('admin_password', newPassword);
    onPasswordChange?.(newPassword);
    setPwSuccess(true); setNewPassword(''); setConfirmPassword(''); setAuthCode('');
    setTimeout(() => setPwSuccess(false), 4000);
  };
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">الإعدادات</h2>
      {/* حفظ كل التغييرات الآن */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(107,191,122,0.06)', border: '1px solid rgba(107,191,122,0.25)' }}>
        <div className="flex items-center gap-2 mb-2"><Save size={16} className="text-[#6BBF7A]" /><h3 className="text-base font-bold text-white">حفظ التغييرات</h3></div>
        <p className="text-xs text-white/45 mb-3">
          كل الأقسام والمحتوى والملفات والتسجيلات والإعدادات بتتحفظ تلقائيًا أول ما تعدّل أي حاجة، بس الزرار ده بيحفظ كل حاجة فورًا ويأكّدلك إن الحفظ نجح فعلاً.
        </p>
        <button
          onClick={onSaveNow}
          disabled={saveStatus === 'saving'}
          className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all"
          style={{
            background: saveStatus === 'error' ? 'rgba(255,80,80,0.15)' : saveStatus === 'saved' ? 'rgba(107,191,122,0.18)' : 'white',
            color: saveStatus === 'error' ? '#f87171' : saveStatus === 'saved' ? '#6BBF7A' : '#0a0a1a',
            cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
            opacity: saveStatus === 'saving' ? 0.75 : 1,
          }}
        >
          {saveStatus === 'saving' && <><Loader2 size={15} className="animate-spin" /> جاري الحفظ...</>}
          {saveStatus === 'saved' && <><Check size={15} /> {saveWasCloud ? 'تم حفظ كل التغييرات على السحابة' : 'تم الحفظ محليًا على هذا الجهاز'}</>}
          {saveStatus === 'error' && <><AlertCircle size={15} /> فشل الحفظ — تحقق من الاتصال بالإنترنت</>}
          {saveStatus === 'idle' && <><Save size={15} /> حفظ كل التغييرات الآن</>}
        </button>
        {saveStatus === 'error' && saveErrorMessage && (
          <p className="text-[11px] mt-2 text-center" style={{ color: '#fca5a5', direction: 'ltr' }}>{saveErrorMessage}</p>
        )}
      </div>
      {/* App name */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3"><Globe size={16} className="text-white/60" /><h3 className="text-base font-bold text-white">اسم التطبيق</h3></div>
        <div className="flex gap-2">
          <input type="text" value={appName} onChange={e => setAppName(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl text-white outline-none text-sm" style={inp} />
          <button className="px-4 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-sm flex items-center gap-1"><Save size={13} /> حفظ</button>
        </div>
      </div>
      {/* App icon / branding — داخل الموقع بس، راجع التنويه أسفل الصندوق */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3"><ImageIcon size={16} className="text-white/60" /><h3 className="text-base font-bold text-white">أيقونة التطبيق (شعار الموقع)</h3></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {appIconUrl ? <img src={appIconUrl} alt="أيقونة التطبيق" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-white/25" />}
          </div>
          <label className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-white/20 transition-colors">
            {iconUploading ? <><Loader2 size={14} className="animate-spin" /> جاري الرفع...</> : <><UploadCloud size={14} /> رفع أيقونة جديدة</>}
            <input type="file" accept="image/*" className="hidden" disabled={iconUploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) pickAppIcon(f); e.target.value = ''; }} />
          </label>
          {appIconUrl && (
            <button onClick={() => setAppIconUrl('')} className="p-2.5 rounded-xl hover:bg-white/10 text-white/40" title="إزالة الأيقونة"><X size={16} /></button>
          )}
        </div>
        {iconUploadError && <p className="text-xs text-red-400 mb-2">فشل رفع الأيقونة: {iconUploadError}</p>}
        <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
          <AlertCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-white/60">
            الاسم والأيقونة هنا بيتزامنوا فورًا لكل المستخدمين <b className="text-white/80">جوه الموقع/التطبيق نفسه</b> (الهيدر، تبويب المتصفح، وأيقونة الإضافة للشاشة الرئيسية عند أي تثبيت PWA جديد).
            لكن <b className="text-white/80">أيقونة التطبيق واسمه الظاهرين تحت أيقونته على الشاشة الرئيسية للهاتف</b> (زي "EduVerse" اللي شايفها تحت أيقونة التطبيق المثبّت فعلاً) بيتم تجميعهم داخل حزمة التطبيق نفسها (APK/AAB) وقت البناء — مفيش أي إعداد من جوه التطبيق يقدر يغيّرهم على أجهزة المستخدمين اللي مثبّتين التطبيق أصلاً؛ التغيير ده بيحتاج تعديل ملفات الأيقونة والاسم في مشروع Android ثم بناء ونشر تحديث حقيقي للتطبيق (عبر متجر التطبيقات أو حزمة APK جديدة) عشان يوصل لكل المستخدمين. لو جاهز تعمل التحديث ده، ابعتلي وهقولّك بالظبط الملفات اللي تتغيّر.
          </p>
        </div>
      </div>
      {/* Colors */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3"><Palette size={16} className="text-white/60" /><h3 className="text-base font-bold text-white">ألوان الثيم</h3></div>
        <div className="flex flex-wrap gap-4">
          {themeColors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <input type="color" value={color} onChange={e => { const c = [...themeColors]; c[i] = e.target.value; setThemeColors(c); }} className="w-12 h-12 rounded-xl cursor-pointer border-0" />
              <span className="text-xs text-white/40 font-mono">{color}</span>
            </div>
          ))}
        </div>
      </div>
      {/* System toggles */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-base font-bold text-white mb-3">إعدادات النظام</h3>
        <div className="space-y-3">
          <ToggleRow icon={<Power size={15} />} label="وضع الصيانة" description="يوقف الوصول للطلاب" checked={maintenanceMode} onChange={setMaintenanceMode} danger />
          <ToggleRow icon={<Lightbulb size={15} />} label="إضاءة RGB" description="تأثيرات ضوئية متحركة" checked={rgbLighting} onChange={setRgbLighting} />
          <ToggleRow icon={<Bell size={15} />} label="الإشعارات" description="إشعارات تحديث المحتوى" checked={notifications} onChange={setNotifications} />
          <ToggleRow icon={<Download size={15} />} label="أزرار التنزيل" description="تفعيل التنزيل لكل محتوى" checked={downloadFeatureEnabled} onChange={setDownloadFeatureEnabled} />
        </div>
      </div>
      {/* نصوص والصور — بقت تبويب مستقل جنب باقي التبويبات (شوف tabs[] فوق)، بدل ما تكون مطمورة هنا. */}
      {/* Storage */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-base font-bold text-white mb-3">التخزين</h3>
        {cacheCleared && <div className="mb-2 px-3 py-2 rounded-xl text-xs text-green-400 flex items-center gap-2" style={{ background: 'rgba(107,191,122,0.1)' }}><Check size={12} /> تم المسح</div>}
        <button onClick={async () => { try { if (caches) { const names = await caches.keys(); await Promise.all(names.map(n => caches.delete(n))); } setCacheCleared(true); setTimeout(() => setCacheCleared(false), 3000); } catch {} }}
          className="px-3 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400">مسح الذاكرة المؤقتة</button>

        {/* مكان التخزين على الجهاز */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-bold text-white mb-1">مكان التخزين على الهاتف</p>
          <p className="text-xs text-white/40 mb-3">
            بالإضافة للسحابة، بتتحفظ نسخة احتياطية من كل البيانات كملف حقيقي على تخزين الجهاز. "خارجي" بيشمل كارت الميموري تلقائيًا لو الجهاز مركّب فيه واحد ومتظبط كتخزين افتراضي. "الاثنين مع بعض" (الموصى به): لو مكان واحد فشل، التاني بيفضل شغال عادي من غير ما تضيع أي بيانات.
          </p>
          <div className="space-y-2">
            {(Object.keys(STORAGE_LOCATION_LABELS) as StorageLocation[]).map((loc) => (
              <button
                key={loc}
                onClick={() => handlePickStorageLocation(loc)}
                disabled={storageStatus === 'working'}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-start transition-all"
                style={{
                  background: storageLocation === loc ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                  border: storageLocation === loc ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  color: storageLocation === loc ? '#f97316' : 'white',
                  cursor: storageStatus === 'working' ? 'wait' : 'pointer',
                }}
              >
                <span className="font-medium">{STORAGE_LOCATION_LABELS[loc]}</span>
                {storageLocation === loc && <Check size={14} />}
              </button>
            ))}
          </div>
          {storageStatus === 'working' && (
            <p className="text-xs mt-2 text-white/40 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> جاري نقل البيانات للمكان الجديد...</p>
          )}
          {storageStatus === 'done' && (
            <p className="text-xs mt-2 text-[#6BBF7A] flex items-center gap-1.5"><Check size={12} /> تم تغيير مكان التخزين ونقل آخر نسخة بيانات إليه.</p>
          )}
          {storageStatus === 'denied' && (
            <p className="text-xs mt-2 text-red-400">{storageError}</p>
          )}
        </div>
      </div>
      {/* مصدر نشر المحتوى (Supabase / GitHub / كلاهما) */}
      <ContentSourcePanel />
      {/* Supabase Schema Reference */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-white/60" /><h3 className="text-base font-bold text-white">سكيما قاعدة بيانات Supabase</h3></div>
        <p className="text-xs text-white/40 mb-3">انسخ هذا الكود ونفّذه مرة واحدة في محرر SQL الخاص بمشروع Supabase لإنشاء الجداول المطلوبة.</p>
        <pre className="text-[11px] leading-relaxed text-white/60 whitespace-pre-wrap max-h-48 overflow-y-auto rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>{SUPABASE_SCHEMA}</pre>
        <button
          onClick={async () => { try { await navigator.clipboard.writeText(SUPABASE_SCHEMA); setSchemaCopied(true); setTimeout(() => setSchemaCopied(false), 3000); } catch {} }}
          className="mt-3 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
          style={{ background: schemaCopied ? 'rgba(107,191,122,0.15)' : 'rgba(255,255,255,0.08)', color: schemaCopied ? '#6BBF7A' : 'white' }}
        >
          {schemaCopied ? <Check size={13} /> : <FileText size={13} />} {schemaCopied ? 'تم النسخ' : 'نسخ السكيما'}
        </button>
      </div>
      {/* Change password */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-white/60" /><h3 className="text-base font-bold text-white">تغيير كلمة المرور</h3></div>
        {pwSuccess && <div className="mb-3 px-3 py-2 rounded-xl text-sm text-green-400 flex items-center gap-2" style={{ background: 'rgba(107,191,122,0.1)', border: '1px solid rgba(107,191,122,0.2)' }}><Check size={14} /> تم التحديث</div>}
        {pwError && <div className="mb-3 px-3 py-2 rounded-xl text-sm text-red-400" style={{ background: 'rgba(255,80,80,0.1)' }}>{pwError}</div>}
        <div className="space-y-2">
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwError(''); }} placeholder="كلمة المرور الجديدة"
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/20 outline-none text-sm" style={inp} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <input type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPwError(''); }} placeholder="تأكيد كلمة المرور"
            className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/20 outline-none text-sm" style={inp} />
          <input type="password" value={authCode} onChange={e => { setAuthCode(e.target.value); setPwError(''); }} placeholder="رقم التفويض"
            className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/20 outline-none text-sm" style={inp} />
          <button onClick={handleSavePw} disabled={!canSave}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all"
            style={{ background: canSave ? 'white' : 'rgba(255,255,255,0.1)', color: canSave ? '#0a0a1a' : 'rgba(255,255,255,0.3)', cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <Save size={14} /> حفظ كلمة المرور
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════
   MAIN — AdminDashboard
══════════════════════════════ */
export default function AdminDashboard({ currentPassword, onPasswordChange, onExit }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mediaViewer, setMediaViewer] = useState<{ src: string; type: 'image' | 'video' } | null>(null);

  const [data] = useState<AdminData>(() => loadData());
  const [appName, setAppName] = useState(data.appName);
  const [appIconUrl, setAppIconUrl] = useState(data.appIconUrl || '');
  const [themeColors, setThemeColors] = useState(data.themeColors);
  const [maintenanceMode, setMaintenanceMode] = useState(data.maintenanceMode);
  const [rgbLighting, setRgbLighting] = useState(data.rgbLighting);
  const [notifications, setNotifications] = useState(data.notifications);
  const [downloadFeatureEnabled, setDownloadFeatureEnabled] = useState(data.downloadFeatureEnabled);
  const [sections, setSections] = useState<Section[]>(data.sections);
  const [contentItems, setContentItems] = useState<ContentItem[]>(data.contentItems);
  const [records, setRecords] = useState<RecordItem[]>(data.records);
  const [files, setFiles] = useState<FileItem[]>(data.files);
  const [courses, setCourses] = useState<GalleryCourse[]>(data.courses && data.courses.length ? data.courses : DEFAULT_GALLERY_COURSES);
  const [siteTexts, setSiteTexts] = useState<Record<string, string>>(data.siteTexts || {});
  const [siteImages, setSiteImages] = useState<Record<string, string>>(data.siteImages || {});

  useEffect(() => {
    saveData({ appName, appIconUrl, themeColors, maintenanceMode, rgbLighting, notifications, downloadFeatureEnabled, sections, contentItems, records, files, courses, siteTexts, siteImages });
  }, [appName, appIconUrl, themeColors, maintenanceMode, rgbLighting, notifications, downloadFeatureEnabled, sections, contentItems, records, files, courses, siteTexts, siteImages]);

  // زرار "حفظ الآن" في الإعدادات — بيجمع أحدث نسخة من كل حاجة (أقسام،
  // محتوى، ملفات، تسجيلات، إعدادات) ويحفظها فورًا (محلي + Supabase لو
  // متصل) ويرجّع تأكيد حقيقي بدل انتظار الحفظ التلقائي المؤجَّل بصمت.
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveWasCloud, setSaveWasCloud] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const handleSaveNow = useCallback(async () => {
    setSaveStatus('saving');
    setSaveErrorMessage(null);
    const result = await saveDataNow({
      appName, appIconUrl, themeColors, maintenanceMode, rgbLighting, notifications, downloadFeatureEnabled,
      sections, contentItems, records, files, courses, siteTexts, siteImages,
    });
    setSaveWasCloud(result.cloud);
    setSaveStatus(result.ok ? 'saved' : 'error');
    if (!result.ok) setSaveErrorMessage(result.message || 'خطأ غير معروف');
    setTimeout(() => setSaveStatus('idle'), result.ok ? 3500 : 8000);
  }, [appName, appIconUrl, themeColors, maintenanceMode, rgbLighting, notifications, downloadFeatureEnabled, sections, contentItems, records, files, courses, siteTexts, siteImages]);

  // عند فتح لوحة الإدارة أول مرة على أي جهاز، نسحب أحدث نسخة حقيقية من
  // Supabase ونستبدل بيها القيم المحلية (اللي ممكن تكون بيانات تجريبية
  // افتراضية لو الجهاز ده فتح اللوحة لأول مرة). من غير الخطوة دي، أدمن
  // بيفتح اللوحة على جهاز جديد كان هيشوف بيانات افتراضية قديمة، ولو ضاف
  // حاجة كانت هتُكتب فوق آخر نسخة حقيقية وتمسحها بالغلط.
  useEffect(() => {
    let cancelled = false;
    pullRemoteAppData().then((remote) => {
      if (cancelled || !remote) return;
      const merged: AdminData = { ...DEFAULT_DATA, ...(remote as unknown as Partial<AdminData>) };
      setAppName(merged.appName);
      setAppIconUrl(merged.appIconUrl || '');
      setThemeColors(merged.themeColors);
      setMaintenanceMode(merged.maintenanceMode);
      setRgbLighting(merged.rgbLighting);
      setNotifications(merged.notifications);
      setDownloadFeatureEnabled(merged.downloadFeatureEnabled);
      setSections(merged.sections);
      setContentItems(stripKnownDemoSeed(merged.contentItems));
      setRecords(merged.records);
      setFiles(merged.files);
      setCourses(merged.courses && merged.courses.length ? merged.courses : DEFAULT_GALLERY_COURSES);
      setSiteTexts(merged.siteTexts || {});
      setSiteImages(merged.siteImages || {});
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMediaView = useCallback((src: string, type: 'image' | 'video') => setMediaViewer({ src, type }), []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <Home size={15} /> },
    { id: 'sections', label: 'الأقسام', icon: <BookOpen size={15} /> },
    { id: 'gallery', label: 'مكتبة المواد الدراسية', icon: <GraduationCap size={15} /> },
    { id: 'content', label: 'المحتوى', icon: <ImageIcon size={15} /> },
    { id: 'record', label: 'صوتي', icon: <Mic size={15} /> },
    { id: 'files', label: 'الملفات', icon: <File size={15} /> },
    { id: 'comments', label: 'تعليقات', icon: <MessageSquare size={15} /> },
    { id: 'analytics', label: 'إحصائيات', icon: <BarChart3 size={15} /> },
    { id: 'trash', label: 'محذوفات', icon: <Trash2 size={15} /> },
    { id: 'display', label: 'شاشة العرض', icon: <Monitor size={15} /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings size={15} /> },
    { id: 'texts', label: 'نصوص وصور', icon: <Type size={15} /> },
  ];

  const totalDeleted = sections.filter(s => s.isDeleted).length + contentItems.filter(c => c.isDeleted).length +
    records.filter(r => r.isDeleted).length + files.filter(f => f.isDeleted).length;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a', fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <AnimatePresence>
        {mediaViewer && <MediaViewer src={mediaViewer.src} type={mediaViewer.type} onClose={() => setMediaViewer(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-[500] flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(10,10,26,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">لوحة التحكم</span>
        </div>
        {onExit && (
          <button onClick={onExit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/60 hover:text-white text-xs transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <ArrowLeft size={12} /> خروج
          </button>
        )}
      </div>

      {/* Tabs — scrollable horizontally */}
      <div className="flex overflow-x-auto px-3 py-2.5 gap-1.5" style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {tabs.map(tab => {
          const isTrash = tab.id === 'trash';
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all relative flex-shrink-0"
              style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.12)' : 'transparent', color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)', border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent' }}>
              {tab.icon} {tab.label}
              {isTrash && totalDeleted > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px] font-bold">{totalDeleted}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-4 max-w-lg mx-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}>

            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5">مرحباً بك 👋</h2>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'الأقسام', value: sections.filter(s => !s.isDeleted).length, color: '#F4845F', icon: <BookOpen size={18} />, tab: 'sections' as Tab },
                    { label: 'المحتوى', value: contentItems.filter(c => !c.isDeleted).length, color: '#6BBF7A', icon: <ImageIcon size={18} />, tab: 'content' as Tab },
                    { label: 'الملفات', value: files.filter(f => !f.isDeleted).length, color: '#E882B4', icon: <File size={18} />, tab: 'files' as Tab },
                    { label: 'صوتيات', value: records.filter(r => !r.isDeleted).length, color: '#6EB5FF', icon: <Mic size={18} />, tab: 'record' as Tab },
                  ].map((s, i) => (
                    <motion.button key={i} onClick={() => setActiveTab(s.tab)}
                      className="rounded-2xl p-4 text-right transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                      </div>
                      <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                    </motion.button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {tabs.filter(t => t.id !== 'dashboard').map((tab, i) => (
                    <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl text-right transition-all hover:bg-white/8"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>{tab.icon}</div>
                      <span className="text-white/70 text-xs font-medium">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sections' && <SectionsTab sections={sections} setSections={setSections} />}
            {activeTab === 'gallery' && <GalleryTab courses={courses} setCourses={setCourses} />}
            {activeTab === 'content' && <ContentTab content={contentItems} setContent={setContentItems} sections={sections} downloadFeatureEnabled={downloadFeatureEnabled} onMediaView={onMediaView} />}
            {activeTab === 'record' && <RecordTab records={records} setRecords={setRecords} sections={sections} onMediaView={onMediaView} />}
            {activeTab === 'files' && <FilesTab files={files} setFiles={setFiles} sections={sections} onMediaView={onMediaView} />}
            {activeTab === 'comments' && <CommentsTab />}
            {activeTab === 'analytics' && <AnalyticsTab content={contentItems} records={records} files={files} />}
            {activeTab === 'trash' && <TrashTab sections={sections} setSections={setSections} content={contentItems} setContent={setContentItems} records={records} setRecords={setRecords} files={files} setFiles={setFiles} />}
            {activeTab === 'display' && <DisplayScreen />}
            {activeTab === 'texts' && <TextsImagesPanel siteTexts={siteTexts} setSiteTexts={setSiteTexts} siteImages={siteImages} setSiteImages={setSiteImages} startExpanded />}
            {activeTab === 'settings' && <SettingsTab appName={appName} setAppName={setAppName} appIconUrl={appIconUrl} setAppIconUrl={setAppIconUrl} themeColors={themeColors} setThemeColors={setThemeColors} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} rgbLighting={rgbLighting} setRgbLighting={setRgbLighting} notifications={notifications} setNotifications={setNotifications} downloadFeatureEnabled={downloadFeatureEnabled} setDownloadFeatureEnabled={setDownloadFeatureEnabled} siteTexts={siteTexts} setSiteTexts={setSiteTexts} siteImages={siteImages} setSiteImages={setSiteImages} onPasswordChange={onPasswordChange} onSaveNow={handleSaveNow} saveStatus={saveStatus} saveWasCloud={saveWasCloud} saveErrorMessage={saveErrorMessage} getCurrentDataSnapshot={() => ({ appName, appIconUrl, themeColors, maintenanceMode, rgbLighting, notifications, downloadFeatureEnabled, sections, contentItems, records, files, courses, siteTexts, siteImages })} />}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* زرار حفظ ثابت وظاهر في كل التابات (مش بس جوه الإعدادات) — عشان
          تقدر تأكّد إن أي إضافة أو تعديل اتحفظ فعلاً من غير ما تدوّر
          عليه في مكان تاني. */}
      <div style={{ position: 'fixed', insetInline: 0, bottom: 0, zIndex: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 16px calc(10px + env(safe-area-inset-bottom))', pointerEvents: 'none' }}>
        {saveStatus === 'error' && saveErrorMessage && (
          <div style={{
            pointerEvents: 'auto', maxWidth: '92vw', padding: '7px 14px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
            color: '#fca5a5', fontSize: '11.5px', textAlign: 'center', direction: 'ltr',
          }}>
            {saveErrorMessage}
          </div>
        )}
        <button
          onClick={handleSaveNow}
          disabled={saveStatus === 'saving'}
          style={{
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 22px', borderRadius: '999px', fontWeight: 700, fontSize: '13.5px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)', border: 'none',
            cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
            background: saveStatus === 'error' ? '#ef4444' : saveStatus === 'saved' ? '#6BBF7A' : 'white',
            color: saveStatus === 'error' || saveStatus === 'saved' ? 'white' : '#0a0a1a',
            opacity: saveStatus === 'saving' ? 0.8 : 1,
            transition: 'all 200ms ease',
          }}
        >
          {saveStatus === 'saving' && <><Loader2 size={16} className="animate-spin" /> جاري الحفظ...</>}
          {saveStatus === 'saved' && <><Check size={16} /> {saveWasCloud ? 'اتحفظ للجميع ✓' : 'اتحفظ محليًا ✓'}</>}
          {saveStatus === 'error' && <><AlertCircle size={16} /> فشل الحفظ، اضغط للمحاولة</>}
          {saveStatus === 'idle' && <><Save size={16} /> حفظ التغييرات</>}
        </button>
      </div>
    </div>
  );
}

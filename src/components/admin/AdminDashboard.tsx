import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Settings, BookOpen, FileText, MessageSquare, BarChart3, Trash2, Plus, Edit3, X,
  Check, Eye, EyeOff, Palette, Globe, Save, ArrowLeft, Home, Star, Shield, Power,
  Lightbulb, Bell, Image as ImageIcon, Video, UploadCloud, Type, Mic, MicOff, Download,
  File, Music, StopCircle, ZoomIn, Monitor,
} from 'lucide-react';
import DisplayScreen from './DisplayScreen';
import { SUPABASE_SCHEMA } from './SchemaPanel';

// ─── Auth code for password change only ───
const REQUIRED_AUTH_CODE = 'Yy2004//';
const STORAGE_KEY = 'eduverse_admin_data';

type Tab = 'dashboard' | 'settings' | 'sections' | 'content' | 'record' | 'files' | 'comments' | 'analytics' | 'trash' | 'display';

interface Section { id: number; title: string; isVisible: boolean; isDeleted: boolean; displayOrder: number; }
interface Attachment { url: string; name: string; type: 'image' | 'video' | 'audio'; }
interface ContentItem {
  id: number; sectionId: number; title: string; type: string; contentBody: string;
  fileUrl: string; isFeatured: boolean; showOnHome: boolean; allowDownload: boolean;
  isDeleted: boolean; attachments?: Attachment[];
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
interface Comment {
  id: number; contentId: number; userId: string; commentText: string;
  replyText: string | null; isVisible: boolean; createdAt: string;
}
interface AdminData {
  sections: Section[]; contentItems: ContentItem[]; records: RecordItem[];
  files: FileItem[]; comments: Comment[]; appName: string;
  themeColors: string[]; maintenanceMode: boolean; rgbLighting: boolean;
  notifications: boolean; downloadFeatureEnabled: boolean;
}

// ─── Props interface ───
interface AdminDashboardProps {
  currentPassword?: string;
  onPasswordChange?: (pw: string) => void;
  onExit?: () => void;
}

const DEFAULT_DATA: AdminData = {
  appName: 'EduVerse',
  themeColors: ['#F4845F', '#6BBF7A', '#E882B4', '#6EB5FF'],
  maintenanceMode: false, rgbLighting: true, notifications: true, downloadFeatureEnabled: false,
  sections: [
    { id: 1, title: 'المستوى الأول — رياضيات', isVisible: true, isDeleted: false, displayOrder: 1 },
    { id: 2, title: 'المستوى الثاني — علوم', isVisible: true, isDeleted: false, displayOrder: 2 },
    { id: 3, title: 'المستوى الأول — لغة عربية', isVisible: true, isDeleted: false, displayOrder: 3 },
    { id: 4, title: 'المستوى الثاني — فنون', isVisible: true, isDeleted: false, displayOrder: 4 },
  ],
  contentItems: [
    { id: 1, sectionId: 1, title: 'أساسيات الجبر', type: 'video', contentBody: 'شرح مبسط', fileUrl: '', isFeatured: true, showOnHome: true, allowDownload: false, isDeleted: false },
    { id: 2, sectionId: 2, title: 'التجارب العلمية', type: 'pdf', contentBody: '', fileUrl: '', isFeatured: true, showOnHome: true, allowDownload: false, isDeleted: false },
  ],
  records: [], files: [],
  comments: [
    { id: 1, contentId: 1, userId: 'user1', commentText: 'شرح رائع!', replyText: 'شكراً لك', isVisible: true, createdAt: '2025-01-15' },
    { id: 2, contentId: 2, userId: 'user2', commentText: 'هل يوجد ملف PDF؟', replyText: null, isVisible: true, createdAt: '2025-01-16' },
  ],
};

function loadData(): AdminData {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return { ...DEFAULT_DATA, ...JSON.parse(raw) }; } catch {}
  return DEFAULT_DATA;
}
function saveData(data: AdminData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); if (navigator.storage?.persist) navigator.storage.persist(); } catch {}
}

const readFile = (file: File): Promise<string> =>
  new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });

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
    const file = e.target.files?.[0]; if (!file) return;
    const url = await readFile(file);
    const type: Attachment['type'] = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
    onChange([...attachments, { url, name: file.name, type }]);
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
        <Plus size={12} /> إضافة صورة / فيديو / صوت
        <input type="file" accept="image/*,video/*,audio/*" onChange={addAttachment} className="hidden" />
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
    setSections(prev => [...prev, { id: Date.now(), title: newTitle, isVisible: true, isDeleted: false, displayOrder: activeSections.length + 1 }]);
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
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const activeSections = sections.filter(s => !s.isDeleted);
  const activeContent = content.filter(c => !c.isDeleted);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const typeLabels: Record<string, string> = { video: '🎬', image: '🖼️', text: '📝', pdf: '📄', word: '📝', powerpoint: '📊', excel: '📈', zip: '📦' };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await readFile(file); setUploadedFile({ url, name: file.name });
  };
  const addContent = () => {
    if (addMode === 'media' && !uploadedFile && !title.trim()) return;
    if (addMode === 'text' && !title.trim() && !desc.trim()) return;
    setContent(prev => [...prev, {
      id: Date.now(), sectionId, title: title.trim() || (uploadedFile?.name || 'محتوى'),
      type: addMode === 'text' ? 'text' : mediaType, contentBody: desc.trim(),
      fileUrl: uploadedFile?.url || '', isFeatured: false, showOnHome,
      allowDownload: false, isDeleted: false, attachments,
    }]);
    setTitle(''); setDesc(''); setUploadedFile(null); setShowOnHome(false); setAttachments([]);
  };
  const saveEdit = () => { if (!editingContent) return; setContent(prev => prev.map(c => c.id === editingContent.id ? editingContent : c)); setEditingContent(null); };
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
              <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
                <UploadCloud size={24} className="text-white/40" />
                <span className="text-xs text-white/50">{mediaType === 'image' ? 'اختر صورة' : 'اختر فيديو'}</span>
                <input type="file" accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileSelect} className="hidden" />
              </label>
            ) : (
              <div className="rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {mediaType === 'image' ? <img src={uploadedFile.url} alt="" className="w-full max-h-48 object-contain" style={{ background: '#000' }} /> : <video src={uploadedFile.url} controls className="w-full max-h-48" />}
                <button onClick={() => setUploadedFile(null)} className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <X size={14} className="text-white" />
                </button>
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
                    : <p className="text-white font-medium text-sm truncate">{item.title}</p>}
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
  const [title, setTitle] = useState(''); const [text, setText] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [showOnHome, setShowOnHome] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
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
      id: Date.now(), title: title.trim() || 'تعليق صوتي', audioUrl: finalUrl,
      sectionId, section: sections.find(s => s.id === sectionId)?.title || '',
      showOnHome, isDeleted: false, text: text.trim(), attachments,
    }]);
    setTitle(''); setText(''); setAudioUrl(null); setUploadedAudio(null); setShowOnHome(false); setAttachments([]);
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
          <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'rgba(107,191,122,0.12)', border: '1px solid rgba(107,191,122,0.3)', color: '#6BBF7A' }}>
            <UploadCloud size={14} /> رفع صوت
            <input type="file" accept="audio/*" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setUploadedAudio({ url: await readFile(f), name: f.name }); setAudioUrl(null); }} className="hidden" />
          </label>
        </div>
        {(audioUrl || uploadedAudio) && (
          <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <audio src={uploadedAudio?.url || audioUrl!} controls className="w-full" />
          </div>
        )}
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان (اختياري)"
          className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/30 outline-none mb-2 text-sm" style={inp} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="نص توضيحي..." rows={2}
          className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/30 outline-none mb-2 resize-none text-sm" style={inp} />
        <AttachmentPicker attachments={attachments} onChange={setAttachments} onView={onMediaView} />
        <button onClick={addRecord} disabled={!audioUrl && !uploadedAudio}
          className="w-full px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-3 text-sm transition-all"
          style={{ background: (audioUrl || uploadedAudio) ? 'white' : 'rgba(255,255,255,0.1)', color: (audioUrl || uploadedAudio) ? '#0a0a1a' : 'rgba(255,255,255,0.3)' }}>
          <Plus size={14} /> إضافة التعليق
        </button>
      </div>
      <div className="space-y-2">
        {activeRecords.map(r => (
          <motion.div key={r.id} layout className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Mic size={16} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{r.title}</p>
                <p className="text-xs text-white/30">{r.section}</p>
              </div>
              <button onClick={() => setRecords(prev => prev.map(x => x.id === r.id ? { ...x, isDeleted: true } : x))} className="p-1.5 rounded-lg hover:bg-white/10">
                <Trash2 size={13} className="text-red-400" />
              </button>
            </div>
            <audio src={r.audioUrl} controls className="w-full" style={{ height: 32 }} />
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const activeFiles = files.filter(f => !f.isDeleted);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const fileAccept: Record<string, string> = { pdf: '.pdf', word: '.doc,.docx', excel: '.xls,.xlsx', ppt: '.ppt,.pptx', zip: '.zip,.rar' };
  const addFile = () => {
    if (!uploadedFile) return;
    setFiles(prev => [...prev, {
      id: Date.now(), title: title.trim() || uploadedFile.name, fileUrl: uploadedFile.url,
      fileName: uploadedFile.name, fileType, sectionId, showOnHome: false,
      isDeleted: false, allowDownload: true, attachments,
    }]);
    setTitle(''); setUploadedFile(null); setAttachments([]);
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
          <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer hover:bg-white/5 mb-3" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
            <File size={24} className="text-white/40" />
            <span className="text-xs text-white/50">اختر ملف {fileTypeLabel[fileType]}</span>
            <input type="file" accept={fileAccept[fileType]} onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setUploadedFile({ url: await readFile(f), name: f.name }); }} className="hidden" />
          </label>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-xl">{fileTypeIcon[fileType]}</span>
            <p className="flex-1 text-sm text-white/70 truncate">{uploadedFile.name}</p>
            <button onClick={() => setUploadedFile(null)}><X size={14} className="text-white/40" /></button>
          </div>
        )}
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
          <div key={f.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-2xl flex-shrink-0">{fileTypeIcon[f.fileType]}</span>
            <div className="flex-1 min-w-0"><p className="text-white font-medium text-sm truncate">{f.title}</p><p className="text-xs text-white/30">{fileTypeLabel[f.fileType]}</p></div>
            <button onClick={() => setFiles(prev => prev.map(x => x.id === f.id ? { ...x, isDeleted: true } : x))} className="p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0">
              <Trash2 size={13} className="text-red-400" />
            </button>
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
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">التعليقات</h2>
        <span className="text-sm text-white/40">{comments.filter(c => !c.replyText).length} بدون رد</span>
      </div>
      <div className="space-y-2">
        {comments.map(c => (
          <div key={c.id} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: c.isVisible ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,0,0,0.2)', opacity: c.isVisible ? 1 : 0.5 }}>
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${c.id * 90}, 60%, 50%)`, color: 'white' }}>{c.userId.slice(-2)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{c.commentText}</p>
                <p className="text-xs text-white/30">{c.createdAt}</p>
                {c.replyText && <div className="mt-1.5 pr-3 border-r-2 border-white/10"><p className="text-xs text-white/50">{c.replyText}</p></div>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setComments(prev => prev.map(x => x.id === c.id ? { ...x, isVisible: !x.isVisible } : x))} className="p-1.5 rounded-lg hover:bg-white/10">
                  {c.isVisible ? <Eye size={12} className="text-white/50" /> : <EyeOff size={12} className="text-yellow-400" />}
                </button>
                <button onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))} className="p-1.5 rounded-lg hover:bg-white/10">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>
            {replyingTo === c.id ? (
              <div className="flex gap-2 mt-2 pr-9">
                <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="ردك..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none" style={{ background: 'rgba(255,255,255,0.06)' }} autoFocus />
                <button onClick={() => { if (!replyText.trim()) return; setComments(prev => prev.map(x => x.id === c.id ? { ...x, replyText } : x)); setReplyingTo(null); setReplyText(''); }} className="px-2 py-2 rounded-lg bg-white/10 text-white"><Check size={12} /></button>
                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-2 py-2 rounded-lg bg-white/5 text-white/50"><X size={12} /></button>
              </div>
            ) : !c.replyText ? (
              <button onClick={() => setReplyingTo(c.id)} className="mt-1 mr-9 text-xs text-white/30 hover:text-white/60">رد...</button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Analytics Tab ─── */
function AnalyticsTab({ comments, content, records, files }: { comments: Comment[]; content: ContentItem[]; records: RecordItem[]; files: FileItem[] }) {
  const stats = [
    { label: 'المحتوى', value: content.filter(c => !c.isDeleted).length, color: '#F4845F' },
    { label: 'الصوتيات', value: records.filter(r => !r.isDeleted).length, color: '#E882B4' },
    { label: 'الملفات', value: files.filter(f => !f.isDeleted).length, color: '#6BBF7A' },
    { label: 'تعليقات بدون رد', value: comments.filter(c => !c.replyText).length, color: '#6EB5FF' },
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
function SettingsTab({ appName, setAppName, themeColors, setThemeColors, maintenanceMode, setMaintenanceMode, rgbLighting, setRgbLighting, notifications, setNotifications, downloadFeatureEnabled, setDownloadFeatureEnabled, onPasswordChange }: {
  appName: string; setAppName: (v: string) => void; themeColors: string[]; setThemeColors: (v: string[]) => void;
  maintenanceMode: boolean; setMaintenanceMode: (v: boolean) => void; rgbLighting: boolean; setRgbLighting: (v: boolean) => void;
  notifications: boolean; setNotifications: (v: boolean) => void; downloadFeatureEnabled: boolean; setDownloadFeatureEnabled: (v: boolean) => void;
  onPasswordChange?: (pw: string) => void;
}) {
  const [newPassword, setNewPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [authCode, setAuthCode] = useState(''); const [showPw, setShowPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false); const [pwError, setPwError] = useState('');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);
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
      {/* App name */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3"><Globe size={16} className="text-white/60" /><h3 className="text-base font-bold text-white">اسم التطبيق</h3></div>
        <div className="flex gap-2">
          <input type="text" value={appName} onChange={e => setAppName(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl text-white outline-none text-sm" style={inp} />
          <button className="px-4 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-sm flex items-center gap-1"><Save size={13} /> حفظ</button>
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
      {/* Storage */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-base font-bold text-white mb-3">التخزين</h3>
        {cacheCleared && <div className="mb-2 px-3 py-2 rounded-xl text-xs text-green-400 flex items-center gap-2" style={{ background: 'rgba(107,191,122,0.1)' }}><Check size={12} /> تم المسح</div>}
        <button onClick={async () => { try { if (caches) { const names = await caches.keys(); await Promise.all(names.map(n => caches.delete(n))); } setCacheCleared(true); setTimeout(() => setCacheCleared(false), 3000); } catch {} }}
          className="px-3 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400">مسح الذاكرة المؤقتة</button>
      </div>
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
  const [themeColors, setThemeColors] = useState(data.themeColors);
  const [maintenanceMode, setMaintenanceMode] = useState(data.maintenanceMode);
  const [rgbLighting, setRgbLighting] = useState(data.rgbLighting);
  const [notifications, setNotifications] = useState(data.notifications);
  const [downloadFeatureEnabled, setDownloadFeatureEnabled] = useState(data.downloadFeatureEnabled);
  const [sections, setSections] = useState<Section[]>(data.sections);
  const [contentItems, setContentItems] = useState<ContentItem[]>(data.contentItems);
  const [records, setRecords] = useState<RecordItem[]>(data.records);
  const [files, setFiles] = useState<FileItem[]>(data.files);
  const [comments, setComments] = useState<Comment[]>(data.comments);

  useEffect(() => {
    saveData({ appName, themeColors, maintenanceMode, rgbLighting, notifications, downloadFeatureEnabled, sections, contentItems, records, files, comments });
  }, [appName, themeColors, maintenanceMode, rgbLighting, notifications, downloadFeatureEnabled, sections, contentItems, records, files, comments]);

  const onMediaView = useCallback((src: string, type: 'image' | 'video') => setMediaViewer({ src, type }), []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <Home size={15} /> },
    { id: 'sections', label: 'الأقسام', icon: <BookOpen size={15} /> },
    { id: 'content', label: 'المحتوى', icon: <ImageIcon size={15} /> },
    { id: 'record', label: 'صوتي', icon: <Mic size={15} /> },
    { id: 'files', label: 'الملفات', icon: <File size={15} /> },
    { id: 'comments', label: 'تعليقات', icon: <MessageSquare size={15} /> },
    { id: 'analytics', label: 'إحصائيات', icon: <BarChart3 size={15} /> },
    { id: 'trash', label: 'محذوفات', icon: <Trash2 size={15} /> },
    { id: 'display', label: 'شاشة العرض', icon: <Monitor size={15} /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings size={15} /> },
  ];

  const totalDeleted = sections.filter(s => s.isDeleted).length + contentItems.filter(c => c.isDeleted).length +
    records.filter(r => r.isDeleted).length + files.filter(f => f.isDeleted).length;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a', fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <AnimatePresence>
        {mediaViewer && <MediaViewer src={mediaViewer.src} type={mediaViewer.type} onClose={() => setMediaViewer(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
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
            {activeTab === 'content' && <ContentTab content={contentItems} setContent={setContentItems} sections={sections} downloadFeatureEnabled={downloadFeatureEnabled} onMediaView={onMediaView} />}
            {activeTab === 'record' && <RecordTab records={records} setRecords={setRecords} sections={sections} onMediaView={onMediaView} />}
            {activeTab === 'files' && <FilesTab files={files} setFiles={setFiles} sections={sections} onMediaView={onMediaView} />}
            {activeTab === 'comments' && <CommentsTab comments={comments} setComments={setComments} />}
            {activeTab === 'analytics' && <AnalyticsTab comments={comments} content={contentItems} records={records} files={files} />}
            {activeTab === 'trash' && <TrashTab sections={sections} setSections={setSections} content={contentItems} setContent={setContentItems} records={records} setRecords={setRecords} files={files} setFiles={setFiles} />}
            {activeTab === 'display' && <DisplayScreen />}
            {activeTab === 'settings' && <SettingsTab appName={appName} setAppName={setAppName} themeColors={themeColors} setThemeColors={setThemeColors} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} rgbLighting={rgbLighting} setRgbLighting={setRgbLighting} notifications={notifications} setNotifications={setNotifications} downloadFeatureEnabled={downloadFeatureEnabled} setDownloadFeatureEnabled={setDownloadFeatureEnabled} onPasswordChange={onPasswordChange} />}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, FileText, FileVideo, Box, Mic,
  Trash2, Edit3, Plus, Upload, Check, X, Volume2, File, Presentation, Table, Download
} from 'lucide-react';

type MediaType = 'image' | '3d' | 'icon' | 'gif' | 'video' | 'pdf' | 'excel' | 'word' | 'powerpoint' | 'zip' | 'text' | 'audio_comment' | 'audio_file' | 'graphic_3d';

interface DisplayItem {
  id: number;
  type: MediaType;
  title: string;
  /** data-URL preview, used for image-like types (image / gif / icon / graphic_3d) */
  preview?: string;
  content?: string;
  /** data-URL of the uploaded file itself, for downloadable/non-previewable types */
  url?: string;
  fileName?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<MediaType, { label: string; labelAr: string; icon: React.ReactNode; color: string; accept?: string; isPreviewable?: boolean }> = {
  image:         { label: 'Image',         labelAr: 'صورة',          icon: <Image size={16} />,        color: '#6EB5FF', accept: 'image/*',              isPreviewable: true },
  gif:           { label: 'GIF',           labelAr: 'صورة متحركة',   icon: <Image size={16} />,        color: '#E882B4', accept: 'image/gif',            isPreviewable: true },
  icon:          { label: 'Icon',          labelAr: 'أيقونة',         icon: <Image size={16} />,        color: '#9B8FFF', accept: 'image/svg+xml,image/png,image/x-icon', isPreviewable: true },
  '3d':          { label: '3D Model',      labelAr: 'مجسم 3D',       icon: <Box size={16} />,          color: '#F4845F', accept: '.glb,.gltf,.obj' },
  graphic_3d:    { label: '3D Graphic',    labelAr: 'مجسم Graphics', icon: <Box size={16} />,          color: '#FF9B6A', accept: 'image/*',              isPreviewable: true },
  video:         { label: 'Video',         labelAr: 'فيديو',          icon: <FileVideo size={16} />,    color: '#6BBF7A', accept: 'video/*' },
  pdf:           { label: 'PDF',           labelAr: 'ملف PDF',        icon: <FileText size={16} />,     color: '#F4845F', accept: '.pdf' },
  word:          { label: 'Word',          labelAr: 'ملف Word',       icon: <FileText size={16} />,     color: '#4472C4', accept: '.doc,.docx' },
  excel:         { label: 'Excel',         labelAr: 'ملف Excel',      icon: <Table size={16} />,        color: '#217346', accept: '.xls,.xlsx' },
  powerpoint:    { label: 'PowerPoint',    labelAr: 'باور بوينت',    icon: <Presentation size={16} />, color: '#D24726', accept: '.ppt,.pptx' },
  zip:           { label: 'ZIP',           labelAr: 'ملف مضغوط',     icon: <File size={16} />,         color: '#9B8FFF', accept: '.zip,.rar' },
  text:          { label: 'Text',          labelAr: 'نص',             icon: <FileText size={16} />,     color: '#A8E6CF', accept: undefined },
  audio_comment: { label: 'Voice Comment', labelAr: 'تعليق صوتي',    icon: <Mic size={16} />,          color: '#FFD93D', accept: 'audio/*' },
  audio_file:    { label: 'Audio File',    labelAr: 'ملف صوتي',      icon: <Volume2 size={16} />,      color: '#F8C8D4', accept: 'audio/*' },
};

/** أزرار الوصول السريع المطلوبة: GIF، أيقونة، مجسم Graphics (3D) */
const QUICK_ADD_TYPES: MediaType[] = ['gif', 'icon', 'graphic_3d'];

const STORAGE_KEY = 'eduverse_display_screen_items';

const DEMO_ITEMS: DisplayItem[] = [
  { id: 1, type: 'image',   title: 'صورة الرياضيات',      createdAt: '2026-06-28' },
  { id: 2, type: 'video',   title: 'شرح التفاضل',         createdAt: '2026-06-27' },
  { id: 3, type: 'pdf',     title: 'ملخص الفصل الأول',   createdAt: '2026-06-26' },
  { id: 4, type: 'text',    title: 'ملاحظات المدرس',  content: 'هذا نص توضيحي للمادة', createdAt: '2026-06-25' },
];

function loadItems(): DisplayItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupted storage */ }
  return DEMO_ITEMS;
}

function saveItems(items: DisplayItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (navigator.storage?.persist) navigator.storage.persist();
  } catch { /* storage full / unavailable — ignore */ }
}

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

export default function DisplayScreen() {
  const [items, setItems] = useState<DisplayItem[]>(loadItems);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<MediaType>('image');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [pendingFile, setPendingFile] = useState<{ dataUrl: string; name: string } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => { saveItems(items); }, [items]);

  const openAddForType = (type: MediaType) => {
    setNewType(type);
    setPendingFile(null);
    setShowAdd(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      setPendingFile({ dataUrl, name: file.name });
      if (!newTitle.trim()) setNewTitle(file.name.replace(/\.[^./]+$/, ''));
    } finally {
      setFileLoading(false);
    }
    e.target.value = '';
  };

  const addItem = () => {
    if (!newTitle.trim()) return;
    const cfg = TYPE_CONFIG[newType];
    setItems((prev) => [{
      id: Date.now(),
      type: newType,
      title: newTitle.trim(),
      content: newContent.trim() || undefined,
      preview: cfg.isPreviewable ? pendingFile?.dataUrl : undefined,
      url: !cfg.isPreviewable && newType !== 'text' && newType !== 'audio_comment' ? pendingFile?.dataUrl : undefined,
      fileName: pendingFile?.name,
      createdAt: new Date().toISOString().split('T')[0],
    }, ...prev]);
    setNewTitle(''); setNewContent(''); setPendingFile(null); setShowAdd(false);
  };

  const cancelAdd = () => {
    setShowAdd(false); setNewTitle(''); setNewContent(''); setPendingFile(null);
  };

  const deleteItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const startEdit = (item: DisplayItem) => { setEditingId(item.id); setEditTitle(item.title); };
  const saveEdit = (id: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, title: editTitle } : i));
    setEditingId(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setItems((prev) => [{ id: Date.now(), type: 'audio_comment', title: `تعليق صوتي - ${new Date().toLocaleTimeString('ar')}`, url, createdAt: new Date().toISOString().split('T')[0] }, ...prev]);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { /* microphone not available */ }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const typeList = Object.entries(TYPE_CONFIG) as [MediaType, typeof TYPE_CONFIG[MediaType]][];
  const currentCfg = TYPE_CONFIG[newType];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
          شاشة العرض <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({items.length} عنصر)</span>
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Record button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            style={{ padding: '8px 16px', borderRadius: '10px', background: recording ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${recording ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, color: recording ? '#f87171' : 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Mic size={14} className={recording ? 'rgb-pulse' : ''} />
            {recording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
          </button>
          <button
            onClick={() => openAddForType(newType)}
            style={{ padding: '8px 16px', borderRadius: '10px', background: '#f97316', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> إضافة محتوى
          </button>
        </div>
      </div>

      {/* Quick-add shortcuts: GIF / Icon / 3D Graphic */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
        {QUICK_ADD_TYPES.map((key) => {
          const cfg = TYPE_CONFIG[key];
          return (
            <button
              key={key}
              onClick={() => openAddForType(key)}
              style={{ padding: '9px 16px', borderRadius: '10px', border: `1px solid ${cfg.color}45`, background: `${cfg.color}15`, color: cfg.color, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}
            >
              {cfg.icon} إضافة {cfg.labelAr}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="admin-card" style={{ padding: '24px', marginBottom: '20px', overflow: 'hidden' }}>
            {/* Type grid */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                نوع المحتوى
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {typeList.map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => { setNewType(key); setPendingFile(null); }}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${newType === key ? cfg.color : 'rgba(255,255,255,0.1)'}`, background: newType === key ? `${cfg.color}20` : 'transparent', color: newType === key ? cfg.color : 'rgba(255,255,255,0.55)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 150ms' }}
                  >
                    {cfg.icon} {cfg.labelAr}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان المحتوى..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none', marginBottom: '12px', textAlign: 'right' }} />

            {/* Text content */}
            {newType === 'text' && (
              <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="اكتب النص هنا..."
                rows={4} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', marginBottom: '12px', textAlign: 'right' }} />
            )}

            {/* File upload for non-text types */}
            {newType !== 'text' && newType !== 'audio_comment' && (
              <div>
                <input ref={fileRef} type="file" accept={currentCfg.accept} style={{ display: 'none' }} onChange={handleFileChange} />
                <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '20px', borderRadius: '12px', border: `2px dashed ${pendingFile ? currentCfg.color : 'rgba(255,255,255,0.15)'}`, background: 'rgba(255,255,255,0.03)', color: pendingFile ? currentCfg.color : 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Upload size={16} />
                  {fileLoading ? 'جارِ الرفع...' : pendingFile ? `تم اختيار: ${pendingFile.name}` : `اضغط لرفع الملف (${currentCfg.labelAr})`}
                </button>
                {pendingFile && currentCfg.isPreviewable && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <img src={pendingFile.dataUrl} alt="" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addItem} style={{ padding: '10px 24px', borderRadius: '10px', background: '#f97316', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> إضافة
              </button>
              <button onClick={cancelAdd} style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        <AnimatePresence>
          {items.map((item) => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="admin-card" style={{ padding: '18px' }}>
                {/* Type badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '4px 10px', borderRadius: '8px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, color: cfg.color, fontSize: '12px', fontWeight: 600 }}>
                    {cfg.icon} {cfg.labelAr}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {item.url && !cfg.isPreviewable && (
                      <a href={item.url} download={item.fileName || item.title} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Download size={13} />
                      </a>
                    )}
                    <button onClick={() => startEdit(item)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteItem(item.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Preview thumbnail (image / gif / icon / 3D graphic) */}
                {item.preview && (
                  <div style={{ marginBottom: '10px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    <img src={item.preview} alt={item.title} loading="lazy" decoding="async" style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', display: 'block' }} />
                  </div>
                )}

                {/* Title */}
                {editingId === item.id ? (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus
                      style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 10px', color: 'white', fontSize: '13px', outline: 'none', textAlign: 'right' }}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)} />
                    <button onClick={() => saveEdit(item.id)} style={{ width: '30px', borderRadius: '8px', border: 'none', background: 'rgba(74,222,128,0.15)', color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ width: '30px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '6px', textAlign: 'right' }}>{item.title}</div>
                )}

                {/* File name for non-previewable uploads (3D models, docs, etc.) */}
                {item.fileName && !item.preview && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px', textAlign: 'right', direction: 'ltr' }}>{item.fileName}</div>
                )}

                {/* Content preview */}
                {item.content && (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, textAlign: 'right' }}>{item.content.slice(0, 80)}{item.content.length > 80 ? '...' : ''}</p>
                )}

                {/* Audio player */}
                {item.url && (item.type === 'audio_comment' || item.type === 'audio_file') && (
                  <audio controls src={item.url} style={{ width: '100%', marginTop: '8px', borderRadius: '8px' }} />
                )}

                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '10px', textAlign: 'right' }}>{item.createdAt}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
          لا يوجد محتوى بعد. أضف أول عنصر! ✨
        </div>
      )}
    </div>
  );
}

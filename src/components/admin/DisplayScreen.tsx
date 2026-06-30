import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, FileText, FileVideo, FileAudio, Box, Mic,
  Trash2, Edit3, Plus, Upload, Check, X, Volume2, File, Presentation, Table
} from 'lucide-react';

type MediaType = 'image' | '3d' | 'icon' | 'gif' | 'video' | 'pdf' | 'excel' | 'word' | 'powerpoint' | 'zip' | 'text' | 'audio_comment' | 'audio_file' | 'graphic_3d';

interface DisplayItem {
  id: number;
  type: MediaType;
  title: string;
  preview?: string;
  content?: string;
  url?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<MediaType, { label: string; labelAr: string; icon: React.ReactNode; color: string; accept?: string }> = {
  image:         { label: 'Image',         labelAr: 'صورة',          icon: <Image size={16} />,        color: '#6EB5FF', accept: 'image/*' },
  gif:           { label: 'GIF',           labelAr: 'صورة متحركة',   icon: <Image size={16} />,        color: '#E882B4', accept: 'image/gif' },
  icon:          { label: 'Icon',          labelAr: 'أيقونة',         icon: <Image size={16} />,        color: '#9B8FFF', accept: 'image/svg+xml,image/png' },
  '3d':          { label: '3D Model',      labelAr: 'مجسم 3D',       icon: <Box size={16} />,          color: '#F4845F', accept: '.glb,.gltf,.obj' },
  graphic_3d:    { label: '3D Graphic',    labelAr: 'جرافيك 3D',     icon: <Box size={16} />,          color: '#FF9B6A', accept: 'image/*' },
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

const DEMO_ITEMS: DisplayItem[] = [
  { id: 1, type: 'image',   title: 'صورة الرياضيات',      createdAt: '2026-06-28' },
  { id: 2, type: 'video',   title: 'شرح التفاضل',         createdAt: '2026-06-27' },
  { id: 3, type: 'pdf',     title: 'ملخص الفصل الأول',   createdAt: '2026-06-26' },
  { id: 4, type: 'text',    title: 'ملاحظات المدرس',  content: 'هذا نص توضيحي للمادة', createdAt: '2026-06-25' },
];

export default function DisplayScreen() {
  const [items, setItems] = useState<DisplayItem[]>(DEMO_ITEMS);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<MediaType>('image');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const addItem = () => {
    if (!newTitle.trim()) return;
    setItems((prev) => [{
      id: Date.now(), type: newType, title: newTitle.trim(),
      content: newContent.trim() || undefined, createdAt: new Date().toISOString().split('T')[0],
    }, ...prev]);
    setNewTitle(''); setNewContent(''); setShowAdd(false);
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
            onClick={() => setShowAdd(true)}
            style={{ padding: '8px 16px', borderRadius: '10px', background: '#f97316', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> إضافة محتوى
          </button>
        </div>
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
                    onClick={() => setNewType(key)}
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
                <input ref={fileRef} type="file" accept={TYPE_CONFIG[newType].accept} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '20px', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Upload size={16} /> اضغط لرفع الملف ({TYPE_CONFIG[newType].labelAr})
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addItem} style={{ padding: '10px 24px', borderRadius: '10px', background: '#f97316', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> إضافة
              </button>
              <button onClick={() => { setShowAdd(false); setNewTitle(''); setNewContent(''); }} style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>
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
                    <button onClick={() => startEdit(item)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteItem(item.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

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

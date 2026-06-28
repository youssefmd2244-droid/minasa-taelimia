import { useState, useEffect, useRef } from 'react';
import {
  Lock, Settings, BookOpen, FileText, MessageSquare, BarChart3, Trash2, Plus, Edit3, X,
  Check, Eye, EyeOff, Palette, Globe, Save, ArrowLeft, Home, Star, Shield, Power,
  Lightbulb, Bell, Image as ImageIcon, Video, UploadCloud, Type, Mic, MicOff, Download,
  File, Music, StopCircle, PlayCircle,
} from 'lucide-react';

const DEFAULT_PASSWORD = '20042007';
const REQUIRED_AUTH_CODE = 'Yy2004//';

type Tab = 'dashboard' | 'settings' | 'sections' | 'content' | 'record' | 'files' | 'comments' | 'analytics' | 'trash';

interface Section {
  id: number; title: string; isVisible: boolean; isDeleted: boolean; displayOrder: number;
}

interface Attachment {
  url: string; name: string; type: 'image' | 'video' | 'audio';
}

interface ContentItem {
  id: number; sectionId: number; title: string;
  type: string; contentBody: string; fileUrl: string;
  isFeatured: boolean; showOnHome: boolean; allowDownload: boolean; isDeleted: boolean;
  attachments?: Attachment[];
}

interface RecordItem {
  id: number; title: string; audioUrl: string;
  sectionId: number; showOnHome: boolean; isDeleted: boolean;
  text?: string; attachments?: Attachment[];
  section?: string;
}

interface FileItem {
  id: number; title: string; fileUrl: string; fileName: string;
  fileType: 'pdf' | 'word' | 'excel' | 'ppt' | 'zip';
  description?: string; sectionId: number; showOnHome: boolean;
  isDeleted: boolean; allowDownload: boolean;
  attachments?: Attachment[];
}

interface Comment {
  id: number; contentId: number; userId: string; commentText: string;
  replyText: string | null; isVisible: boolean; createdAt: string;
}

/* ─── helpers ─── */
const readFile = (file: File): Promise<string> =>
  new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });

const fileTypeIcon: Record<string, string> = { pdf: '📄', word: '📝', excel: '📊', ppt: '📋', zip: '📦' };
const fileTypeLabel: Record<string, string> = { pdf: 'PDF', word: 'Word', excel: 'Excel', ppt: 'PowerPoint', zip: 'ZIP' };

/* ─── Toggle row ─── */
function ToggleRow({ icon, label, description, checked, onChange, danger }: {
  icon: React.ReactNode; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: danger && checked ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.06)' }}>{icon}</div>
        <div><p className="text-sm text-white font-medium">{label}</p><p className="text-xs text-white/30">{description}</p></div>
      </div>
      <button onClick={() => onChange(!checked)} className="relative w-11 h-6 rounded-full transition-colors duration-200"
        style={{ background: checked ? (danger ? '#ef4444' : '#6BBF7A') : 'rgba(255,255,255,0.15)' }}>
        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}

/* ─── Attachment uploader ─── */
function AttachmentPicker({ attachments, onChange }: { attachments: Attachment[]; onChange: (a: Attachment[]) => void }) {
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
          <div key={i} className="relative rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {a.type === 'image' ? <img src={a.url} alt="" className="w-16 h-16 object-cover" /> :
              a.type === 'video' ? <div className="w-16 h-16 flex items-center justify-center bg-black/40"><Video size={20} className="text-green-400" /></div> :
                <div className="w-16 h-16 flex items-center justify-center bg-black/40"><Music size={20} className="text-purple-400" /></div>}
            <button onClick={() => remove(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"><X size={10} className="text-white" /></button>
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs text-white/50 hover:text-white/80 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.12)' }}>
        <Plus size={12} /> إضافة صورة / فيديو / صوت
        <input type="file" accept="image/*,video/*,audio/*" onChange={addAttachment} className="hidden" />
      </label>
    </div>
  );
}

/* ─── Record Tab ─── */
function RecordTab({ records, setRecords, sections }: {
  records: RecordItem[]; setRecords: React.Dispatch<React.SetStateAction<RecordItem[]>>; sections: Section[];
}) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<{ url: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [showOnHome, setShowOnHome] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const activeSections = sections.filter(s => !s.isDeleted);
  const activeRecords = records.filter(r => !r.isDeleted);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); mediaRef.current = mr; setRecording(true);
    } catch { alert('لم يتم السماح بالميكروفون'); }
  };

  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false); };

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await readFile(file);
    setUploadedAudio({ url, name: file.name });
    setAudioUrl(null);
  };

  const addRecord = () => {
    const finalUrl = uploadedAudio?.url || audioUrl;
    if (!finalUrl) return;
    const sectionTitle = sections.find(s => s.id === sectionId)?.title || '';
    const item: RecordItem = {
      id: Date.now(), title: title.trim() || 'تعليق صوتي', audioUrl: finalUrl,
      sectionId, section: sectionTitle, showOnHome, isDeleted: false,
      text: text.trim(), attachments,
    };
    setRecords(prev => [...prev, item]);
    setTitle(''); setText(''); setAudioUrl(null); setUploadedAudio(null);
    setShowOnHome(false); setAttachments([]); setSectionId(sections[0]?.id || 1);
  };

  const deleteRecord = (id: number) => setRecords(prev => prev.map(r => r.id === id ? { ...r, isDeleted: true } : r));
  const toggleHome = (id: number) => setRecords(prev => prev.map(r => r.id === id ? { ...r, showOnHome: !r.showOnHome } : r));

  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">التعليقات الصوتية</h2>
        <span className="text-sm text-white/40">{activeRecords.length} تعليق</span>
      </div>

      {/* Add record */}
      <div className="rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
        <h3 className="text-white font-bold mb-4">إضافة تعليق صوتي</h3>

        {/* Record / Upload */}
        <div className="flex gap-3 mb-4">
          {!recording ? (
            <button onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              <Mic size={16} /> تسجيل الآن
            </button>
          ) : (
            <button onClick={stopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171' }}>
              <StopCircle size={16} /> إيقاف التسجيل
            </button>
          )}
          <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
            style={{ background: 'rgba(107,191,122,0.12)', border: '1px solid rgba(107,191,122,0.3)', color: '#6BBF7A' }}>
            <UploadCloud size={16} /> رفع ملف صوتي
            <input type="file" accept="audio/*" onChange={handleUploadAudio} className="hidden" />
          </label>
        </div>

        {(audioUrl || uploadedAudio) && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <audio src={uploadedAudio?.url || audioUrl!} controls className="w-full" />
            {uploadedAudio && <p className="text-xs text-white/40 mt-1 truncate">{uploadedAudio.name}</p>}
          </div>
        )}

        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان (اختياري)"
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3" style={inp} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="نص توضيحي (اختياري)..." rows={2}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3 resize-none" style={inp} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">القسم</label>
            <select value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-white outline-none" style={inp}>
              {activeSections.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.title}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => setShowOnHome(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
              style={{ background: showOnHome ? 'rgba(107,191,122,0.12)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-sm text-white/80 flex items-center gap-2"><Home size={14} /> الرئيسية</span>
              <span className="relative w-10 h-5 rounded-full" style={{ background: showOnHome ? '#6BBF7A' : 'rgba(255,255,255,0.15)' }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: showOnHome ? 'translateX(20px)' : 'translateX(2px)' }} />
              </span>
            </button>
          </div>
        </div>

        {/* Optional attachments */}
        <div className="mb-4">
          <p className="text-xs text-white/40 mb-2">مرفقات اختيارية (صور / فيديو / صوت)</p>
          <AttachmentPicker attachments={attachments} onChange={setAttachments} />
        </div>

        <button onClick={addRecord}
          disabled={!audioUrl && !uploadedAudio}
          className="w-full px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: (audioUrl || uploadedAudio) ? 'white' : 'rgba(255,255,255,0.1)', color: (audioUrl || uploadedAudio) ? '#0a0a1a' : 'rgba(255,255,255,0.3)' }}>
          <Plus size={16} /> إضافة التعليق الصوتي
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {activeRecords.map(r => (
          <div key={r.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Mic size={18} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{r.title}</p>
                <p className="text-xs text-white/30">{r.section} {r.showOnHome && <span className="text-green-400 ml-2">· رئيسية</span>}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleHome(r.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  {r.showOnHome ? <Eye size={15} className="text-green-400" /> : <EyeOff size={15} className="text-white/30" />}
                </button>
                <button onClick={() => deleteRecord(r.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <Trash2 size={15} className="text-red-400" />
                </button>
              </div>
            </div>
            <audio src={r.audioUrl} controls className="w-full mb-2" style={{ height: 36 }} />
            {r.text && <p className="text-xs text-white/50 mb-2">{r.text}</p>}
            {r.attachments && r.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {r.attachments.map((a, i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    {a.type === 'image' ? <img src={a.url} alt="" className="w-14 h-14 object-cover" /> :
                      a.type === 'video' ? <div className="w-14 h-14 flex items-center justify-center bg-black/40"><Video size={16} className="text-green-400" /></div> :
                        <div className="w-14 h-14 flex items-center justify-center bg-black/40"><Music size={16} className="text-purple-400" /></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {activeRecords.length === 0 && (
          <div className="text-center py-12"><Mic size={40} className="text-white/10 mx-auto mb-3" /><p className="text-white/30">لا توجد تعليقات صوتية</p></div>
        )}
      </div>
    </div>
  );
}

/* ─── Files Tab ─── */
function FilesTab({ files, setFiles, sections }: {
  files: FileItem[]; setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>; sections: Section[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [showOnHome, setShowOnHome] = useState(false);
  const [fileType, setFileType] = useState<FileItem['fileType']>('pdf');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);

  const activeSections = sections.filter(s => !s.isDeleted);
  const activeFiles = files.filter(f => !f.isDeleted);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  const fileAccept: Record<string, string> = {
    pdf: '.pdf', word: '.doc,.docx', excel: '.xls,.xlsx', ppt: '.ppt,.pptx', zip: '.zip,.rar',
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await readFile(file);
    setUploadedFile({ url, name: file.name });
    e.target.value = '';
  };

  const addFile = () => {
    if (!uploadedFile) return;
    const item: FileItem = {
      id: Date.now(), title: title.trim() || uploadedFile.name, fileUrl: uploadedFile.url,
      fileName: uploadedFile.name, fileType, description: description.trim(),
      sectionId, showOnHome, isDeleted: false, allowDownload: true, attachments,
    };
    setFiles(prev => [...prev, item]);
    setTitle(''); setDescription(''); setUploadedFile(null);
    setShowOnHome(false); setAttachments([]); setSectionId(sections[0]?.id || 1);
  };

  const deleteFile = (id: number) => setFiles(prev => prev.map(f => f.id === id ? { ...f, isDeleted: true } : f));
  const toggleHome = (id: number) => setFiles(prev => prev.map(f => f.id === id ? { ...f, showOnHome: !f.showOnHome } : f));
  const toggleDownload = (id: number) => setFiles(prev => prev.map(f => f.id === id ? { ...f, allowDownload: !f.allowDownload } : f));
  const saveEdit = () => {
    if (!editingFile) return;
    setFiles(prev => prev.map(f => f.id === editingFile.id ? editingFile : f));
    setEditingFile(null);
  };

  const fileTypes: FileItem['fileType'][] = ['pdf', 'word', 'excel', 'ppt', 'zip'];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">الملفات</h2>
        <span className="text-sm text-white/40">{activeFiles.length} ملف</span>
      </div>

      {/* Add file */}
      <div className="rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
        <h3 className="text-white font-bold mb-4">رفع ملف جديد</h3>

        {/* File type selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {fileTypes.map(t => (
            <button key={t} onClick={() => { setFileType(t); setUploadedFile(null); }}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: fileType === t ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)', color: fileType === t ? 'white' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {fileTypeIcon[t]} {fileTypeLabel[t]}
            </button>
          ))}
        </div>

        {/* File upload */}
        {!uploadedFile ? (
          <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer transition-colors hover:bg-white/5 mb-4"
            style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
            <File size={28} className="text-white/40" />
            <span className="text-sm text-white/50">اختر ملف {fileTypeLabel[fileType]}</span>
            <input type="file" accept={fileAccept[fileType]} onChange={handleFileUpload} className="hidden" />
          </label>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-2xl">{fileTypeIcon[fileType]}</span>
            <p className="flex-1 text-sm text-white/70 truncate">{uploadedFile.name}</p>
            <button onClick={() => setUploadedFile(null)}><X size={16} className="text-white/40" /></button>
          </div>
        )}

        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان (اختياري)"
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3" style={inp} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف / ملاحظات (اختياري)..." rows={2}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3 resize-none" style={inp} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">القسم</label>
            <select value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-white outline-none" style={inp}>
              {activeSections.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.title}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => setShowOnHome(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
              style={{ background: showOnHome ? 'rgba(107,191,122,0.12)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-sm text-white/80 flex items-center gap-2"><Home size={14} /> الرئيسية</span>
              <span className="relative w-10 h-5 rounded-full" style={{ background: showOnHome ? '#6BBF7A' : 'rgba(255,255,255,0.15)' }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: showOnHome ? 'translateX(20px)' : 'translateX(2px)' }} />
              </span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-white/40 mb-2">مرفقات إضافية اختيارية</p>
          <AttachmentPicker attachments={attachments} onChange={setAttachments} />
        </div>

        <button onClick={addFile} disabled={!uploadedFile}
          className="w-full px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: uploadedFile ? 'white' : 'rgba(255,255,255,0.1)', color: uploadedFile ? '#0a0a1a' : 'rgba(255,255,255,0.3)' }}>
          <Plus size={16} /> رفع الملف
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {activeFiles.map(f => (
          <div key={f.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {fileTypeIcon[f.fileType]}
              </div>
              <div className="flex-1 min-w-0">
                {editingFile?.id === f.id ? (
                  <input type="text" value={editingFile.title} onChange={e => setEditingFile({ ...editingFile, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-white outline-none mb-1" style={{ background: 'rgba(255,255,255,0.08)' }} autoFocus />
                ) : <p className="text-white font-medium truncate">{f.title}</p>}
                {editingFile?.id === f.id ? (
                  <textarea value={editingFile.description || ''} onChange={e => setEditingFile({ ...editingFile, description: e.target.value })}
                    placeholder="الوصف..." rows={1} className="w-full px-3 py-2 rounded-lg text-sm text-white/60 outline-none resize-none" style={{ background: 'rgba(255,255,255,0.08)' }} />
                ) : f.description ? <p className="text-xs text-white/40 truncate">{f.description}</p> : null}
                <p className="text-xs text-white/30 mt-1">{fileTypeLabel[f.fileType]} {f.showOnHome && <span className="text-green-400 ml-1">· رئيسية</span>}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {editingFile?.id === f.id ? (
                  <button onClick={saveEdit} className="p-2 rounded-lg hover:bg-white/10"><Check size={15} className="text-green-400" /></button>
                ) : (
                  <button onClick={() => setEditingFile(f)} className="p-2 rounded-lg hover:bg-white/10"><Edit3 size={15} className="text-white/50" /></button>
                )}
                <button onClick={() => toggleHome(f.id)} className="p-2 rounded-lg hover:bg-white/10">
                  {f.showOnHome ? <Eye size={15} className="text-green-400" /> : <EyeOff size={15} className="text-white/30" />}
                </button>
                <button onClick={() => toggleDownload(f.id)} className="p-2 rounded-lg hover:bg-white/10" title="زر تنزيل">
                  <Download size={15} className={f.allowDownload ? 'text-blue-400' : 'text-white/30'} />
                </button>
                <button onClick={() => deleteFile(f.id)} className="p-2 rounded-lg hover:bg-white/10">
                  <Trash2 size={15} className="text-red-400" />
                </button>
              </div>
            </div>
            {f.attachments && f.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {f.attachments.map((a, i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    {a.type === 'image' ? <img src={a.url} alt="" className="w-12 h-12 object-cover" /> :
                      <div className="w-12 h-12 flex items-center justify-center bg-black/40"><Video size={14} className="text-green-400" /></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {activeFiles.length === 0 && (
          <div className="text-center py-12"><File size={40} className="text-white/10 mx-auto mb-3" /><p className="text-white/30">لا توجد ملفات</p></div>
        )}
      </div>
    </div>
  );
}

/* ─── Sections Tab ─── */
function SectionsTab({ sections, setSections, editingSection, setEditingSection, newSectionTitle, setNewSectionTitle }: {
  sections: Section[]; setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  editingSection: Section | null; setEditingSection: (s: Section | null) => void;
  newSectionTitle: string; setNewSectionTitle: (s: string) => void;
}) {
  const activeSections = sections.filter(s => !s.isDeleted);
  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    setSections(prev => [...prev, { id: Date.now(), title: newSectionTitle, isVisible: true, isDeleted: false, displayOrder: activeSections.length + 1 }]);
    setNewSectionTitle('');
  };
  const deleteSection = (id: number) => setSections(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true } : s));
  const saveEdit = () => { if (!editingSection) return; setSections(prev => prev.map(s => s.id === editingSection.id ? editingSection : s)); setEditingSection(null); };
  const toggleVisible = (id: number) => setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">الأقسام</h2>
        <span className="text-sm text-white/40">{activeSections.length} قسم</span>
      </div>
      <div className="rounded-2xl p-4 mb-6 flex gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <input type="text" value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} placeholder="اسم القسم الجديد..."
          className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          onKeyDown={e => e.key === 'Enter' && addSection()} />
        <button onClick={addSection} className="px-5 py-3 rounded-xl bg-white/10 text-white font-medium flex items-center gap-2 hover:bg-white/20 transition-colors">
          <Plus size={16} /> إضافة
        </button>
      </div>
      <div className="space-y-3">
        {activeSections.map(section => (
          <div key={section.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: section.isVisible ? 1 : 0.5 }}>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">{section.displayOrder}</div>
            <div className="flex-1">
              {editingSection?.id === section.id ? (
                <input type="text" value={editingSection.title} onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)' }} autoFocus />
              ) : <p className="text-white font-medium">{section.title}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleVisible(section.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                {section.isVisible ? <Eye size={15} className="text-green-400" /> : <EyeOff size={15} className="text-yellow-400" />}
              </button>
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
function ContentTab({ content, setContent, editingContent, setEditingContent, sections, downloadFeatureEnabled }: {
  content: ContentItem[]; setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  editingContent: ContentItem | null; setEditingContent: (c: ContentItem | null) => void;
  sections: Section[]; downloadFeatureEnabled: boolean;
}) {
  const [addMode, setAddMode] = useState<'media' | 'text'>('media');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [sectionId, setSectionId] = useState(sections[0]?.id || 1);
  const [showOnHome, setShowOnHome] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const activeSections = sections.filter(s => !s.isDeleted);
  const activeContent = content.filter(c => !c.isDeleted);
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const typeLabels: Record<string, string> = { video: '🎬 فيديو', image: '🖼️ صورة', text: '📝 نص', pdf: '📄 PDF', word: '📝 Word', powerpoint: '📊 PowerPoint', excel: '📈 Excel', zip: '📦 ZIP' };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const url = await readFile(file); setUploadedFile({ url, name: file.name }); } catch { }
    setUploading(false);
  };

  const resetForm = () => { setTitle(''); setDesc(''); setShowOnHome(false); setUploadedFile(null); setMediaType('image'); setSectionId(sections[0]?.id || 1); setAttachments([]); };

  const addContent = () => {
    if (addMode === 'media' && !uploadedFile && !title.trim() && !desc.trim()) return;
    if (addMode === 'text' && !title.trim() && !desc.trim()) return;
    const type = addMode === 'text' ? 'text' : mediaType;
    setContent(prev => [...prev, {
      id: Date.now(), sectionId, title: title.trim() || (uploadedFile ? uploadedFile.name : 'محتوى'),
      type, contentBody: desc.trim(), fileUrl: uploadedFile?.url || '',
      isFeatured: false, showOnHome, allowDownload: false, isDeleted: false, attachments,
    }]);
    resetForm();
  };

  const deleteContent = (id: number) => setContent(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));
  const toggleFeatured = (id: number) => setContent(prev => prev.map(c => c.id === id ? { ...c, isFeatured: !c.isFeatured } : c));
  const toggleHome = (id: number) => setContent(prev => prev.map(c => c.id === id ? { ...c, showOnHome: !c.showOnHome } : c));
  const toggleDownload = (id: number) => setContent(prev => prev.map(c => c.id === id ? { ...c, allowDownload: !c.allowDownload } : c));
  const saveEdit = () => { if (!editingContent) return; setContent(prev => prev.map(c => c.id === editingContent.id ? editingContent : c)); setEditingContent(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">المحتوى</h2>
        <span className="text-sm text-white/40">{activeContent.length} عنصر</span>
      </div>

      {/* Add */}
      <div className="rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
        <div className="flex gap-2 mb-5">
          {(['media', 'text'] as const).map(m => (
            <button key={m} onClick={() => { setAddMode(m); setUploadedFile(null); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: addMode === m ? 'rgba(255,255,255,0.12)' : 'transparent', color: addMode === m ? 'white' : 'rgba(255,255,255,0.4)', border: addMode === m ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
              {m === 'media' ? <><UploadCloud size={16} /> فيديو / صورة</> : <><Type size={16} /> نص فقط</>}
            </button>
          ))}
        </div>

        {addMode === 'media' && (
          <div className="mb-5">
            <div className="flex gap-2 mb-3">
              {(['image', 'video'] as const).map(mt => (
                <button key={mt} onClick={() => { setMediaType(mt); setUploadedFile(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: mediaType === mt ? (mt === 'image' ? 'rgba(110,181,255,0.15)' : 'rgba(107,191,122,0.15)') : 'transparent', color: mediaType === mt ? (mt === 'image' ? '#6EB5FF' : '#6BBF7A') : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {mt === 'image' ? <><ImageIcon size={14} /> صورة</> : <><Video size={14} /> فيديو</>}
                </button>
              ))}
            </div>
            {!uploadedFile ? (
              <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer hover:bg-white/5" style={{ border: '2px dashed rgba(255,255,255,0.15)' }}>
                {uploading ? <div className="text-sm text-white/40">جاري الرفع...</div> : <>
                  <UploadCloud size={28} className="text-white/40" />
                  <span className="text-sm text-white/50">{mediaType === 'image' ? 'اختر صورة' : 'اختر فيديو'}</span>
                </>}
                <input type="file" accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileSelect} className="hidden" />
              </label>
            ) : (
              <div className="rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {mediaType === 'image' ? <img src={uploadedFile.url} alt="" className="w-full max-h-64 object-contain" style={{ background: '#000' }} /> : <video src={uploadedFile.url} controls className="w-full max-h-64" />}
                <button onClick={() => setUploadedFile(null)} className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}><X size={16} className="text-white" /></button>
              </div>
            )}
          </div>
        )}

        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان (اختياري)"
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3" style={inp} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="الوصف (اختياري)..." rows={2}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none mb-3 resize-none" style={inp} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">القسم</label>
            <select value={sectionId} onChange={e => setSectionId(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl text-white outline-none" style={inp}>
              {activeSections.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.title}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => setShowOnHome(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
              style={{ background: showOnHome ? 'rgba(107,191,122,0.12)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-sm text-white/80 flex items-center gap-2"><Home size={14} /> الرئيسية</span>
              <span className="relative w-10 h-5 rounded-full" style={{ background: showOnHome ? '#6BBF7A' : 'rgba(255,255,255,0.15)' }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: showOnHome ? 'translateX(20px)' : 'translateX(2px)' }} />
              </span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-white/40 mb-2">مرفقات إضافية اختيارية</p>
          <AttachmentPicker attachments={attachments} onChange={setAttachments} />
        </div>

        <button onClick={addContent} className="w-full px-5 py-3 rounded-xl bg-white text-gray-900 font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform">
          <Plus size={16} /> إضافة المحتوى
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {activeContent.map(item => (
          <div key={item.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {item.type === 'image' && item.fileUrl ? <img src={item.fileUrl} alt="" className="w-full h-full object-cover" /> :
                item.type === 'video' && item.fileUrl ? <Video size={18} className="text-green-400" /> :
                  <span className="text-lg">{typeLabels[item.type]?.split(' ')[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              {editingContent?.id === item.id ? (
                <input type="text" value={editingContent.title} onChange={e => setEditingContent({ ...editingContent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white outline-none mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} autoFocus />
              ) : <p className="text-white font-medium truncate">{item.title}</p>}
              {editingContent?.id === item.id ? (
                <textarea value={editingContent.contentBody} onChange={e => setEditingContent({ ...editingContent, contentBody: e.target.value })}
                  placeholder="الوصف..." rows={1} className="w-full px-3 py-2 rounded-lg text-sm text-white/70 outline-none resize-none" style={{ background: 'rgba(255,255,255,0.08)' }} />
              ) : item.contentBody ? <p className="text-xs text-white/40 mt-0.5 truncate">{item.contentBody}</p> : null}
              <p className="text-xs text-white/30 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{typeLabels[item.type]}</span><span>·</span>
                <span>{sections.find(s => s.id === item.sectionId)?.title || 'غير محدد'}</span>
                {item.showOnHome && <span className="px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">رئيسية</span>}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
              {editingContent?.id === item.id ? (
                <button onClick={saveEdit} className="p-2 rounded-lg hover:bg-white/10"><Check size={16} className="text-green-400" /></button>
              ) : (
                <button onClick={() => setEditingContent(item)} className="p-2 rounded-lg hover:bg-white/10"><Edit3 size={16} className="text-white/50" /></button>
              )}
              <button onClick={() => toggleFeatured(item.id)} className="p-2 rounded-lg hover:bg-white/10" title="مميز">
                <Star size={16} className={item.isFeatured ? 'text-yellow-400' : 'text-white/30'} />
              </button>
              <button onClick={() => toggleHome(item.id)} className="p-2 rounded-lg hover:bg-white/10" title="عرض في الرئيسية">
                {item.showOnHome ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-white/30" />}
              </button>
              {downloadFeatureEnabled && (
                <button onClick={() => toggleDownload(item.id)} className="p-2 rounded-lg hover:bg-white/10" title="تنزيل">
                  <Download size={16} className={item.allowDownload ? 'text-blue-400' : 'text-white/30'} />
                </button>
              )}
              <button onClick={() => deleteContent(item.id)} className="p-2 rounded-lg hover:bg-white/10">
                <Trash2 size={16} className="text-red-400" />
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
  const submitReply = (id: number) => { if (!replyText.trim()) return; setComments(prev => prev.map(c => c.id === id ? { ...c, replyText } : c)); setReplyingTo(null); setReplyText(''); };
  const toggleVisibility = (id: number) => setComments(prev => prev.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  const deleteComment = (id: number) => setComments(prev => prev.filter(c => c.id !== id));
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">التعليقات</h2>
        <div className="flex gap-4 text-sm text-white/40">
          <span>الكل: {comments.length}</span>
          <span>بدون رد: {comments.filter(c => !c.replyText).length}</span>
        </div>
      </div>
      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: c.isVisible ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,0,0,0.2)', opacity: c.isVisible ? 1 : 0.5 }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${c.id * 90}, 60%, 50%)`, color: 'white' }}>{c.userId.slice(-3)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{c.commentText}</p>
                <span className="text-xs text-white/30">{c.createdAt}</span>
                {c.replyText && <div className="mt-2 pr-4 border-r-2 border-white/10"><p className="text-xs text-white/50">{c.replyText}</p></div>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleVisibility(c.id)} className="p-1.5 rounded-lg hover:bg-white/10">
                  {c.isVisible ? <Eye size={14} className="text-white/50" /> : <EyeOff size={14} className="text-yellow-400" />}
                </button>
                <button onClick={() => deleteComment(c.id)} className="p-1.5 rounded-lg hover:bg-white/10"><Trash2 size={14} className="text-red-400" /></button>
              </div>
            </div>
            {replyingTo === c.id ? (
              <div className="flex gap-2 mt-3 pr-11">
                <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="اكتب ردك..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none" style={{ background: 'rgba(255,255,255,0.06)' }} autoFocus />
                <button onClick={() => submitReply(c.id)} className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20"><Check size={14} /></button>
                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10"><X size={14} /></button>
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
function AnalyticsTab({ comments, content, records, files }: { comments: Comment[]; content: ContentItem[]; records: RecordItem[]; files: FileItem[] }) {
  const stats = [
    { label: 'المحتوى الكلي', value: content.filter(c => !c.isDeleted).length, color: '#F4845F' },
    { label: 'التعليقات الصوتية', value: records.filter(r => !r.isDeleted).length, color: '#E882B4' },
    { label: 'الملفات المرفوعة', value: files.filter(f => !f.isDeleted).length, color: '#6BBF7A' },
    { label: 'تعليقات بدون رد', value: comments.filter(c => !c.replyText).length, color: '#6EB5FF' },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-8">الإحصائيات</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Anton', sans-serif", color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Trash Tab ─── */
function TrashTab({ deletedSections, deletedContent, deletedRecords, deletedFiles, setSections, setContent, setRecords, setFiles }: {
  deletedSections: Section[]; deletedContent: ContentItem[]; deletedRecords: RecordItem[]; deletedFiles: FileItem[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>; setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  setRecords: React.Dispatch<React.SetStateAction<RecordItem[]>>; setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}) {
  const totalDeleted = deletedSections.length + deletedContent.length + deletedRecords.length + deletedFiles.length;
  const restoreSection = (id: number) => setSections(prev => prev.map(s => s.id === id ? { ...s, isDeleted: false } : s));
  const restoreContent = (id: number) => setContent(prev => prev.map(c => c.id === id ? { ...c, isDeleted: false } : c));
  const restoreRecord = (id: number) => setRecords(prev => prev.map(r => r.id === id ? { ...r, isDeleted: false } : r));
  const restoreFile = (id: number) => setFiles(prev => prev.map(f => f.id === id ? { ...f, isDeleted: false } : f));
  const emptyTrash = () => {
    setSections(prev => prev.filter(s => !s.isDeleted)); setContent(prev => prev.filter(c => !c.isDeleted));
    setRecords(prev => prev.filter(r => !r.isDeleted)); setFiles(prev => prev.filter(f => !f.isDeleted));
  };

  const Row = ({ label, name, onRestore, onDelete }: { label: string; name: string; onRestore: () => void; onDelete: () => void }) => (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
      <span className="text-white/30 text-sm shrink-0">{label}</span>
      <p className="flex-1 text-white/60 font-medium truncate">{name}</p>
      <div className="flex gap-2 shrink-0">
        <button onClick={onRestore} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">استعادة</button>
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">حذف نهائي</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">سلة المحذوفات</h2>
        {totalDeleted > 0 && <button onClick={emptyTrash} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">تفريغ السلة</button>}
      </div>
      {totalDeleted === 0 ? (
        <div className="text-center py-16"><Trash2 size={48} className="text-white/10 mx-auto mb-4" /><p className="text-white/30">لا توجد عناصر محذوفة</p></div>
      ) : (
        <div className="space-y-3">
          {deletedSections.map(s => <Row key={s.id} label="قسم" name={s.title} onRestore={() => restoreSection(s.id)} onDelete={() => setSections(prev => prev.filter(x => x.id !== s.id))} />)}
          {deletedContent.map(c => <Row key={c.id} label="محتوى" name={c.title} onRestore={() => restoreContent(c.id)} onDelete={() => setContent(prev => prev.filter(x => x.id !== c.id))} />)}
          {deletedRecords.map(r => <Row key={r.id} label="صوتي" name={r.title} onRestore={() => restoreRecord(r.id)} onDelete={() => setRecords(prev => prev.filter(x => x.id !== r.id))} />)}
          {deletedFiles.map(f => <Row key={f.id} label="ملف" name={f.title} onRestore={() => restoreFile(f.id)} onDelete={() => setFiles(prev => prev.filter(x => x.id !== f.id))} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Settings Tab ─── */
function SettingsTab({ appName, setAppName, themeColors, setThemeColors, maintenanceMode, setMaintenanceMode, rgbLighting, setRgbLighting, notifications, setNotifications, downloadFeatureEnabled, setDownloadFeatureEnabled, storageInfo, cacheCleared, setCacheCleared, newPassword, setNewPassword, confirmPassword, setConfirmPassword, authCode, setAuthCode, showNewPassword, setShowNewPassword, canSavePassword, handleSavePassword, passwordSuccess, passwordError, setPasswordError }: {
  appName: string; setAppName: (v: string) => void; themeColors: string[]; setThemeColors: (v: string[]) => void;
  maintenanceMode: boolean; setMaintenanceMode: (v: boolean) => void; rgbLighting: boolean; setRgbLighting: (v: boolean) => void;
  notifications: boolean; setNotifications: (v: boolean) => void; downloadFeatureEnabled: boolean; setDownloadFeatureEnabled: (v: boolean) => void;
  storageInfo: { used: string; total: string; percent: number }; cacheCleared: boolean; setCacheCleared: (v: boolean) => void;
  newPassword: string; setNewPassword: (v: string) => void; confirmPassword: string; setConfirmPassword: (v: string) => void;
  authCode: string; setAuthCode: (v: string) => void; showNewPassword: boolean; setShowNewPassword: (v: boolean) => void;
  canSavePassword: boolean; handleSavePassword: () => void; passwordSuccess: boolean; passwordError: string; setPasswordError: (v: string) => void;
}) {
  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-8">الإعدادات العامة</h2>
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4"><Globe size={20} className="text-white/60" /><h3 className="text-lg font-bold text-white">اسم التطبيق</h3></div>
        <div className="flex gap-3">
          <input type="text" value={appName} onChange={e => setAppName(e.target.value)} className="flex-1 px-4 py-3 rounded-xl text-white outline-none" style={inp} />
          <button className="px-6 py-3 rounded-xl bg-white text-gray-900 font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform"><Save size={16} /> حفظ</button>
        </div>
        <p className="mt-4 text-2xl font-bold text-center rounded-xl py-4" style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 900, color: 'white' }}>{appName}</p>
      </div>
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4"><Palette size={20} className="text-white/60" /><h3 className="text-lg font-bold text-white">ألوان الثيم</h3></div>
        <div className="flex flex-wrap gap-4">
          {themeColors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <input type="color" value={color} onChange={e => { const c = [...themeColors]; c[i] = e.target.value; setThemeColors(c); }} className="w-16 h-16 rounded-xl cursor-pointer border-0" />
              <span className="text-xs text-white/40 font-mono">{color}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold text-white mb-4">إعدادات النظام</h3>
        <div className="space-y-4">
          <ToggleRow icon={<Power size={18} />} label="وضع الصيانة" description="يظهر صفحة صيانة للزوار" checked={maintenanceMode} onChange={setMaintenanceMode} danger />
          <ToggleRow icon={<Lightbulb size={18} />} label="إضاءة RGB" description="تأثير نبض الألوان على العناصر المميزة" checked={rgbLighting} onChange={setRgbLighting} />
          <ToggleRow icon={<Bell size={18} />} label="الإشعارات" description="إشعارات للطلاب عند تحديث المحتوى" checked={notifications} onChange={setNotifications} />
          <ToggleRow icon={<Download size={18} />} label="إتاحة أزرار التنزيل" description="عند التفعيل، يظهر زر التنزيل لكل محتوى بشكل منفرد" checked={downloadFeatureEnabled} onChange={setDownloadFeatureEnabled} />
        </div>
      </div>
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold text-white mb-4">إدارة التخزين</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs text-white/40">المستخدم</p><p className="text-xl font-bold text-white mt-1">{storageInfo.used}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs text-white/40">الحد الأقصى</p><p className="text-xl font-bold text-white mt-1">{storageInfo.total}</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-4">
          <div className="h-full rounded-full" style={{ width: `${Math.min(storageInfo.percent, 100)}%`, background: storageInfo.percent > 80 ? '#ef4444' : '#6BBF7A' }} />
        </div>
        {cacheCleared && <div className="mb-3 px-4 py-2 rounded-xl text-sm text-green-400 flex items-center gap-2" style={{ background: 'rgba(107,191,122,0.1)' }}><Check size={14} /> تم مسح الذاكرة المؤقتة</div>}
        <button onClick={async () => { try { if (caches) { const names = await caches.keys(); await Promise.all(names.map(n => caches.delete(n))); } setCacheCleared(true); setTimeout(() => setCacheCleared(false), 3000); } catch { } }}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">مسح الذاكرة المؤقتة</button>
      </div>
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4"><Shield size={20} className="text-white/60" /><h3 className="text-lg font-bold text-white">تغيير كلمة المرور</h3></div>
        {passwordSuccess && <div className="mb-4 px-4 py-3 rounded-xl text-sm text-green-400 flex items-center gap-2" style={{ background: 'rgba(107,191,122,0.1)', border: '1px solid rgba(107,191,122,0.2)' }}><Check size={16} /> تم التحديث بنجاح</div>}
        {passwordError && <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)' }}>{passwordError}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">كلمة المرور الجديدة</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 outline-none" style={inp} />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">تأكيد كلمة المرور</label>
            <input type={showNewPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }} placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 outline-none" style={inp} />
          </div>
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">رقم التفويض</label>
            <input type="password" value={authCode} onChange={e => { setAuthCode(e.target.value); setPasswordError(''); }} placeholder="أدخل رقم التفويض..."
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 outline-none"
              style={{ ...inp, border: authCode.length > 0 && authCode !== REQUIRED_AUTH_CODE ? '1px solid rgba(255,80,80,0.3)' : '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <button onClick={() => { if (newPassword !== confirmPassword) { setPasswordError('كلمتا المرور غير متطابقتين'); return; } handleSavePassword(); }}
            disabled={!canSavePassword}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: canSavePassword ? 'white' : 'rgba(255,255,255,0.1)', color: canSavePassword ? '#0a0a1a' : 'rgba(255,255,255,0.3)', cursor: canSavePassword ? 'pointer' : 'not-allowed' }}>
            <Save size={16} /> حفظ كلمة المرور الجديدة
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN AdminDashboard
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const [currentPassword] = useState(() => localStorage.getItem('admin_password') || DEFAULT_PASSWORD);
  const [accessed, setAccessed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Settings
  const [appName, setAppName] = useState('EduVerse');
  const [themeColors, setThemeColors] = useState(['#F4845F', '#6BBF7A', '#E882B4', '#6EB5FF']);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rgbLighting, setRgbLighting] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [downloadFeatureEnabled, setDownloadFeatureEnabled] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: string; total: string; percent: number }>({ used: '0 MB', total: '—', percent: 0 });
  const [cacheCleared, setCacheCleared] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Data
  const [sections, setSections] = useState<Section[]>([
    { id: 1, title: 'المستوى الأول — رياضيات', isVisible: true, isDeleted: false, displayOrder: 1 },
    { id: 2, title: 'المستوى الثاني — علوم', isVisible: true, isDeleted: false, displayOrder: 2 },
    { id: 3, title: 'المستوى الأول — لغة عربية', isVisible: true, isDeleted: false, displayOrder: 3 },
    { id: 4, title: 'المستوى الثاني — فنون', isVisible: true, isDeleted: false, displayOrder: 4 },
  ]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    { id: 1, sectionId: 1, title: 'أساسيات الجبر', type: 'video', contentBody: 'شرح مبسط', fileUrl: '', isFeatured: true, showOnHome: true, allowDownload: false, isDeleted: false },
    { id: 2, sectionId: 2, title: 'التجارب العلمية', type: 'pdf', contentBody: '', fileUrl: '', isFeatured: true, showOnHome: true, allowDownload: false, isDeleted: false },
  ]);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([
    { id: 1, contentId: 1, userId: 'user1', commentText: 'شرح رائع!', replyText: 'شكراً لك', isVisible: true, createdAt: '2025-01-15' },
    { id: 2, contentId: 2, userId: 'user2', commentText: 'هل يوجد ملف PDF؟', replyText: null, isVisible: true, createdAt: '2025-01-16' },
  ]);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(est => {
        const used = est.usage || 0; const quota = est.quota || 0;
        setStorageInfo({ used: `${(used / 1048576).toFixed(1)} MB`, total: `${(quota / 1073741824).toFixed(1)} GB`, percent: quota > 0 ? used / quota * 100 : 0 });
      }).catch(() => { });
    }
  }, []);

  const canSavePassword = newPassword.length > 0 && newPassword === confirmPassword && authCode === REQUIRED_AUTH_CODE;
  const handleSavePassword = () => { localStorage.setItem('admin_password', newPassword); setPasswordSuccess(true); setNewPassword(''); setConfirmPassword(''); setAuthCode(''); setTimeout(() => setPasswordSuccess(false), 4000); };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (password === currentPassword) { setAccessed(true); setError(''); } else { setError('كلمة المرور غير صحيحة'); setPassword(''); } };

  if (!accessed) {
    return (
      <section className="relative w-full flex items-center justify-center" style={{ height: '100vh', background: '#0a0a1a' }}>
        <div className="rounded-3xl p-8 sm:p-12 w-full max-w-md mx-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 rgb-pulse"><Lock size={28} className="text-white" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">لوحة التحكم</h2>
            <p className="text-sm text-white/50 mb-8 text-center">أدخل كلمة المرور للوصول</p>
            <form onSubmit={handleLogin} className="w-full">
              <div className="relative mb-4">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: error ? '1px solid rgba(255,80,80,0.4)' : '1px solid rgba(255,255,255,0.1)' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-gray-900 bg-white hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> دخول
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <Home size={18} /> },
    { id: 'sections', label: 'الأقسام', icon: <BookOpen size={18} /> },
    { id: 'content', label: 'المحتوى', icon: <ImageIcon size={18} /> },
    { id: 'record', label: 'صوتي', icon: <Mic size={18} /> },
    { id: 'files', label: 'الملفات', icon: <File size={18} /> },
    { id: 'comments', label: 'التعليقات', icon: <MessageSquare size={18} /> },
    { id: 'analytics', label: 'إحصائيات', icon: <BarChart3 size={18} /> },
    { id: 'trash', label: 'المحذوفات', icon: <Trash2 size={18} /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings size={18} /> },
  ];

  const deletedSections = sections.filter(s => s.isDeleted);
  const deletedContent = contentItems.filter(c => c.isDeleted);
  const deletedRecords = records.filter(r => r.isDeleted);
  const deletedFiles = files.filter(f => f.isDeleted);
  const totalDeleted = deletedSections.length + deletedContent.length + deletedRecords.length + deletedFiles.length;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a', fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center rgb-pulse" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Shield size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">لوحة التحكم</span>
        </div>
        <button onClick={() => { setAccessed(false); window.location.hash = ''; }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white/60 hover:text-white text-sm transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={14} /> خروج
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto px-4 py-3 gap-2" style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {tabs.map(tab => {
          const isTrash = tab.id === 'trash';
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all relative"
              style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.12)' : 'transparent', color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)', border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent' }}>
              {tab.icon} {tab.label}
              {isTrash && totalDeleted > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold">{totalDeleted}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto pb-20">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">مرحباً بك 👋</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'الأقسام', value: sections.filter(s => !s.isDeleted).length, color: '#F4845F', icon: <BookOpen size={20} /> },
                { label: 'المحتوى', value: contentItems.filter(c => !c.isDeleted).length, color: '#6BBF7A', icon: <ImageIcon size={20} /> },
                { label: 'الملفات', value: files.filter(f => !f.isDeleted).length, color: '#E882B4', icon: <File size={20} /> },
                { label: 'صوتيات', value: records.filter(r => !r.isDeleted).length, color: '#6EB5FF', icon: <Mic size={20} /> },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                  </div>
                  <p className="text-3xl font-bold" style={{ fontFamily: "'Anton', sans-serif", color: s.color }}>{s.value}</p>
                  <p className="text-xs text-white/40 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {tabs.filter(t => t.id !== 'dashboard').map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-right transition-all hover:bg-white/8"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60" style={{ background: 'rgba(255,255,255,0.06)' }}>{tab.icon}</div>
                  <span className="text-white/70 text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sections' && <SectionsTab sections={sections} setSections={setSections} editingSection={editingSection} setEditingSection={setEditingSection} newSectionTitle={newSectionTitle} setNewSectionTitle={setNewSectionTitle} />}
        {activeTab === 'content' && <ContentTab content={contentItems} setContent={setContentItems} editingContent={editingContent} setEditingContent={setEditingContent} sections={sections} downloadFeatureEnabled={downloadFeatureEnabled} />}
        {activeTab === 'record' && <RecordTab records={records} setRecords={setRecords} sections={sections} />}
        {activeTab === 'files' && <FilesTab files={files} setFiles={setFiles} sections={sections} />}
        {activeTab === 'comments' && <CommentsTab comments={comments} setComments={setComments} />}
        {activeTab === 'analytics' && <AnalyticsTab comments={comments} content={contentItems} records={records} files={files} />}
        {activeTab === 'trash' && <TrashTab deletedSections={deletedSections} deletedContent={deletedContent} deletedRecords={deletedRecords} deletedFiles={deletedFiles} setSections={setSections} setContent={setContentItems} setRecords={setRecords} setFiles={setFiles} />}
        {activeTab === 'settings' && <SettingsTab appName={appName} setAppName={setAppName} themeColors={themeColors} setThemeColors={setThemeColors} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} rgbLighting={rgbLighting} setRgbLighting={setRgbLighting} notifications={notifications} setNotifications={setNotifications} downloadFeatureEnabled={downloadFeatureEnabled} setDownloadFeatureEnabled={setDownloadFeatureEnabled} storageInfo={storageInfo} cacheCleared={cacheCleared} setCacheCleared={setCacheCleared} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} authCode={authCode} setAuthCode={setAuthCode} showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword} canSavePassword={canSavePassword} handleSavePassword={handleSavePassword} passwordSuccess={passwordSuccess} passwordError={passwordError} setPasswordError={setPasswordError} />}
      </div>
    </div>
  );
}

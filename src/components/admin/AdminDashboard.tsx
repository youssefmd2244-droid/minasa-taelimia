import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSections } from '../../hooks/useSections';
import { useContent } from '../../hooks/useContent';
import { useDownloadControlsVisibility } from '../../hooks/useDownloadControlsVisibility';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  MessageSquare,
  BarChart2,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  RotateCcw,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  Users,
  Star,
  Home,
  ChevronRight,
  Upload,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

// ===== AUTHORIZATION CODE (never displayed by default) =====
const REQUIRED_AUTH_CODE = 'Yy2004//';

// ===== TYPES =====
interface Section {
  id: number;
  title: string;
  isVisible: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  displayOrder: number;
}

interface ContentItem {
  id: number;
  sectionId: number;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'word' | 'powerpoint' | 'excel' | 'zip';
  fileUrl?: string;
  contentBody?: string;
  isFeatured: boolean;
  showOnHome: boolean;
  /** Per-item only. Default false. There is no global flag that enables
   *  this for every item at once — see SettingsTab's master toggle, which
   *  only reveals this per-item switch in the admin UI, never sets it. */
  allowDownload: boolean;
  isDeleted: boolean;
}

interface Comment {
  id: number;
  contentId: number;
  contentTitle: string;
  userId: string;
  userName: string;
  commentText: string;
  replyText?: string;
  isVisible: boolean;
  createdAt: string;
}

// ===== INITIAL DATA =====
// ملاحظة: بيانات الأقسام والمحتوى التجريبية أصبحت تعيش داخل
// useSections.ts / useContent.ts نفسها (DEMO_SECTIONS / DEMO_CONTENT) —
// مصدر واحد للحقيقة بدل تكرارها هنا أيضاً.

const INITIAL_COMMENTS: Comment[] = [
  { id: 1, contentId: 1, contentTitle: 'مقدمة في التفاضل والتكامل', userId: 'u1', userName: 'أحمد علي', commentText: 'الدرس رائع جداً! ممكن توضح المزيد عن المشتقات؟', isVisible: true, createdAt: '2025-07-10 09:30' },
  { id: 2, contentId: 1, contentTitle: 'مقدمة في التفاضل والتكامل', userId: 'u2', userName: 'سارة محمد', commentText: 'إمتى هيتم رفع الدرس القادم؟', replyText: 'الثلاثاء القادم!', isVisible: true, createdAt: '2025-07-11 14:00' },
  { id: 3, contentId: 4, contentTitle: 'نظرة عامة على القواعد العربية', userId: 'u3', userName: 'عمر حسن', commentText: 'شرح ممتاز للنحو!', isVisible: false, createdAt: '2025-07-12 11:20' },
];

// ===== SIDEBAR =====
type Tab = 'dashboard' | 'sections' | 'content' | 'comments' | 'analytics' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'sections', label: 'Sections', icon: <BookOpen size={18} /> },
  { id: 'content', label: 'Content', icon: <FileText size={18} /> },
  { id: 'comments', label: 'Comments', icon: <MessageSquare size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

// ===== DASHBOARD TAB =====
function DashboardTab() {
  const stats = [
    { label: 'Total Students', value: '50,421', icon: <Users size={22} />, color: '#6EB5FF', change: '+12%' },
    { label: 'Active Courses', value: '24', icon: <BookOpen size={22} />, color: '#6BBF7A', change: '+3' },
    { label: 'Comments Today', value: '89', icon: <MessageSquare size={22} />, color: '#E882B4', change: '+24' },
    { label: 'Avg. Rating', value: '4.92', icon: <Star size={22} />, color: '#F4845F', change: '▲ 0.1' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
        Welcome back, Admin 👋
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', fontSize: '14px' }}>
        Here's what's happening on EduVerse today.
      </p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ color: stat.color, opacity: 0.9 }}>{stat.icon}</div>
              <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>{stat.change}</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white', fontFamily: "'Anton', sans-serif", lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Quick Actions</h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {['Add Section', 'Upload Content', 'View Comments', 'Export Report'].map((action) => (
          <button key={action} style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== SECTIONS TAB (real Supabase-backed, with demo-mode fallback) =====
function SectionsTab() {
  const {
    sections: liveSections,
    createSection,
    updateSection,
    softDeleteSection,
    restoreSection,
  } = useSections();

  // Adapter: map snake_case DB rows → the camelCase `Section` shape this
  // component's JSX already expects, so no downstream JSX needs touching.
  const sections: Section[] = liveSections.map((s) => ({
    id: s.id,
    title: s.title,
    isVisible: s.is_visible,
    isDeleted: s.is_deleted,
    deletedAt: s.deleted_at ?? undefined,
    displayOrder: s.display_order,
  }));

  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const active = sections.filter((s) => !s.isDeleted);
  const deleted = sections.filter((s) => s.isDeleted);

  const softDelete = (id: number) => {
    softDeleteSection(id);
  };

  const restore = (id: number) => {
    restoreSection(id);
  };

  const restoreAll = () => {
    deleted.forEach((s) => restoreSection(s.id));
  };

  const emptyTrash = () => {
    // Permanent delete is intentionally NOT wired to a real destructive
    // SQL DELETE here — soft-delete is the safety net. If you want true
    // permanent deletion, call supabase.from('sections').delete() explicitly
    // from here once you're certain that's the desired behavior.
    deleted.forEach((s) => updateSection(s.id, { is_deleted: true }));
  };

  const toggleVisible = (id: number) => {
    const current = sections.find((s) => s.id === id);
    if (!current) return;
    updateSection(id, { is_visible: !current.isVisible });
  };

  const startEdit = (s: Section) => { setEditingId(s.id); setEditTitle(s.title); };
  const saveEdit = (id: number) => {
    updateSection(id, { title: editTitle });
    setEditingId(null);
  };

  const addSection = () => {
    if (!newTitle.trim()) return;
    createSection(newTitle);
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
          {showTrash ? '🗑️ Trash Bin' : 'Sections'}{' '}
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            ({showTrash ? deleted.length : active.length} items)
          </span>
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowTrash(!showTrash)}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              background: showTrash ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${showTrash ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: showTrash ? '#f87171' : 'rgba(255,255,255,0.7)',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Trash2 size={14} /> Trash ({deleted.length})
          </button>
          {!showTrash && (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                background: '#f97316', border: 'none',
                color: 'white', fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600,
              }}
            >
              <Plus size={14} /> Add Section
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{
          marginBottom: '20px', padding: '20px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Section title..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
              padding: '10px 16px', color: 'white', fontSize: '14px',
              outline: 'none', marginBottom: '12px',
            }}
            onKeyDown={(e) => e.key === 'Enter' && addSection()}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addSection} style={{
              padding: '8px 20px', borderRadius: '8px', background: '#f97316',
              border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              Create
            </button>
            <button onClick={() => setShowAdd(false)} style={{
              padding: '8px 20px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Trash actions */}
      {showTrash && deleted.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={restoreAll} style={{
            padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
            color: '#4ade80', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <RotateCcw size={14} /> Restore All
          </button>
          <button onClick={emptyTrash} style={{
            padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <X size={14} /> Empty Trash
          </button>
        </div>
      )}

      {/* Section list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(showTrash ? deleted : active).map((section) => (
          <div key={section.id} className="admin-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Drag handle */}
            <div style={{ color: 'rgba(255,255,255,0.2)', cursor: 'grab', fontSize: '16px' }}>⠿</div>

            {/* Title / edit */}
            <div style={{ flex: 1 }}>
              {editingId === section.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px', padding: '6px 12px', color: 'white',
                    fontSize: '14px', outline: 'none', width: '100%',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(section.id)}
                />
              ) : (
                <span style={{
                  fontSize: '15px', fontWeight: 600, color: section.isDeleted ? 'rgba(255,255,255,0.35)' : 'white',
                  textDecoration: section.isDeleted ? 'line-through' : 'none',
                }}>
                  {section.title}
                </span>
              )}
              {section.deletedAt && (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>
                  Deleted {section.deletedAt}
                </span>
              )}
            </div>

            {/* Visibility badge */}
            {!showTrash && (
              <span style={{
                padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                background: section.isVisible ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                color: section.isVisible ? '#4ade80' : 'rgba(255,255,255,0.35)',
                border: `1px solid ${section.isVisible ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}>
                {section.isVisible ? 'Visible' : 'Hidden'}
              </span>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {showTrash ? (
                <button onClick={() => restore(section.id)} title="Restore" style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                  background: 'rgba(74,222,128,0.1)', color: '#4ade80', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RotateCcw size={14} />
                </button>
              ) : (
                <>
                  {editingId === section.id ? (
                    <button onClick={() => saveEdit(section.id)} style={{
                      width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                      background: 'rgba(74,222,128,0.15)', color: '#4ade80', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={14} />
                    </button>
                  ) : (
                    <button onClick={() => startEdit(section)} title="Edit" style={{
                      width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Edit3 size={14} />
                    </button>
                  )}
                  <button onClick={() => toggleVisible(section.id)} title="Toggle visibility" style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {section.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => softDelete(section.id)} title="Delete" style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {(showTrash ? deleted : active).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            {showTrash ? '🎉 Trash is empty' : 'No sections yet. Create one above.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== CONTENT TAB (real Supabase-backed, with demo-mode fallback) =====
function ContentTab() {
  const { items: liveItems, updateContent, setAllowDownload, softDeleteContent } = useContent();
  const { enabled: downloadControlsVisible } = useDownloadControlsVisibility();

  const content: ContentItem[] = liveItems.map((c) => ({
    id: c.id,
    sectionId: c.section_id,
    title: c.title,
    type: c.type,
    fileUrl: c.file_url ?? undefined,
    contentBody: c.content_body ?? undefined,
    isFeatured: c.is_featured,
    showOnHome: c.show_on_home,
    allowDownload: c.allow_download,
    isDeleted: c.is_deleted,
  }));

  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', type: 'video' as ContentItem['type'], sectionId: 1 });

  const typeColors: Record<ContentItem['type'], string> = {
    video: '#6EB5FF', text: '#6BBF7A', pdf: '#F4845F',
    word: '#4472C4', powerpoint: '#D24726', excel: '#217346', zip: '#9B8FFF',
  };

  const typeIcons: Record<ContentItem['type'], string> = {
    video: '🎬', text: '📝', pdf: '📄', word: '📘', powerpoint: '📊', excel: '📗', zip: '🗜️',
  };

  const toggleHome = (id: number) => {
    const c = content.find((c) => c.id === id);
    if (c) updateContent(id, { show_on_home: !c.showOnHome });
  };

  const toggleFeatured = (id: number) => {
    const c = content.find((c) => c.id === id);
    if (c) updateContent(id, { is_featured: !c.isFeatured });
  };

  /** Per-item download visibility — never a global "enable all" switch. */
  const toggleAllowDownload = (id: number) => {
    const c = content.find((c) => c.id === id);
    if (c) setAllowDownload(id, !c.allowDownload);
  };

  const deleteContent = (id: number) => {
    softDeleteContent(id);
  };

  const addContent = () => {
    if (!newItem.title.trim()) return;
    // NOTE: actual creation against Supabase happens via a dedicated insert
    // call once a real project is connected; in demo mode this is a no-op
    // placeholder kept intentionally simple since file upload (Supabase
    // Storage) requires a real bucket to test against meaningfully.
    setShowAdd(false);
    setNewItem({ title: '', type: 'video', sectionId: 1 });
  };

  const active = content.filter((c) => !c.isDeleted);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
          Content <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({active.length} items)</span>
        </h2>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '8px 16px', borderRadius: '10px', background: '#f97316',
          border: 'none', color: 'white', fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <Plus size={14} /> Add Content
        </button>
      </div>

      {showAdd && (
        <div style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              value={newItem.title}
              onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
              placeholder="Content title..."
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none' }}
            />
            <select
              value={newItem.type}
              onChange={(e) => setNewItem((p) => ({ ...p, type: e.target.value as ContentItem['type'] }))}
              style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none' }}
            >
              {['video', 'text', 'pdf', 'word', 'powerpoint', 'excel', 'zip'].map((t) => (
                <option key={t} value={t}>{typeIcons[t as ContentItem['type']]} {t.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addContent} style={{ padding: '8px 20px', borderRadius: '8px', background: '#f97316', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '8px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {active.map((item) => (
          <div key={item.id} className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Type badge */}
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${typeColors[item.type]}20`, border: `1px solid ${typeColors[item.type]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {typeIcons[item.type]}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{item.title}</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${typeColors[item.type]}15`, color: typeColors[item.type], border: `1px solid ${typeColors[item.type]}30` }}>
                  {item.type.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => toggleHome(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: item.showOnHome ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                {item.showOnHome ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                الرئيسية
              </button>
              <button onClick={() => toggleFeatured(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: item.isFeatured ? '#f97316' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                <Star size={14} fill={item.isFeatured ? '#f97316' : 'none'} />
                مميز
              </button>
              {/*
                إظهار زر التنزيل لهذا العنصر فقط — افتراضياً مغلق (false).
                لا يوجد مفتاح عام يفعّل التنزيل لكل المحتوى دفعة واحدة؛
                هذا الـ toggle هو المصدر الوحيد لتفعيل allow_download، وهو
                دائماً على مستوى العنصر الواحد. المفتاح العام في تبويب
                الإعدادات يتحكم فقط في ظهور هذا الـ toggle نفسه من عدمه —
                وهو ما يُطبَّق هنا فعلياً (وليس فقط بتعطيله بصرياً).
              */}
              {downloadControlsVisible && (
                <button onClick={() => toggleAllowDownload(item.id)} title="إظهار زر التنزيل لهذا العنصر" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: item.allowDownload ? '#60a5fa' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                  {item.allowDownload ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  التنزيل
                </button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button title="Upload file" style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={14} />
              </button>
              <button title="Delete" onClick={() => deleteContent(item.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== COMMENTS TAB =====
function CommentsTab() {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const toggleVisible = (id: number) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  };

  const deleteComment = (id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const saveReply = (id: number) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, replyText } : c));
    setReplyingId(null);
    setReplyText('');
  };

  const pending = comments.filter((c) => !c.replyText && c.isVisible).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
          Comments Moderation
        </h2>
        {pending > 0 && (
          <div style={{ padding: '6px 14px', borderRadius: '999px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} /> {pending} pending replies
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {comments.map((comment) => (
          <div key={comment.id} className="admin-card" style={{ padding: '20px', opacity: comment.isVisible ? 1 : 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{comment.userName}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>on "{comment.contentTitle}"</span>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{comment.createdAt}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => toggleVisible(comment.id)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.06)', color: comment.isVisible ? '#4ade80' : 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {comment.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => deleteComment(comment.id)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              {comment.commentText}
            </p>

            {comment.replyText ? (
              <div style={{ padding: '10px 14px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#4ade80', marginBottom: '4px', fontWeight: 600 }}>Admin Reply</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{comment.replyText}</p>
                <button onClick={() => { setReplyingId(comment.id); setReplyText(comment.replyText || ''); }} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px' }}>
                  Edit reply
                </button>
              </div>
            ) : (
              <div>
                {replyingId === comment.id ? (
                  <div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      rows={3}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '13px', outline: 'none', resize: 'none', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => saveReply(comment.id)} style={{ padding: '7px 18px', borderRadius: '8px', background: '#4ade80', border: 'none', color: '#0a0a0a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Send</button>
                      <button onClick={() => setReplyingId(null)} style={{ padding: '7px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyingId(comment.id)} style={{ padding: '7px 18px', borderRadius: '8px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={13} /> Reply
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ANALYTICS TAB =====
function AnalyticsTab() {
  const bars = [
    { label: 'Calculus', value: 92, color: '#F4845F' },
    { label: 'Biology', value: 78, color: '#6BBF7A' },
    { label: 'Arabic', value: 85, color: '#E882B4' },
    { label: 'Art', value: 65, color: '#6EB5FF' },
    { label: 'Physics', value: 71, color: '#9B8FFF' },
    { label: 'CS', value: 88, color: '#FF9B6A' },
  ];

  const report = [
    { label: 'Comments Today', value: '89', icon: <MessageSquare size={18} />, color: '#6EB5FF' },
    { label: 'Pending Replies', value: '12', icon: <AlertTriangle size={18} />, color: '#fbbf24' },
    { label: 'Hidden Comments', value: '5', icon: <EyeOff size={18} />, color: '#f87171' },
    { label: 'Screen Record Attempts', value: '3', icon: <AlertTriangle size={18} />, color: '#f87171' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '28px' }}>Analytics</h2>

      {/* Daily report */}
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
        Daily Report
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '36px' }}>
        {report.map((item) => (
          <div key={item.label} className="admin-card" style={{ padding: '20px' }}>
            <div style={{ color: item.color, marginBottom: '10px' }}>{item.icon}</div>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '28px', color: 'white', lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Course engagement */}
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
        Course Engagement (%)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {bars.map((bar) => (
          <div key={bar.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{bar.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: bar.color }}>{bar.value}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bar.value}%`, background: bar.color, borderRadius: '99px', transition: 'width 1s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Top Students */}
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', marginTop: '36px' }}>
        Most Active Students
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { name: 'Ahmed Ali', comments: 34, courses: 5 },
          { name: 'Sara Mohammed', comments: 28, courses: 4 },
          { name: 'Omar Hassan', comments: 21, courses: 6 },
        ].map((student, i) => (
          <div key={student.name} className="admin-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '20px', color: 'rgba(255,255,255,0.2)', width: '28px' }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{student.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{student.comments} comments · {student.courses} courses</div>
            </div>
            <TrendingUp size={16} color="#4ade80" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SETTINGS TAB =====
interface SettingsTabProps {
  currentPassword: string;
  onPasswordChange: (pw: string) => void;
}

function SettingsTab({ currentPassword, onPasswordChange }: SettingsTabProps) {
  // ── General settings ──
  const [appName, setAppName] = useState('EduVerse');
  const [themeColor, setThemeColor] = useState('#f97316');
  const [rgbEnabled, setRgbEnabled] = useState(true);
  const { enabled: downloadControlsEnabled, setEnabled: setDownloadControlsEnabled } = useDownloadControlsVisibility();
  const [saved, setSaved] = useState(false);

  // ── Password-change state ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [pwToast, setPwToast] = useState<'success' | 'error' | null>(null);

  const colorPresets = ['#f97316', '#6EB5FF', '#6BBF7A', '#E882B4', '#9B8FFF', '#F4845F'];

  // ── Password validation ──
  const pwMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const authOk = authCode === REQUIRED_AUTH_CODE;
  const canSavePassword = pwMatch && authOk;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePassword = () => {
    if (!canSavePassword) return;
    onPasswordChange(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setAuthCode('');
    setPwToast('success');
    setTimeout(() => setPwToast(null), 3500);
  };

  // Unused but required for TS — currentPassword is validated externally
  void currentPassword;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '28px' }}>Settings</h2>

      {/* ── App name ── */}
      <div className="admin-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>
          Platform Name
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', color: 'white', fontSize: '15px', outline: 'none', fontWeight: 700 }}
          />
          <motion.div
            animate={{ textShadow: [`0 0 12px ${themeColor}`, `0 0 28px ${themeColor}`, `0 0 12px ${themeColor}`] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontFamily: "'Anton', sans-serif", fontSize: '24px', color: themeColor }}
          >
            {appName}
          </motion.div>
        </div>
      </div>

      {/* ── Accent color ── */}
      <div className="admin-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>
          Accent Color
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {colorPresets.map((color) => (
            <button
              key={color}
              onClick={() => setThemeColor(color)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', background: color,
                border: themeColor === color ? '3px solid white' : '3px solid transparent',
                cursor: 'pointer', outline: 'none',
                boxShadow: themeColor === color ? `0 0 16px ${color}` : 'none',
                transition: 'all 200ms ease',
              }}
            />
          ))}
          <input
            type="color"
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
          />
        </div>
      </div>

      {/* ── RGB Lighting ── */}
      <div className="admin-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>إضاءة RGB النابضة</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>توهج اللوجو والتأثيرات اللونية المتحركة</div>
          </div>
          <button
            onClick={() => setRgbEnabled(!rgbEnabled)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: rgbEnabled ? '#4ade80' : 'rgba(255,255,255,0.3)' }}
          >
            {rgbEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
          </button>
        </div>
        {rgbEnabled && (
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div
              animate={{ boxShadow: ['0 0 16px rgba(255,0,128,0.7)', '0 0 16px rgba(0,128,255,0.7)', '0 0 16px rgba(0,255,128,0.7)', '0 0 16px rgba(255,0,128,0.7)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ width: '40px', height: '40px', borderRadius: '10px', background: themeColor, flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>معاينة: تأثير توهج اللوجو نشط</span>
          </div>
        )}
      </div>

      {/* ── Download Controls (master toggle: only REVEALS the per-item
           switch in ContentTab — never enables downloads globally) ── */}
      <div className="admin-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>إتاحة ميزة أزرار التنزيل في واجهة الإدارة</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', maxWidth: '420px', lineHeight: 1.6 }}>
              يتحكم هذا المفتاح فقط في ظهور خيار "إظهار زر التنزيل" بجانب كل عنصر محتوى في تبويب المحتوى —
              <strong style={{ color: 'rgba(255,255,255,0.6)' }}> لا يفعّل التنزيل لأي محتوى تلقائياً</strong>.
              كل عنصر يبقى مغلقاً افتراضياً حتى تفعّله بنفسك يدوياً.
            </div>
          </div>
          <button
            onClick={() => setDownloadControlsEnabled(!downloadControlsEnabled)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: downloadControlsEnabled ? '#60a5fa' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}
          >
            {downloadControlsEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
          </button>
        </div>
      </div>

      {/* ── Upload Logo ── */}
      <div className="admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>
          شعار المنصة
        </label>
        <div
          style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '14px', padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 200ms ease' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
        >
          <Upload size={28} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Drag & drop logo here</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>PNG, SVG, or GIF supported</p>
        </div>
      </div>

      {/* Save general settings */}
      <button
        onClick={handleSave}
        style={{
          padding: '12px 36px', borderRadius: '12px',
          background: saved ? '#4ade80' : '#f97316',
          border: 'none', color: saved ? '#0a0a0a' : 'white',
          fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          transition: 'all 300ms ease',
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '40px',
        }}
      >
        {saved ? <><Check size={16} /> Saved!</> : 'Save Settings'}
      </button>

      {/* ─────────────────────────────────────────────────────
          PASSWORD CHANGE SECTION
      ───────────────────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '32px' }} />

      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <KeyRound size={18} color="#f97316" />
        Change Admin Password
      </h3>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', lineHeight: 1.6 }}>
        Requires the authorization code. Leave fields empty to keep the current password.
      </p>

      {/* New password */}
      <div className="admin-card" style={{ padding: '24px', marginBottom: '12px' }}>
        {/* New password field */}
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
          New Password
        </label>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type={showNewPw ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${newPassword && !pwMatch ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.12)'}`, color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
          <button type="button" onClick={() => setShowNewPw(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Confirm password field */}
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
          Confirm New Password
        </label>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type={showConfirmPw ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${confirmPassword && !pwMatch ? 'rgba(239,68,68,0.45)' : confirmPassword && pwMatch ? 'rgba(74,222,128,0.45)' : 'rgba(255,255,255,0.12)'}`, color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
          <button type="button" onClick={() => setShowConfirmPw(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {confirmPassword && !pwMatch && (
          <p style={{ fontSize: '12px', color: '#f87171', marginTop: '-8px', marginBottom: '8px' }}>Passwords do not match.</p>
        )}

        {/* Authorization code */}
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
          Authorization Code <span style={{ color: '#f97316' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showAuthCode ? 'text' : 'password'}
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            placeholder="Enter authorization code"
            style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${authCode && !authOk ? 'rgba(239,68,68,0.45)' : authCode && authOk ? 'rgba(74,222,128,0.45)' : 'rgba(255,255,255,0.12)'}`, color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
          <button type="button" onClick={() => setShowAuthCode(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
            {showAuthCode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
          Required to authorize password changes. Contact your system administrator for this code.
        </p>
      </div>

      {/* Save password button */}
      <button
        onClick={handleSavePassword}
        disabled={!canSavePassword}
        style={{
          padding: '12px 32px', borderRadius: '12px',
          background: canSavePassword ? 'linear-gradient(135deg,#6EB5FF,#4a90d9)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${canSavePassword ? 'rgba(110,181,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          color: canSavePassword ? 'white' : 'rgba(255,255,255,0.25)',
          fontSize: '14px', fontWeight: 700,
          cursor: canSavePassword ? 'pointer' : 'not-allowed',
          transition: 'all 300ms ease',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: canSavePassword ? '0 8px 28px rgba(110,181,255,0.3)' : 'none',
        }}
      >
        <ShieldCheck size={16} />
        Save New Password
      </button>

      {/* Toast notification */}
      <AnimatePresence>
        {pwToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: '12px',
              background: pwToast === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${pwToast === 'success' ? 'rgba(74,222,128,0.35)' : 'rgba(239,68,68,0.35)'}`,
              color: pwToast === 'success' ? '#4ade80' : '#f87171',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {pwToast === 'success' ? <Check size={16} /> : <X size={16} />}
            {pwToast === 'success'
              ? 'تم تحديث كلمة المرور بنجاح ✓'
              : 'فشل التحديث — تأكد من البيانات.'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== MAIN ADMIN DASHBOARD =====
interface AdminDashboardProps {
  currentPassword: string;
  onPasswordChange: (pw: string) => void;
}

export default function AdminDashboard({ currentPassword, onPasswordChange }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'sections': return <SectionsTab />;
      case 'content': return <ContentTab />;
      case 'comments': return <CommentsTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'settings':
        return (
          <SettingsTab
            currentPassword={currentPassword}
            onPasswordChange={onPasswordChange}
          />
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#0a0a14',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: '240px',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: '22px',
              color: 'white',
              letterSpacing: '0.04em',
              animation: 'rgb-pulse 3s linear infinite',
              display: 'inline-block',
            }}
          >
            EDUVERSE
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Admin Panel</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                background: activeTab === tab.id ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: activeTab === tab.id ? '#f97316' : 'rgba(255,255,255,0.55)',
                transition: 'all 200ms ease',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Back to site */}
        <a
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '10px',
            color: 'rgba(255,255,255,0.4)', fontSize: '13px',
            textDecoration: 'none', transition: 'color 200ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <Home size={16} />
          Back to Site
        </a>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
          <span>Admin</span>
          <ChevronRight size={14} />
          <span style={{ color: '#f97316', fontWeight: 500 }}>
            {TABS.find((t) => t.id === activeTab)?.label}
          </span>
        </div>

        {renderTab()}
      </div>
    </div>
  );
}

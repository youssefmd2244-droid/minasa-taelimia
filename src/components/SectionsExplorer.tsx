/**
 * SectionsExplorer — شريط/نافذة "الأقسام" العلوية.
 * -----------------------------------------------------------------------
 * بتقرأ نفس مصدر الحقيقة اللي بتستخدمه SearchOverlay ولوحة الإدارة
 * (useSections / useContent) — يعني أي قسم أو محتوى يضيفه الأدمن يظهر
 * هنا فورًا لكل المستخدمين بدون إعادة تحميل الصفحة.
 *
 * بالضغط على زر "الأقسام" في الشريط العلوي، بتفتح قائمة بكل الأقسام.
 * الضغط على أي قسم يفتح محتوياته (نصوص، صور، فيديوهات، صوتيات، وملفات
 * PDF/Word/Excel/PowerPoint/ZIP) في نفس النافذة.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, BookOpen, Video, Image as ImageIcon, Music, FileText,
  File as FileIcon, Download, Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useSections } from '../hooks/useSections';
import { useContent } from '../hooks/useContent';
import type { ContentRow, ContentType } from '../lib/supabaseClient';

interface SectionsExplorerProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICON: Partial<Record<ContentType, React.ReactNode>> = {
  video: <Video size={16} color="#6BBF7A" />,
  image: <ImageIcon size={16} color="#6EB5FF" />,
  audio: <Music size={16} color="#E882B4" />,
  text: <FileText size={16} color="#F4845F" />,
  pdf: <FileIcon size={16} color="#f87171" />,
  word: <FileIcon size={16} color="#60a5fa" />,
  excel: <FileIcon size={16} color="#4ade80" />,
  powerpoint: <FileIcon size={16} color="#fb923c" />,
  zip: <FileIcon size={16} color="#a78bfa" />,
};

function ContentRowItem({ item }: { item: ContentRow }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const isMedia = item.type === 'image' || item.type === 'video';
  const isAudio = item.type === 'audio';
  const isText = item.type === 'text';
  const isFile = !isMedia && !isAudio && !isText;

  return (
    <div
      style={{
        borderRadius: '14px', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 14px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'start',
        }}
      >
        <div
          style={{
            width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          {TYPE_ICON[item.type] ?? <FileIcon size={16} color="rgba(255,255,255,0.5)" />}
        </div>
        <span style={{ flex: 1, color: 'white', fontSize: '14px', fontWeight: 500 }}>{item.title}</span>
        {item.is_featured && <Sparkles size={13} color="#facc15" style={{ flexShrink: 0 }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px' }}>
              {item.type === 'image' && item.file_url && (
                <img src={item.file_url} alt={item.title} style={{ width: '100%', borderRadius: '10px', maxHeight: '320px', objectFit: 'contain', background: '#000' }} />
              )}
              {item.type === 'video' && item.file_url && (
                <video src={item.file_url} controls style={{ width: '100%', borderRadius: '10px', maxHeight: '320px' }} />
              )}
              {isAudio && item.file_url && (
                <audio src={item.file_url} controls style={{ width: '100%' }} />
              )}
              {isText && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: 1.8, margin: 0 }}>
                  {item.content_body || item.title}
                </p>
              )}
              {isFile && (
                item.file_url ? (
                  item.allow_download ? (
                    <a
                      href={item.file_url}
                      download={item.title}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '9px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)',
                        color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <Download size={14} /> {t('content_download')}
                    </a>
                  ) : (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '9px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)',
                        color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <FileIcon size={14} /> {t('content_open_file')}
                    </a>
                  )
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>{item.title}</p>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SectionsExplorer({ open, onClose }: SectionsExplorerProps) {
  const { t, dir } = useLanguage();
  const { sections, loading: sectionsLoading } = useSections();
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const { items, loading: contentLoading } = useContent(activeSectionId ?? undefined);

  useEffect(() => {
    if (open) setActiveSectionId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activeSectionId !== null) setActiveSectionId(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, activeSectionId, onClose]);

  const visibleSections = sections.filter((s) => s.is_visible);
  const activeSection = sections.find((s) => s.id === activeSectionId) || null;
  const visibleItems = items.filter((i) => !i.is_deleted);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          dir={dir}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(5,5,16,0.92)', backdropFilter: 'blur(16px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '80px 20px 40px', overflowY: 'auto',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px', borderRadius: '16px', marginBottom: '16px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {activeSection ? (
                <button
                  onClick={() => setActiveSectionId(null)}
                  aria-label={t('sections_back')}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={16} style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : 'none' }} />
                </button>
              ) : (
                <BookOpen size={18} color="#f97316" style={{ flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, color: 'white', fontSize: '15px', fontWeight: 700 }}>
                {activeSection ? activeSection.title : t('sections_modal_title')}
              </span>
              <button
                onClick={onClose}
                aria-label={t('search_close')}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!activeSection ? (
                sectionsLoading ? (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '24px 0' }}>
                    {t('sections_loading')}
                  </p>
                ) : visibleSections.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '24px 0' }}>
                    {t('sections_modal_empty')}
                  </p>
                ) : (
                  visibleSections
                    .slice()
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSectionId(s.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '14px', borderRadius: '14px', textAlign: 'start',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                          color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        <BookOpen size={16} color="#f97316" style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{s.title}</span>
                        <ChevronLeft
                          size={14}
                          color="rgba(255,255,255,0.3)"
                          style={{ transform: dir === 'ltr' ? 'scaleX(-1)' : 'none' }}
                        />
                      </button>
                    ))
                )
              ) : contentLoading ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '24px 0' }}>
                  {t('sections_loading')}
                </p>
              ) : visibleItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '24px 0' }}>
                  {t('sections_content_empty')}
                </p>
              ) : (
                visibleItems.map((item) => <ContentRowItem key={item.id} item={item} />)
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

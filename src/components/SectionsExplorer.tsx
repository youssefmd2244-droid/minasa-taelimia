/**
 * SectionsExplorer — صفحة "الأقسام" الكاملة.
 * -----------------------------------------------------------------------
 * بتقرأ نفس مصدر الحقيقة اللي بتستخدمه SearchOverlay ولوحة الإدارة
 * (useSections / useContent) — يعني أي قسم أو محتوى يضيفه الأدمن يظهر
 * هنا فورًا لكل المستخدمين بدون إعادة تحميل الصفحة.
 *
 * دلوقتي شكلها صفحة كاملة مزينة (مش نافذة صغيرة في النص): هيدر بتدرّج
 * لوني، سيرش بيفلتر الأقسام أو محتوى القسم المفتوح، ومحوّل لغة (عربي/
 * مصري/إنجليزي). الضغط على أي قسم يفتح محتوياته (نصوص، صور، فيديوهات،
 * صوتيات، وملفات PDF/Word/Excel/PowerPoint/ZIP) في نفس الصفحة.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, BookOpen, Video, Image as ImageIcon, Music, FileText,
  File as FileIcon, Download, Sparkles, Search, Globe as GlobeIcon,
} from 'lucide-react';
import { useLanguage, type Language } from '../i18n/LanguageContext';
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

const SECTION_GRADIENTS = [
  'linear-gradient(135deg, #F4845F, #E882B4)',
  'linear-gradient(135deg, #6EB5FF, #6BBF7A)',
  'linear-gradient(135deg, #E882B4, #9B8FFF)',
  'linear-gradient(135deg, #6BBF7A, #6EB5FF)',
  'linear-gradient(135deg, #f97316, #F4845F)',
  'linear-gradient(135deg, #9B8FFF, #6EB5FF)',
];

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'egy', label: 'مصري' },
  { code: 'en', label: 'EN' },
];

function ContentRowItem({ item }: { item: ContentRow }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const isMedia = item.type === 'image' || item.type === 'video';
  const isAudio = item.type === 'audio';
  const isText = item.type === 'text';
  const isFile = !isMedia && !isAudio && !isText;

  return (
    <motion.div
      layout
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
    </motion.div>
  );
}

export default function SectionsExplorer({ open, onClose }: SectionsExplorerProps) {
  const { t, dir, language, setLanguage } = useLanguage();
  const { sections, loading: sectionsLoading } = useSections();
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const { items, loading: contentLoading } = useContent(activeSectionId ?? undefined);
  const [query, setQuery] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    if (open) { setActiveSectionId(null); setQuery(''); }
  }, [open]);

  useEffect(() => {
    setQuery('');
  }, [activeSectionId]);

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

  const visibleSections = sections
    .filter((s) => s.is_visible)
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase()));

  const activeSection = sections.find((s) => s.id === activeSectionId) || null;
  const visibleItems = items
    .filter((i) => !i.is_deleted)
    .filter((i) => i.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          dir={dir}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'radial-gradient(circle at 20% 0%, rgba(244,132,95,0.15), transparent 45%), radial-gradient(circle at 85% 10%, rgba(110,181,255,0.12), transparent 40%), #050510',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}
        >
          {/* Hero header — يخليها حاسة كأنها صفحة رئيسية مصغّرة، مش نافذة عابرة */}
          <div style={{ position: 'relative', padding: '22px 20px 26px', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.5,
              background: 'linear-gradient(135deg, rgba(244,132,95,0.18), rgba(110,181,255,0.1), transparent)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              {activeSection ? (
                <button
                  onClick={() => setActiveSectionId(null)}
                  aria-label={t('sections_back')}
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={17} style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : 'none' }} />
                </button>
              ) : (
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', background: 'rgba(249,115,22,0.15)',
                }}>
                  <BookOpen size={17} color="#f97316" />
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setLangMenuOpen((v) => !v)}
                  aria-label={t('sections_language')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
                    borderRadius: '999px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <GlobeIcon size={13} /> {LANG_OPTIONS.find((l) => l.code === language)?.label}
                </button>
                <AnimatePresence>
                  {langMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', insetInlineEnd: 0, top: '40px', zIndex: 10,
                        background: '#12121f', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px', overflow: 'hidden', minWidth: '120px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                      }}
                    >
                      {LANG_OPTIONS.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLanguage(l.code); setLangMenuOpen(false); }}
                          style={{
                            width: '100%', textAlign: 'start', padding: '10px 14px', fontSize: '13px',
                            background: language === l.code ? 'rgba(249,115,22,0.15)' : 'transparent',
                            color: language === l.code ? '#f97316' : 'white', border: 'none', cursor: 'pointer',
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={onClose}
                aria-label={t('search_close')}
                style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                {activeSection ? activeSection.title : t('sections_modal_title')}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '6px 0 0' }}>
                {t('sections_hero_subtitle')}
              </p>

              <div style={{ position: 'relative', marginTop: '16px' }}>
                <Search size={16} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', insetInlineStart: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  style={{
                    width: '100%', padding: '13px 14px 13px 40px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '4px 20px 40px', maxWidth: '640px', width: '100%', margin: '0 auto' }}>
            {!activeSection ? (
              sectionsLoading ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '40px 0' }}>
                  {t('sections_loading')}
                </p>
              ) : visibleSections.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '40px 0' }}>
                  {query ? t('sections_search_empty') : t('sections_modal_empty')}
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {visibleSections.map((s, i) => (
                    <motion.button
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveSectionId(s.id)}
                      style={{
                        position: 'relative', overflow: 'hidden', borderRadius: '18px', padding: '18px 14px',
                        textAlign: 'start', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                        background: SECTION_GRADIENTS[i % SECTION_GRADIENTS.length],
                        minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      }}
                    >
                      <div style={{
                        position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,5,16,0.05), rgba(5,5,16,0.55))',
                      }} />
                      <BookOpen size={18} color="rgba(255,255,255,0.9)" style={{ position: 'relative' }} />
                      <span style={{ position: 'relative', color: 'white', fontSize: '13.5px', fontWeight: 700, lineHeight: 1.35 }}>
                        {s.title}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )
            ) : contentLoading ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '40px 0' }}>
                {t('sections_loading')}
              </p>
            ) : visibleItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '40px 0' }}>
                {query ? t('sections_search_empty') : t('sections_content_empty')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleItems.map((item) => <ContentRowItem key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

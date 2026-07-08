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
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, BookOpen, Video, Image as ImageIcon, Music, FileText,
  File as FileIcon, Download, Sparkles, Search, Globe as GlobeIcon,
} from 'lucide-react';
import { useLanguage, type Language } from '../i18n/LanguageContext';
import { useSections } from '../hooks/useSections';
import { useContent } from '../hooks/useContent';
import type { ContentRow, ContentType } from '../lib/supabaseClient';
import { gridItemProps } from '../lib/motionVariants';
import ZoomableImage from './ui/ZoomableImage';
import VideoPlayer from './ui/VideoPlayer';

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

/**
 * useVideoThumbnail — بيلتقط أول فريم حقيقي من الفيديو ويرجّعه كصورة.
 * ─────────────────────────────────────────────────────────────────
 * ليه كان بيظهر أسود قبل كده: كنا بنعمل الفيديو بـ
 * `document.createElement('video')` من غير ما نحطه فعليًا جوه الصفحة
 * (DOM). متصفحات الموبايل (خصوصًا WebView بتاع تطبيق أندرويد المبني
 * بـ Capacitor) بترفض تحمّل أي بيانات فيديو لعنصر مش متصل بالصفحة
 * فعليًا — توفير للبيانات/الباتري — فحدث 'loadeddata' مكانش بيحصل
 * خالص، والصورة المصغّرة فضلت فاضية للأبد.
 * الحل: نضيف الفيديو فعليًا جوه الصفحة (مخفي تمامًا بـ 1px بعيد عن
 * الشاشة) عشان يتحمّل زي أي فيديو عادي، ونجرب `play()` (مكتوم الصوت،
 * فمسموح تلقائيًا) عشان نضمن فك أول فريم فعليًا حتى لو `loadeddata`
 * لوحدها مش كافية على بعض الأجهزة، وبعدين نلقط الفريم ونشيل العنصر.
 */
function useVideoThumbnail(src: string | null | undefined): string | null {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!src) { setThumb(null); return; }
    let cancelled = false;
    let captured = false;

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    video.src = src;

    const capture = () => {
      if (captured || cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width && canvas.height) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          captured = true;
          setThumb(canvas.toDataURL('image/jpeg', 0.6));
          video.pause();
        }
      } catch {
        // فشل الالتقاط (مثلاً CORS) — تفضل الأيقونة الافتراضية بدل الصورة
      }
    };

    const onLoadedData = () => {
      // نحاول نشغّله لحظة عشان نضمن فك الفريم فعليًا (بعض متصفحات
      // الموبايل مش بترسم أي فريم إلا بعد play() حقيقي)، ثم نوقفه فورًا.
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { requestAnimationFrame(capture); }).catch(() => { capture(); });
      } else {
        requestAnimationFrame(capture);
      }
    };
    const onTimeUpdate = () => capture();
    const onError = () => { /* هيبان بالأيقونة الافتراضية بدل الصورة */ };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onError);
    document.body.appendChild(video);
    video.load();

    return () => {
      cancelled = true;
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onError);
      try { video.pause(); } catch { /* ignore */ }
      video.src = '';
      video.remove();
    };
  }, [src]);

  return thumb;
}

function ContentCard({ item, gradient, index, onOpen }: { item: ContentRow; gradient: string; index: number; onOpen: () => void }) {
  const isMedia = item.type === 'image' || item.type === 'video';
  // مهم: الأولوية دايمًا للصورة المصغّرة (poster_url) اللي اتولّدت ورُفعت
  // فعليًا وقت رفع الفيديو نفسه (انظر videoThumbnail.ts) — دي صورة جاهزة
  // خفيفة بتظهر فورًا لكل المستخدمين. لو مش موجودة (فيديو قديم اتضاف
  // قبل الميزة دي)، نرجع بس لمحاولة التقاط فريم حي من الفيديو نفسه —
  // وده اللي كان بيسبب البطء (تحميل جزء من كل فيديو في الشبكة) والصورة
  // السودة (لو فشل الالتقاط بسبب CORS)، فمينفعش يبقى المصدر الأساسي.
  const needsLiveCapture = item.type === 'video' && !item.poster_url;
  const videoThumb = useVideoThumbnail(needsLiveCapture ? item.file_url : null);
  const posterSrc = item.poster_url || videoThumb;
  return (
    <motion.button
      layout
      {...gridItemProps(index)}
      onClick={onOpen}
      style={{
        position: 'relative', borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        textAlign: 'start', cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: 0,
      }}
    >
      <div
        style={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden',
          background: isMedia ? '#000' : gradient, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {item.type === 'image' && item.file_url && (
          <img src={item.file_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {item.type === 'video' && item.file_url && (
          <>
            {posterSrc ? (
              <img src={posterSrc} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(107,191,122,0.25), rgba(20,20,30,0.6))' }} />
            )}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.25)',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Video size={17} color="white" />
              </div>
            </div>
          </>
        )}
        {!isMedia && (
          <div style={{ transform: 'scale(1.7)', opacity: 0.95 }}>
            {TYPE_ICON[item.type] ?? <FileIcon size={20} color="white" />}
          </div>
        )}
        {item.is_featured && (
          <div style={{ position: 'absolute', top: 8, insetInlineEnd: 8 }}>
            <Sparkles size={14} color="#facc15" />
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <span style={{
          color: 'white', fontSize: '12.5px', fontWeight: 600, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          unicodeBidi: 'plaintext',
        }}>
          {item.title}
        </span>
      </div>
    </motion.button>
  );
}

function ContentLightbox({ item, onClose }: { item: ContentRow; onClose: () => void }) {
  const { t } = useLanguage();
  const isMedia = item.type === 'image' || item.type === 'video';
  const isAudio = item.type === 'audio';
  const isText = item.type === 'text';
  const isFile = !isMedia && !isAudio && !isText;
  // لما الفيديو يبقى في وضع "عائم"، بنشيل الخلفية المعتمة وبنوقف
  // استقبالها للمس عشان تقدر فعليًا تستخدم باقي الصفحة/التطبيق وانت
  // بتفرج، من غير ما الفيديو نفسه يتوقف أو يعيد التحميل.
  const [videoFloating, setVideoFloating] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={videoFloating ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: videoFloating ? 'transparent' : 'rgba(3,3,10,0.92)',
        backdropFilter: videoFloating ? 'none' : 'blur(6px)',
        pointerEvents: videoFloating ? 'none' : 'auto',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
        <button
          onClick={onClose}
          style={{
            width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 20px 30px', gap: '16px', overflowY: 'auto',
        }}
      >
        <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 700, textAlign: 'center', margin: 0, unicodeBidi: 'plaintext' }}>{item.title}</h3>
        {item.type === 'image' && item.file_url && (
          <ZoomableImage src={item.file_url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '14px', objectFit: 'contain' }} />
        )}
        {item.type === 'video' && item.file_url && (
          <VideoPlayer src={item.file_url} poster={item.poster_url || undefined} autoPlay borderRadius="14px" maxHeight="60vh"
            onFloatingChange={setVideoFloating} onCloseFloating={onClose} />
        )}
        {isAudio && item.file_url && (
          <audio src={item.file_url} controls style={{ width: '100%', maxWidth: '360px' }} />
        )}
        {isText && (
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.9, maxWidth: '480px', textAlign: 'center', margin: 0 }}>
            {item.content_body || item.title}
          </p>
        )}
        {isFile && item.file_url && (
          item.allow_download ? (
            <a
              href={item.file_url} download={item.title}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px',
                borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white',
                fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              }}
            >
              <Download size={15} /> {t('content_download')}
            </a>
          ) : (
            <a
              href={item.file_url} target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px',
                borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white',
                fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              }}
            >
              <FileIcon size={15} /> {t('content_open_file')}
            </a>
          )
        )}
      </div>
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
  const [lightboxItem, setLightboxItem] = useState<ContentRow | null>(null);

  useEffect(() => {
    if (open) { setActiveSectionId(null); setQuery(''); setLightboxItem(null); }
  }, [open]);

  useEffect(() => {
    setQuery('');
    setLightboxItem(null);
  }, [activeSectionId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (lightboxItem) setLightboxItem(null);
      else if (activeSectionId !== null) setActiveSectionId(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, activeSectionId, lightboxItem, onClose]);

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
                      {...gridItemProps(i)}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {visibleItems.map((item, i) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    gradient={SECTION_GRADIENTS[i % SECTION_GRADIENTS.length]}
                    index={i}
                    onOpen={() => setLightboxItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {lightboxItem && <ContentLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

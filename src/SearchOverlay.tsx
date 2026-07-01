/**
 * SearchOverlay — real, functional search across the app's live data.
 * -----------------------------------------------------------------------
 * يبحث في نفس مصدر الحقيقة المستخدم في باقي التطبيق (useSections و
 * useContent، نفس الـ hooks اللي بيقرأ منها لوحة الأدمن والصفحة
 * الرئيسية) — مش بيانات وهمية منفصلة. الضغط على أي نتيجة يعمل تمرير
 * سلس (scroll) لمكانها الفعلي في الصفحة (قسم الكورسات أو قسم الدروس).
 */
import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, FileText } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useSections } from '../hooks/useSections';
import { useContent } from '../hooks/useContent';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { t, dir } = useLanguage();
  const { sections } = useSections();
  const { items } = useContent();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      // Small delay so the entrance animation isn't interrupted by focus scroll.
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();

  const matchedSections = useMemo(() => {
    if (!q) return [];
    return sections.filter((s) => s.is_visible && s.title.toLowerCase().includes(q));
  }, [sections, q]);

  const matchedContent = useMemo(() => {
    if (!q) return [];
    return items.filter((i) => !i.is_deleted && i.title.toLowerCase().includes(q)).slice(0, 12);
  }, [items, q]);

  const hasResults = matchedSections.length > 0 || matchedContent.length > 0;

  const goTo = (anchor: string) => {
    onClose();
    // Wait a tick for the overlay's exit animation to clear before scrolling.
    setTimeout(() => {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

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
            {/* Search input */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              <Search size={18} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'white', fontSize: '15px',
                }}
              />
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

            {/* Results */}
            {q && (
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {!hasResults && (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '24px 0' }}>
                    {t('search_no_results')}
                  </p>
                )}

                {matchedSections.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
                      {t('search_sections')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {matchedSections.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => goTo('courses')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', borderRadius: '12px', textAlign: 'start',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                            color: 'white', fontSize: '14px', cursor: 'pointer',
                          }}
                        >
                          <BookOpen size={16} color="#f97316" style={{ flexShrink: 0 }} />
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedContent.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
                      {t('search_lessons')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {matchedContent.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => goTo('lessons')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', borderRadius: '12px', textAlign: 'start',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                            color: 'white', fontSize: '14px', cursor: 'pointer',
                          }}
                        >
                          <FileText size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                          {c.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * LessonList — the real student-facing piece that was missing entirely.
 * -----------------------------------------------------------------------
 * يقرأ عناصر `content` الحقيقية (عبر useContent، بنفس مصدر الحقيقة
 * المستخدم في لوحة الإدارة) ويطبّق القاعدة المتفق عليها بدقة:
 *
 *   - زر التنزيل لا "يُركَّب" في DOM أصلاً إلا للعنصر الذي
 *     `allow_download === true` تحديداً — ليس مخفياً بـ CSS، غائب فعلياً.
 *   - لا يوجد أي مفتاح عام هنا يُظهر تنزيلاً لعنصر لم يُفعَّل صراحة.
 *   - عند الضغط على تنزيل لعنصر حقيقي (مرتبط بـ Supabase Storage)،
 *     يُطلب signed URL قصير الصلاحية (10 دقائق) بدل رابط عام دائم.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  Video,
  Download,
  Presentation,
  Archive,
  Star,
  Music,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import type { ContentType } from '../../lib/supabaseClient';
import ZoomableImage from '../ui/ZoomableImage';
import VideoPlayer from '../ui/VideoPlayer';

const TYPE_META: Record<ContentType, { icon: typeof FileText; color: string; label: string }> = {
  video: { icon: Video, color: '#6EB5FF', label: 'فيديو' },
  image: { icon: FileImage, color: '#E882B4', label: 'صورة' },
  audio: { icon: Music, color: '#9B8FFF', label: 'تسجيل صوتي' },
  text: { icon: FileText, color: '#6BBF7A', label: 'نص' },
  pdf: { icon: FileImage, color: '#F4845F', label: 'PDF' },
  word: { icon: FileText, color: '#4472C4', label: 'Word' },
  powerpoint: { icon: Presentation, color: '#D24726', label: 'PowerPoint' },
  excel: { icon: FileSpreadsheet, color: '#217346', label: 'Excel' },
  zip: { icon: Archive, color: '#9B8FFF', label: 'ZIP' },
};

interface LessonListProps {
  sectionId?: number;
  /** Optional cap on items shown (e.g. featured-only widgets). */
  limit?: number;
  /**
   * لو true، بيعرض فقط العناصر اللي الأدمن حدد لها "رئيسية" (show_on_home
   * === true) — ده اللي بيمنع أي محتوى يتضاف في قسم من الظهور في
   * الصفحة الرئيسية تلقائياً من غير ما حد يحدد إظهاره فيها فعلاً.
   */
  onlyShowOnHome?: boolean;
}

export default function LessonList({ sectionId, limit, onlyShowOnHome }: LessonListProps) {
  const { items, getSignedDownloadUrl } = useContent(sectionId);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const filtered = items.filter((i) => !i.is_deleted && (!onlyShowOnHome || i.show_on_home));
  const visible = limit ? filtered.slice(0, limit) : filtered;

  async function handleDownload(itemId: number, fileUrl: string | null) {
    if (!fileUrl) return;
    setDownloadingId(itemId);
    const signedUrl = await getSignedDownloadUrl(fileUrl);
    setDownloadingId(null);
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Demo mode (no Supabase connected) — no real file to fetch.
      // eslint-disable-next-line no-alert
      window.alert('وضع العرض التوضيحي: لا يوجد ملف حقيقي متصل بعد.');
    }
  }

  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {visible.map((item, index) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        const hasMediaPreview = (item.type === 'image' || item.type === 'video') && !!item.file_url;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: hasMediaPreview ? '10px' : 0,
              padding: '16px 18px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* معاينة حقيقية للصورة/الفيديو — ده اللي كان ناقص وبيخلي أي
                صورة أو فيديو يضيفه الأدمن يظهر فعلياً هنا مش مجرد أيقونة */}
            {hasMediaPreview && (
              <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                {item.type === 'image' ? (
                  <ZoomableImage
                    src={item.file_url as string}
                    alt={item.title}
                    style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <VideoPlayer src={item.file_url as string} maxHeight="260px" borderRadius="10px" />
                )}
              </div>
            )}
            {item.type === 'audio' && item.file_url && (
              <audio src={item.file_url} controls style={{ width: '100%' }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${meta.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={meta.color} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'white', unicodeBidi: 'plaintext' }}>{item.title}</span>
                {item.is_featured && <Star size={13} fill="#f97316" color="#f97316" />}
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{meta.label}</span>
            </div>

            {/*
              القاعدة الصارمة: هذا الزر غير موجود في DOM أصلاً لأي عنصر
              لا يحمل allow_download === true — وليس مجرد مخفي بصرياً.
            */}
            {item.allow_download && (
              <button
                onClick={() => handleDownload(item.id, item.file_url)}
                disabled={downloadingId === item.id}
                title="تنزيل"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(96,165,250,0.15)',
                  color: '#60a5fa',
                  cursor: downloadingId === item.id ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: downloadingId === item.id ? 0.6 : 1,
                  transition: 'opacity 200ms ease, transform 200ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                <Download size={16} />
              </button>
            )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

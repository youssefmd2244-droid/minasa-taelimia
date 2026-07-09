/**
 * siteContentRegistry — "كتالوج" كل نص وصورة قابلة للتعديل من لوحة
 * الإدارة (تبويب "نصوص والصور" جوه الإعدادات)، بدل ما تكون هذه
 * النصوص/الصور مكتوبة بشكل ثابت (hardcoded) جوه كود المكوّنات.
 * ─────────────────────────────────────────────────────────────────
 * كل عنصر هنا له `key` فريد (بيتخزن بيه في siteTexts/siteImages داخل
 * بيانات لوحة الإدارة)، و`default` هي نفس القيمة الأصلية اللي كانت
 * مكتوبة في الكود قبل كده — يعني لو الأدمن مفتحش المحرر ده أبداً،
 * الموقع بيفضل شكله بالظبط زي ما كان من غير أي فرق.
 *
 * لإضافة نص/صورة جديدة قابلة للتعديل مستقبلاً: (1) ضيف عنصر جديد هنا
 * بمفتاح فريد، (2) في المكوّن نفسه استبدل النص/الصورة الثابتة بـ
 * useSiteText('المفتاح', 'القيمة الأصلية') أو useSiteImage(...).
 */

export interface SiteTextField {
  key: string;
  label: string;
  group: string;
  default: string;
  multiline?: boolean;
}

export interface SiteImageField {
  key: string;
  label: string;
  group: string;
  default: string;
}

export const SITE_TEXT_FIELDS: SiteTextField[] = [
  // ── قسم "محتوى مميز" (الصفحة الرئيسية) ──
  { key: 'academy.badgeLabel', label: 'تسمية الشارة (بجانب رقم عدد الكورسات)', group: 'محتوى مميز', default: 'أفضل تقييمات الطلاب' },
  { key: 'academy.heading', label: 'العنوان الرئيسي', group: 'محتوى مميز', default: 'محتوى مميز' },
  { key: 'academy.ctaLabel', label: 'نص زرار "عرض كل الأقسام"', group: 'محتوى مميز', default: 'عرض كل الأقسام' },
  { key: 'academy.emptyTitle', label: 'نص الحالة الفارغة (لو مفيش محتوى مميز)', group: 'محتوى مميز', default: 'مفيش محتوى مميز لسه' },

  // ── قسم "انتشارنا العالمي" (الكرة الأرضية) ──
  { key: 'globalPresence.eyebrow', label: 'التسمية الصغيرة فوق العنوان', group: 'انتشارنا العالمي', default: 'انتشارنا العالمي' },
  { key: 'globalPresence.headingLine1', label: 'العنوان — السطر الأول', group: 'انتشارنا العالمي', default: 'طلاب من كل' },
  { key: 'globalPresence.headingLine2', label: 'العنوان — السطر الثاني (بالبرتقالي)', group: 'انتشارنا العالمي', default: 'أنحاء العالم العربي' },
  { key: 'globalPresence.statHeading', label: 'جملة إحصائية رئيسية', group: 'انتشارنا العالمي', default: 'منصة بتكبر يوم بعد يوم' },
  { key: 'globalPresence.statSub', label: 'جملة إحصائية فرعية', group: 'انتشارنا العالمي', default: 'طلاب بينضموا من كل حتة في الوطن العربي' },

  // ── آراء الطلاب ──
  { key: 'studentComments.heading', label: 'عنوان قسم آراء الطلاب', group: 'آراء الطلاب', default: 'آراء الطلاب' },
  { key: 'studentComments.subheading', label: 'زرار "شاركنا رأيك"', group: 'آراء الطلاب', default: 'شاركنا رأيك' },

  // ── التذييل (Footer) — اتصل بنا ──
  { key: 'footer.email', label: 'البريد الإلكتروني', group: 'التذييل — اتصل بنا', default: 'info@eduverse.com' },
  { key: 'footer.phone', label: 'رقم الهاتف', group: 'التذييل — اتصل بنا', default: '+20 100 000 0000' },
];

export const SITE_IMAGE_FIELDS: SiteImageField[] = [
  { key: 'academy.imageLarge', label: 'صورة "محتوى مميز" — الصورة الكبيرة', group: 'محتوى مميز', default: 'https://images.pexels.com/photos/7777691/pexels-photo-7777691.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900' },
  { key: 'academy.imageSmall1', label: 'صورة "محتوى مميز" — الصورة الصغيرة الأولى', group: 'محتوى مميز', default: 'https://images.pexels.com/photos/9159039/pexels-photo-9159039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600' },
  { key: 'academy.imageSmall2', label: 'صورة "محتوى مميز" — الصورة الصغيرة الثانية', group: 'محتوى مميز', default: 'https://images.pexels.com/photos/8926887/pexels-photo-8926887.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600' },
];

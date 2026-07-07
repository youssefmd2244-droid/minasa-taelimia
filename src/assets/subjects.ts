// Subject book images — served from /public/assets/subjects/
// ملحوظة أداء مهمة: كانت دي 4 صور PNG بحجم 1.5–1.9 ميجا لكل واحدة (~7
// ميجا في المجموع)، بأبعاد أكبر بكتير من مساحة العرض الفعلية على الشاشة
// (بتتعرض بحد أقصى ~55% من عرض الموبايل). اتحولت لـ WebP مضغوط بأبعاد
// 900px (أكتر من كفاية لأعلى دقة شاشة)، فبقى حجمها الإجمالي ~260 كيلوبايت
// بدل 7 ميجا — ده فرق حقيقي وملموس في سرعة فتح الصفحة الرئيسية خصوصًا
// على نت موبايل بطيء.
export const SUBJECT_IMAGES = {
  math:     '/assets/subjects/math-book-3d.webp',
  science:  '/assets/subjects/science-book-3d.webp',
  language: '/assets/subjects/language-book-3d.webp',
  art:      '/assets/subjects/art-book-3d.webp',
};

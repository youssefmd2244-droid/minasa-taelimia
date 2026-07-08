// Subject book images — served from /public/assets/subjects/
// ─────────────────────────────────────────────────────────────────────
// الأربعة: math/science/language/art — أغلفة فوتوغرافية WebP (900px).
// الأربعة التانيين: english/french/psychology/philosophy — كانوا
// أغلفة SVG مؤقتة، دلوقتي اتستبدلوا بأغلفة فوتوغرافية حقيقية (WebP
// مضغوط 900px) بعتها المستخدم.
export const SUBJECT_IMAGES = {
  math:     '/assets/subjects/math-book-3d.webp',
  science:  '/assets/subjects/science-book-3d.webp',
  language: '/assets/subjects/language-book-3d.webp',
  art:      '/assets/subjects/art-book-3d.webp',
  english:    '/assets/subjects/english-book-3d.webp',
  french:     '/assets/subjects/french-book-3d.webp',
  psychology: '/assets/subjects/psychology-book-3d.webp',
  philosophy: '/assets/subjects/philosophy-book-3d.webp',
  // اتنين إضافيين اتبعتوا لسه مش مربوطين بأي قسم — لو حابب تستخدمهم
  // ضيف عنصر جديد في HeroCarousel.tsx بنفس شكل الأسطر التانية.
  computer_science: '/assets/subjects/computer-science-book-3d.webp',
  courses:          '/assets/subjects/courses-book-3d.webp',
  // نسخة فلسفة بالفرنساوي (PHILOSOPHIE) — مضافة كمادة سابعة في الكاروسيل.
  philosophy_fr: '/assets/subjects/philosophy-fr-book-3d.webp',
};

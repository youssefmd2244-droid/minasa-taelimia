/**
 * i18n — نظام الترجمة الكامل
 * اللغات: عربي (ar) | إنجليزي (en) | عامية مصرية (egy)
 */

export type Lang = 'ar' | 'en' | 'egy';

export const translations = {
  // ── Nav ─────────────────────────────────────────────────────
  nav: {
    courses:     { ar: 'الكورسات',    en: 'Courses',     egy: 'الكورسات' },
    instructors: { ar: 'المدرسين',    en: 'Instructors', egy: 'الأساتذة' },
    community:   { ar: 'المجتمع',     en: 'Community',   egy: 'المجتمع' },
    pricing:     { ar: 'الأسعار',     en: 'Pricing',     egy: 'الأسعار' },
    startLearning: { ar: 'ابدأ التعلم', en: 'Start Learning', egy: 'ابدأ تتعلم' },
    exploreCourses: { ar: 'استكشف الكورسات', en: 'Explore Courses', egy: 'شوف الكورسات' },
  },

  // ── Hero ────────────────────────────────────────────────────
  hero: {
    heading:   { ar: 'نصنع عقولاً\nبتركيز وفضول.', en: 'Shaping minds\nwith focus and curiosity.', egy: 'بنبني عقول\nبتركيز وفضول.' },
    subheading: {
      ar:  'نساعد الطلاب على بناء مهارات حقيقية والسعي نحو مستقبل يعكس تطلعاتهم التعليمية.',
      en:  'We help students build real skills and pursue ventures that define what comes next in their education.',
      egy: 'بنساعد الطلاب يبنوا مهارات حقيقية ويحققوا اللي بيحلموا بيه في تعليمهم.',
    },
    words: {
      ar:  ['التعلم.', 'النمو.', 'التفوق.'],
      en:  ['Learning.', 'Growing.', 'Achieving.'],
      egy: ['بتتعلم.', 'بتكبر.', 'بتتفوق.'],
    },
  },

  // ── Stats ───────────────────────────────────────────────────
  stats: {
    badge:   { ar: 'المنصة بالأرقام', en: 'Platform by the Numbers', egy: 'المنصة بالأرقام' },
    heading: { ar: 'يثق بنا الطلاب', en: 'Trusted by students', egy: 'الطلاب واثقين فينا' },
    sub:     { ar: 'في كل أرجاء العالم العربي.', en: 'across the Arab world.', egy: 'في كل البلاد العربية.' },
    activeStudents:  { ar: 'طالب نشط',       en: 'Active Students',    egy: 'طالب شغّال' },
    coursesAvailable:{ ar: 'كورس متاح',       en: 'Courses Available',  egy: 'كورس موجود' },
    completionRate:  { ar: 'معدل الإتمام',    en: 'Completion Rate',    egy: 'نسبة إتمام' },
    countriesReached:{ ar: 'دولة وصلنا إليها', en: 'Countries Reached',  egy: 'دولة وصلناها' },
    quote:   {
      ar:  '"التعليم ليس تعلّم الحقائق، بل تدريب العقل على التفكير."',
      en:  '"Education is not the learning of facts, but the training of the mind to think."',
      egy: '"التعليم مش حفظ معلومات، ده تدريب العقل إنه يفكر."',
    },
  },

  // ── Instructors ─────────────────────────────────────────────
  instructors: {
    badge:      { ar: 'تعرف على المدرسين', en: 'Meet Our Educators', egy: 'اتعرف على الأساتذة' },
    heading:    { ar: 'مدرسون خبراء،',     en: 'Expert instructors,', egy: 'أساتذة محترفين,' },
    headingSub: { ar: 'نتائج حقيقية.',      en: 'real results.',       egy: 'نتايج حقيقية.' },
    viewAll:    { ar: 'عرض الكل',           en: 'View all',            egy: 'شوف الكل' },
    courses:    { ar: 'كورس',               en: 'courses',             egy: 'كورس' },
  },

  // ── Footer ──────────────────────────────────────────────────
  footer: {
    ctaHeading: { ar: 'هل أنت جاهز لبدء التعلم؟', en: 'Ready to start learning?', egy: 'مستعد تبدأ تتعلم؟' },
    ctaSub: {
      ar:  'انضم إلى أكثر من 50,000 طالب على منصة بُنيت من أجل تقدّم أكاديمي حقيقي. التسجيل مجاني، والشهادات حقيقية.',
      en:  'Join over 50,000 students on a platform built for real academic progress. Free to join, real certificates.',
      egy: 'انضم لأكتر من 50,000 طالب على منصة اتبنت عشان تقدم أكاديمي حقيقي. التسجيل مجاني والشهادات حقيقية.',
    },
    ctaBtn:      { ar: 'سجّل مجاناً',         en: 'Sign Up Free',          egy: 'سجّل مجاناً' },
    description: {
      ar:  'منصة تعليمية حديثة تقدّم كورسات معدّة بعناية في جميع المواد الأساسية. منهج معتمد، وصول مجاني، ونتائج حقيقية.',
      en:  'A modern learning platform offering carefully crafted courses across all core subjects. Accredited curriculum, free access, real results.',
      egy: 'منصة تعليمية عصرية بتقدم كورسات متعملة بعناية في كل المواد الأساسية. منهج معتمد، دخول مجاني، ونتايج حقيقية.',
    },
    subjects:    { ar: 'المواد الدراسية', en: 'Subjects',   egy: 'المواد' },
    platform:    { ar: 'المنصة',          en: 'Platform',   egy: 'المنصة' },
    newsletter:  { ar: 'تابع آخر التحديثات', en: 'Stay Updated', egy: 'تابع التحديثات' },
    newsletterSub: {
      ar:  'كورسات جديدة، نصائح، وتحديثات — مباشرة إلى بريدك.',
      en:  'New courses, tips, and updates — straight to your inbox.',
      egy: 'كورسات جديدة، نصايح، وتحديثات — على بريدك مباشرة.',
    },
    subscribe:   { ar: 'اشترك', en: 'Subscribe', egy: 'اشترك' },
    accredited:  { ar: 'منهج معتمد', en: 'Accredited', egy: 'منهج معتمد' },
    accreditedSub:{ ar: 'موثّق ومعتمد رسمياً', en: 'Officially certified', egy: 'موثّق ومعتمد رسمياً' },
    rights:      { ar: '© 2025 EduVerse. جميع الحقوق محفوظة.', en: '© 2025 EduVerse. All rights reserved.', egy: '© 2025 EduVerse. كل الحقوق محفوظة.' },
    madeWith:    { ar: 'صُنع بحب لكل المتعلمين في كل مكان. ❤️', en: 'Made with love for learners everywhere. ❤️', egy: 'اتعمل بحب لكل اللي بيتعلموا في كل مكان. ❤️' },
    subjectsList: {
      ar:  ['الرياضيات', 'العلوم', 'اللغة العربية', 'الفنون والتصميم', 'الفيزياء', 'علوم الحاسوب'],
      en:  ['Mathematics', 'Science', 'Arabic Language', 'Arts & Design', 'Physics', 'Computer Science'],
      egy: ['الرياضيات', 'العلوم', 'اللغة العربية', 'الفنون والتصميم', 'الفيزياء', 'علوم الكمبيوتر'],
    },
    linksList: {
      ar:  ['من نحن', 'كيف تعمل المنصة', 'الاعتماد الأكاديمي', 'المدونة', 'سياسة الخصوصية', 'شروط الاستخدام'],
      en:  ['About Us', 'How It Works', 'Academic Accreditation', 'Blog', 'Privacy Policy', 'Terms of Use'],
      egy: ['عنّا', 'إزاي بتشتغل المنصة', 'الاعتماد الأكاديمي', 'المدونة', 'سياسة الخصوصية', 'شروط الاستخدام'],
    },
  },

  // ── Admin ───────────────────────────────────────────────────
  admin: {
    enterPassword: { ar: 'أدخل كلمة المرور', en: 'Enter password', egy: 'ادخل الباسورد' },
    enterCode:     { ar: 'أدخل رمز التفويض', en: 'Enter authorization code', egy: 'ادخل الكود' },
    dashboard:     { ar: 'لوحة التحكم',       en: 'Dashboard',               egy: 'لوحة التحكم' },
    openAdmin:     { ar: 'فتح لوحة التحكم',   en: 'Open Dashboard',          egy: 'افتح لوحة التحكم' },
    sectionTitle:  { ar: 'عنوان القسم...',    en: 'Section title...',        egy: 'عنوان القسم...' },
    contentTitle:  { ar: 'عنوان المحتوى...', en: 'Content title...',        egy: 'عنوان المحتوى...' },
    edit:          { ar: 'تعديل',             en: 'Edit',                    egy: 'عدّل' },
    delete:        { ar: 'حذف',               en: 'Delete',                  egy: 'امسح' },
    restore:       { ar: 'استعادة',           en: 'Restore',                 egy: 'رجّع' },
    upload:        { ar: 'رفع ملف',           en: 'Upload file',             egy: 'ارفع ملف' },
    toggleVisibility: { ar: 'تبديل الظهور',  en: 'Toggle visibility',       egy: 'خلّيه يظهر/يختفي' },
    writeReply:    { ar: 'اكتب ردك...',       en: 'Write your reply...',     egy: 'اكتب ردك...' },
    download:      { ar: 'تنزيل',             en: 'Download',                egy: 'نزّل' },
  },

  // ── Language switcher ────────────────────────────────────────
  langSwitcher: {
    ar:  { ar: 'العربية',    en: 'Arabic',         egy: 'عربي' },
    en:  { ar: 'الإنجليزية', en: 'English',        egy: 'إنجليزي' },
    egy: { ar: 'العامية المصرية', en: 'Egyptian Arabic', egy: 'مصري' },
  },
} as const;

/** Helper: اجلب نص بالـ key واللغة */
export function t(
  key: keyof typeof translations,
  subKey: string,
  lang: Lang
): string {
  const section = translations[key] as Record<string, Record<Lang, string>>;
  return section?.[subKey]?.[lang] ?? section?.[subKey]?.['ar'] ?? subKey;
}

/** Helper for array values */
export function tArr(
  key: keyof typeof translations,
  subKey: string,
  lang: Lang
): string[] {
  const section = translations[key] as Record<string, Record<Lang, string[]>>;
  return section?.[subKey]?.[lang] ?? section?.[subKey]?.['ar'] ?? [];
}

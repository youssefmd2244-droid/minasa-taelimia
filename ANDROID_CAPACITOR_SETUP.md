# EduVerse Android / Capacitor Setup

تم تجهيز المشروع لنسخة Android عبر Capacitor على مستوى الويب والتهيئة الأساسية.

## ما تم إضافته
- `capacitor.config.ts`
- حزم Capacitor الأساسية:
  - `@capacitor/core`
  - `@capacitor/cli`
  - `@capacitor/android`
  - `@capacitor/app`
  - `@capacitor/status-bar`
  - `@capacitor/splash-screen`
- تهيئة runtime داخل `src/mobile/capacitor.ts`

## ملاحظة مهمة
هذا المستودع الآن **Android-ready** من جهة الويب والـ bridge configuration.
لكن إنشاء مشروع Android native الكامل (`android/`) يحتاج تشغيل أوامر Capacitor في بيئة تطوير محلية:

```bash
npm run build
npx cap add android
npx cap sync android
```

## لماذا لم يُولّد مجلد android بالكامل هنا؟
لأن توليد مشروع Android الكامل يتم عادةً عبر Capacitor CLI ويحتاج إنشاء ملفات Gradle وAndroidManifest وnative assets تلقائيًا.

## بعد التوليد محليًا
يمكن فتح المشروع عبر Android Studio من:
- `android/`

ثم بناء APK أو AAB مباشرة.

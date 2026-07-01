# EduVerse — دليل إعداد Android + Capacitor

> **المشروع:** `com.eduverse.lms` — منصة EduVerse التعليمية  
> **Stack:** React + TypeScript + Vite + Capacitor 8 + Android

---

## ✅ ما تم إعداده مسبقاً في المشروع

| الملف / الحزمة | الحالة |
|---|---|
| `capacitor.config.ts` | ✅ مُهيَّأ |
| `@capacitor/core` | ✅ مثبّت |
| `@capacitor/cli` | ✅ مثبّت |
| `@capacitor/android` | ✅ مثبّت |
| `@capacitor/app` | ✅ مثبّت |
| `@capacitor/status-bar` | ✅ مثبّت |
| `@capacitor/splash-screen` | ✅ مثبّت |
| `src/mobile/capacitor.ts` | ✅ موجود |
| `index.html` — viewport mobile | ✅ مُصلَح |

---

## 🚀 خطوات التشغيل من الصفر (محلياً)

### المتطلبات الأساسية
```
Node.js 18+
Java JDK 17+         ← مهم جداً لـ Capacitor 8
Android Studio (Ladybug أو أحدث)
Android SDK API 35
```

---

### الخطوة 1 — تثبيت الحزم

```bash
npm install
```

---

### الخطوة 2 — بناء مشروع الويب

```bash
npm run build
```

> يُنشئ مجلد `dist/` — هذا هو ما سيُحمَّل داخل التطبيق.

---

### الخطوة 3 — إضافة منصة Android (مرة واحدة فقط)

```bash
npx cap add android
```

يُنشئ مجلد `android/` بالكامل داخل المشروع.

---

### الخطوة 4 — مزامنة الملفات

```bash
npx cap sync android
```

> شغّل هذا الأمر **في كل مرة** تعمل فيها `npm run build`.

---

### الخطوة 5 — فتح Android Studio

```bash
npx cap open android
```

أو افتح مجلد `android/` مباشرة من Android Studio.

---

### الخطوة 6 — تشغيل على جهازك

1. فعّل **Developer Options** و**USB Debugging** على هاتفك
2. وصّل الهاتف بـ USB
3. في Android Studio → اختر جهازك → ▶ Run

---

## ⚙️ ملف `capacitor.config.ts` الحالي

```ts
const config: CapacitorConfig = {
  appId: 'com.eduverse.lms',
  appName: 'EduVerse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#05050f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#05050f',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#05050f',
      overlaysWebView: false,
    },
  },
};
```

---

## 📁 هيكل مجلد `android/` بعد التوليد

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml       ← الأذونات وإعدادات التطبيق
│   │   ├── java/com/eduverse/lms/
│   │   │   └── MainActivity.java     ← نقطة الدخول الرئيسية
│   │   └── res/
│   │       ├── drawable/             ← Splash screen
│   │       ├── mipmap-*/             ← أيقونات التطبيق
│   │       └── values/
│   │           ├── strings.xml       ← اسم التطبيق
│   │           └── styles.xml        ← ثيم Android
│   └── build.gradle
├── build.gradle
└── gradle.properties
```

---

## 🔧 تعديلات Android Studio المهمة بعد التوليد

### 1. اسم التطبيق عربي

في `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">EduVerse</string>
```

### 2. منع تدوير الشاشة (Portrait فقط)

في `android/app/src/main/AndroidManifest.xml` داخل `<activity>`:
```xml
android:screenOrientation="portrait"
```

### 3. دعم الشاشات العريضة (Edge-to-Edge)

في `android/app/src/main/res/values/styles.xml`:
```xml
<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
<item name="android:navigationBarColor">@android:color/transparent</item>
<item name="android:statusBarColor">@android:color/transparent</item>
```

---

## 📦 بناء APK للتوزيع

### APK مباشر (للتجربة)
```
Android Studio → Build → Build Bundle(s)/APK(s) → Build APK(s)
```
الملف في: `android/app/build/outputs/apk/debug/app-debug.apk`

### AAB للرفع على Google Play
```
Android Studio → Build → Generate Signed Bundle / APK
```

---

## 🔄 سكريبت البناء الكامل (مختصر)

```bash
# كل مرة تعمل تعديل وعايز ترفع على الهاتف:
npm run build && npx cap sync android
```

أو استخدم الأمر الجاهز في `package.json`:
```bash
npm run android
```

---

## ❓ مشاكل شائعة وحلولها

| المشكلة | الحل |
|---|---|
| الصفحة بيضاء عند فتح التطبيق | تأكد عملت `npm run build` قبل `cap sync` |
| المحتوى خارج الشاشة يساراً | تأكد أن `index.html` فيه `maximum-scale=1.0, user-scalable=no` |
| خطأ `JAVA_HOME` | ثبّت JDK 17 وعيّن المسار في متغيرات البيئة |
| Gradle sync فاشل | في `android/build.gradle` تأكد `classpath 'com.android.tools.build:gradle:8.+'` |
| الكاميرا/الميكروفون لا يعمل | أضف الأذونات في `AndroidManifest.xml` (موجودة أسفله) |

---

## 🛡️ أذونات AndroidManifest.xml المقترحة

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.CAMERA" />
```

---

## 📱 Live Reload للتطوير (اختياري)

لو عايز ترى التعديلات فوراً على الهاتف بدون بناء كل مرة:

```bash
# شغّل dev server أولاً
npm run dev

# في capacitor.config.ts أضف مؤقتاً:
server: {
  url: 'http://YOUR_PC_IP:5173',
  cleartext: true,
}

# ثم sync
npx cap sync android
npx cap open android
```

> ⚠️ احذف `server.url` قبل البناء النهائي!

---

*آخر تحديث: يونيو 2026 — EduVerse LMS*

import type { CapacitorConfig } from '@capacitor/cli';

// ملاحظة: لون الخلفية هنا (#05050f) مطابق تماماً لخلفية IntroSplash.tsx
// الفعلية في الكود، حتى لا يحدث "قفزة لونية" مرئية بين شاشة الإقلاع
// الأصلية للنظام (native splash) وبين شاشة البداية المتحركة (React).
const config: CapacitorConfig = {
  appId: 'com.eduverse.lms',
  appName: 'EduVerse',
  webDir: 'dist',
  bundledWebRuntime: false,
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
    App: {
      launchUrl: 'eduverse://home',
    },
  },
};

export default config;

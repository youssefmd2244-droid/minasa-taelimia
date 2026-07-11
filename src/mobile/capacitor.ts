import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { flushPendingPush } from '../lib/adminBridge';

// باگ تم اكتشافه وإصلاحه هنا: أي تعديل من الأدمن (إضافة قسم/محتوى) كان
// بيتحفظ بعد تأخير بسيط (debounce) قبل ما يتبعت فعليًا لـ Supabase/GitHub.
// لو الأدمن قفل التطبيق أو رجع للخلفية قبل ما التأخير ده يخلص، أندرويد
// بيوقف الـ WebView والتعديل بيضيع من غير أي حفظ فعلي، حتى لو كان ظاهر
// على شاشة الأدمن نفسه لحظتها. بنسمع هنا لأي لحظة التطبيق بيروح
// للخلفية (تصغير/تبديل تطبيق/قفل الشاشة) أو الصفحة هتتقفل، ونجبر أي
// حفظ معلّق يحصل فورًا بدل ما نستنى.
function registerFlushOnBackground() {
  try {
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) flushPendingPush();
    });
  } catch {
    // Ignore listener issues on unsupported runtimes.
  }
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushPendingPush();
    });
    window.addEventListener('pagehide', () => flushPendingPush());
  } catch {
    // بيئة بدون document/window — تجاهل
  }
}

export async function bootstrapCapacitor() {
  registerFlushOnBackground();
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#050510' });
  } catch {
    // Native-only API; ignore on unsupported environments.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Ignore if splash already hidden.
  }

  try {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });
  } catch {
    // Ignore listener issues on unsupported runtimes.
  }
}

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function bootstrapCapacitor() {
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

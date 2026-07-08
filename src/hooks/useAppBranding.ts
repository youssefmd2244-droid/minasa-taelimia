/**
 * useAppBranding — بيطبّق اسم التطبيق وأيقونته (اللي ضبطهم الأدمن من
 * "الإعدادات") على عنوان تبويب المتصفح والفافيكون، ويسمع لأي تحديث
 * جديد فورًا (زي باقي بيانات لوحة الإدارة).
 *
 * ملحوظة مهمة: ده بيغيّر الاسم/الأيقونة بس *جوه المتصفح/الموقع نفسه*
 * (تبويب المتصفح، وأيقونة أي تثبيت PWA جديد على الشاشة الرئيسية من
 * دلوقتي فصاعدًا). أيقونة واسم التطبيق المثبّت فعلاً على هاتف المستخدم
 * (اللي شايفها تحت الأيقونة على الشاشة الرئيسية للأندرويد) متجمّعة جوه
 * حزمة APK/AAB وقت البناء ومش بتتغيّر بتحديث بيانات زي ده — محتاجة
 * تحديث حقيقي للتطبيق نفسه (راجع تنويه SettingsTab في AdminDashboard.tsx).
 */
import { useEffect } from 'react';
import { getBridgedBranding, subscribeAdminData } from '../lib/adminBridge';

const DEFAULT_TITLE = document.title;
const DEFAULT_FAVICON = '/favicon.png';

function applyBranding() {
  const { appName, appIconUrl } = getBridgedBranding();
  document.title = appName ? `${appName} — منصة تعليمية متكاملة` : DEFAULT_TITLE;
  const faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (faviconLink) faviconLink.href = appIconUrl || DEFAULT_FAVICON;
  const appleTouchLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (appleTouchLink && appIconUrl) appleTouchLink.href = appIconUrl;
}

export function useAppBranding() {
  useEffect(() => {
    applyBranding();
    return subscribeAdminData(applyBranding);
  }, []);
}

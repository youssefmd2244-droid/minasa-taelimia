/**
 * useSiteText / useSiteImage — بتقرا تعديل الأدمن (لو موجود) لنص أو صورة
 * معينة من تبويب "نصوص والصور"، وبترجع القيمة الأصلية (fallback) لو
 * الأدمن ما عدّلش حاجة. بتستمع لأي تغيير فوري من لوحة الإدارة (نفس
 * التاب أو تاب/جهاز تاني) عبر subscribeAdminData، بالظبط زي باقي
 * البيانات (أقسام/محتوى/إلخ).
 */
import { useEffect, useState } from 'react';
import { getBridgedSiteContent, subscribeAdminData } from '../lib/adminBridge';

export function useSiteText(key: string, fallback: string): string {
  const [value, setValue] = useState<string>(() => getBridgedSiteContent().texts[key] ?? fallback);
  useEffect(() => {
    const read = () => setValue(getBridgedSiteContent().texts[key] ?? fallback);
    read();
    return subscribeAdminData(read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback]);
  return value;
}

export function useSiteImage(key: string, fallback: string): string {
  const [value, setValue] = useState<string>(() => getBridgedSiteContent().images[key] ?? fallback);
  useEffect(() => {
    const read = () => setValue(getBridgedSiteContent().images[key] ?? fallback);
    read();
    return subscribeAdminData(read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback]);
  return value;
}

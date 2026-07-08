/**
 * useGalleryCourses — بيرجّع كروت "مكتبة المواد الدراسية" (معرض الكورسات
 * في الصفحة الرئيسية، CoursesGallerySection) بنفس شكل GalleryItem اللي
 * بيفهمه CircularGallery.
 *
 * قبل كده كانت الكروت دي ثابتة في الكود (EDUCATIONAL_COURSES في
 * circular-gallery.tsx) ومفيش أي طريقة لتغييرها إلا بتعديل الكود نفسه.
 * دلوقتي بقت جزء من بيانات لوحة الإدارة (tab "مكتبة المواد الدراسية")،
 * وبتتزامن تلقائيًا لكل المستخدمين بنفس آلية useSections/useContent
 * (adminBridge + Supabase realtime).
 *
 * لو الأدمن لسه ما فتحش اللوحة أبدًا على أي جهاز (يعني مفيش أي بيانات
 * متزامنة على الإطلاق)، بترجع لنفس الكروت الثمانية الافتراضية القديمة
 * (EDUCATIONAL_COURSES) عشان الصفحة الرئيسية متفضلش فاضية.
 */
import { useEffect, useState } from 'react';
import { getBridgedCourses, shouldUseAdminBridge, subscribeAdminData, type RawGalleryCourse } from '../lib/adminBridge';
import { EDUCATIONAL_COURSES, type GalleryItem } from '../components/ui/circular-gallery';

function toGalleryItem(c: RawGalleryCourse): GalleryItem {
  return {
    title: c.title,
    subtitle: c.subtitle,
    badge: c.badge,
    photo: { url: c.imageUrl, text: c.title, pos: 'center' },
  };
}

function getCurrentCourses(): GalleryItem[] {
  if (shouldUseAdminBridge()) {
    const bridged = getBridgedCourses();
    if (bridged.length) return bridged.map(toGalleryItem);
  }
  return EDUCATIONAL_COURSES;
}

export function useGalleryCourses(): GalleryItem[] {
  const [items, setItems] = useState<GalleryItem[]>(getCurrentCourses);

  useEffect(() => {
    const unsubscribe = subscribeAdminData(() => setItems(getCurrentCourses()));
    return unsubscribe;
  }, []);

  return items;
}

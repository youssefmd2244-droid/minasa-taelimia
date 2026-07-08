import { motion } from 'framer-motion';
import { CircularGallery } from '../ui/circular-gallery';
import { useGalleryCourses } from '../../hooks/useGalleryCourses';

export default function CoursesGallerySection() {
  const courses = useGalleryCourses();
  return (
    // NOTE: intentionally NOT position:sticky / pinned-scroll — that pattern
    // was making the page feel "stuck" and unresponsive to touch scrolling
    // on mobile. The section now sits in normal document flow: the page
    // always scrolls through it freely, and the gallery rotates on its own
    // (auto-rotate + a light scroll-linked nudge) without ever blocking scroll.
    <section
      id="courses"
      className="relative w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: '100vh', padding: '80px 0', background: 'linear-gradient(180deg, #050510 0%, #0d0d24 50%, #050510 100%)', scrollMarginTop: '80px' }}
    >
      {/* Heading */}
      <motion.div className="text-center z-10 px-4 mb-8"
        initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <p className="text-xs text-white/30 tracking-widest uppercase mb-2">استكشف المواد</p>
        <h2 className="text-2xl font-black text-white">
          مكتبة <span style={{ color: '#f97316' }}>المواد الدراسية</span>
        </h2>
        <p className="text-xs text-white/40 mt-2">اضغط على أي كورس للتفاصيل</p>
      </motion.div>

      {/* Gallery */}
      <div className="w-full" style={{ height: '360px' }}>
        <CircularGallery
          items={courses}
          radius={320}
          autoRotateSpeed={0.012}
        />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #050510)' }} />
    </section>
  );
}

import { motion } from 'framer-motion';
import { CircularGallery, EDUCATIONAL_COURSES } from '../ui/circular-gallery';

export default function CoursesGallerySection() {
  return (
    <section style={{ height: '350vh', position: 'relative' }}>
      {/* Sticky container */}
      <div
        className="sticky top-0 w-full flex flex-col items-center justify-center overflow-hidden"
        style={{ height: '100vh', background: 'linear-gradient(180deg, #050510 0%, #0d0d24 50%, #050510 100%)' }}
      >
        {/* Heading */}
        <motion.div className="absolute top-16 text-center z-10 px-4"
          initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p className="text-xs text-white/30 tracking-widest uppercase mb-2">استكشف المواد</p>
          <h2 className="text-2xl font-black text-white">
            مكتبة <span style={{ color: '#f97316' }}>المواد الدراسية</span>
          </h2>
          <p className="text-xs text-white/40 mt-2">اسكرول للتدوير — اضغط على أي كورس</p>
        </motion.div>

        {/* Gallery */}
        <div className="w-full" style={{ height: '360px' }}>
          <CircularGallery
            items={EDUCATIONAL_COURSES}
            radius={320}
            autoRotateSpeed={0.012}
          />
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #050510)' }} />
      </div>
    </section>
  );
}

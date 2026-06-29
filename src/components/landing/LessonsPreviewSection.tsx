/**
 * LessonsPreviewSection — wraps `LessonList` with a real section shell
 * (heading + container + entrance motion) so the per-item download
 * control isn't a disconnected component nobody actually renders.
 */
import { motion } from 'framer-motion';
import LessonList from './LessonList';

export default function LessonsPreviewSection() {
  return (
    <section
      style={{
        background: '#0a0a14',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: '32px', textAlign: 'center' }}
        >
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            دروس مختارة
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            بعض الدروس متاحة للتنزيل — تظهر علامة التنزيل فقط على الدروس التي يحددها المعلّم.
          </p>
        </motion.div>

        <LessonList limit={6} />
      </div>
    </section>
  );
}

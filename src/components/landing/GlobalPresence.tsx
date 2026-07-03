import { motion } from 'framer-motion';
import Globe from '../ui/globe';

export default function GlobalPresence() {
  return (
    <section className="py-20 px-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%)' }}>
      <div className="max-w-xl mx-auto">
        {/* Heading */}
        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <p className="text-xs text-white/30 tracking-widest uppercase mb-3">انتشارنا العالمي</p>
          <motion.h2
            className="text-3xl font-black text-white leading-tight inline-block"
            animate={{
              rotateX: [0, 6, 0, -6, 0],
              textShadow: [
                '0 0 6px rgba(249,115,22,0.15)',
                '0 0 24px rgba(249,115,22,0.9)',
                '0 0 24px rgba(232,130,180,0.85)',
                '0 0 24px rgba(110,181,255,0.85)',
                '0 0 24px rgba(107,191,122,0.85)',
                '0 0 6px rgba(249,115,22,0.15)',
              ],
            }}
            transition={{
              rotateX: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
              textShadow: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ transformStyle: 'preserve-3d', perspective: '600px', backfaceVisibility: 'hidden' }}
          >
            طلاب من كل<br />
            <span style={{ color: '#f97316' }}>أنحاء العالم العربي</span>
          </motion.h2>
        </motion.div>

        {/* Globe */}
        <motion.div className="flex justify-center mb-12"
          initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.9, type: 'spring', bounce: 0.35 }}>
          <Globe size={180} autoSpeed={28} mouseTracking={true} />
        </motion.div>

        {/* Total students */}
        <motion.div className="text-center mt-2"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.4 }}>
          <p className="text-5xl font-black text-white">+32,000</p>
          <p className="text-sm text-white/40 mt-1">طالب نشط على المنصة</p>
        </motion.div>
      </div>
    </section>
  );
}

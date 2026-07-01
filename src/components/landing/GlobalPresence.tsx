import { motion } from 'framer-motion';
import Globe from '../ui/globe';

const COUNTRIES = [
  { flag: '🇪🇬', name: 'مصر',    students: '+12k' },
  { flag: '🇸🇦', name: 'السعودية', students: '+8k' },
  { flag: '🇦🇪', name: 'الإمارات', students: '+5k' },
  { flag: '🇰🇼', name: 'الكويت',  students: '+3k' },
  { flag: '🇶🇦', name: 'قطر',    students: '+2k' },
  { flag: '🇯🇴', name: 'الأردن',  students: '+1.5k' },
];

export default function GlobalPresence() {
  return (
    <section className="py-20 px-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%)' }}>
      <div className="max-w-xl mx-auto">
        {/* Heading */}
        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <p className="text-xs text-white/30 tracking-widest uppercase mb-3">انتشارنا العالمي</p>
          <h2 className="text-3xl font-black text-white leading-tight">
            طلاب من كل<br />
            <span style={{ color: '#f97316' }}>أنحاء العالم العربي</span>
          </h2>
        </motion.div>

        {/* Globe */}
        <motion.div className="flex justify-center mb-12"
          initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.9, type: 'spring', bounce: 0.35 }}>
          <Globe size={180} autoSpeed={28} mouseTracking={true} />
        </motion.div>

        {/* Country cards */}
        <div className="grid grid-cols-3 gap-3">
          {COUNTRIES.map((c, i) => (
            <motion.div key={c.name}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.06)' }}>
              <motion.span className="text-3xl select-none"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}>
                {c.flag}
              </motion.span>
              <span className="text-xs text-white/60 font-medium">{c.name}</span>
              <span className="text-xs text-orange-400 font-bold">{c.students}</span>
            </motion.div>
          ))}
        </div>

        {/* Total students */}
        <motion.div className="text-center mt-10"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.6 }}>
          <p className="text-5xl font-black text-white">+32,000</p>
          <p className="text-sm text-white/40 mt-1">طالب نشط على المنصة</p>
        </motion.div>
      </div>
    </section>
  );
}

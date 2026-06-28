import { motion } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import GlobalPresence from './GlobalPresence';

const WHATSAPP_NUMBERS = ['201094555299', '201102293350'];
const PHONE_NUMBER = '01094555299';

export default function DeveloperCredit() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full py-16 px-4 sm:px-8" style={{
      background: 'linear-gradient(180deg, #050510 0%, #0a0a1a 100%)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          className="inline-block mb-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="rounded-2xl px-8 py-6 flex flex-col items-center relative overflow-hidden" style={{
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  'inset 0 0 30px rgba(255,0,100,0.15), inset 0 0 60px rgba(0,255,100,0.08)',
                  'inset 0 0 30px rgba(0,255,100,0.15), inset 0 0 60px rgba(0,100,255,0.08)',
                  'inset 0 0 30px rgba(0,100,255,0.15), inset 0 0 60px rgba(255,0,100,0.08)',
                  'inset 0 0 30px rgba(255,0,100,0.15), inset 0 0 60px rgba(0,255,100,0.08)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span className="text-2xl font-bold tracking-widest text-white relative z-10"
              style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 900 }}
              animate={{ rotateY: [0, 8, 0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              {t('dev_brand')}
            </motion.span>
            <p className="mt-4 text-xs sm:text-sm text-white/40 max-w-lg leading-relaxed relative z-10">{t('dev_desc')}</p>
          </div>
        </motion.div>

        <motion.div className="flex flex-wrap items-center justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.7 }}>
          <motion.a href={`tel:${PHONE_NUMBER}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(107,191,122,0.15)', color: '#6BBF7A', border: '1px solid rgba(107,191,122,0.2)' }}
            whileHover={{ rotateY: 10, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Phone size={16} /> {t('dev_call')}
          </motion.a>
          {WHATSAPP_NUMBERS.map((num, i) => (
            <motion.a key={i} href={`https://wa.me/${num}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}
              whileHover={{ rotateY: -10, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <MessageCircle size={16} /> {t('dev_whatsapp')} {i + 1}
            </motion.a>
          ))}
        </motion.div>

        <GlobalPresence />
      </div>
    </section>
  );
}

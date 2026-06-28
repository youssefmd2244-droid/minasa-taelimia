import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

const COUNTRIES = [
  { flag: '🇪🇬', nameKey: 'presence_egypt' as const, animated: true },
  { flag: '🇸🇦', nameKey: 'presence_saudi' as const, animated: false },
  { flag: '🇦🇪', nameKey: 'presence_uae' as const, animated: true },
  { flag: '🇰🇼', nameKey: 'presence_kuwait' as const, animated: true },
  { flag: '🇶🇦', nameKey: 'presence_qatar' as const, animated: true },
  { flag: '🇬🇷', nameKey: 'presence_greece' as const, animated: true },
];

export default function GlobalPresence() {
  const { t } = useLanguage();

  return (
    <motion.div className="mt-10"
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.7 }}>
      <h3 className="text-sm text-white/40 mb-6 text-center">{t('presence_title')}</h3>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {COUNTRIES.map((country, i) => (
          <motion.div key={country.nameKey}
            className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}>
            {country.animated ? (
              <motion.span className="text-3xl select-none"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
              >{country.flag}</motion.span>
            ) : (
              <span className="text-3xl select-none">{country.flag}</span>
            )}
            <span className="text-xs text-white/50">{t(country.nameKey)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

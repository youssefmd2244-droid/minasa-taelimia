import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from './LanguageContext';

const LANGUAGES = [
  { code: 'ar' as Language, label: 'العربية', flag: '🇸🇦' },
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'egy' as Language, label: 'المصري', flag: '🇪🇬' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        title="تغيير اللغة / Change Language"
      >
        <Globe size={16} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div
            className="absolute z-50 mt-2 rounded-xl overflow-hidden shadow-lg min-w-[160px]"
            style={{
              background: 'rgba(20, 20, 40, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              right: '0',
            }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  language === lang.code ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
                }`}
                style={{
                  direction: lang.code === 'en' ? 'ltr' : 'rtl',
                  textAlign: lang.code === 'en' ? 'left' : 'right',
                }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
                {language === lang.code && (
                  <span className="mr-auto ml-auto text-xs text-green-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * LangSwitcher — زرار تغيير اللغة يظهر في الـ Nav والإعدادات
 */
import { useLang } from '../lib/useLang';
import type { Lang } from '../lib/i18n';

const OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: 'ar',  label: 'العربية',     flag: '🇸🇦' },
  { value: 'en',  label: 'English',     flag: '🇬🇧' },
  { value: 'egy', label: 'مصري',        flag: '🇪🇬' },
];

export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();

  if (compact) {
    // زرار صغير يدور بين اللغات
    const currentIdx = OPTIONS.findIndex((o) => o.value === lang);
    const next = OPTIONS[(currentIdx + 1) % OPTIONS.length];
    return (
      <button
        onClick={() => setLang(next.value)}
        title={next.label}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          padding: '6px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background 200ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
        }}
      >
        {OPTIONS.find((o) => o.value === lang)?.flag}
        {OPTIONS.find((o) => o.value === lang)?.label}
      </button>
    );
  }

  // قائمة كاملة (للإعدادات)
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLang(opt.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            border: lang === opt.value
              ? '1px solid #f97316'
              : '1px solid rgba(255,255,255,0.15)',
            background: lang === opt.value
              ? 'rgba(249,115,22,0.15)'
              : 'rgba(255,255,255,0.05)',
            color: lang === opt.value ? '#f97316' : 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            fontWeight: lang === opt.value ? 700 : 400,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {opt.flag} {opt.label}
        </button>
      ))}
    </div>
  );
}

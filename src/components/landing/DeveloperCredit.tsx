import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';

// RGB color cycle for the logo glow
const RGB_COLORS = [
  'rgba(249,115,22,0.7)',   // orange
  'rgba(110,181,255,0.7)',  // blue
  'rgba(107,191,122,0.7)', // green
  'rgba(232,130,180,0.7)', // pink
  'rgba(249,115,22,0.7)',   // back to orange
];

const CONTACT_LINKS = [
  {
    icon: <MessageCircle size={18} />,
    label: 'واتساب 1',
    href: 'https://wa.me/201094555299',
    color: '#25D366',
    hoverBg: 'rgba(37,211,102,0.12)',
    hoverBorder: 'rgba(37,211,102,0.4)',
  },
  {
    icon: <MessageCircle size={18} />,
    label: 'واتساب 2',
    href: 'https://wa.me/201102293350',
    color: '#25D366',
    hoverBg: 'rgba(37,211,102,0.12)',
    hoverBorder: 'rgba(37,211,102,0.4)',
  },
  {
    icon: <Phone size={18} />,
    label: 'اتصال مباشر',
    href: 'tel:01094555299',
    color: '#6EB5FF',
    hoverBg: 'rgba(110,181,255,0.12)',
    hoverBorder: 'rgba(110,181,255,0.4)',
  },
];

function ContactButton({
  link,
}: {
  link: (typeof CONTACT_LINKS)[0];
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={link.href}
      target={link.href.startsWith('http') ? '_blank' : undefined}
      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={
        hovered
          ? { rotateY: 6, scale: 1.04 }
          : { rotateY: 0, scale: 1 }
      }
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '12px',
        background: hovered ? link.hoverBg : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? link.hoverBorder : 'rgba(255,255,255,0.1)'}`,
        color: hovered ? link.color : 'rgba(255,255,255,0.6)',
        fontSize: '13px',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'background 200ms ease, border-color 200ms ease, color 200ms ease',
        cursor: 'pointer',
        fontFamily: "'Cairo', 'Inter', sans-serif",
        boxShadow: hovered ? `0 4px 20px ${link.hoverBg}` : 'none',
        transformStyle: 'preserve-3d',
        perspective: '600px',
      }}
    >
      <span style={{ color: link.color }}>{link.icon}</span>
      {link.label}
    </motion.a>
  );
}

export default function DeveloperCredit() {
  return (
    <section
      style={{
        background: '#07070f',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '56px 40px',
        fontFamily: "'Cairo', 'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0',
      }}
    >
      {/* Separator line */}
      <div
        style={{
          width: '60px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)',
          marginBottom: '36px',
        }}
      />

      {/* ICON CODE logo with RGB pulse glow */}
      <motion.div
        animate={{
          boxShadow: RGB_COLORS.map((c) => `0 0 28px ${c}, 0 0 56px ${c.replace('0.7', '0.2')}`),
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 24px',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '20px',
        }}
      >
        {/* Simple code brackets as part of logo feel */}
        <span
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: '22px',
            fontWeight: 400,
            letterSpacing: '0.1em',
            color: 'white',
          }}
        >
          {'< '}
          <span
            style={{
              background: 'linear-gradient(90deg, #f97316, #6EB5FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ICON CODE
          </span>
          {' />'}
        </span>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.75,
          maxWidth: '480px',
          marginBottom: '32px',
          direction: 'rtl',
        }}
      >
        تم تطوير هذه المنصة بواسطة{' '}
        <span style={{ color: '#f97316', fontWeight: 600 }}>ICON CODE</span>
        {' '}— حلول برمجية متكاملة للتعليم الرقمي.
      </motion.p>

      {/* Contact buttons — in-layout, not floating */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        {CONTACT_LINKS.map((link) => (
          <ContactButton key={link.label} link={link} />
        ))}
      </motion.div>

      {/* International presence — Saudi Arabia's flag is intentionally
          static while every other flag floats; see COUNTRIES below. */}
      <GlobalPresence />
    </section>
  );
}

const COUNTRIES: { flag: string; name: string; animated: boolean }[] = [
  { flag: '🇪🇬', name: 'مصر', animated: true },
  { flag: '🇸🇦', name: 'السعودية', animated: false }, // ثابت دائماً — تمييز متعمد
  { flag: '🇦🇪', name: 'الإمارات', animated: true },
  { flag: '🇰🇼', name: 'الكويت', animated: true },
  { flag: '🇶🇦', name: 'قطر', animated: true },
  { flag: '🇬🇷', name: 'اليونان', animated: true },
];

function GlobalPresence() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginTop: '40px' }}
    >
      <h3 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', textAlign: 'center' }}>
        نفّذنا مشاريع في
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
        {COUNTRIES.map((country, i) => (
          <motion.div
            key={country.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'default',
            }}
          >
            {country.animated ? (
              <motion.span
                style={{ fontSize: '28px', userSelect: 'none' }}
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
              >
                {country.flag}
              </motion.span>
            ) : (
              // علم السعودية يبقى ثابتاً تماماً — بدون أي transform متحرك
              <span style={{ fontSize: '28px', userSelect: 'none' }}>{country.flag}</span>
            )}
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{country.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

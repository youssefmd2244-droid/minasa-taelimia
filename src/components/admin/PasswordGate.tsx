import { useState, useRef, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PasswordGateProps {
  /** The live admin password (may have been changed via Settings) */
  currentPassword: string;
  onSuccess: () => void;
}

export default function PasswordGate({ currentPassword, onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentPassword) {
      setError('');
      onSuccess();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setError(`Incorrect password.${next >= 3 ? " Hint: It's a date." : ''}`);
      setPassword('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div
      className="vh-full"
      style={{
        background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background mesh */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(249,115,22,0.08), transparent)',
        }}
      />

      {/* Floating ambient orbs */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -24, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.5,
          }}
          style={{
            position: 'absolute',
            width: `${180 + i * 120}px`,
            height: `${180 + i * 120}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(249,115,22,${0.06 - i * 0.01}) 0%, transparent 70%)`,
            top: `${20 + i * 25}%`,
            left: `${10 + i * 35}%`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Gate card */}
      <motion.div
        animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={shake ? { duration: 0.45, ease: 'easeOut' } : {}}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '48px 40px',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 10,
          margin: '0 16px',
        }}
      >
        {/* Icon */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(255,0,128,0.4)',
              '0 0 20px rgba(128,0,255,0.4)',
              '0 0 20px rgba(0,128,255,0.4)',
              '0 0 20px rgba(249,115,22,0.4)',
              '0 0 20px rgba(255,0,128,0.4)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.1))',
            border: '1px solid rgba(249,115,22,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
          }}
        >
          <Lock size={28} color="#f97316" />
        </motion.div>

        <h1
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: '28px',
            fontWeight: 400,
            color: 'white',
            letterSpacing: '0.04em',
            marginBottom: '8px',
          }}
        >
          ADMIN ACCESS
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '36px',
            lineHeight: 1.6,
          }}
        >
          This area is restricted. Enter the admin password to continue.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Password input */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '14px 48px 14px 18px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: showPassword ? '0' : '0.2em',
                transition: 'border-color 200ms ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                if (!error)
                  (e.target as HTMLInputElement).style.borderColor =
                    'rgba(249,115,22,0.5)';
              }}
              onBlur={(e) => {
                if (!error)
                  (e.target as HTMLInputElement).style.borderColor =
                    'rgba(255,255,255,0.15)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={!password}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: password
                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                : 'rgba(255,255,255,0.06)',
              border: 'none',
              color: password ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: password ? 'pointer' : 'not-allowed',
              transition: 'all 300ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: password
                ? '0 12px 40px rgba(249,115,22,0.35)'
                : 'none',
            }}
          >
            <ShieldCheck size={18} />
            Access Dashboard
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          Unauthorized access is prohibited.
        </p>
      </motion.div>
    </div>
  );
}

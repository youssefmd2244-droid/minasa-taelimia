import React, { useRef, useEffect, useState } from 'react';

interface GlobeProps {
  /** حجم الكرة (px) — default 200 */
  size?: number;
  /** سرعة الدوران التلقائي */
  autoSpeed?: number;
  /** تفعيل تتبع الماوس */
  mouseTracking?: boolean;
}

const Globe: React.FC<GlobeProps> = ({ size = 200, autoSpeed = 30, mouseTracking = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!mouseTracking) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalize -1 to 1
      const nx = (e.clientX - cx) / (window.innerWidth / 2);
      const ny = (e.clientY - cy) / (window.innerHeight / 2);
      setTilt({ x: ny * -18, y: nx * 18 });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseTracking]);

  // Reset tilt on mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <>
      <style>{`
        @keyframes earthRotate {
          0%   { background-position: 0 center; }
          100% { background-position: ${size * 1.6}px center; }
        }
        @keyframes globeTwinkle-a { 0%,100% { opacity:0.1; } 50% { opacity:0.9; } }
        @keyframes globeTwinkle-b { 0%,100% { opacity:0.2; } 50% { opacity:1; } }
        @keyframes globePulse {
          0%,100% { box-shadow: 0 0 ${size * 0.14}px rgba(99,183,255,0.25), 0 0 ${size * 0.28}px rgba(99,183,255,0.1); }
          50%     { box-shadow: 0 0 ${size * 0.22}px rgba(99,183,255,0.45), 0 0 ${size * 0.44}px rgba(99,183,255,0.2); }
        }
      `}</style>

      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          // Outer 3D tilt — follows mouse globally
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: isHovered ? 'transform 0.05s linear' : 'transform 0.8s cubic-bezier(0.22,1,0.36,1)',
          willChange: 'transform',
        }}
      >
        {/* Atmosphere glow ring */}
        <div
          style={{
            position: 'absolute',
            width: size + size * 0.12,
            height: size + size * 0.12,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,183,255,0.08) 0%, rgba(99,183,255,0.04) 50%, transparent 75%)',
            animation: 'globePulse 3s ease-in-out infinite',
          }}
        />

        {/* The globe itself */}
        <div
          style={{
            position: 'relative',
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
            backgroundSize: `${size * 1.6}px ${size}px`,
            backgroundPosition: 'left center',
            animation: `earthRotate ${autoSpeed}s linear infinite`,
            boxShadow: `
              0 0 ${size * 0.08}px rgba(195,244,255,0.4) inset,
              ${size * 0.06}px ${size * 0.008}px ${size * 0.1}px rgba(0,0,0,1) inset,
              -${size * 0.096}px -${size * 0.008}px ${size * 0.136}px rgba(195,244,255,0.6) inset,
              ${size}px 0 ${size * 0.176}px rgba(0,0,0,0.4) inset,
              ${size * 0.6}px 0 ${size * 0.152}px rgba(0,0,0,0.67) inset
            `,
          }}
        >
          {/* Star particles */}
          {[
            { left: '-8%', top: '8%',  size: 2, anim: 'globeTwinkle-a 3s infinite' },
            { left: '-16%', top: '30%', size: 2, anim: 'globeTwinkle-b 2s infinite' },
            { left: '140%', top: '36%', size: 2, anim: 'globeTwinkle-a 4s infinite' },
            { left: '80%', top: '116%', size: 2, anim: 'globeTwinkle-b 3s infinite' },
            { left: '20%', top: '108%', size: 2, anim: 'globeTwinkle-a 1.5s infinite' },
            { left: '100%', top: '-20%', size: 2, anim: 'globeTwinkle-b 4s infinite' },
            { left: '116%', top: '24%',  size: 2, anim: 'globeTwinkle-a 2s infinite' },
          ].map((star, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: star.left, top: star.top,
              width: star.size, height: star.size,
              borderRadius: '50%',
              background: 'white',
              animation: star.anim,
            }} />
          ))}
        </div>
      </div>
    </>
  );
};

export default Globe;

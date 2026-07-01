import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export interface GalleryItem {
  title: string;
  subtitle?: string;
  photo: { url: string; text: string; pos?: string; };
  badge?: string;
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  radius?: number;
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 480, autoRotateSpeed = 0.015, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const scrollRafRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Pauses the rAF/scroll work entirely while the gallery is off-screen —
    // without this the auto-rotate loop below updates React state ~60x/sec
    // forever, even miles away from the viewport, which is a major cause of
    // main-thread jank (sluggish scrolling, slow app feel) on mobile.
    const visibleRef = useRef(false);

    // Merge the internally-needed ref with any ref forwarded by the parent.
    const setRefs = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => { visibleRef.current = entry.isIntersecting; },
        { threshold: 0.01 }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);

    useEffect(() => {
      const handleScroll = () => {
        if (!visibleRef.current) return; // skip all work while off-screen
        setIsScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        // rAF-throttle: only recompute once per paint instead of once per
        // scroll event (mobile browsers can fire dozens per frame).
        if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = requestAnimationFrame(() => {
          const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
          setRotation(scrollProgress * 360);
        });
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      };
    }, []);

    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling && visibleRef.current) setRotation(prev => prev + autoRotateSpeed);
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };
      animationFrameRef.current = requestAnimationFrame(autoRotate);
      return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [isScrolling, autoRotateSpeed]);

    const anglePerItem = 360 / items.length;

    return (
      <div
        ref={setRefs}
        role="region"
        aria-label="Educational Courses Gallery"
        className={cn('relative w-full h-full flex items-center justify-center', className)}
        style={{ perspective: '1600px' }}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{ transform: `rotateY(${rotation}deg)`, transformStyle: 'preserve-3d' }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.25, 1 - normalizedAngle / 180);
            const scale = Math.max(0.85, 1 - normalizedAngle / 360);

            return (
              <div
                key={i}
                role="group"
                aria-label={item.title}
                className="absolute"
                style={{
                  width: '200px', height: '270px',
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%', top: '50%',
                  marginLeft: '-100px', marginTop: '-135px',
                  opacity,
                  transition: 'opacity 0.3s linear',
                  scale: String(scale),
                }}
              >
                <div
                  className="relative w-full h-full rounded-2xl overflow-hidden group"
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(15,15,30,0.7)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: item.photo.pos || 'center' }}
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.9) 100%)' }} />
                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: '#f97316' }}>
                      {item.badge}
                    </div>
                  )}
                  {/* Text */}
                  <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                    <h2 className="text-base font-bold leading-tight">{item.title}</h2>
                    {item.subtitle && <p className="text-xs mt-1 opacity-70">{item.subtitle}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';
export { CircularGallery };

/* ─── Educational data for the gallery ─── */
export const EDUCATIONAL_COURSES: GalleryItem[] = [
  {
    title: 'رياضيات متقدمة',
    subtitle: 'المستوى الثالث · 24 درس',
    badge: 'جديد',
    photo: { url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80', text: 'رياضيات', pos: 'center' },
  },
  {
    title: 'الفيزياء والميكانيكا',
    subtitle: 'المستوى الثاني · 18 درس',
    photo: { url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80', text: 'فيزياء', pos: 'center' },
  },
  {
    title: 'الكيمياء التطبيقية',
    subtitle: 'المستوى الأول · 15 درس',
    badge: 'مميز',
    photo: { url: 'https://images.unsplash.com/photo-1532094349884-543559153ade?w=600&auto=format&fit=crop&q=80', text: 'كيمياء', pos: 'center' },
  },
  {
    title: 'اللغة العربية',
    subtitle: 'جميع المستويات · 30 درس',
    photo: { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', text: 'لغة عربية', pos: 'center' },
  },
  {
    title: 'علوم الحاسب',
    subtitle: 'المستوى الأول · 22 درس',
    badge: 'شعبي',
    photo: { url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&auto=format&fit=crop&q=80', text: 'علوم حاسب', pos: 'center' },
  },
  {
    title: 'الأحياء والبيولوجيا',
    subtitle: 'المستوى الثاني · 20 درس',
    photo: { url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=80', text: 'أحياء', pos: 'center' },
  },
  {
    title: 'الجغرافيا والتاريخ',
    subtitle: 'المستوى الأول · 12 درس',
    photo: { url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80', text: 'جغرافيا', pos: 'center' },
  },
  {
    title: 'اللغة الإنجليزية',
    subtitle: 'جميع المستويات · 28 درس',
    badge: 'جديد',
    photo: { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=80', text: 'إنجليزي', pos: 'center' },
  },
];

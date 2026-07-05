import { useState } from 'react';
import {
  ArrowRight,
  Star,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';

// ========== SECTION 1: Academy Hero ==========
function AcademyHero() {
  const [hoverCTA, setHoverCTA] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050510 0%, #0a0a20 40%, #050510 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/*
        خلفية متدرجة بـ CSS فقط (بدون WebGL) — أداء أعلى بكتير على الموبايل،
        بنفس الإحساس البصري (توهج برتقالي متحرك ببطء).
      */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 30% 20%, rgba(249,115,22,0.12) 0%, transparent 55%), radial-gradient(circle at 75% 70%, rgba(110,181,255,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Spacer to clear the fixed global nav */}
      <div style={{ height: '24px' }} />

      {/* Hero content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '60px 40px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* CTA top button */}
        <button
          onMouseEnter={() => setHoverCTA(true)}
          onMouseLeave={() => setHoverCTA(false)}
          onClick={() => {}}
          className="liquid-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '999px',
            marginBottom: '48px',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '13px',
            background: 'rgba(255,255,255,0.06)',
            transition: 'all 250ms ease',
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              display: 'inline-flex',
              flexDirection: 'column',
              height: '1.2em',
            }}
          >
            احجز حصة تجريبية مجانية
          </span>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 300ms ease',
              transform: hoverCTA ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            <ArrowRight size={10} strokeWidth={2.5} />
          </div>
        </button>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(2.5rem, 5.5vw, 5rem)',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: '820px',
            marginBottom: '48px',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          نصمّم تجربة تعليمية
          <br />
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>
            لكل طالب جاهز يتقن
          </span>
          <br />
          أي مادة، أونلاين.
        </h1>

        {/* CTA row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {/* Orange button */}
          <a
            href="#start"
            style={{
              padding: '14px 32px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 12px 40px rgba(249,115,22,0.4)',
              transition: 'all 250ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                '0 16px 50px rgba(249,115,22,0.6)';
              (e.currentTarget as HTMLAnchorElement).style.transform =
                'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                '0 12px 40px rgba(249,115,22,0.4)';
              (e.currentTarget as HTMLAnchorElement).style.transform =
                'translateY(0)';
            }}
          >
            ابدأ مجانًا
            <ArrowRight size={16} style={{ transform: 'scaleX(-1)' }} />
          </a>

          {/* Accredited Curriculum badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Starburst SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z"
                fill="#f97316"
                stroke="#ea580c"
                strokeWidth="0.5"
              />
            </svg>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              منهج معتمد
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#f97316',
                background: 'rgba(249,115,22,0.15)',
                padding: '2px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(249,115,22,0.3)',
              }}
            >
              موثّق
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== SECTION 2: Teaching Philosophy ==========
function TeachingPhilosophy() {
  const features = [
    { icon: <BookOpen size={18} />, text: 'منهج منظم لكل مستوى' },
    { icon: <Users size={18} />, text: 'مدرّسون متخصصون وأسئلة مباشرة' },
    { icon: <Award size={18} />, text: 'شهادات حقيقية عند إتمام المستوى' },
    { icon: <TrendingUp size={18} />, text: 'متابعة تقدّم كل طالب' },
  ];

  return (
    <div
      style={{
        background: '#ffffff',
        padding: '100px 40px',
        color: '#0a0a0a',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center',
        }}
      >
        {/* Left — text */}
        <div>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#f0f0f0',
              marginBottom: '28px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#555' }}>
              فلسفتنا في التدريس
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
              fontWeight: 700,
              color: '#0a0a0a',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            تعليم قائم على الإتقان، بنتائج حقيقية في كل مادة.
          </h2>

          <p
            style={{
              fontSize: '16px',
              color: '#555',
              lineHeight: 1.75,
              marginBottom: '36px',
            }}
          >
            من خلال دروس منظمة وتدريب عملي ومتابعة مستمرة، بنساعد كل طالب يوصل لأقصى إمكانياته الدراسية.
          </p>

          {/* Feature list */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '40px',
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                className={`reveal-3d-left reveal-delay-${(i % 3) + 1}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#333',
                  fontSize: '14px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#f97316',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>

          <a
            href="#about"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '13px 28px',
              borderRadius: '999px',
              background: '#0a0a0a',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 250ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#222';
              (e.currentTarget as HTMLAnchorElement).style.transform =
                'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#0a0a0a';
              (e.currentTarget as HTMLAnchorElement).style.transform =
                'translateY(0)';
            }}
          >
            تعرف على أسلوبنا في التدريس
            <ArrowRight size={16} style={{ transform: 'scaleX(-1)' }} />
          </a>
        </div>

        {/* Right — images grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {/* Large image */}
          <div
            style={{
              gridColumn: '1 / -1',
              aspectRatio: '900/600',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#e0e0e0',
            }}
          >
            <img
              src="https://images.pexels.com/photos/7777691/pexels-photo-7777691.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"
              alt="Students studying"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Two smaller images */}
          {[
            'https://images.pexels.com/photos/9159039/pexels-photo-9159039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600',
            'https://images.pexels.com/photos/8926887/pexels-photo-8926887.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600',
          ].map((src, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '3/2',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#e0e0e0',
              }}
            >
              <img
                src={src}
                alt="Classroom"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== SECTION 3: Featured Courses ==========
const FEATURED_TYPE_TAG: Record<string, string> = {
  video: 'فيديو مميز', pdf: 'ملف PDF', image: 'صورة', text: 'محتوى نصي',
  word: 'مستند Word', excel: 'جدول بيانات', powerpoint: 'عرض تقديمي',
  zip: 'ملف مضغوط', audio: 'تسجيل صوتي',
};

const FEATURED_VISUAL_THEMES = [
  { gradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%)', accent: '#7c3aed', aspectRatio: '329/246', circleSize: 148, emoji: '📐' },
  { gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0a2010 100%)', accent: '#16a34a', aspectRatio: '1/1', circleSize: 168, emoji: '✍️' },
];

function FeaturedCourses() {
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);
  const { items } = useContent();

  // بيعرض أول عنصرين اتحددوا "مميز" فعلاً من لوحة التحكم — مش محتوى
  // وهمي ثابت. لو الأدمن لسه مامختارش أي حاجة مميزة، بيظهر بدل كده
  // كارت إرشادي بسيط بيوضح إزاي يفعّلها، بدل ما يفضل شكل تجريبي.
  const featured = items.filter((i) => i.is_featured).slice(0, 2);
  const hovers = [hover1, hover2];
  const setHovers = [setHover1, setHover2];

  const courses = featured.length > 0
    ? featured.map((item, i) => ({
        id: item.id,
        title: item.title,
        tag: FEATURED_TYPE_TAG[item.type] ?? 'محتوى مميز',
        description: item.content_body || 'من أحدث المحتوى المميز المتاح على المنصة.',
        ...FEATURED_VISUAL_THEMES[i % FEATURED_VISUAL_THEMES.length],
        hovered: hovers[i],
        setHovered: setHovers[i],
      }))
    : [
        {
          id: -1, title: 'مفيش محتوى مميز لسه', tag: 'من لوحة التحكم',
          description: 'حدد أي عنصر بعلامة "مميز" (⭐) من تبويب المحتوى في لوحة التحكم، وهيظهر هنا تلقائيًا.',
          ...FEATURED_VISUAL_THEMES[0], hovered: hover1, setHovered: setHover1,
        },
        {
          id: -2, title: 'محتوى جديد كل فترة', tag: 'تحديث مستمر',
          description: 'كل ما تضاف مواد جديدة وتتحدد كمميزة، هتلاقيها هنا فورًا لكل الطلاب.',
          ...FEATURED_VISUAL_THEMES[1], hovered: hover2, setHovered: setHover2,
        },
      ];

  return (
    <div
      style={{
        background: '#F5F5F5',
        padding: '100px 40px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '60px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#0a0a0a',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {courses.length}
              </span>
              <span
                style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}
              >
                أفضل تقييمات الطلاب
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 700,
                color: '#0a0a0a',
                lineHeight: 1.08,
                letterSpacing: '-0.04em',
              }}
            >
              محتوى مميز
            </h2>
          </div>

          <a
            href="#courses"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '999px',
              background: '#0a0a0a',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 250ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#333';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#0a0a0a';
            }}
          >
            عرض كل الأقسام
            <ArrowRight size={14} style={{ transform: 'scaleX(-1)' }} />
          </a>
        </div>

        {/* Course cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
          }}
        >
          {courses.map((course, ci) => (
            <div
              key={course.id}
              className={`reveal-3d reveal-delay-${(ci % 3) + 1}`}
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                background: '#fff',
                boxShadow: course.hovered
                  ? '0 24px 64px rgba(0,0,0,0.15)'
                  : '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'box-shadow 400ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => course.setHovered(true)}
              onMouseLeave={() => course.setHovered(false)}
            >
              {/* Video/preview area */}
              <div
                style={{
                  aspectRatio: course.aspectRatio,
                  background: course.gradient,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Floating emoji icon */}
                <span
                  style={{
                    fontSize: '80px',
                    opacity: course.hovered ? 0.3 : 0.5,
                    transition: 'opacity 400ms ease',
                    userSelect: 'none',
                  }}
                >
                  {course.emoji}
                </span>

                {/* Hover circle */}
                <div
                  style={{
                    position: 'absolute',
                    width: course.hovered ? `${course.circleSize}px` : '0px',
                    height: course.hovered ? `${course.circleSize}px` : '0px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'width 400ms cubic-bezier(0.4,0,0.2,1), height 400ms cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0a0a0a',
                      textAlign: 'center',
                      opacity: course.hovered ? 1 : 0,
                      transition: 'opacity 200ms ease 200ms',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View course
                  </span>
                </div>

                {/* Tag */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}
                >
                  {course.tag}
                </div>
              </div>

              {/* Card content */}
              <div style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#0a0a0a',
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {course.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
                  {course.description}
                </p>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill="#f97316"
                        color="#f97316"
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: course.accent,
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle size={14} />
                    معتمد
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== COMBINED EXPORT ==========
export default function AcademyShowcase() {
  return (
    <>
      <AcademyHero />
      <TeachingPhilosophy />
      <FeaturedCourses />
    </>
  );
}

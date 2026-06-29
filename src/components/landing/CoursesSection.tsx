import { useState } from 'react';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  ArrowRight,
  Play,
  Award,
} from 'lucide-react';

const COURSES = [
  {
    id: 1,
    title: 'Advanced Mathematics',
    titleAr: 'الرياضيات المتقدمة',
    instructor: 'Dr. Ahmed Hassan',
    level: 'Advanced',
    duration: '48 hours',
    students: '12,400',
    rating: 4.9,
    price: 'Free',
    tag: 'Most Popular',
    color: '#F4845F',
    emoji: '📐',
    topics: ['Calculus', 'Linear Algebra', 'Statistics'],
  },
  {
    id: 2,
    title: 'Biology & Life Sciences',
    titleAr: 'الأحياء وعلوم الحياة',
    instructor: 'Prof. Sara Al-Rashidi',
    level: 'Intermediate',
    duration: '36 hours',
    students: '8,900',
    rating: 4.8,
    price: 'Free',
    tag: 'New',
    color: '#6BBF7A',
    emoji: '🔬',
    topics: ['Cell Biology', 'Genetics', 'Ecology'],
  },
  {
    id: 3,
    title: 'Arabic Literature',
    titleAr: 'الأدب العربي',
    instructor: 'Dr. Fatima Al-Zahra',
    level: 'All Levels',
    duration: '24 hours',
    students: '15,600',
    rating: 5.0,
    price: 'Free',
    tag: 'Top Rated',
    color: '#E882B4',
    emoji: '📖',
    topics: ['Classical Poetry', 'Modern Prose', 'Grammar'],
  },
  {
    id: 4,
    title: 'Creative Arts & Design',
    titleAr: 'الفنون والتصميم',
    instructor: 'Ustad Omar Khalil',
    level: 'Beginner',
    duration: '30 hours',
    students: '6,300',
    rating: 4.7,
    price: 'Free',
    tag: 'Featured',
    color: '#6EB5FF',
    emoji: '🎨',
    topics: ['Drawing', 'Color Theory', 'Digital Art'],
  },
  {
    id: 5,
    title: 'Physics Fundamentals',
    titleAr: 'أساسيات الفيزياء',
    instructor: 'Dr. Khalid Mansour',
    level: 'Intermediate',
    duration: '40 hours',
    students: '10,200',
    rating: 4.8,
    price: 'Free',
    tag: '',
    color: '#9B8FFF',
    emoji: '⚛️',
    topics: ['Mechanics', 'Thermodynamics', 'Optics'],
  },
  {
    id: 6,
    title: 'Computer Science',
    titleAr: 'علوم الحاسوب',
    instructor: 'Eng. Rania Aziz',
    level: 'Beginner',
    duration: '52 hours',
    students: '18,700',
    rating: 4.9,
    price: 'Free',
    tag: 'Trending',
    color: '#FF9B6A',
    emoji: '💻',
    topics: ['Programming', 'Algorithms', 'Web Dev'],
  },
];

function CourseCard({ course }: { course: (typeof COURSES)[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 24px 60px rgba(0,0,0,0.15)'
          : '0 4px 16px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <div
        style={{
          height: '180px',
          background: `linear-gradient(135deg, ${course.color}20, ${course.color}40)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: '72px',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))',
            transform: hovered ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
            transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
            userSelect: 'none',
          }}
        >
          {course.emoji}
        </span>

        {/* Play button overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 300ms ease',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <Play size={20} fill="#0a0a0a" color="#0a0a0a" />
          </div>
        </div>

        {/* Tag badge */}
        {course.tag && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: course.color,
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {course.tag}
          </div>
        )}

        {/* Level badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.9)',
            color: '#333',
            fontSize: '10px',
            fontWeight: 600,
          }}
        >
          {course.level}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#0a0a0a',
            marginBottom: '4px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {course.title}
        </h3>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
          {course.titleAr}
        </p>

        {/* Topics */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '14px',
          }}
        >
          {course.topics.map((topic) => (
            <span
              key={topic}
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                background: `${course.color}15`,
                color: course.color,
                fontSize: '11px',
                fontWeight: 500,
                border: `1px solid ${course.color}30`,
              }}
            >
              {topic}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '14px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          {/* Instructor */}
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            <strong style={{ color: '#333' }}>By</strong> {course.instructor}
          </p>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#888',
                  fontSize: '12px',
                }}
              >
                <Clock size={12} />
                {course.duration}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#888',
                  fontSize: '12px',
                }}
              >
                <Users size={12} />
                {course.students}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Star size={12} fill="#f97316" color="#f97316" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
                {course.rating}
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            style={{
              width: '100%',
              marginTop: '14px',
              padding: '10px',
              borderRadius: '12px',
              background: hovered ? course.color : '#f5f5f5',
              color: hovered ? 'white' : '#333',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 300ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <BookOpen size={14} />
            Enroll Now — {course.price}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoursesSection() {
  const [filter, setFilter] = useState('All');
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filtered =
    filter === 'All'
      ? COURSES
      : COURSES.filter((c) => c.level === filter || c.level === 'All Levels');

  return (
    <section
      id="courses"
      style={{
        background: '#fafafa',
        padding: '100px 40px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '999px',
              background: '#f0f0f0',
              marginBottom: '24px',
            }}
          >
            <Award size={14} color="#f97316" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>
              Accredited & Free Courses
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              fontWeight: 700,
              color: '#0a0a0a',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '16px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Explore Our Curriculum
          </h2>

          <p
            style={{
              fontSize: '16px',
              color: '#666',
              lineHeight: 1.7,
              maxWidth: '520px',
              margin: '0 auto 36px',
            }}
          >
            Expert-crafted courses across all major subjects. Learn at your own
            pace with real certificates.
          </p>

          {/* Level filters */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  background: filter === level ? '#0a0a0a' : '#fff',
                  color: filter === level ? 'white' : '#555',
                  border: filter === level ? 'none' : '1px solid #e0e0e0',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 250ms ease',
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {/* View all CTA */}
        <div style={{ textAlign: 'center', marginTop: '56px' }}>
          <a
            href="#all-courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 36px',
              borderRadius: '999px',
              background: '#0a0a0a',
              color: 'white',
              fontSize: '15px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 250ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#333';
              (e.currentTarget as HTMLAnchorElement).style.transform =
                'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#0a0a0a';
              (e.currentTarget as HTMLAnchorElement).style.transform =
                'translateY(0)';
            }}
          >
            View All Courses
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}

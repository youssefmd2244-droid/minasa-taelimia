import { useState } from 'react';
import { Star, Users, BookOpen, ArrowRight } from 'lucide-react';
import { useLang } from '../../lib/useLang';
import { translations } from '../../lib/i18n';

const INSTRUCTORS = [
  { name: 'Dr. Ahmed Hassan', title: { ar: 'الرياضيات والتفاضل والتكامل', en: 'Mathematics & Calculus', egy: 'الرياضيات والتفاضل' }, rating: 4.9, students: '12,400', courses: 8, color: '#F4845F', emoji: '👨‍🏫', bio: { ar: 'دكتوراه في الرياضيات التطبيقية من جامعة القاهرة. 15 عاماً من التدريس المتميز.', en: 'PhD in Applied Mathematics from Cairo University. 15 years of teaching excellence.', egy: 'دكتوراه في الرياضيات التطبيقية من جامعة القاهرة. 15 سنة تدريس ممتاز.' } },
  { name: 'Prof. Sara Al-Rashidi', title: { ar: 'علوم الحياة والأحياء', en: 'Life Sciences & Biology', egy: 'علوم الحياة والبيولوجيا' }, rating: 4.8, students: '8,900', courses: 6, color: '#6BBF7A', emoji: '👩‍🔬', bio: { ar: 'باحثة ومعلمة شغوفة بجعل الأحياء في متناول جميع الطلاب.', en: 'Researcher and educator with passion for making biology accessible to all students.', egy: 'باحثة ومدرسة بتحب تخلي البيولوجيا سهلة لكل الطلاب.' } },
  { name: 'Dr. Fatima Al-Zahra', title: { ar: 'اللغة العربية وآدابها', en: 'Arabic Language & Literature', egy: 'اللغة العربية والأدب' }, rating: 5.0, students: '15,600', courses: 10, color: '#E882B4', emoji: '👩‍🏫', bio: { ar: 'خبيرة في الأدب العربي الكلاسيكي والتربية الحديثة. مؤلفة 3 كتب مدرسية.', en: 'Expert in classical Arabic literature and modern pedagogy. Author of 3 textbooks.', egy: 'متخصصة في الأدب العربي الكلاسيكي والتدريس الحديث. مؤلفة 3 كتب مدرسية.' } },
  { name: 'Ustad Omar Khalil', title: { ar: 'الفنون الجميلة والتصميم', en: 'Fine Arts & Design', egy: 'الفنون والتصميم' }, rating: 4.7, students: '6,300', courses: 5, color: '#6EB5FF', emoji: '🎨', bio: { ar: 'فنان ومعلم حائز على جوائز. يجعل الإبداع في متناول كل طالب.', en: 'Award-winning artist and educator. Making creativity accessible to every student.', egy: 'فنان ومدرس حاصل على جوائز. بيخلي الإبداع متاح لكل طالب.' } },
];

function InstructorCard({ instructor }: { instructor: typeof INSTRUCTORS[0] }) {
  const [hovered, setHovered] = useState(false);
  const { lang } = useLang();
  const t = translations.instructors;
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ borderRadius: '24px', overflow: 'hidden', background: '#fff', boxShadow: hovered ? '0 24px 60px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.06)', transform: hovered ? 'translateY(-8px)' : 'translateY(0)', transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer' }}>
      <div style={{ height: '140px', background: `linear-gradient(135deg, ${instructor.color}20, ${instructor.color}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '72px', transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 400ms ease' }}>{instructor.emoji}</span>
      </div>
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px', letterSpacing: '-0.02em' }}>{instructor.name}</h3>
        <p style={{ fontSize: '13px', color: instructor.color, fontWeight: 600, marginBottom: '12px' }}>{instructor.title[lang]}</p>
        <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '16px' }}>{instructor.bio[lang]}</p>
        <div style={{ display: 'flex', gap: '16px', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#555' }}><Star size={13} fill="#f97316" color="#f97316" /><strong style={{ color: '#333' }}>{instructor.rating}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#555' }}><Users size={13} />{instructor.students}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#555' }}><BookOpen size={13} />{instructor.courses} {t.courses[lang]}</div>
        </div>
      </div>
    </div>
  );
}

export default function InstructorsSection() {
  const { lang } = useLang();
  const t = translations.instructors;
  return (
    <section id="instructors" style={{ background: '#fff', padding: '100px 40px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: '#f0f0f0', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>{t.badge[lang]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {t.heading[lang]}<br /><span style={{ color: '#888' }}>{t.headingSub[lang]}</span>
            </h2>
            <a href="#all-instructors" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#0a0a0a', textDecoration: 'none', padding: '10px 22px', borderRadius: '999px', border: '1px solid #e0e0e0', transition: 'all 250ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#0a0a0a'; (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#0a0a0a'; }}>
              {t.viewAll[lang]}<ArrowRight size={14} />
            </a>
          </div>
        </div>
        <div className="reveal-3d" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
          {INSTRUCTORS.map((instructor) => <InstructorCard key={instructor.name} instructor={instructor} />)}
        </div>
      </div>
    </section>
  );
}

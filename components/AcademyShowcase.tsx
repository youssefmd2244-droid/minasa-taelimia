import { useState } from 'react';
import { Play, ArrowLeft, ExternalLink, Star, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const COURSES = [
  { id: 1, title: 'إتقان التفاضل والتكامل', description: 'أعلى كورس تقييماً لعام 2025 — منهج تفاعلي بالفيديو يحقق معدلات إتمام قياسية.', image: 'linear-gradient(135deg, #F4845F, #F79B7F)', badge: 'الأعلى تقييماً', students: '3,240 طالب', duration: '40 ساعة', rating: '4.9', action: 'عرض الكورس', hoverSize: 148 },
  { id: 2, title: 'مختبر الكتابة الإبداعية', description: 'تحويل منهج قديم إلى تجربة تعليمية ممتعة قائمة على المشاريع.', image: 'linear-gradient(135deg, #E882B4, #ED9DC4)', badge: 'محدث حديثاً', students: '1,850 طالب', duration: '28 ساعة', rating: '4.8', action: 'عرض المنهج', hoverSize: 168 },
  { id: 3, title: 'البرمجة بلغة Python', description: 'تعلم البرمجة من الصفر حتى الاحتراف مع مشاريع عملية حقيقية.', image: 'linear-gradient(135deg, #6BBF7A, #85CC92)', badge: 'الأكثر شعبية', students: '5,120 طالب', duration: '52 ساعة', rating: '4.9', action: 'عرض الكورس', hoverSize: 148 },
  { id: 4, title: 'التصميم الرقمي', description: 'أسس التصميم الرقمي باستخدام أحدث الأدوات والتقنيات الإبداعية.', image: 'linear-gradient(135deg, #6EB5FF, #8DC4FF)', badge: 'جديد', students: '2,300 طالب', duration: '36 ساعة', rating: '4.7', action: 'عرض الكورس', hoverSize: 148 },
];

export default function AcademyShowcase() {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const reveal = (id: string) => (ref: HTMLElement | null) => { if (!ref) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(p => ({ ...p, [id]: true })); }, { threshold: 0.15 }); obs.observe(ref); };

  return (
    <div id="courses" style={{ background: '#0a0a1a' }}>
      <section className="relative w-full overflow-hidden" style={{ height: '100vh' }} ref={reveal('hero')}>
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #0a0a1a, #151530 30%, #0a1a2e 60%, #0a0a1a)' }} />
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div className="absolute rounded-full" style={{ width: 600, height: 600, top: '-10%', right: '-10%', background: 'conic-gradient(from 180deg at 50% 50%, #F4845F15, #6BBF7A15, #E882B415, #6EB5FF15, #F4845F15)', filter: 'blur(80px)' }} animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '-5%', left: '10%', background: 'conic-gradient(from 0deg at 50% 50%, #6EB5FF12, #E882B412, #6BBF7A12, #F4845F12, #6EB5FF12)', filter: 'blur(60px)' }} animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} />
        </div>
        <nav className="absolute top-0 left-0 right-0 z-50 px-4 pt-6">
          <div className="max-w-5xl mx-auto liquid-glass rounded-full px-6 py-3 flex items-center gap-8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>عَ</div>
            <div className="hidden md:flex items-center gap-6">{['الكورسات', 'المنهج', 'المدونة', 'اتصل بنا'].map((l) => <a key={l} href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a>)}</div>
            <span className="hidden lg:block text-xs text-white/40">التسجيل متاح لدفعة ربيع 2026</span>
            <a href="#trial" className="pill-btn bg-orange-500 text-white hover:bg-orange-600 transition-colors hidden sm:flex items-center gap-2">جرب حصة مجانية <ArrowLeft size={14} /></a>
          </div>
        </nav>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
          <motion.h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl" style={{ fontFamily: "'Cairo', sans-serif", color: 'white' }} initial={{ opacity: 0, y: 50 }} animate={visible['hero'] ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: 'easeOut' }}>
            نبني تجارب تعليمية<br /><span style={{ color: 'rgba(255,255,255,0.4)' }}>للطلاب المستعدين لإتقان</span><br />أي مادة، عبر الإنترنت.
          </motion.h1>
          <motion.div className="mt-10 flex flex-wrap items-center justify-center gap-6" initial={{ opacity: 0, y: 30 }} animate={visible['hero'] ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}>
            <a href="#trial" className="pill-btn bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-2">ابدأ تجربة مجانية <ArrowLeft size={14} /></a>
            <div className="flex items-center gap-3 pr-4">
              <motion.div className="relative w-10 h-10" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                <svg viewBox="0 0 40 40" fill="none">{[...Array(8)].map((_, i) => <rect key={i} x="18" y="2" width="4" height="16" rx="1" fill="rgba(255,255,255,0.15)" transform={`rotate(${i * 45} 20 20)`} />)}<circle cx="20" cy="20" r="8" fill="rgba(255,255,255,0.1)" /></svg>
              </motion.div>
              <div><p className="text-xs text-white/70 font-medium">منهج معتمد</p><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#1a1a2e', color: 'white' }}>مُعتمد ✓</span></div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-16" style={{ background: '#0a0a1a' }} ref={reveal('about')}>
        <div className="max-w-6xl mx-auto">
          <motion.div className="flex justify-center mb-8" initial={{ opacity: 0, y: 40 }} animate={visible['about'] ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <span className="px-4 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>فلسفتنا التعليمية</span>
          </motion.div>
          <motion.h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Cairo', sans-serif", color: 'white' }} initial={{ opacity: 0, y: 30 }} animate={visible['about'] ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}>تعليم قائم على الإتقان، يحقق نتائج في كل مادة.</motion.h2>
          <motion.p className="text-center max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8" style={{ color: 'hsl(240, 4%, 66%)' }} initial={{ opacity: 0, y: 20 }} animate={visible['about'] ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }}>من خلال الدروس المنظمة والممارسة النشطة والتغذية الراجعة، نساعد كل طالب على الوصول إلى كامل إمكاناته الأكاديمية.</motion.p>
          <motion.div className="flex justify-center mb-16" initial={{ opacity: 0 }} animate={visible['about'] ? { opacity: 1 } : {}} transition={{ duration: 0.7, delay: 0.3 }}>
            <a href="#method" className="pill-btn border border-white/20 text-white hover:bg-white/10 transition-colors">حول منهجيتنا التعليمية</a>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ gradient: 'linear-gradient(135deg, #1a2a4a, #2a3a5a)', label: 'قاعة دراسية حديثة' }, { gradient: 'linear-gradient(135deg, #1a3a2a, #2a4a3a)', label: 'طالب يدرس' }, { gradient: 'linear-gradient(135deg, #3a2a1a, #4a3a2a)', label: 'معلم يشرح' }].map((item, i) => (
              <motion.div key={i} className="relative rounded-2xl overflow-hidden group" style={{ aspectRatio: '3/2', background: item.gradient, opacity: visible['about'] ? 1 : 0, transform: visible['about'] ? 'translateY(0)' : 'translateY(30px)', transition: `all 0.6s ease ${0.4 + i * 0.1}s` }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"><Play size={20} className="text-white" /></div><span className="text-white/70 text-sm">{item.label}</span></div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-16" style={{ background: '#0d0d1a' }} ref={reveal('courses')}>
        <div className="max-w-6xl mx-auto">
          <motion.div className="flex items-center justify-center gap-3 mb-8" initial={{ opacity: 0, y: 30 }} animate={visible['courses'] ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'white', color: '#0a0a1a' }}>★</span>
            <span className="text-xs text-white/50 font-medium">نتائج طلابية مرموقة</span>
          </motion.div>
          <motion.h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-bold mb-16" style={{ fontFamily: "'Cairo', sans-serif", color: 'white' }} initial={{ opacity: 0, y: 30 }} animate={visible['courses'] ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}>كورساتنا المميزة</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COURSES.map((course, i) => <CourseCard key={course.id} course={course} index={i} isVisible={visible['courses'] ?? false} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function CourseCard({ course, index, isVisible }: { course: typeof COURSES[0]; index: number; isVisible: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div className="relative rounded-2xl overflow-hidden group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)', transition: `all 0.6s ease ${0.2 + index * 0.1}s` }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: index === 1 ? '1/1' : '329/246', background: course.image }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', backdropFilter: 'blur(10px)' }}>{course.badge}</span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{course.title}</h3>
        </div>
        <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }}>
          <motion.div className="rounded-full flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)' }} animate={{ width: hovered ? course.hoverSize : 60, height: hovered ? course.hoverSize : 60 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <ExternalLink size={24} className="text-white" />
            {hovered && <span className="text-white text-xs font-medium mt-1">{course.action}</span>}
          </motion.div>
        </motion.div>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-sm text-white/50 leading-relaxed mb-4">{course.description}</p>
        <h3 className="text-lg font-bold text-white mb-3">{course.title}</h3>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1"><Users size={12} /> {course.students}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
          <span className="flex items-center gap-1"><Star size={12} /> {course.rating}</span>
        </div>
      </div>
    </motion.div>
  );
}

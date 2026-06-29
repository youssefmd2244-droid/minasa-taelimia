import HeroCarousel from './HeroCarousel';
import HeroVideo from './HeroVideo';
import HeroVex from './HeroVex';
import AcademyShowcase from './AcademyShowcase';
import CoursesSection from './CoursesSection';
import LessonsPreviewSection from './LessonsPreviewSection';
import InstructorsSection from './InstructorsSection';
import StatsSection from './StatsSection';
import GlobalNav from './GlobalNav';
import DeveloperCredit from './DeveloperCredit';
import Footer from './Footer';

interface LandingPageProps {
  /** يفتح بوابة كلمة سر الأدمن — يُمرَّر للأسفل حتى أيقونة الإعدادات الثابتة في Footer */
  onOpenAdmin?: () => void;
}

export default function LandingPage({ onOpenAdmin }: LandingPageProps) {
  return (
    <main>
      {/* Global sticky nav */}
      <GlobalNav />

      {/* SECTION 1: Book Carousel Hero */}
      <HeroCarousel />

      {/* SECTION 2: Cinematic Video Hero */}
      <HeroVideo />

      {/* SECTION 3: VEX-Style Hero */}
      <HeroVex />

      {/* SECTION 4: Academy Showcase (3 parts) */}
      <AcademyShowcase />

      {/* SECTION 5: Courses Grid */}
      <CoursesSection />

      {/* SECTION 5.5: Real per-item lesson list — download button appears
          only for items an admin explicitly marked allow_download=true */}
      <LessonsPreviewSection />

      {/* SECTION 6: Stats / Numbers */}
      <StatsSection />

      {/* SECTION 7: Instructors */}
      <InstructorsSection />

      {/* ICON CODE — Developer Credit (above footer) */}
      <DeveloperCredit />

      {/* FOOTER */}
      <Footer onOpenAdmin={onOpenAdmin} />
    </main>
  );
}

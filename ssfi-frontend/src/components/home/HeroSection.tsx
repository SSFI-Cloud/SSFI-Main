'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useInView } from 'framer-motion';

/* ─── Types ─── */
interface CMSBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  sortOrder: number;
  metadata?: {
    badge?: string;
    highlight?: string;
    stroke?: string;
    description?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    ghostWord?: string;
  };
}

interface SlideData {
  id: string;
  tag: string;
  titleLine1: string;
  accent: string;
  stroke: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryText: string;
  secondaryLink: string;
  image: string;
  ghost: string;
  stats: { n: string; l: string }[];
}

/* ─── Static fallback slides ─── */
const FALLBACK_SLIDES: SlideData[] = [
  {
    id: 'national-championship',
    tag: 'Just Concluded \u00b7 National Championship 2025',
    titleLine1: 'National',
    accent: 'Championship',
    stroke: '2025 Recap',
    description: 'Records shattered. Stars born. Over 2,000 athletes from 28 states competed in India\u2019s biggest speed skating showdown.',
    ctaText: 'View Results & Gallery',
    ctaLink: '/gallery',
    secondaryText: 'See Events',
    secondaryLink: '/events',
    image: '/images/hero/Hero-1.webp',
    ghost: 'GLORY',
    stats: [
      { n: '2,000+', l: 'Athletes' },
      { n: '28', l: 'States' },
      { n: '5,616+', l: 'Registered' },
    ],
  },
  {
    id: 'find-club',
    tag: 'Registrations Open \u00b7 Season 2025\u201326',
    titleLine1: 'Empowering',
    accent: 'Young India',
    stroke: 'Find a Club',
    description: '500+ affiliated clubs across 18 states. From beginners to elite \u2014 every young skater has a home with SSFI.',
    ctaText: 'Register Now',
    ctaLink: '/auth/register',
    secondaryText: 'View Programs',
    secondaryLink: '/beginner-program',
    image: '/images/hero/Hero-2.webp',
    ghost: 'SPEED',
    stats: [
      { n: '500+', l: 'Clubs' },
      { n: '18', l: 'States' },
      { n: 'Age 6+', l: 'Any Level' },
    ],
  },
  {
    id: 'coach-certification',
    tag: 'Certification Open \u00b7 Apply Now',
    titleLine1: 'Coach &',
    accent: 'Referee',
    stroke: 'Certification',
    description: 'Get nationally certified. 3 levels of coach certification and referee licensing \u2014 shaping the future of Indian speed skating.',
    ctaText: 'Apply for Certification',
    ctaLink: '/coach-certification',
    secondaryText: 'View Coaches',
    secondaryLink: '/affiliated-coaches',
    image: '/images/hero/Hero-3.webp',
    ghost: 'INDIA',
    stats: [
      { n: '300+', l: 'Coaches' },
      { n: '3', l: 'Cert Levels' },
      { n: 'All India', l: 'Recognition' },
    ],
  },
  {
    id: 'register-now',
    tag: 'Season 2025\u201326 \u00b7 Registrations Open',
    titleLine1: 'Your Spot Is',
    accent: 'Waiting.',
    stroke: 'Register Now',
    description: 'Registration windows are now open for State/District Secretaries and Student Athletes. Secure your place.',
    ctaText: 'Register Now',
    ctaLink: '/auth/register',
    secondaryText: 'About SSFI',
    secondaryLink: '/about',
    image: '/images/hero/Hero-4.webp',
    ghost: 'SKATE',
    stats: [
      { n: '36', l: 'States' },
      { n: '5,616+', l: 'Skaters' },
      { n: 'Open', l: 'Season' },
    ],
  },
];

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1').replace('/api/v1', '');
const GHOST_WORDS = ['GLORY', 'SPEED', 'INDIA', 'SKATE'];

/* ─── CSS Keyframes ─── */
const heroCSS = `
@keyframes hero-up{to{opacity:1;transform:translateY(0)}}
@keyframes hero-ken{from{transform:scale(1.08)}to{transform:scale(1)}}
@keyframes hero-swipe{0%{left:-110%;opacity:0}8%{opacity:1}65%{opacity:0.85}100%{left:120%;opacity:0}}
@keyframes hero-pdot{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.6)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}
@keyframes hero-pip-fill{from{width:0%}to{width:100%}}
`;

/* ─── Component ─── */
interface HeroSectionProps {
  banners?: CMSBanner[];
  stats?: { students?: number; states?: number; clubs?: number; totalEvents?: number; events?: number; certifiedCoaches?: number };
}

const HeroSection = ({ banners, stats: propStats }: HeroSectionProps) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fireLines, setFireLines] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const [cmsSlides, setCmsSlides] = useState<CMSBanner[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Accept banners from parent prop (aggregate endpoint)
  useEffect(() => {
    if (banners && banners.length > 0) {
      setCmsSlides([...banners].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [banners]);

  const hasCms = cmsSlides && cmsSlides.length > 0;

  // Map CMS banners to slide format using metadata fields
  const cmsAdapted: SlideData[] = (cmsSlides || []).map((s, i) => {
    const meta = s.metadata || {};
    const fallback = FALLBACK_SLIDES[i % FALLBACK_SLIDES.length];
    return {
      id: s.id,
      tag: meta.badge || s.subtitle || 'SSFI Announcement',
      titleLine1: s.title || fallback.titleLine1,
      accent: meta.highlight || fallback.accent,
      stroke: meta.stroke || fallback.stroke,
      description: meta.description || fallback.description,
      ctaText: s.linkText || fallback.ctaText,
      ctaLink: s.linkUrl || fallback.ctaLink,
      secondaryText: meta.secondaryCtaText || fallback.secondaryText,
      secondaryLink: meta.secondaryCtaLink || fallback.secondaryLink,
      image: s.imageUrl
        ? (s.imageUrl.startsWith('http') ? s.imageUrl : s.imageUrl.startsWith('/images/') ? s.imageUrl : `${API_BASE}${s.imageUrl}`)
        : fallback.image,
      ghost: meta.ghostWord || GHOST_WORDS[i % GHOST_WORDS.length],
      stats: fallback.stats,
    };
  });

  // Merge live API stats into fallback slides
  const liveSlides = FALLBACK_SLIDES.map((slide, i) => {
    if (!propStats) return slide;
    const s = propStats;
    const statsMap: Record<number, { n: string; l: string }[]> = {
      0: [
        { n: `${(s.students || 2000).toLocaleString()}+`, l: 'Athletes' },
        { n: String(s.states || 28), l: 'States' },
        { n: `${(s.students || 5616).toLocaleString()}+`, l: 'Registered' },
      ],
      1: [
        { n: `${s.clubs || 500}+`, l: 'Clubs' },
        { n: String(s.states || 18), l: 'States' },
        { n: 'Age 6+', l: 'Any Level' },
      ],
      2: [
        { n: `${s.certifiedCoaches || 300}+`, l: 'Coaches' },
        { n: '3', l: 'Cert Levels' },
        { n: 'All India', l: 'Recognition' },
      ],
      3: [
        { n: String(s.states || 36), l: 'States' },
        { n: `${(s.students || 5616).toLocaleString()}+`, l: 'Skaters' },
        { n: 'Open', l: 'Season' },
      ],
    };
    return { ...slide, stats: statsMap[i] || slide.stats };
  });

  // Apply live stats to CMS slides too
  const cmsWithLiveStats = cmsAdapted.map((slide, i) => {
    if (!propStats) return slide;
    const s = propStats;
    const statsMap: Record<number, { n: string; l: string }[]> = {
      0: [
        { n: `${(s.students || 2000).toLocaleString()}+`, l: 'Athletes' },
        { n: String(s.states || 28), l: 'States' },
        { n: `${(s.students || 5616).toLocaleString()}+`, l: 'Registered' },
      ],
      1: [
        { n: `${s.clubs || 500}+`, l: 'Clubs' },
        { n: String(s.states || 18), l: 'States' },
        { n: 'Age 6+', l: 'Any Level' },
      ],
      2: [
        { n: `${s.certifiedCoaches || 300}+`, l: 'Coaches' },
        { n: '3', l: 'Cert Levels' },
        { n: 'All India', l: 'Recognition' },
      ],
      3: [
        { n: String(s.states || 36), l: 'States' },
        { n: `${(s.students || 5616).toLocaleString()}+`, l: 'Skaters' },
        { n: 'Open', l: 'Season' },
      ],
    };
    return { ...slide, stats: statsMap[i] || slide.stats };
  });

  const slides = hasCms ? cmsWithLiveStats : liveSlides;
  const N = slides.length;

  const goTo = useCallback((n: number) => {
    setCurrent(n);
    setSlideKey(k => k + 1);
    setFireLines(false);
    requestAnimationFrame(() => setFireLines(true));
    setTimeout(() => setFireLines(false), 700);
  }, []);

  const next = useCallback(() => goTo((current + 1) % N), [current, N, goTo]);
  const prev = useCallback(() => goTo((current - 1 + N) % N), [current, N, goTo]);

  useEffect(() => { setCurrent(0); }, [hasCms]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const n = (c + 1) % N;
        setSlideKey(k => k + 1);
        setFireLines(false);
        requestAnimationFrame(() => setFireLines(true));
        setTimeout(() => setFireLines(false), 700);
        return n;
      });
    }, 5800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, N]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [next, prev]);

  const slide = slides[current];
  if (!slide) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: heroCSS }} />

      <section
        className="relative overflow-hidden bg-[#06101e]"
        style={{ height: 'calc(100vh - 72px - var(--ribbon-h, 0px))', minHeight: 520 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Speed Lines */}
        <div className="absolute inset-0 z-[20] pointer-events-none overflow-hidden">
          {[33, 50, 67, 43, 58].map((top, i) => (
            <div
              key={`sl-${i}`}
              className="absolute"
              style={{
                top: `${top}%`,
                left: '-110%',
                height: i === 1 ? 2.5 : i >= 3 ? 1 : 2,
                width: ['85%', '105%', '70%', '50%', '60%'][i],
                background: 'linear-gradient(to right, transparent, rgba(16,185,129,0.9), rgba(255,255,255,0.95), rgba(16,185,129,0.9), transparent)',
                borderRadius: 2,
                opacity: 0,
                ...(fireLines ? {
                  animation: `hero-swipe ${[0.55, 0.58, 0.52, 0.42, 0.44][i]}s cubic-bezier(0.4,0,0.2,1) ${[0, 0.05, 0.02, 0.09, 0.07][i]}s forwards`,
                } : {}),
              }}
            />
          ))}
        </div>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] z-[15]" style={{ background: 'linear-gradient(to right, #10b981 0%, rgba(16,185,129,0.3) 40%, transparent 70%)' }} />

        {/* Vertical label */}
        <div className="absolute left-4 top-1/2 z-10 pointer-events-none hidden lg:block text-[8px] tracking-[6px] uppercase whitespace-nowrap"
          style={{ color: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center' }}>
          Speed Skating Federation of India &mdash; Est. 2001
        </div>

        {/* ─── Slides ─── */}
        {slides.map((s, i) => {
          const isActive = i === current;
          return (
            <div key={s.id} className={`absolute inset-0 transition-none ${isActive ? 'z-[2] opacity-100' : 'z-[1] opacity-0 pointer-events-none'}`}>
              {/* BG Image with Ken Burns */}
              <div className="absolute inset-0" style={{
                animation: isActive ? 'hero-ken 7s ease forwards' : 'none',
                transform: isActive ? undefined : 'scale(1.08)',
                willChange: 'transform',
              }}>
                <Image src={s.image} alt={s.titleLine1} fill className="object-cover" style={{ objectPosition: 'center 25%' }} priority={i === 0} quality={90} sizes="100vw" />
              </div>

              {/* Overlays */}
              <div className="absolute inset-0 z-[2]" style={{ background: 'linear-gradient(100deg, rgba(6,16,30,0.97) 0%, rgba(6,16,30,0.82) 30%, rgba(6,16,30,0.45) 55%, rgba(6,16,30,0.1) 75%, transparent 90%)' }} />
              <div className="absolute bottom-0 left-0 right-0 z-[2]" style={{ height: '40%', background: 'linear-gradient(to top, rgba(6,16,30,0.95), transparent)' }} />
              <div className="absolute top-0 left-0 right-0 z-[2]" style={{ height: '18%', background: 'linear-gradient(to bottom, rgba(6,16,30,0.7), transparent)' }} />

              {/* Ghost word — font-hero (900 italic) */}
              <div className="absolute bottom-[-20px] right-[-10px] z-[3] pointer-events-none select-none font-hero italic"
                style={{ fontSize: 'clamp(110px, 18vw, 240px)', fontWeight: 900, letterSpacing: -4, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1px rgba(16,185,129,0.1)', textTransform: 'uppercase' }}>
                {s.ghost}
              </div>

              {/* Slide content */}
              <div className="absolute left-0 bottom-0 w-full sm:w-[65%] lg:w-[58%] px-5 sm:px-10 lg:px-[52px] pb-14 sm:pb-14 z-10">
                {/* Tag — body font (light weight) */}
                <div style={{ opacity: 0, transform: 'translateY(22px)', animation: isActive ? 'hero-up 0.5s ease 0.12s forwards' : 'none' }}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-[14px] sm:py-[5px] mb-4 sm:mb-[18px] rounded-full border"
                    style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10b981', animation: 'hero-pdot 2s infinite' }} />
                    <span className="text-[10px] sm:text-[11px] font-medium tracking-[3px] uppercase" style={{ color: '#10b981' }}>{s.tag}</span>
                  </span>
                </div>

                {/* Title — font-hero (900 italic) */}
                <div style={{ opacity: 0, transform: 'translateY(22px)', animation: isActive ? 'hero-up 0.55s ease 0.24s forwards' : 'none' }}>
                  <h1 className="font-hero italic uppercase mb-3 sm:mb-4 leading-[0.92] tracking-tight"
                    style={{ fontSize: 'clamp(42px, 7.2vw, 94px)', fontWeight: 900 }}>
                    <span className="text-white block">{s.titleLine1}</span>
                    {s.accent && <span className="block" style={{ color: '#10b981' }}>{s.accent}</span>}
                    {s.stroke && <span className="block" style={{ color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.7)' }}>{s.stroke}</span>}
                  </h1>
                </div>

                {/* Description — hidden on very small screens for space */}
                {s.description && (
                  <div className="hidden sm:block" style={{ opacity: 0, transform: 'translateY(22px)', animation: isActive ? 'hero-up 0.5s ease 0.38s forwards' : 'none' }}>
                    <p className="text-sm font-light leading-[1.75] mb-8 max-w-[390px]" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      {s.description}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ opacity: 0, transform: 'translateY(22px)', animation: isActive ? 'hero-up 0.5s ease 0.38s forwards' : 'none' }}>
                  <div className="flex flex-wrap gap-3">
                    <Link href={s.ctaLink}
                      className="inline-flex items-center gap-2 px-5 py-3 sm:px-[26px] sm:py-[13px] rounded-md font-hero text-[11px] sm:text-xs font-bold tracking-[2.5px] uppercase text-black transition-all duration-200 hover:translate-x-[3px]"
                      style={{ background: '#10b981' }}>
                      {s.ctaText}
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M8 3l3.5 3.5L8 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Link>
                    {s.secondaryText && s.secondaryLink && (
                      <Link href={s.secondaryLink}
                        className="inline-flex items-center gap-2 px-5 py-3 sm:px-[22px] sm:py-[12px] rounded-md font-hero text-[11px] sm:text-xs font-bold tracking-[2px] uppercase border transition-all duration-200 hover:border-white/45 hover:text-white"
                        style={{ color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.18)' }}>
                        {s.secondaryText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats badge — font-hero for numbers, body for labels */}
              <div className="absolute right-4 sm:right-[4%] bottom-14 sm:bottom-14 z-10 hidden sm:flex gap-[1px]"
                style={{ opacity: 0, transform: 'translateY(14px)', animation: isActive ? 'hero-up 0.5s ease 0.62s forwards' : 'none' }}>
                {s.stats.map((st, si) => (
                  <div key={si} className="text-center backdrop-blur-sm"
                    style={{
                      background: 'rgba(8,18,34,0.88)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '13px 20px',
                      minWidth: 105,
                      borderRadius: si === 0 ? '8px 0 0 8px' : si === s.stats.length - 1 ? '0 8px 8px 0' : 0,
                      borderLeft: si > 0 ? 'none' : undefined,
                      borderRight: si < s.stats.length - 1 ? 'none' : undefined,
                    }}>
                    <div className="font-hero text-[26px] font-bold leading-none mb-[3px]" style={{ color: '#10b981' }}>{st.n}</div>
                    <div className="text-[9px] font-medium tracking-[2px] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>{st.l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* ─── Progress Nav ─── */}
        <div className="absolute bottom-5 sm:bottom-7 left-6 sm:left-[52px] z-10 flex items-center gap-2">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => goTo(i)} className="flex items-center gap-2 py-1 cursor-pointer" aria-label={`Slide ${i + 1}`}>
              <div className="relative overflow-hidden rounded-sm transition-all duration-300"
                style={{ width: i === current ? 52 : 28, height: 3, background: 'rgba(255,255,255,0.12)' }}>
                {i === current && (
                  <div key={`pip-${slideKey}`} className="absolute left-0 top-0 bottom-0 rounded-sm" style={{ background: '#10b981', animation: 'hero-pip-fill 5.5s linear forwards' }} />
                )}
              </div>
              <span className="font-hero text-[10px] tracking-[1px] transition-colors duration-300"
                style={{ color: i === current ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </button>
          ))}
        </div>

        {/* ─── Arrow Nav ─── */}
        <div className="absolute bottom-5 sm:bottom-[22px] right-6 sm:right-[52px] z-10 flex gap-2">
          <button onClick={prev} className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 text-[15px] select-none hover:text-[#10b981]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }} aria-label="Previous">&#8592;</button>
          <button onClick={next} className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 text-[15px] select-none hover:text-[#10b981]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }} aria-label="Next">&#8594;</button>
        </div>
      </section>

      {/* ─── Stats Strip (dynamic from backend) ─── */}
      <StatsStrip propStats={propStats} />

      {/* ─── Seamless transition: navy → white ─── */}
      <div className="h-40 sm:h-56 lg:h-64" style={{ background: 'linear-gradient(to bottom, #0e1e38 0%, #13243f 12%, #1a3050 24%, #243d5e 36%, #3a5a7a 46%, #5d809e 55%, #8aa8c0 64%, #b0c8d8 72%, #d0dee8 80%, #e4ecf1 87%, #f2f5f7 93%, #ffffff 100%)' }} />

    </>
  );
};

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!isInView || target === 0) return;
    let start: number | null = null;
    let rafId: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) rafId = requestAnimationFrame(step);
      else setCount(target);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Stats Strip (accepts data from parent) ─── */
function StatsStrip({ propStats }: { propStats?: HeroSectionProps['stats'] }) {
  const stats = {
    students: propStats?.students || 0,
    states: propStats?.states || 0,
    clubs: propStats?.clubs || 0,
    events: propStats?.totalEvents || propStats?.events || 0,
    certifiedCoaches: propStats?.certifiedCoaches || 0,
  };

  const items = [
    { value: stats.students, suffix: '+', label: 'Registered Skaters' },
    { value: stats.states, suffix: '', label: 'State Associations' },
    { value: stats.events, suffix: '+', label: 'National Events' },
    { value: stats.clubs, suffix: '+', label: 'Affiliated Clubs' },
    { value: stats.certifiedCoaches, suffix: '+', label: 'Certified Coaches' },
  ];

  return (
    <div className="flex flex-wrap items-center border-t" style={{ background: '#0e1e38', borderColor: 'rgba(255,255,255,0.05)' }}>
      {items.map((st, i) => (
        <div key={i} className="flex-1 text-center py-5 sm:py-6 px-3 sm:px-5 relative min-w-[50%] sm:min-w-0">
          {i > 0 && <div className="absolute left-0 top-[15%] bottom-[15%] w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.07)' }} />}
          <div className="font-hero text-xl sm:text-[32px] font-bold leading-none mb-1" style={{ color: '#10b981' }}>
            {st.value > 0 ? <AnimatedCounter target={st.value} suffix={st.suffix} /> : `0${st.suffix}`}
          </div>
          <div className="text-[9px] sm:text-[10px] font-medium tracking-[2.5px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>{st.label}</div>
        </div>
      ))}
    </div>
  );
}


export default HeroSection;

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Trophy, GraduationCap, UserPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api/client';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  sortOrder: number;
}

const FALLBACK_SLIDES = [
  {
    id: 'join-skating',
    badge: 'Start Your Journey',
    title: 'Lace Up.',
    highlight: 'Roll Forward.',
    subtitle: 'Dream Big.',
    description: "Every champion started with a single stride. Join India's fastest-growing skating community and discover the thrill of speed, balance, and endless possibility.",
    ctaText: 'Join SSFI Today',
    ctaLink: '/auth/register',
    secondaryCta: { text: 'Learn More', link: '/about' },
    image: '/images/hero/slide-1.webp',
    gradient: 'from-blue-600/30 via-cyan-500/20 to-transparent',
    icon: Sparkles,
  },
  {
    id: 'national-event',
    badge: 'Just Concluded',
    title: 'National Championship',
    highlight: '2025 Recap',
    subtitle: 'Records Shattered. Stars Born.',
    description: 'Over 2,000 athletes from 28 states competed in the biggest skating showdown India has ever seen.',
    ctaText: 'View Results & Gallery',
    ctaLink: '/gallery',
    secondaryCta: { text: 'See Events', link: '/events' },
    image: '/images/hero/slide-2.webp',
    gradient: 'from-amber-600/30 via-orange-500/20 to-transparent',
    icon: Trophy,
  },
  {
    id: 'coach-training',
    badge: 'Certification Program',
    title: 'Shape the Next',
    highlight: 'Generation.',
    subtitle: 'SSFI Coach Training Program',
    description: 'Become a certified SSFI coach. Our comprehensive training program equips you with world-class techniques and credentials.',
    ctaText: 'Apply for Certification',
    ctaLink: '/affiliated-coaches',
    secondaryCta: { text: 'Program Details', link: '/affiliated-coaches' },
    image: '/images/hero/slide-3.webp',
    gradient: 'from-emerald-600/30 via-green-500/20 to-transparent',
    icon: GraduationCap,
  },
  {
    id: 'registrations',
    badge: 'Registrations Open',
    title: 'Your Spot Is',
    highlight: 'Waiting.',
    subtitle: 'Secretary & Student Registration',
    description: 'Registration windows are now open for State/District Secretaries and Student Athletes. Secure your place.',
    ctaText: 'Register Now',
    ctaLink: '/auth/register',
    secondaryCta: { text: 'Check Eligibility', link: '/about' },
    image: '/images/hero/slide-4.webp',
    gradient: 'from-purple-600/30 via-violet-500/20 to-transparent',
    icon: UserPlus,
  },
];

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const [cmsSlides, setCmsSlides] = useState<HeroSlide[] | null>(null);

  // Load HOME_HERO banners from CMS — fallback silently if none
  useEffect(() => {
    api.get('/cms/banners?position=HOME_HERO&status=PUBLISHED')
      .then(res => {
        const data: HeroSlide[] = res.data?.data || [];
        if (data.length > 0) {
          setCmsSlides(data.sort((a, b) => a.sortOrder - b.sortOrder));
        }
      })
      .catch(() => {});
  }, []);

  // Determine which slides to show
  const hasCms = cmsSlides && cmsSlides.length > 0;

  // Adapted slide structure for CMS banners
  const cmsAdapted = (cmsSlides || []).map((s, i) => ({
    id: s.id,
    badge: s.subtitle || 'SSFI Announcement',
    title: s.title,
    highlight: '',
    subtitle: s.subtitle || '',
    description: '',
    ctaText: s.linkText || 'Learn More',
    ctaLink: s.linkUrl || '/about',
    secondaryCta: null as null,
    image: s.imageUrl ? (s.imageUrl.startsWith('http') ? s.imageUrl : `${API_BASE}${s.imageUrl}`) : `/images/hero/slide-${(i % 4) + 1}.webp`,
    gradient: ['from-blue-600/30 via-cyan-500/20 to-transparent', 'from-amber-600/30 via-orange-500/20 to-transparent', 'from-emerald-600/30 via-green-500/20 to-transparent', 'from-purple-600/30 via-violet-500/20 to-transparent'][i % 4],
    icon: [Sparkles, Trophy, GraduationCap, UserPlus][i % 4],
  }));

  const slides = hasCms ? cmsAdapted : FALLBACK_SLIDES;

  const next = useCallback(() => { setDirection(1); setCurrent((p) => (p + 1) % slides.length); }, [slides.length]);
  const prev = useCallback(() => { setDirection(-1); setCurrent((p) => (p - 1 + slides.length) % slides.length); }, [slides.length]);

  useEffect(() => {
    setCurrent(0); // reset on slide source change
  }, [hasCms]);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [isPaused, next]);

  const slide = slides[Math.min(current, slides.length - 1)];
  if (!slide) return null;
  const Icon = slide.icon;

  return (
    <section className="relative overflow-hidden" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      {/* BG Image */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={slide.id + '-bg'} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
          <Image src={slide.image} alt={slide.title} fill className="object-cover" priority quality={90} />
          <div className="absolute inset-0 bg-gray-950/70" />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Floating glass orbs */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <motion.div animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-[15%] right-[10%] w-72 h-72 rounded-full bg-white/[0.03] backdrop-blur-3xl border border-white/[0.05]" />
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-[30%] left-[5%] w-56 h-56 rounded-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center pt-28 pb-56">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={slide.id} custom={direction}
                  initial={{ x: direction > 0 ? '8%' : '-8%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction > 0 ? '-8%' : '8%', opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium">
                    <Icon className="w-4 h-4" /> {slide.badge}
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-headline font-bold leading-[1.08] tracking-tight">
                    <span className="text-white">{slide.title}</span>
                    {slide.highlight && <><br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">{slide.highlight}</span>
                    </>}
                  </h1>
                  {slide.subtitle && <p className="text-lg sm:text-xl text-white/60 font-medium">{slide.subtitle}</p>}
                  {slide.description && <p className="text-base sm:text-lg text-white/45 max-w-xl leading-relaxed">{slide.description}</p>}
                  <div className="flex flex-wrap gap-4 pt-4">
                    <Link href={slide.ctaLink} className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300">
                      {slide.ctaText} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    {slide.secondaryCta && (
                      <Link href={slide.secondaryCta.link} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/20 transition-all">
                        {slide.secondaryCta.text}
                      </Link>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={slide.id + '-card'} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative">
                  <div className="w-80 h-80 rounded-3xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-6 border border-amber-400/30">
                      <Icon className="w-10 h-10 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-headline font-bold text-white mb-2">{slide.badge}</h3>
                    <p className="text-white/50 text-sm">{slide.subtitle || slide.title}</p>
                    <div className="flex gap-2 mt-6">
                      {slides.map((_, i) => (<div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-amber-400 w-6' : 'bg-white/20 w-2'}`} />))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-48 sm:bottom-56 left-0 right-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-xl rounded-full p-1.5 border border-white/10">
              {slides.map((s, i) => (
                <button key={s.id} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${i === current ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-white/50 hover:text-white/80'}`}>
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prev} className="w-10 h-10 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/15 transition-all" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={next} className="w-10 h-10 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/15 transition-all" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 z-[3] pointer-events-none">
        <div className="h-20 bg-gradient-to-b from-transparent to-gray-950/30" />
        <div className="h-20 bg-gradient-to-b from-gray-950/30 to-gray-950/70" />
        <div className="h-16 bg-gradient-to-b from-gray-950/70 to-gray-950" />
        <div className="h-12 bg-gradient-to-b from-gray-950 via-[#1a1f2e] to-[#3a3f4e]" />
        <div className="h-10 bg-gradient-to-b from-[#3a3f4e] via-[#7a7f8e] to-[#c8cbd0]" />
        <div className="h-8 bg-gradient-to-b from-[#c8cbd0] via-[#e8eaed] to-white" />
      </div>
    </section>
  );
};

export default HeroSection;

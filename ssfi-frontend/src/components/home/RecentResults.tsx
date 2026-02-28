'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, ChevronLeft, ChevronRight,
  Medal, Calendar, MapPin, Trophy, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultEntry {
  position: 1 | 2 | 3;
  firstName: string;
  state: string;
  skateCategory: string;
  raceType: string;
  gender: string;
}

interface SlideData {
  eventId: number;
  eventName: string;
  eventDate: string;
  city: string;
  category: string;
  ageCategory: string;
  top3: ResultEntry[];
  isPlaceholder?: boolean;
}

// Groups multiple age-category slides under one event card
interface EventCardData {
  eventId: number;
  eventName: string;
  eventDate: string;
  city: string;
  category: string;
  slides: SlideData[];
  isPlaceholder?: boolean;
}

// ─── Static fallback (3 events, each with 2 age-category slides) ─────────────

const PLACEHOLDER_EVENTS: EventCardData[] = [
  {
    eventId: 1,
    eventName: '39th National Speed Skating Championship',
    eventDate: '2025-12-01',
    city: 'Bangalore',
    category: 'NATIONAL',
    isPlaceholder: true,
    slides: [
      {
        eventId: 1, eventName: '', eventDate: '2025-12-01', city: 'Bangalore', category: 'NATIONAL',
        ageCategory: 'U-14', isPlaceholder: true,
        top3: [
          { position: 1, firstName: 'Arjun',  state: 'Tamil Nadu',  skateCategory: 'SPEED_SKATING', raceType: '500M', gender: 'MALE' },
          { position: 2, firstName: 'Priya',  state: 'Maharashtra', skateCategory: 'SPEED_SKATING', raceType: '500M', gender: 'FEMALE' },
          { position: 3, firstName: 'Ravi',   state: 'Kerala',      skateCategory: 'SPEED_SKATING', raceType: '500M', gender: 'MALE' },
        ],
      },
      {
        eventId: 1, eventName: '', eventDate: '2025-12-01', city: 'Bangalore', category: 'NATIONAL',
        ageCategory: 'U-10', isPlaceholder: true,
        top3: [
          { position: 1, firstName: 'Sneha',  state: 'Karnataka',  skateCategory: 'SPEED_SKATING', raceType: '300M', gender: 'FEMALE' },
          { position: 2, firstName: 'Dev',    state: 'Rajasthan',  skateCategory: 'SPEED_SKATING', raceType: '300M', gender: 'MALE' },
          { position: 3, firstName: 'Ananya', state: 'Gujarat',    skateCategory: 'SPEED_SKATING', raceType: '300M', gender: 'FEMALE' },
        ],
      },
    ],
  },
  {
    eventId: 2,
    eventName: 'National Artistic Skating Championship',
    eventDate: '2025-11-01',
    city: 'Mumbai',
    category: 'NATIONAL',
    isPlaceholder: true,
    slides: [
      {
        eventId: 2, eventName: '', eventDate: '2025-11-01', city: 'Mumbai', category: 'NATIONAL',
        ageCategory: 'U-12', isPlaceholder: true,
        top3: [
          { position: 1, firstName: 'Kavya',  state: 'Gujarat',     skateCategory: 'ARTISTIC', raceType: 'SOLO',  gender: 'FEMALE' },
          { position: 2, firstName: 'Meera',  state: 'Delhi',       skateCategory: 'ARTISTIC', raceType: 'SOLO',  gender: 'FEMALE' },
          { position: 3, firstName: 'Ishaan', state: 'Maharashtra', skateCategory: 'ARTISTIC', raceType: 'SOLO',  gender: 'MALE' },
        ],
      },
      {
        eventId: 2, eventName: '', eventDate: '2025-11-01', city: 'Mumbai', category: 'NATIONAL',
        ageCategory: 'U-16', isPlaceholder: true,
        top3: [
          { position: 1, firstName: 'Aditya', state: 'Punjab',     skateCategory: 'ARTISTIC', raceType: 'PAIRS', gender: 'MALE' },
          { position: 2, firstName: 'Rhea',   state: 'Haryana',    skateCategory: 'ARTISTIC', raceType: 'PAIRS', gender: 'FEMALE' },
          { position: 3, firstName: 'Kiran',  state: 'Tamil Nadu', skateCategory: 'ARTISTIC', raceType: 'PAIRS', gender: 'FEMALE' },
        ],
      },
    ],
  },
  {
    eventId: 3,
    eventName: 'Inter-State Inline Hockey Cup',
    eventDate: '2025-10-01',
    city: 'Chandigarh',
    category: 'STATE',
    isPlaceholder: true,
    slides: [
      {
        eventId: 3, eventName: '', eventDate: '2025-10-01', city: 'Chandigarh', category: 'STATE',
        ageCategory: 'U-18', isPlaceholder: true,
        top3: [
          { position: 1, firstName: 'Rohit',  state: 'Haryana',   skateCategory: 'INLINE_HOCKEY', raceType: 'FINAL', gender: 'MALE' },
          { position: 2, firstName: 'Vikram', state: 'Punjab',    skateCategory: 'INLINE_HOCKEY', raceType: 'FINAL', gender: 'MALE' },
          { position: 3, firstName: 'Suresh', state: 'Rajasthan', skateCategory: 'INLINE_HOCKEY', raceType: 'FINAL', gender: 'MALE' },
        ],
      },
      {
        eventId: 3, eventName: '', eventDate: '2025-10-01', city: 'Chandigarh', category: 'STATE',
        ageCategory: 'U-14', isPlaceholder: true,
        top3: [
          { position: 1, firstName: 'Tanvi', state: 'Delhi',   skateCategory: 'INLINE_HOCKEY', raceType: 'FINAL', gender: 'FEMALE' },
          { position: 2, firstName: 'Pooja', state: 'Haryana', skateCategory: 'INLINE_HOCKEY', raceType: 'FINAL', gender: 'FEMALE' },
          { position: 3, firstName: 'Nisha', state: 'Punjab',  skateCategory: 'INLINE_HOCKEY', raceType: 'FINAL', gender: 'FEMALE' },
        ],
      },
    ],
  },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const MEDALS: Record<number, { emoji: string; label: string; bg: string; text: string; border: string }> = {
  1: { emoji: '🥇', label: 'Gold',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  2: { emoji: '🥈', label: 'Silver', bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200' },
  3: { emoji: '🥉', label: 'Bronze', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

const SKATE_LABELS: Record<string, string> = {
  SPEED_SKATING: 'Speed',
  ARTISTIC:      'Artistic',
  INLINE_HOCKEY: 'Hockey',
  QUAD:          'Quad',
  INLINE:        'Inline',
  BEGINNER:      'Beginner',
  RECREATIONAL:  'Rec.',
  PRO_INLINE:    'Pro Inline',
};

const CAT_COLORS: Record<string, { badge: string; accent: string }> = {
  NATIONAL: { badge: 'bg-blue-100 text-blue-700',    accent: 'from-blue-500 to-indigo-500'    },
  STATE:    { badge: 'bg-violet-100 text-violet-700', accent: 'from-violet-500 to-purple-500'  },
  DISTRICT: { badge: 'bg-teal-100 text-teal-700',     accent: 'from-teal-500 to-emerald-500'   },
};

const CARD_INTERVAL = 3500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function skateName(raw: string) {
  return SKATE_LABELS[raw] || raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function groupIntoCards(slides: SlideData[]): EventCardData[] {
  const map = new Map<number, EventCardData>();
  for (const s of slides) {
    if (!map.has(s.eventId)) {
      map.set(s.eventId, {
        eventId:   s.eventId,
        eventName: s.eventName,
        eventDate: s.eventDate,
        city:      s.city,
        category:  s.category,
        slides:    [],
      });
    }
    map.get(s.eventId)!.slides.push(s);
  }
  return Array.from(map.values()).slice(0, 3);
}

// ─── Single card component (named differently from the interface) ─────────────

function ChampionshipCard({ card, index }: { card: EventCardData; index: number }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused]           = useState(false);
  const [dir, setDir]                 = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goNext = useCallback(() => {
    if (card.slides.length <= 1) return;
    setDir(1);
    setActiveSlide(i => (i + 1) % card.slides.length);
  }, [card.slides.length]);

  const goPrev = useCallback(() => {
    if (card.slides.length <= 1) return;
    setDir(-1);
    setActiveSlide(i => (i - 1 + card.slides.length) % card.slides.length);
  }, [card.slides.length]);

  // Stagger auto-cycles so all 3 cards don't flip simultaneously
  useEffect(() => {
    if (paused || card.slides.length <= 1) return;
    const delay = setTimeout(() => {
      timerRef.current = setInterval(goNext, CARD_INTERVAL);
    }, index * 1200);
    return () => {
      clearTimeout(delay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, card.slides.length, goNext, index]);

  const slide     = card.slides[activeSlide];
  const catColors = CAT_COLORS[card.category] || CAT_COLORS.NATIONAL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
      className="group rounded-2xl bg-white border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-100/40 hover:-translate-y-1 transition-all duration-500"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Colour accent top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${catColors.accent}`} />

      {/* Event header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${catColors.badge}`}>
            {card.category}
          </span>
          <span className="flex items-center gap-1 text-gray-400 text-xs">
            <Calendar className="w-3 h-3" /> {fmtDate(card.eventDate)}
          </span>
          {card.city && (
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <MapPin className="w-3 h-3" /> {card.city}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
          {card.eventName}
        </h3>
      </div>

      {/* Age-category tabs + mini prev/next — only if multiple slides */}
      {card.slides.length > 1 && (
        <div className="px-5 pt-3 flex items-center gap-1.5 flex-wrap">
          {card.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => { setDir(i > activeSlide ? 1 : -1); setActiveSlide(i); }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                i === activeSlide
                  ? `bg-gradient-to-r ${catColors.accent} text-white shadow-sm`
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.ageCategory}
            </button>
          ))}
          <div className="ml-auto flex gap-1">
            <button
              onClick={goPrev}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all"
              aria-label="Previous age group"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={goNext}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all"
              aria-label="Next age group"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Animated medal result rows */}
      <div className="px-5 pt-3 pb-5 overflow-hidden min-h-[148px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={activeSlide}
            custom={dir}
            initial={{ opacity: 0, x: dir * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -30 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-2"
          >
            {[1, 2, 3].map(pos => {
              const entry = slide.top3.find(e => e.position === pos) ?? null;
              const medal = MEDALS[pos];
              return (
                <div
                  key={pos}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                    entry ? `${medal.bg} ${medal.border}` : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <span className="text-xl w-7 text-center flex-shrink-0">{medal.emoji}</span>
                  {entry ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${medal.text}`}>
                          {entry.firstName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {entry.state} · {skateName(entry.skateCategory)}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold flex-shrink-0 ${medal.text}`}>
                        {medal.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-300 text-xs italic">—</span>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function RecentResults() {
  const [cards, setCards]         = useState<EventCardData[]>(PLACEHOLDER_EVENTS);
  const [loading, setLoading]     = useState(true);
  const [isPlaceholder, setIsPlaceholder] = useState(true);

  useEffect(() => {
    api.get('/results/public/recent')
      .then(res => {
        const data: SlideData[] = res.data?.data || [];
        if (data.length > 0) {
          setCards(groupIntoCards(data));
          setIsPlaceholder(false);
        }
      })
      .catch(() => { /* silently keep placeholders */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-28 overflow-hidden bg-gray-50">

      {/* Dotted background */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{ backgroundImage: 'radial-gradient(circle,#d1d5db 1px,transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[150px]" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-amber-50/30 rounded-full blur-[120px]" />

      {/* ── Floating mascot — 3D pop-out, outside the cards ── */}
      <motion.div
        initial={{ opacity: 0, x: 60, y: 20 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-[-20px] lg:right-[20px] xl:right-[60px] bottom-[80px] z-20 pointer-events-none hidden lg:block"
        style={{ perspective: '1000px' }}
      >
        {/* Soft glow halo behind mascot */}
        <div className="absolute -inset-10 bg-gradient-to-br from-emerald-200/30 via-amber-100/20 to-blue-200/25 rounded-full blur-3xl" />

        {/* Floating animation wrapper */}
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [-1, 1.5, -1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.18)) drop-shadow(0 12px 20px rgba(0,0,0,0.10))',
            transform: 'translateZ(60px)',
          }}
        >
          <div className="relative w-52 h-64 xl:w-60 xl:h-72">
            <Image
              src="/images/mascot/11.webp"
              alt="Rollie mascot"
              fill
              className="object-contain object-bottom"
              sizes="240px"
              priority={false}
            />
          </div>
        </motion.div>

        {/* Ground shadow ellipse */}
        <div
          className="mx-auto mt-1 w-28 h-4 rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 75%)',
          }}
        />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Section header ────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-500 text-sm font-medium mb-4 shadow-sm">
              <Medal className="w-4 h-4 text-amber-500" /> Recent Results
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 tracking-tight">
              Championship{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                Highlights
              </span>
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <Link
              href="/results"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Trophy className="w-4 h-4" />
              View All Results
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching live results…
          </div>
        )}

        {/* Placeholder notice */}
        {!loading && isPlaceholder && (
          <div className="mb-6 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Showing sample results — live results will appear here once published
          </div>
        )}

        {/* ── 3-column cards grid ───────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <ChampionshipCard key={card.eventId} card={card} index={i} />
          ))}
        </div>

        {/* ── Discipline tags ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 text-sm mb-3">Disciplines covered in national events</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['#SpeedSkating', '#ArtisticSkating', '#InlineHockey', '#FreestyleSlalom', '#DownhillRacing', '#FigureSkating'].map(tag => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium shadow-sm hover:border-emerald-200 hover:text-emerald-600 transition-colors cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}

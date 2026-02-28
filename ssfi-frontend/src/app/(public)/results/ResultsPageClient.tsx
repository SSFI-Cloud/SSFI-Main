'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy, Calendar, MapPin, ChevronDown, ChevronUp,
  Loader2, Search, Filter, ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api/client';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface EventSummary {
  id: number;
  name: string;
  eventDate: string;
  city: string;
  category: 'NATIONAL' | 'STATE' | 'DISTRICT';
  venue: string;
  _count: { raceResults: number };
}

interface ResultRow {
  position: 1 | 2 | 3;
  firstName: string;
  state: string;
  skateCategory: string;
  raceType: string;
  gender: string;
}

interface EventDetail {
  event: { id: number; name: string; eventDate: string; city: string };
  grouped: Record<string, ResultRow[]>;
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MEDAL_ICON: Record<number, string>  = { 1: 'ðŸ¥‡', 2: 'ðŸ¥ˆ', 3: 'ðŸ¥‰' };

const MEDAL_ROW_CLS: Record<number, string> = {
  1: 'bg-amber-50/70 border-amber-100',
  2: 'bg-slate-50/70  border-slate-100',
  3: 'bg-orange-50/70 border-orange-100',
};
const MEDAL_TEXT_CLS: Record<number, string> = {
  1: 'text-amber-700 font-extrabold',
  2: 'text-slate-600  font-bold',
  3: 'text-orange-700 font-bold',
};

const CAT_CFG: Record<string, { bg: string; text: string }> = {
  NATIONAL: { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  STATE:    { bg: 'bg-violet-100', text: 'text-violet-700' },
  DISTRICT: { bg: 'bg-teal-100',   text: 'text-teal-700'   },
};

const SKATE_LABELS: Record<string, string> = {
  SPEED_SKATING: 'Speed Skating',
  ARTISTIC:      'Artistic',
  INLINE_HOCKEY: 'Inline Hockey',
  QUAD:          'Quad',
  INLINE:        'Inline',
  BEGINNER:      'Beginner',
  RECREATIONAL:  'Recreational',
  PRO_INLINE:    'Pro Inline',
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function skateName(raw: string) {
  return SKATE_LABELS[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// â”€â”€â”€ Expanded table (lazy-loaded per event) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EventResultsTable({ eventId }: { eventId: number }) {
  const [data, setData]       = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/results/public/event/${eventId}`)
      .then(res => setData(res.data?.data ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (!data || Object.keys(data.grouped).length === 0) {
    return (
      <p className="text-center py-10 text-gray-400 text-sm italic">
        No results recorded for this event yet.
      </p>
    );
  }

  const ageCategories = Object.keys(data.grouped).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-left">
            <th className="px-5 py-3 text-gray-500 font-semibold text-center w-14">Rank</th>
            <th className="px-5 py-3 text-gray-500 font-semibold">Athlete</th>
            <th className="px-5 py-3 text-gray-500 font-semibold">Age Group</th>
            <th className="px-5 py-3 text-gray-500 font-semibold">Discipline</th>
            <th className="px-5 py-3 text-gray-500 font-semibold">Gender</th>
            <th className="px-5 py-3 text-gray-500 font-semibold">State</th>
          </tr>
        </thead>
        <tbody>
          {ageCategories.map(ageGroup =>
            data.grouped[ageGroup].map((r, ri) => (
              <tr
                key={`${ageGroup}-${ri}`}
                className={`border-b ${MEDAL_ROW_CLS[r.position] ?? 'border-gray-50'}`}
              >
                {/* Rank */}
                <td className="px-5 py-3.5 text-center">
                  <span className="text-xl leading-none">{MEDAL_ICON[r.position]}</span>
                </td>

                {/* Athlete */}
                <td className="px-5 py-3.5">
                  <span className={`text-gray-900 ${MEDAL_TEXT_CLS[r.position] ?? ''}`}>
                    {r.firstName}
                  </span>
                </td>

                {/* Age Group */}
                <td className="px-5 py-3.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold whitespace-nowrap">
                    {ageGroup}
                  </span>
                </td>

                {/* Discipline + race type */}
                <td className="px-5 py-3.5 text-gray-600">
                  {skateName(r.skateCategory)}
                  {r.raceType && (
                    <span className="ml-1.5 text-xs text-gray-400">Â· {r.raceType}</span>
                  )}
                </td>

                {/* Gender */}
                <td className="px-5 py-3.5 text-gray-500 capitalize">
                  {r.gender.charAt(0) + r.gender.slice(1).toLowerCase()}
                </td>

                {/* State */}
                <td className="px-5 py-3.5 text-gray-700 font-medium">{r.state}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// â”€â”€â”€ Main page component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ResultsPageClient() {
  const [events, setEvents]       = useState<EventSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [expanded, setExpanded]   = useState<number | null>(null);

  useEffect(() => {
    api.get('/results/public/events')
      .then(res => setEvents(res.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback((id: number) => {
    setExpanded(prev => (prev === id ? null : id));
  }, []);

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || (e.city ?? '').toLowerCase().includes(q);
    const matchCat    = !filterCat || e.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50]">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(251,191,36,0.1) 0%,transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end">

            {/* Left: Text */}
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 pt-28 pb-16 md:pt-36 md:pb-20">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold mb-6">
                <Trophy className="w-4 h-4" /> Official Championship Results
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
                Results &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  Rankings
                </span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl">
                Official top-3 finishers for every SSFI championship — by age group and discipline.
              </p>
            </motion.div>

            {/* Right: Mascot */}
            <div className="hidden lg:block lg:w-[400px] xl:w-[460px] flex-shrink-0 self-end relative">
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-amber-500/8 via-transparent to-transparent blur-3xl pointer-events-none" />
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  animate={{ y: [0, -20, 0], rotate: [-0.5, 1.5, -0.5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 40px 55px rgba(0,0,0,0.55)) drop-shadow(0 12px 24px rgba(251,191,36,0.3))' }}
                >
                  <div className="relative w-full h-[420px] xl:h-[460px]">
                    <Image src="/images/mascot/result.webp" alt="SSFI Results Mascot" fill
                      className="object-contain object-bottom" sizes="460px" priority />
                  </div>
                </motion.div>
                <div className="mx-auto w-36 h-4 rounded-full -mt-2"
                  style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.3) 0%, transparent 70%)' }} />
              </motion.div>
            </div>

          </div>
        </div>
        <div className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent)' }} />
      </section>

      {/* â”€â”€ Sticky filter bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search event name or cityâ€¦"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 bg-gray-50"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50 text-gray-700"
            >
              <option value="">All Levels</option>
              <option value="NATIONAL">National</option>
              <option value="STATE">State</option>
              <option value="DISTRICT">District</option>
            </select>
          </div>

          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>

      {/* â”€â”€ Events list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
            <p className="text-gray-400 text-sm">Loading resultsâ€¦</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Trophy className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {events.length === 0 ? 'No Results Published Yet' : 'No Matching Events'}
            </h3>
            <p className="text-gray-400 text-sm">
              {events.length === 0
                ? 'Championship results will appear here once they are published.'
                : 'Try a different search term or remove the filter.'}
            </p>
          </div>

        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Showing{' '}
              <strong className="text-gray-700">{filtered.length}</strong>{' '}
              event{filtered.length !== 1 ? 's' : ''} with published results
            </p>

            <div className="space-y-4">
              {filtered.map((event, i) => {
                const cfg   = CAT_CFG[event.category] ?? CAT_CFG.NATIONAL;
                const isOpen = expanded === event.id;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* â”€â”€ Header row (clickable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <button
                      onClick={() => toggle(event.id)}
                      className="w-full text-left p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50/60 transition-colors group"
                      aria-expanded={isOpen}
                    >
                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {event.category}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {fmtDate(event.eventDate)}
                          </span>
                          {event.city && (
                            <span className="flex items-center gap-1 text-gray-400 text-xs">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.city}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {event.name}
                        </h3>
                      </div>

                      {/* Result count + chevron */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center hidden sm:block">
                          <p className="text-xl font-extrabold text-gray-800 tabular-nums">
                            {event._count.raceResults}
                          </p>
                          <p className="text-xs text-gray-400 leading-none">results</p>
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isOpen ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600'
                        }`}>
                          {isOpen
                            ? <ChevronUp className="w-5 h-5" />
                            : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </button>

                    {/* â”€â”€ Expandable results table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="table"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-gray-100">
                            <EventResultsTable eventId={event.id} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}

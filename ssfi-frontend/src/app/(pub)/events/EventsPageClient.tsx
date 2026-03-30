'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Trophy,
  ChevronDown,
  X,
  Loader2,
  Users,
  Ticket,
  ChevronRight,
  Flame,
  Clock,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  Medal,
  List,
} from 'lucide-react';

import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/resolveImageUrl';
import { useEvents } from '@/lib/hooks/useEvents';
import { useStates } from '@/lib/hooks/useStudent';
import type { EventQueryParams, EventLevel, EventType, Discipline, Event } from '@/types/event';
import {
  EVENT_LEVELS, EVENT_TYPES, DISCIPLINES,
  getStatusConfig, isRegistrationOpen, getDaysUntilEvent, formatEventDate,
} from '@/types/event';

/* ── Level color map ── */
const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  NATIONAL: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  STATE: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  DISTRICT: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  CLUB: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  default: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
};
const getLevelColor = (l?: string) => LEVEL_COLORS[l || ''] ?? LEVEL_COLORS.default;

/* ── Inline Event Card (light theme) ── */
function EventCardLight({ event, index }: { event: Event; index: number }) {
  const [imgError, setImgError] = useState(false);
  const statusCfg = getStatusConfig(event.status);
  const daysUntil = getDaysUntilEvent(event.eventDate);
  const canRegister = isRegistrationOpen(event);
  const lc = getLevelColor(event.eventLevel);
  const regCount = event._count?.registrations || 0;
  const disciplines = (event.disciplines || [])
    .map(d => DISCIPLINES.find(disc => disc.value === d))
    .filter(Boolean).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 hover:border-gray-200 transition-all duration-300"
    >
      {/* Top accent bar */}
      <div className={`h-1 ${lc.dot}`} />

      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {event.bannerImage && !imgError ? (
          <Image src={resolveImageUrl(event.bannerImage)} alt={event.name} fill unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`w-16 h-16 rounded-2xl ${lc.bg} flex items-center justify-center`}>
              <Trophy className={`w-8 h-8 ${lc.text}`} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Badges on image */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${lc.bg} ${lc.text} border ${lc.border} backdrop-blur-sm`}>
            {event.eventLevel?.replace('_', ' ')}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {event.status === 'COMPLETED' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white shadow-lg shadow-red-500/30">
              Completed
            </span>
          ) : event.status === 'CANCELLED' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/80 text-white shadow-lg">
              Cancelled
            </span>
          ) : event.status === 'ONGOING' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-lg shadow-emerald-500/30">
              <Zap className="w-3 h-3" />
              Live
            </span>
          ) : daysUntil > 0 && daysUntil <= 30 ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-lg shadow-emerald-500/30">
              <Flame className="w-3 h-3" />
              {daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d left`}
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Discipline pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {disciplines.map((d, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
              {d?.icon} {d?.label}
            </span>
          ))}
        </div>

        <h3 className="text-[17px] font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">
          {event.name}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>{formatEventDate(event.eventDate, event.eventEndDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <span className="truncate">{event.venue}, {event.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>{regCount} registered</span>
          </div>
        </div>

        {/* Footer: Fee + CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Entry Fee</p>
            <p className="text-lg font-extrabold text-gray-900">
              {event.entryFee > 0 ? `₹${event.entryFee.toLocaleString('en-IN')}` : <span className="text-emerald-600">Free</span>}
            </p>
          </div>
          <Link href={`/events/${event.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${canRegister
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200/50 hover:shadow-emerald-300/60'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
            }`}>
            {canRegister ? <><Ticket className="w-4 h-4" />Register</> : <>Details <ChevronRight className="w-3.5 h-3.5" /></>}
          </Link>
        </div>
      </div>

      {/* Registration progress bar */}
      {canRegister && event.maxParticipants && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
            style={{ width: `${Math.min(100, (regCount / event.maxParticipants) * 100)}%` }} />
        </div>
      )}
    </motion.div>
  );
}

/* ── Past Events Table Row ── */
function EventTableRow({ event, index }: { event: Event; index: number }) {
  const lc = getLevelColor(event.eventLevel);
  const regCount = event._count?.registrations || 0;
  const winnersCount = event.winnersCount || event._count?.raceResults || 0;
  const eventDate = new Date(event.eventDate);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03 }}
      className="group hover:bg-emerald-50/40 transition-colors border-b border-gray-100 last:border-0"
    >
      <td className="py-3 px-4">
        <Link href={`/events/${event.id}`} className="flex items-center gap-3 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${lc.dot}`} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
              {event.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {event.venue}, {event.city}
            </p>
          </div>
        </Link>
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${lc.bg} ${lc.text} border ${lc.border}`}>
          {event.eventLevel?.replace('_', ' ')}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm text-gray-500">
          {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{regCount}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center hidden md:table-cell">
        <div className="flex items-center justify-center gap-1.5">
          <Medal className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-sm font-medium text-gray-700">{winnersCount}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <Link href={`/events/${event.id}`}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
          View →
        </Link>
      </td>
    </motion.tr>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function EventsPageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EventQueryParams>({
    page: 1, limit: 100, sortBy: 'eventDate', sortOrder: 'desc',
  });

  const { fetchEvents, data, isLoading, error } = useEvents();
  const { fetchStates, data: states } = useStates();

  useEffect(() => { fetchEvents(filters); }, [fetchEvents, filters]);
  useEffect(() => { fetchStates(); }, [fetchStates]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery !== filters.search)
        setFilters(p => ({ ...p, search: searchQuery || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleFilterChange = (key: keyof EventQueryParams, value: any) =>
    setFilters(p => ({ ...p, [key]: value || undefined, page: 1 }));
  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ page: 1, limit: 100, sortBy: 'eventDate', sortOrder: 'desc' });
  };
  const activeFilterCount = Object.keys(filters).filter(
    k => !['page','limit','sortBy','sortOrder','upcoming'].includes(k) && filters[k as keyof EventQueryParams]
  ).length;

  // Split events: first 9 as cards (recent/live), rest as table
  const allEvents = data?.events || [];
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Sort: live/ongoing first, then by date descending
  const sortedEvents = [...allEvents].sort((a, b) => {
    const aLive = a.status === 'ONGOING' || a.status === 'REGISTRATION_OPEN';
    const bLive = b.status === 'ONGOING' || b.status === 'REGISTRATION_OPEN';
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
  });

  const cardEvents = sortedEvents.slice(0, 9);
  const tableEvents = sortedEvents.slice(9).filter(
    e => new Date(e.eventDate) >= oneYearAgo
  );

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* ═══════ HERO ═══════ */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50]">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end">

            {/* Left: Text + stats */}
            <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 pt-28 pb-16 md:pt-36 md:pb-20">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                <Zap className="w-4 h-4" /> Discover & Compete
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
                Skating{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Events</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl max-w-xl mb-8">
                Championships, tournaments, and workshops across India — find your next competition
              </p>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-3">
                {[
                  { icon: Trophy, label: 'National Events', value: '12+' },
                  { icon: MapPin, label: 'Cities', value: '25+' },
                  { icon: Users, label: 'Participants', value: '10K+' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
                    <s.icon className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-bold text-sm">{s.value}</span>
                    <span className="text-white/40 text-sm">{s.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Mascot */}
            <div className="hidden lg:block lg:w-[400px] xl:w-[460px] flex-shrink-0 self-end relative">
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-emerald-500/8 via-transparent to-transparent blur-3xl pointer-events-none" />
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  animate={{ y: [0, -20, 0], rotate: [-0.5, 1.5, -0.5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 40px 55px rgba(0,0,0,0.55)) drop-shadow(0 12px 24px rgba(16,185,129,0.25))' }}
                >
                  <div className="relative w-full h-[420px] xl:h-[460px]">
                    <Image src="/images/mascot/15.webp" alt="SSFI Mascot" fill
                      className="object-contain object-bottom" sizes="460px" priority />
                  </div>
                </motion.div>
                <div className="mx-auto w-36 h-4 rounded-full -mt-2" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.3) 0%, transparent 70%)' }} />
              </motion.div>
            </div>

          </div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
      </section>

      {/* ═══════ SEARCH + FILTERS + GRID — all on light bg ═══════ */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4">
          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name, venue, or city..."
                className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-sm" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border font-medium text-sm transition-all shadow-sm ${
                showFilters || activeFilterCount > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              <SlidersHorizontal className="w-4 h-4" /> Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => { const [s, o] = e.target.value.split('-'); setFilters(p => ({ ...p, sortBy: s as any, sortOrder: o as any })); }}
              className="px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm">
              <option value="eventDate-asc">Date ↑</option>
              <option value="eventDate-desc">Date ↓</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </motion.div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden">
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Level</label>
                      <select value={filters.eventLevel || ''} onChange={(e) => handleFilterChange('eventLevel', e.target.value as EventLevel)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <option value="">All Levels</option>
                        {EVENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                      <select value={filters.eventType || ''} onChange={(e) => handleFilterChange('eventType', e.target.value as EventType)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <option value="">All Types</option>
                        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Discipline</label>
                      <select value={filters.discipline || ''} onChange={(e) => handleFilterChange('discipline', e.target.value as Discipline)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <option value="">All Disciplines</option>
                        {DISCIPLINES.map(d => <option key={d.value} value={d.value}>{d.icon} {d.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">State</label>
                      <select value={filters.stateId || ''} onChange={(e) => handleFilterChange('stateId', e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <option value="">All States</option>
                        {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                    <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-emerald-600 font-medium transition-colors">Clear All</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 text-sm">{data?.total || 0} events found</p>
          </div>

          {/* CONTENT */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative w-14 h-14 mb-4">
                <div className="absolute inset-0 rounded-full border-[3px] border-gray-200" />
                <div className="absolute inset-0 rounded-full border-[3px] border-t-emerald-500 animate-spin" />
              </div>
              <p className="text-gray-400 text-sm">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : allEvents.length > 0 ? (
            <>
              {/* ══════ CARDS SECTION (up to 9 recent events) ══════ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cardEvents.map((event, i) => (
                  <EventCardLight key={event.id} event={event} index={i} />
                ))}
              </div>

              {/* ══════ TABLE SECTION (older events within 1 year) ══════ */}
              {tableEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-12"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <List className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Past Events</h2>
                      <p className="text-xs text-gray-400">Events from the last 12 months</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Event</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Level</th>
                          <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Date</th>
                          <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">Participants</th>
                          <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4 hidden md:table-cell">Winners</th>
                          <th className="py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableEvents.map((event, i) => (
                          <EventTableRow key={event.id} event={event} index={i} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <Trophy className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Events Found</h3>
              <p className="text-gray-400 mb-6">
                {activeFilterCount > 0 ? 'Try adjusting your filters' : 'No upcoming events at the moment. Check back soon!'}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors shadow-md shadow-emerald-200/40">
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

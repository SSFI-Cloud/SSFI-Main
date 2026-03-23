'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Award, MapPin, Star, ArrowRight,
  Calendar, Clock, CheckCircle2, Users, Shield, Sparkles, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api/client';

interface Coach {
  id: number; name: string; photo: string | null; level: number; levelTitle: string;
  state: string; experience: string | null; rating: number | null;
  certifiedSince: string | null; certificateNumber: string | null;
}

interface Program {
  id: number; level: number; title: string; city: string; state: string;
  startDate: string; lastDateToApply: string; totalSeats: number; filledSeats: number;
}

const LEVEL_CFG: Record<number, { gradient: string; badge: string; label: string }> = {
  1: { gradient: 'from-sky-500 to-cyan-500', badge: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Level 1 - Certified Coach' },
  2: { gradient: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Level 2 - Advanced Coach' },
  3: { gradient: 'from-teal-500 to-emerald-500', badge: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Level 3 - Master Coach' },
};

export default function AffiliatedCoachesClient() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setLoading(true);
        const params: any = { page: String(page), limit: '12' };
        if (filterState) params.state = filterState;
        if (filterLevel) params.level = filterLevel;
        if (searchTerm) params.search = searchTerm;
        const res = await api.get('/coach-cert/certified-coaches', { params });
        setCoaches(res.data?.data?.coaches || []);
        setTotalPages(res.data?.data?.meta?.totalPages || 1);
      } catch { console.error('Failed to fetch coaches'); }
      finally { setLoading(false); }
    };
    fetchCoaches();
  }, [page, filterState, filterLevel, searchTerm]);

  useEffect(() => {
    api.get('/coach-cert/programs/active').then(res => {
      setPrograms(res.data?.data || []);
    }).catch(() => {});
  }, []);

  const uniqueStates = Array.from(new Set(coaches.map(c => c.state))).sort();

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50]">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
              <Shield className="w-4 h-4" /> SSFI Certified Network
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
              Affiliated{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Coaches</span>
            </h1>
            <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto">
              Every SSFI-listed coach has completed our rigorous certification program
            </p>
          </motion.div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
      </section>

      {/* SEARCH + GRID */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search by name or state..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 shadow-sm" />
            </div>
            <select value={filterState} onChange={e => { setFilterState(e.target.value); setPage(1); }}
              className="px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm focus:outline-none shadow-sm">
              <option value="">All States</option>
              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(1); }}
              className="px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm focus:outline-none shadow-sm">
              <option value="">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Coach Cards */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gray-300 animate-spin" /></div>
              ) : coaches.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No certified coaches found yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Coaches will appear here once they complete certification.</p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {coaches.map((coach, i) => {
                      const lc = LEVEL_CFG[coach.level] || LEVEL_CFG[1];
                      return (
                        <motion.div key={coach.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                          className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                          <div className={`h-1 bg-gradient-to-r ${lc.gradient}`} />
                          <div className="p-5">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 ring-2 ring-gray-100">
                                {coach.photo ? (
                                  <Image src={coach.photo} alt={coach.name} fill className="object-cover" sizes="56px" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <Users className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{coach.name}</h3>
                                <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full border ${lc.badge}`}>
                                  <Shield className="w-2.5 h-2.5" /> {lc.label}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 mb-3">
                              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-teal-400" />{coach.state}</span>
                              {coach.experience && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-sky-400" />{coach.experience}</span>}
                              {coach.certifiedSince && <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-emerald-400" />Since {coach.certifiedSince}</span>}
                              {coach.rating && (
                                <span className="flex items-center gap-1.5 text-teal-500"><Star className="w-3 h-3 fill-teal-400" />{coach.rating.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${page === i + 1 ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#162d50]" />
                <div className="relative p-6">
                  <Sparkles className="w-8 h-8 text-emerald-400 mb-4" />
                  <h3 className="text-lg font-extrabold text-white mb-2">Become a Coach</h3>
                  <p className="text-white/40 text-sm mb-5 leading-relaxed">Get SSFI-certified and join our growing network of professional skating coaches.</p>
                  <Link href="/coach-certification" className="group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:scale-[1.03] transition-all shadow-lg shadow-emerald-500/20">
                    Apply Now <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-base font-bold text-gray-900">Upcoming Programs</h3>
                </div>
                <div className="p-4 space-y-2.5">
                  {programs.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No upcoming programs</p>
                  ) : programs.slice(0, 3).map(p => (
                    <Link key={p.id} href="/coach-certification" className="block p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-emerald-200 transition-all">
                      <h4 className="text-gray-900 text-sm font-bold mb-1.5">{p.title}</h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{new Date(p.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.city}</span>
                      </div>
                      <span className="inline-block mt-2 text-emerald-600 text-[11px] font-bold">{Math.max(0, p.totalSeats - p.filledSeats)} spots left</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">Certification Tiers</h3>
                <div className="space-y-2.5">
                  {[
                    { level: 'Level 1', desc: 'Beginner training & fundamentals', gradient: 'from-sky-500 to-cyan-500' },
                    { level: 'Level 2', desc: 'Competition prep & advanced techniques', gradient: 'from-emerald-500 to-teal-500' },
                    { level: 'Level 3', desc: 'National-level athlete development', gradient: 'from-teal-500 to-emerald-500' },
                  ].map(l => (
                    <div key={l.level} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${l.gradient} flex items-center justify-center flex-shrink-0`}>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm font-bold">{l.level}</p>
                        <p className="text-gray-400 text-[11px]">{l.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

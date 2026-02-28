'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Award, ArrowRight, Calendar, MapPin, IndianRupee, Users,
  GraduationCap, CheckCircle2, Clock, Loader2, Sparkles,
  Zap, Heart, Star,
} from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api/client';

interface Program {
  id: number;
  category: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  lastDateToApply: string;
  venue: string;
  venueAddress: string | null;
  city: string;
  state: string;
  price: string;
  includesText: string | null;
  totalSeats: number;
  filledSeats: number;
  eligibilityCriteria: string | null;
  minAge: number | null;
  maxAge: number | null;
  ageGroup: string | null;
  status: string;
  organizedBy: string | null;
  approvedBy: string | null;
}

const CATEGORY_CFG: Record<string, { label: string; gradient: string; border: string; iconBg: string; icon: typeof Zap }> = {
  SPEED_SKATING:  { label: 'Speed Skating',  gradient: 'from-sky-500 to-cyan-500',      border: 'border-sky-200',     iconBg: 'bg-sky-100 text-sky-600',     icon: Zap },
  ARTISTIC:       { label: 'Artistic Skating', gradient: 'from-violet-500 to-purple-500', border: 'border-violet-200', iconBg: 'bg-violet-100 text-violet-600', icon: Star },
  INLINE_HOCKEY:  { label: 'Inline Hockey',   gradient: 'from-amber-500 to-orange-500',  border: 'border-amber-200',  iconBg: 'bg-amber-100 text-amber-600',  icon: Award },
  GENERAL:        { label: 'General Skating',  gradient: 'from-emerald-500 to-teal-500',  border: 'border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600', icon: Heart },
};
const DEFAULT_CFG = { label: 'Program', gradient: 'from-gray-500 to-slate-500', border: 'border-gray-200', iconBg: 'bg-gray-100 text-gray-600', icon: GraduationCap };

const getCfg = (cat: string) => CATEGORY_CFG[cat] || DEFAULT_CFG;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BeginnerCertClient() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/beginner-cert/programs/active')
      .then(res => {
        setPrograms(res.data?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by category
  const categories = [...new Set(programs.map(p => p.category))];

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50]">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-0">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 pt-28 pb-16 md:pt-36 md:pb-20"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-bold mb-6">
                <Sparkles className="w-4 h-4" /> SSFI Beginner Certification
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
                Beginner{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
                  Certification
                </span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl max-w-xl mb-8">
                Start your speed skating journey with SSFI&apos;s structured beginner programs.
                Open to all ages — learn the fundamentals, build confidence, and earn your certificate.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/beginner-program"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/80 font-semibold hover:bg-white/10 transition-all"
                >
                  <GraduationCap className="w-4 h-4" /> Learn About the Program
                </Link>
              </div>
            </motion.div>

            {/* Right: Mascot */}
            <div className="hidden lg:block lg:w-[400px] xl:w-[460px] flex-shrink-0 self-end relative">
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-violet-500/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  animate={{ y: [0, -20, 0], rotate: [-0.5, 1.5, -0.5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 40px 55px rgba(0,0,0,0.55)) drop-shadow(0 12px 24px rgba(139,92,246,0.25))' }}
                >
                  <div className="relative w-full h-[420px] xl:h-[460px]">
                    <Image
                      src="/images/mascot/13.webp"
                      alt="SSFI Beginner Skating Mascot"
                      fill
                      className="object-contain object-bottom"
                      sizes="460px"
                      priority
                    />
                  </div>
                </motion.div>
                <div
                  className="mx-auto w-36 h-4 rounded-full -mt-2"
                  style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)' }}
                />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }} />
      </section>

      {/* ─── WHY CERTIFY ─── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-extrabold text-gray-900 mb-8 text-center"
          >
            Why Get Certified?
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Award, title: 'Official Certificate', desc: 'SSFI-recognized beginner certification for your skating journey' },
              { icon: GraduationCap, title: 'Structured Learning', desc: 'Step-by-step fundamentals: stance, balance, braking, and turns' },
              { icon: CheckCircle2, title: 'Safety First', desc: 'Learn proper safety protocols, gear usage, and fall techniques' },
              { icon: Users, title: 'All Ages Welcome', desc: 'Programs designed for children, teens, and adult beginners alike' },
            ].map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{b.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROGRAMS ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
              Active Certification Programs
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Browse upcoming programs and register before the deadline. Limited seats available.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
              <p className="text-gray-400">Loading programs...</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <GraduationCap className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Programs</h3>
              <p className="text-gray-500 mb-6">
                There are no beginner certification programs available right now.
                Check back soon for upcoming programs.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:underline"
              >
                Contact us for enquiries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {categories.map(category => {
                const catPrograms = programs.filter(p => p.category === category);
                const cfg = getCfg(category);
                const CatIcon = cfg.icon;
                return (
                  <div key={category}>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r ${cfg.gradient}`}>
                        <CatIcon className="w-4 h-4 text-white" />
                      </span>
                      {cfg.label}
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catPrograms.map((p, i) => {
                        const spotsLeft = Math.max(0, p.totalSeats - p.filledSeats);
                        const pct = p.totalSeats > 0 ? (p.filledSeats / p.totalSeats) * 100 : 0;
                        const deadlinePassed = new Date(p.lastDateToApply) < new Date();
                        const pcfg = getCfg(p.category);

                        return (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className={`bg-white rounded-2xl border ${pcfg.border} overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col`}
                          >
                            <div className={`h-1.5 bg-gradient-to-r ${pcfg.gradient}`} />
                            <div className="p-6 flex flex-col flex-1">
                              {/* Age group badge */}
                              {p.ageGroup && (
                                <span className={`self-start px-3 py-1 rounded-full text-xs font-bold border mb-3 ${pcfg.iconBg.replace('text-', 'text-').replace('bg-', 'bg-')} border-current/20`}>
                                  Ages {p.ageGroup}
                                </span>
                              )}

                              <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                              {p.description && (
                                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{p.description}</p>
                              )}

                              <div className="space-y-2.5 mb-5 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                  {formatDate(p.startDate)} &mdash; {formatDate(p.endDate)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                  {p.venue}, {p.city}, {p.state}
                                </div>
                                <div className="flex items-center gap-2">
                                  <IndianRupee className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                  &#8377;{Number(p.price).toLocaleString()}
                                  {p.includesText && (
                                    <span className="text-xs text-gray-400">({p.includesText})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                  Apply by: {formatDate(p.lastDateToApply)}
                                </div>
                                {p.eligibilityCriteria && (
                                  <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-gray-400 line-clamp-2">{p.eligibilityCriteria}</span>
                                  </div>
                                )}
                              </div>

                              {/* Seats progress */}
                              <div className="mb-5 mt-auto">
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-gray-400">Seats</span>
                                  <span className="text-gray-600 font-medium">{p.filledSeats}/{p.totalSeats}</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${pcfg.gradient} transition-all duration-500`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                {spotsLeft > 0 && spotsLeft <= 10 && (
                                  <p className="text-amber-600 text-xs font-medium mt-1.5">
                                    Only {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left!
                                  </p>
                                )}
                              </div>

                              {/* CTA */}
                              {!deadlinePassed && spotsLeft > 0 ? (
                                <Link
                                  href={`/beginner-certification/register?programId=${p.id}`}
                                  className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 text-white font-bold text-sm shadow-lg shadow-violet-500/15 hover:shadow-violet-500/30 hover:scale-[1.02] transition-all"
                                >
                                  Register Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                              ) : (
                                <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium text-center">
                                  {deadlinePassed ? 'Deadline Passed' : 'Fully Booked'}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── FAQ / INFO ─── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-extrabold text-gray-900 mb-8 text-center"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {[
              { q: 'Who can apply for beginner certification?', a: 'Anyone interested in learning skating — children, teens, and adults. No prior experience required. Each program may have specific age group requirements.' },
              { q: 'What does the certification include?', a: 'Structured coaching sessions covering fundamentals (stance, balance, braking, turns), safety training, gear orientation, and an official SSFI beginner certificate upon completion.' },
              { q: 'Do I need to bring my own skating gear?', a: 'Check each program\'s details. Some programs include gear as part of the fee, while others require participants to bring their own skates and safety equipment.' },
              { q: 'How long are the programs?', a: 'Program duration varies — typically ranging from a single day intensive workshop to multi-day training camps. Check individual program dates for details.' },
              { q: 'What happens after completing beginner certification?', a: 'After earning your beginner certificate, you can join local skating clubs, participate in district-level events, and progress towards advanced certifications or competitive skating.' },
            ].map((faq, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group bg-gray-50 rounded-xl border border-gray-100 hover:border-violet-200 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 text-gray-900 font-semibold text-[15px] select-none">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl font-light ml-4">+</span>
                </summary>
                <p className="px-5 pb-5 text-gray-500 text-sm leading-relaxed -mt-1">
                  {faq.a}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#162d50] to-[#0f1d35]" />
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
            <div className="relative p-10 md:p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                Have Questions?
              </h2>
              <p className="text-white/50 max-w-xl mx-auto mb-8 text-lg leading-relaxed">
                Reach out to us for program details, group bookings, or custom training requests.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-sky-500 text-white rounded-xl font-bold hover:scale-[1.03] transition-all shadow-lg shadow-violet-500/25"
                >
                  Contact Us <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/beginner-program"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/15"
                >
                  About the Program
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

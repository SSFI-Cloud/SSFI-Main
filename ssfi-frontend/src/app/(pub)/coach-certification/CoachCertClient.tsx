'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Award, ArrowRight, Calendar, MapPin, IndianRupee, Users,
  GraduationCap, CheckCircle2, Clock, Loader2, Shield,
  BookOpen, Trophy, Star,
} from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api/client';

interface Program {
  id: number; level: number; title: string; description: string | null;
  startDate: string; endDate: string; lastDateToApply: string;
  venue: string; city: string; state: string; price: string;
  includesText: string | null; totalSeats: number; filledSeats: number;
  eligibilityCriteria: string | null; status: string;
  organizedBy: string | null; approvedBy: string | null;
}

const LEVEL_CFG: Record<number, { label: string; gradient: string; border: string; iconBg: string }> = {
  1: { label: 'Level 1 — Certified Coach', gradient: 'from-sky-500 to-cyan-500', border: 'border-sky-200', iconBg: 'bg-sky-100 text-sky-600' },
  2: { label: 'Level 2 — Advanced Coach', gradient: 'from-emerald-500 to-teal-500', border: 'border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600' },
  3: { label: 'Level 3 — Master Coach', gradient: 'from-teal-500 to-emerald-500', border: 'border-teal-200', iconBg: 'bg-teal-100 text-teal-600' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CoachCertClient() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coach-cert/programs/active').then(res => {
      setPrograms(res.data?.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const grouped = { 1: programs.filter(p => p.level === 1), 2: programs.filter(p => p.level === 2), 3: programs.filter(p => p.level === 3) };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50]">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-0">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 pt-28 pb-16 md:pt-36 md:pb-20"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                <GraduationCap className="w-4 h-4" /> SSFI Coach Certification
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
                Coach{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Certification</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl max-w-xl mb-8">
                Become an officially certified SSFI speed skating coach.
                Choose your level, master the curriculum, and shape the next generation of champions.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/affiliated-coaches"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/80 font-semibold hover:bg-white/10 transition-all">
                  <Shield className="w-4 h-4" /> View Certified Coaches
                </Link>
              </div>
            </motion.div>

            {/* Right: Mascot */}
            <div className="hidden lg:block lg:w-[400px] xl:w-[460px] flex-shrink-0 self-end relative">
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-emerald-500/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
              <motion.div
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  animate={{ y: [0, -20, 0], rotate: [-0.5, 1.5, -0.5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 40px 55px rgba(0,0,0,0.55)) drop-shadow(0 12px 24px rgba(16,185,129,0.25))' }}
                >
                  <div className="relative w-full h-[420px] xl:h-[460px]">
                    <Image
                      src="/images/mascot/coachcert.webp"
                      alt="SSFI Coach Mascot"
                      fill
                      className="object-contain object-bottom"
                      sizes="460px"
                      priority
                    />
                  </div>
                </motion.div>
                <div className="mx-auto w-36 h-4 rounded-full -mt-2"
                  style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.3) 0%, transparent 70%)' }} />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
      </section>

      {/* ─── WHY BECOME A CERTIFIED COACH ─── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl font-extrabold text-gray-900 mb-8 text-center"
          >
            Why Get Certified?
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Award, title: 'Official SSFI Certificate', desc: 'Nationally recognized coaching credential valid across all SSFI-affiliated organizations' },
              { icon: Users, title: 'Coach Directory Listing', desc: 'Get featured in the public SSFI certified coaches directory for visibility' },
              { icon: BookOpen, title: 'Comprehensive Curriculum', desc: 'Master technique coaching, safety protocols, competition rules, and athlete development' },
              { icon: Trophy, title: 'Career Advancement', desc: 'Progress from Level 1 to Master Coach — unlock eligibility for national-level coaching roles' },
            ].map((b, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{b.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CERTIFICATION LEVELS OVERVIEW ─── */}
      <section className="py-16 bg-[#f5f6f8]">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">Certification Levels</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Three progressive levels designed to develop coaches from foundational skills to master-level expertise.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { level: 1, title: 'Level 1 — Certified Coach', desc: 'Foundation coaching skills. Learn basic skating techniques, safety management, beginner athlete development, and session planning.', icon: Star },
              { level: 2, title: 'Level 2 — Advanced Coach', desc: 'Intermediate-to-advanced coaching. Covers race strategy, advanced drills, competition preparation, nutrition basics, and injury prevention.', icon: Award },
              { level: 3, title: 'Level 3 — Master Coach', desc: 'Elite-level coaching certification. National team preparation, sports science integration, periodization, and mentoring other coaches.', icon: Trophy },
            ].map((l, i) => {
              const lc = LEVEL_CFG[l.level];
              return (
                <motion.div
                  key={l.level} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`bg-white rounded-2xl border ${lc.border} p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all`}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${lc.gradient} rounded-full mb-5`} />
                  <div className={`w-10 h-10 rounded-xl ${lc.iconBg} flex items-center justify-center mb-4`}>
                    <l.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{l.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{l.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ACTIVE PROGRAMS ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
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
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-gray-400">Loading programs...</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <GraduationCap className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Programs</h3>
              <p className="text-gray-500 mb-6">
                There are no coach certification programs available right now.
                Check back soon for upcoming programs.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:underline">
                Contact us for enquiries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {([1, 2, 3] as const).map(level => {
                const progs = grouped[level];
                if (progs.length === 0) return null;
                const lc = LEVEL_CFG[level];
                return (
                  <div key={level}>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r ${lc.gradient}`}>
                        <GraduationCap className="w-4 h-4 text-white" />
                      </span>
                      {lc.label}
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {progs.map((p, i) => {
                        const spotsLeft = Math.max(0, p.totalSeats - p.filledSeats);
                        const pct = p.totalSeats > 0 ? (p.filledSeats / p.totalSeats) * 100 : 0;
                        const deadlinePassed = new Date(p.lastDateToApply) < new Date();
                        return (
                          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                            className={`bg-white rounded-2xl border ${lc.border} overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col`}>
                            <div className={`h-1.5 bg-gradient-to-r ${lc.gradient}`} />
                            <div className="p-6 flex flex-col flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                              {p.description && (
                                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{p.description}</p>
                              )}

                              <div className="space-y-2.5 mb-5 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  {formatDate(p.startDate)} &mdash; {formatDate(p.endDate)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                  {p.venue}, {p.city}, {p.state}
                                </div>
                                <div className="flex items-center gap-2">
                                  <IndianRupee className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                  &#8377;{Number(p.price).toLocaleString()}
                                  {p.includesText && <span className="text-xs text-gray-400">({p.includesText})</span>}
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
                                  <div className={`h-full rounded-full bg-gradient-to-r ${lc.gradient} transition-all duration-500`}
                                    style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                {spotsLeft > 0 && spotsLeft <= 10 && (
                                  <p className="text-teal-600 text-xs font-medium mt-1.5">
                                    Only {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left!
                                  </p>
                                )}
                              </div>

                              {/* CTA */}
                              {!deadlinePassed && spotsLeft > 0 ? (
                                <Link href={`/coach-certification/register?programId=${p.id}`}
                                  className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all">
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

      {/* ─── FAQ ─── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl font-extrabold text-gray-900 mb-8 text-center"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {[
              { q: 'Who is eligible to apply for coach certification?', a: 'Anyone with a genuine interest in coaching skating can apply for Level 1. Level 2 requires a valid Level 1 certificate, and Level 3 requires Level 2 certification plus documented coaching experience at the district/state level.' },
              { q: 'What does the certification program cover?', a: 'Each level covers progressively advanced topics — from basic technique coaching and safety management (Level 1), to race strategy and competition preparation (Level 2), to elite athlete development and sports science (Level 3).' },
              { q: 'How long are the certification programs?', a: 'Program duration varies by level. Level 1 is typically 3–5 days, Level 2 is 5–7 days, and Level 3 may span up to 10 days including practical assessments. Check individual program listings for exact dates.' },
              { q: 'Will I be listed as a certified coach after completion?', a: 'Yes! Upon successful completion, your profile is added to the official SSFI Certified Coaches Directory on our website. Clubs and parents can find you for coaching opportunities.' },
              { q: 'Is there an exam or assessment?', a: 'Yes, each level includes both theoretical and practical assessments. You must demonstrate competency in technique demonstration, session planning, and safety protocols to receive your certificate.' },
            ].map((faq, i) => (
              <motion.details
                key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="group bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 text-gray-900 font-semibold text-[15px] select-none">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl font-light ml-4">+</span>
                </summary>
                <p className="px-5 pb-5 text-gray-500 text-sm leading-relaxed -mt-1">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#162d50] to-[#0f1d35]" />
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
            <div className="relative p-10 md:p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                Ready to Start Your Coaching Journey?
              </h2>
              <p className="text-white/50 max-w-xl mx-auto mb-8 text-lg leading-relaxed">
                Reach out to us for program details, group enrollments, or custom training arrangements for your organization.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:scale-[1.03] transition-all shadow-lg shadow-emerald-500/25">
                  Contact Us <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/affiliated-coaches"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/15">
                  View Certified Coaches
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

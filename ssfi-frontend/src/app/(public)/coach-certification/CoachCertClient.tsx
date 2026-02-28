'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Award, ArrowRight, Calendar, MapPin, IndianRupee, Users,
  GraduationCap, CheckCircle2, Clock, Loader2, Shield,
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
  2: { label: 'Level 2 — Advanced Coach', gradient: 'from-violet-500 to-purple-500', border: 'border-violet-200', iconBg: 'bg-violet-100 text-violet-600' },
  3: { label: 'Level 3 — Master Coach', gradient: 'from-amber-500 to-orange-500', border: 'border-amber-200', iconBg: 'bg-amber-100 text-amber-600' },
};

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
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0c2340] to-[#162d50]">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
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
                Get officially certified by SSFI. Choose your level and begin your coaching journey.
              </p>
              <Link href="/affiliated-coaches"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/80 font-semibold hover:bg-white/10 transition-all">
                <Shield className="w-4 h-4" /> View Certified Coaches
              </Link>
            </motion.div>

            {/* Right: Mascot */}
            <div className="hidden lg:block lg:w-[400px] xl:w-[460px] flex-shrink-0 self-end relative">
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-emerald-500/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
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
                <div className="mx-auto w-36 h-4 rounded-full -mt-2" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.3) 0%, transparent 70%)' }} />
              </motion.div>
            </div>

          </div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Award, title: 'Official SSFI Certificate', desc: 'Recognized across all SSFI-affiliated organizations' },
              { icon: Users, title: 'Coach Directory Listing', desc: 'Get listed in our public certified coaches directory' },
              { icon: GraduationCap, title: 'Comprehensive Training', desc: 'Technique, safety, rules, and athlete development' },
            ].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gray-300 animate-spin" /></div>
          ) : programs.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Programs</h3>
              <p className="text-gray-500">Check back soon for upcoming certification programs.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {([1, 2, 3] as const).map(level => {
                const progs = grouped[level];
                if (progs.length === 0) return null;
                const lc = LEVEL_CFG[level];
                return (
                  <div key={level}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <span className={`inline-block w-3 h-3 rounded-full bg-gradient-to-r ${lc.gradient}`} />
                      {lc.label}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {progs.map((p, i) => {
                        const spotsLeft = Math.max(0, p.totalSeats - p.filledSeats);
                        const pct = p.totalSeats > 0 ? (p.filledSeats / p.totalSeats) * 100 : 0;
                        const deadlinePassed = new Date(p.lastDateToApply) < new Date();
                        return (
                          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className={`bg-white rounded-2xl border ${lc.border} overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all`}>
                            <div className={`h-1.5 bg-gradient-to-r ${lc.gradient}`} />
                            <div className="p-6">
                              <h3 className="text-lg font-bold text-gray-900 mb-3">{p.title}</h3>
                              <div className="space-y-2.5 mb-5 text-sm text-gray-500">
                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-500" />{new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &mdash; {new Date(p.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-400" />{p.venue}, {p.city}, {p.state}</div>
                                <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-amber-500" />&#8377;{Number(p.price).toLocaleString()}{p.includesText && <span className="text-xs text-gray-400">({p.includesText})</span>}</div>
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-violet-400" />Apply by: {new Date(p.lastDateToApply).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              </div>
                              <div className="mb-5">
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-gray-400">Seats</span>
                                  <span className="text-gray-600 font-medium">{p.filledSeats}/{p.totalSeats}</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                  <div className={`h-full rounded-full bg-gradient-to-r ${lc.gradient}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                {spotsLeft > 0 && spotsLeft <= 10 && <p className="text-amber-600 text-xs font-medium mt-1.5">Only {spotsLeft} spots left!</p>}
                              </div>
                              {!deadlinePassed && spotsLeft > 0 ? (
                                <Link href={`/coach-certification/register?programId=${p.id}`}
                                  className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/30 transition-all">
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
    </div>
  );
}

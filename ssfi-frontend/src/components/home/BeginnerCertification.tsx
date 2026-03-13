'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Calendar, MapPin, Clock,
  CheckCircle2, Sparkles, Users, Medal,
} from 'lucide-react';
const benefits = [
  'Official SSFI Level 1 Beginner Certification',
  'Balance, posture & speed technique training',
  'Performance-based Gold, Silver & Bronze medals',
  'Structured national training standards',
  'Safety protocols & rink discipline',
  'Clear pathway to district & state events',
];

const fallbackBatch = {
  title: 'Beginner Certification Program',
  date: 'Coming Soon',
  location: 'TBA',
  spotsLeft: 0,
  totalSpots: 40,
  fee: '₹2,000',
  deadline: 'TBA',
  id: null as number | null,
};

interface BeginnerCertificationProps {
  programs?: any[];
}

export default function BeginnerCertification({ programs }: BeginnerCertificationProps) {
  const [batch, setBatch] = useState(fallbackBatch);

  // Accept programs from parent (aggregate endpoint)
  useEffect(() => {
    if (Array.isArray(programs) && programs.length > 0) {
      const p = programs[0]; // Show first active program
      setBatch({
        title: p.title,
        date:
          new Date(p.startDate).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) +
          ' - ' +
          new Date(p.endDate).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        location: p.city + ', ' + p.state,
        spotsLeft: Math.max(0, p.totalSeats - p.filledSeats),
        totalSpots: p.totalSeats,
        fee: '₹' + Number(p.price).toLocaleString(),
        deadline: new Date(p.lastDateToApply).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        id: p.id,
      });
    }
  }, [programs]);

  const pct =
    batch.totalSpots > 0
      ? ((batch.totalSpots - batch.spotsLeft) / batch.totalSpots) * 100
      : 0;

  // If we have a live program id, link directly to its registration page;
  // otherwise link to the programs listing page.
  const registerHref = batch.id
    ? `/beginner-certification/register?programId=${batch.id}`
    : '/beginner-certification';

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl shadow-2xl overflow-hidden px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
          style={{ backgroundImage: 'url(/images/hero/close-1.webp)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gray-950/85 rounded-3xl" />
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              For Young Champions
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-6 tracking-tight leading-tight">
              Beginner{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                Certification
              </span>
              {' '}Program
            </h2>
            <p className="text-lg text-white/45 mb-10 leading-relaxed max-w-lg">
              A structured national-level initiative by SSFI designed to introduce young skaters to the fundamentals of speed skating.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/60 text-sm">{b}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/beginner-certification"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
              >
                View All Programs <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Upcoming Events
              </Link>
            </div>
          </motion.div>

          {/* Right - Batch Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-8 py-5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <Medal className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
                        {batch.id ? 'Upcoming Batch' : 'Coming Soon'}
                      </p>
                      <h3 className="text-white font-headline font-bold">{batch.title}</h3>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    {batch.spotsLeft > 0 ? 'OPEN' : 'COMING SOON'}
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/60">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">{batch.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">{batch.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <Clock className="w-5 h-5 text-teal-400" />
                    <span className="text-sm">Deadline: {batch.deadline}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/40">Seats Filled</span>
                    <span className="text-white font-medium">
                      {batch.totalSpots - batch.spotsLeft}/{batch.totalSpots}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    />
                  </div>
                  {batch.spotsLeft > 0 && (
                    <p className="text-teal-400 text-xs font-medium mt-2">
                      Only {batch.spotsLeft} spots remaining!
                    </p>
                  )}
                </div>

                {/* Medal tiers preview */}
                <div className="flex items-center justify-center gap-6 py-3">
                  {[
                    { emoji: '🥇', label: 'Gold', marks: '70–100' },
                    { emoji: '🥈', label: 'Silver', marks: '40–69' },
                    { emoji: '🥉', label: 'Bronze', marks: '30–39' },
                  ].map((m, i) => (
                    <div key={i} className="text-center">
                      <span className="text-2xl">{m.emoji}</span>
                      <p className="text-white/60 text-[11px] font-medium mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-white/30 text-xs">Program Fee</p>
                    <p className="text-2xl font-headline font-bold text-white">{batch.fee}</p>
                  </div>
                  <div className="flex items-center gap-1 text-white/30">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">{batch.spotsLeft > 0 ? `${batch.spotsLeft} left` : 'TBA'}</span>
                  </div>
                </div>

                <Link
                  href={registerHref}
                  className="group w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
                >
                  {batch.id ? 'Enroll Your Child' : 'View Programs'}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

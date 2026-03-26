'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Shield, CreditCard, Trophy, Users, Globe, Award, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  { icon: CreditCard, title: 'Official ID Card', description: 'Get your official SSFI membership card with unique identification number', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderTint: 'border-emerald-200/40', glassBg: 'from-emerald-500/[0.04]' },
  { icon: Trophy, title: 'National Recognition', description: 'Participate in nationally recognized skating championships and events', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderTint: 'border-emerald-200/40', glassBg: 'from-emerald-500/[0.04]' },
  { icon: Shield, title: 'Insurance Coverage', description: 'Comprehensive insurance coverage for all registered athletes', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderTint: 'border-emerald-200/40', glassBg: 'from-emerald-500/[0.04]' },
  { icon: Users, title: 'Expert Coaching', description: 'Access to certified coaches and training programs nationwide', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderTint: 'border-emerald-200/40', glassBg: 'from-emerald-500/[0.04]' },
  { icon: Globe, title: 'International Events', description: 'Opportunities to represent India in international competitions', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderTint: 'border-emerald-200/40', glassBg: 'from-emerald-500/[0.04]' },
  { icon: Award, title: 'Certificates & Awards', description: 'Digital certificates and awards for all event participations', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderTint: 'border-emerald-200/40', glassBg: 'from-emerald-500/[0.04]' },
];

const tags = ['#Students', '#Athletes', '#Coaches', '#Schools', '#Clubs', '#State Associations'];

interface WhyJoinSSFIProps {
  stats?: { students?: number; states?: number; clubs?: number };
}

const WhyJoinSSFI = ({ stats: propStats }: WhyJoinSSFIProps) => {
  const [stats, setStats] = useState({ students: 10000, states: 28, clubs: 500 });

  // Update from parent-provided stats (aggregate endpoint)
  useEffect(() => {
    if (propStats) {
      setStats({
        students: propStats.students || 10000,
        states: propStats.states || 28,
        clubs: propStats.clubs || 500,
      });
    }
  }, [propStats]);

  return (
    <section className="relative py-28 overflow-hidden bg-gray-50">
      {/* Ghost "SSFI" watermark */}
      <div className="absolute inset-0 flex items-start justify-center pt-16 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <span className="font-hero italic font-black text-[36vw] lg:text-[26vw] leading-none tracking-tight text-gray-400/20 whitespace-nowrap">S.S.F.I</span>
      </div>
      {/* Dotted pattern */}
      <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      {/* Skating SVG decorations */}
      <svg viewBox="0 0 100 100" className="absolute top-20 right-8 w-24 h-24 opacity-10 text-emerald-500" fill="none"><path d="M30 70 Q50 20 70 70" stroke="currentColor" strokeWidth="2" /><circle cx="35" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" /><circle cx="65" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" /></svg>
      <svg viewBox="0 0 100 100" className="absolute bottom-16 left-6 w-20 h-20 opacity-10 text-emerald-500 rotate-[-15deg]" fill="none"><path d="M30 70 Q50 20 70 70" stroke="currentColor" strokeWidth="2" /><circle cx="35" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" /><circle cx="65" cy="75" r="5" stroke="currentColor" strokeWidth="1.5" /></svg>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[180px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top: Text + Image */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-500 text-sm font-medium mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Why Choose SSFI
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 mb-6 tracking-tight leading-tight">
              Built for every skater,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">at every level</span>
            </h2>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
              Be part of India&apos;s premier skating federation and unlock exclusive benefits — from official ID cards and insurance to national championships and international representation.
            </p>
            <Link href="/auth/register" className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 text-white font-bold hover:bg-gray-800 shadow-lg transition-all">
              Join SSFI Today <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/60">
              <Image src="/images/whyssfi.webp" alt="SSFI Athletes" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-emerald-900/10" />
              {/* Glassmorphism stats card overlay */}
              <div className="absolute bottom-5 left-5 right-5 bg-white/80 backdrop-blur-xl rounded-xl p-5 border border-white/60 shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center flex-1">
                    <p className="text-2xl sm:text-3xl font-headline font-bold text-emerald-600">{stats.students.toLocaleString()}+</p>
                    <p className="text-xs text-gray-400 mt-1">Active Members</p>
                  </div>
                  <div className="h-10 w-px bg-gray-200/60" />
                  <div className="text-center flex-1">
                    <p className="text-2xl sm:text-3xl font-headline font-bold text-emerald-600">{stats.states}</p>
                    <p className="text-xs text-gray-400 mt-1">State Associations</p>
                  </div>
                  <div className="h-10 w-px bg-gray-200/60" />
                  <div className="text-center flex-1">
                    <p className="text-2xl sm:text-3xl font-headline font-bold text-teal-600">{stats.clubs}+</p>
                    <p className="text-xs text-gray-400 mt-1">Affiliated Clubs</p>
                  </div>
                </div>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="absolute -top-4 -right-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 shadow-xl shadow-emerald-500/30">
              <Trophy className="w-8 h-8 text-white mb-1" />
              <p className="text-xs font-bold text-white">Official</p>
              <p className="text-[11px] text-white/80">Federation</p>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══ GLASSMORPHISM FEATURE CARDS ═══ */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border ${f.borderTint} shadow-md shadow-gray-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
              >
                {/* Glassmorphism tint */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.glassBg} to-transparent pointer-events-none`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-headline font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tags */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="mt-14 text-center">
          <p className="text-gray-400 text-sm mb-3">For every kind of skater</p>
          <div className="flex flex-wrap justify-center gap-3">
            {tags.map((t) => (
              <span key={t} className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 text-sm font-medium shadow-sm hover:border-emerald-200 hover:text-emerald-600 transition-colors cursor-default">{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyJoinSSFI;

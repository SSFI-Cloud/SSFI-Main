'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function MeetRollie() {
  return (
    <section className="relative py-28 overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-white">
      {/* Background glows */}
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-amber-100/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-emerald-100/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating skate SVGs */}
      <motion.svg
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        viewBox="0 0 80 80"
        className="absolute top-20 right-16 w-14 h-14 opacity-15 text-amber-400"
        fill="none"
      >
        <path d="M20 55 Q40 15 60 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="25" cy="60" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="55" cy="60" r="5" stroke="currentColor" strokeWidth="2" />
      </motion.svg>

      <motion.svg
        animate={{ y: [0, 8, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
        viewBox="0 0 60 60"
        className="absolute bottom-24 left-12 w-12 h-12 opacity-15 text-emerald-400"
        fill="none"
      >
        <path d="M15 40 Q30 10 45 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="45" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="40" cy="45" r="4" stroke="currentColor" strokeWidth="1.5" />
      </motion.svg>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left — Rollie Image ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center"
          >
            {/* Outer wrapper — no 3D transform context so badges stay visible */}
            <div className="relative w-72 sm:w-80 md:w-96">

              {/* Glow ring */}
              <div className="absolute -inset-8 bg-gradient-to-br from-amber-200/30 via-emerald-200/20 to-blue-200/30 rounded-3xl blur-3xl pointer-events-none" />

              {/* Card frame */}
              <div className="relative rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-2xl shadow-amber-200/50 overflow-hidden">
                {/* Image area */}
                <div className="relative h-80 flex items-end justify-center overflow-visible">
                  <div className="relative w-full h-full" style={{ filter: 'drop-shadow(0 24px 36px rgba(0,0,0,0.18))' }}>
                    <Image
                      src="/images/mascot/16.webp"
                      alt="Rollie — SSFI Mascot"
                      fill
                      className="object-contain object-bottom"
                      sizes="(max-width: 768px) 288px, 384px"
                    />
                  </div>
                </div>
                {/* Label inside card */}
                <div className="px-6 pb-5 pt-2 text-center">
                  <p className="text-sm font-semibold text-amber-600 tracking-wide uppercase">SSFI Official Mascot</p>
                </div>
              </div>

              {/* ── Floating badges — OUTSIDE card, in normal stacking context ── */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-amber-200/50 shadow-lg z-20 flex items-center gap-1"
              >
                <span className="text-lg">⚡</span>
                <span className="text-xs font-bold text-gray-700">Speed</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-emerald-200/50 shadow-lg z-20 flex items-center gap-1"
              >
                <span className="text-lg">🎯</span>
                <span className="text-xs font-bold text-gray-700">Balance</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-1/3 -right-8 bg-white/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-blue-200/50 shadow-lg z-20 flex items-center gap-1"
              >
                <span className="text-lg">🔥</span>
                <span className="text-xs font-bold text-gray-700">Fearless</span>
              </motion.div>

            </div>
          </motion.div>

          {/* ── Right — Bio ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium mb-6">
              🐦 Our Mascot
            </span>

            <h2 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 mb-2 tracking-tight leading-tight">
              Meet{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500">
                Rollie
              </span>
            </h2>

            <p className="text-xl text-gray-600 font-medium mb-6">
              Our energetic mascot inspired by the Indian Roller bird.
            </p>

            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Rollie embodies speed, balance, and fearless spirit — encouraging young skaters to push limits while celebrating Indian pride. Seen at events, on kits, and across our social channels, Rollie reminds every athlete to skate with confidence, discipline, and joy.
            </p>

            {/* Tagline */}
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-200/50 via-emerald-200/40 to-blue-200/50 rounded-2xl blur-lg" />
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl px-8 py-5 border border-amber-200/40 shadow-sm">
                <p className="text-lg font-headline font-bold text-gray-800">
                  Skate with <span className="text-amber-500">Rollie</span> — Skate with <span className="text-emerald-500">Pride</span>.
                </p>
              </div>
            </div>

            {/* Traits */}
            <div className="flex flex-wrap gap-3">
              {['Speed', 'Balance', 'Confidence', 'Discipline', 'Joy', 'Indian Pride'].map((trait) => (
                <span key={trait} className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-100/60 text-gray-700 text-sm font-medium shadow-sm">
                  {trait}
                </span>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

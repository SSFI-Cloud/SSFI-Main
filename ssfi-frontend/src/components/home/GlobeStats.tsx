'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { api } from '@/lib/api/client';

/* ─── ANIMATED COUNTER ─── */
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  useEffect(() => {
    if (!isInView) return;
    let s = 0;
    const inc = target / (duration / 16);
    const t = setInterval(() => { s += inc; if (s >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
    return () => clearInterval(t);
  }, [isInView, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── COBE GLOBE ─── */
function CobeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<any>(null);
  const phiRef = useRef(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let destroyed = false;
    const init = async () => {
      const canvas = canvasRef.current;
      if (!canvas || destroyed) return;
      try {
        const createGlobe = (await import('cobe')).default;
        if (destroyed) return;
        const w = canvas.offsetWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        globeRef.current = createGlobe(canvas, {
          devicePixelRatio: dpr, width: w * dpr, height: w * dpr,
          phi: 3.8, theta: 0.15, dark: 0, diffuse: 1.2,
          mapSamples: 40000, mapBrightness: 6,
          baseColor: [0.65, 0.78, 0.95], markerColor: [1, 0.38, 0.08],
          glowColor: [0.88, 0.92, 1], scale: 1.1, // Increased scale slightly
          offset: [0, w * dpr * 0.05], // Adjusted offset
          markers: [
            { location: [28.6139, 77.209], size: 0.06 },
            { location: [19.076, 72.8777], size: 0.05 },
            { location: [13.0827, 80.2707], size: 0.05 },
            { location: [12.9716, 77.5946], size: 0.08 },
            { location: [22.5726, 88.3639], size: 0.04 },
            { location: [17.385, 78.4867], size: 0.04 },
            { location: [23.0225, 72.5714], size: 0.04 },
            { location: [30.7333, 76.7794], size: 0.03 },
          ],
          onRender: (state: any) => { if (!destroyed) { state.phi = phiRef.current; phiRef.current += 0.003; } },
        });
        setLoaded(true);
      } catch (err) { console.error('Globe:', err); }
    };
    init();
    return () => { destroyed = true; globeRef.current?.destroy(); };
  }, []);

  return (
    <div className="relative w-full max-w-[800px] lg:max-w-[900px] mx-auto aspect-square">
      <canvas ref={canvasRef} className={`w-full h-full transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`} style={{ contain: 'layout paint size' }} />
      {!loaded && <div className="absolute inset-0 flex items-center justify-center"><div className="w-60 h-60 rounded-full bg-gradient-to-br from-blue-100 to-cyan-50 animate-pulse" /></div>}
    </div>
  );
}

/* ─── REALISTIC CLOUD SVG ─── */
function RealisticClouds() {
  return (
    <div className="absolute bottom-[-8%] left-[-25%] right-[-25%] z-[5] pointer-events-none select-none overflow-visible">
      <svg viewBox="0 0 1600 560" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full min-w-[1200px]" preserveAspectRatio="none">
        <defs>
          {/* Heavy blur — soft base mass */}
          <filter id="cb1" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="35" />
          </filter>
          {/* Medium blur — mid puffs */}
          <filter id="cb2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
          </filter>
          {/* Light blur — top bright highlights */}
          <filter id="cb3" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
          </filter>
          {/* Very light blur — specular crowns */}
          <filter id="cb4" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>

          {/* SVG fade mask — fades left, right and bottom edges to transparent */}
          <mask id="cloudMask">
            <rect x="0" y="0" width="1600" height="560" fill="white" />
            {/* Fade left edge */}
            <rect x="0" y="0" width="300" height="560">
              <animate attributeName="width" values="300" />
            </rect>
            <linearGradient id="fadeLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="black" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <rect x="0" y="0" width="320" height="560" fill="url(#fadeLeft)" />
            {/* Fade right edge */}
            <linearGradient id="fadeRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="1" />
            </linearGradient>
            <rect x="1280" y="0" width="320" height="560" fill="url(#fadeRight)" />
            {/* Fade bottom edge */}
            <linearGradient id="fadeBottom" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="1" />
            </linearGradient>
            <rect x="0" y="380" width="1600" height="180" fill="url(#fadeBottom)" />
          </mask>

          {/* Soft blue-to-white base */}
          <linearGradient id="cgBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7bb8d8" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#b8ddf0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Mid cloud — light sky blue fading to white */}
          <linearGradient id="cgMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a8d8f0" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#ceeaf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Puff tops — very pale sky, almost white */}
          <linearGradient id="cgTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e4f4fc" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#d0ecf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Highlight tops — near-white with faint blue tint */}
          <linearGradient id="cgHi" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5fbff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#e0f4fc" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g mask="url(#cloudMask)">
          {/* ── Layer 1: Wide soft base — barely-blue atmosphere ── */}
          <ellipse cx="800" cy="520" rx="1100" ry="200" fill="url(#cgBase)" filter="url(#cb1)" />
          <ellipse cx="300" cy="500" rx="600" ry="175" fill="url(#cgBase)" filter="url(#cb1)" opacity="0.7" />
          <ellipse cx="1300" cy="500" rx="600" ry="175" fill="url(#cgBase)" filter="url(#cb1)" opacity="0.7" />

          {/* ── Layer 2: Mid volumes — soft cerulean blue ── */}
          <ellipse cx="800" cy="460" rx="750" ry="160" fill="url(#cgMid)" filter="url(#cb1)" />
          <ellipse cx="200" cy="445" rx="380" ry="130" fill="url(#cgMid)" filter="url(#cb2)" opacity="0.8" />
          <ellipse cx="1400" cy="445" rx="380" ry="130" fill="url(#cgMid)" filter="url(#cb2)" opacity="0.8" />
          <ellipse cx="550" cy="440" rx="300" ry="115" fill="url(#cgMid)" filter="url(#cb2)" opacity="0.75" />
          <ellipse cx="1050" cy="440" rx="300" ry="115" fill="url(#cgMid)" filter="url(#cb2)" opacity="0.75" />

          {/* ── Layer 3: Fluffy puffs — pale sky-blue ── */}
          <circle cx="240" cy="390" r="140" fill="url(#cgTop)" filter="url(#cb2)" />
          <circle cx="520" cy="400" r="160" fill="url(#cgTop)" filter="url(#cb2)" />
          <circle cx="800" cy="355" r="195" fill="url(#cgTop)" filter="url(#cb2)" />
          <circle cx="1080" cy="400" r="160" fill="url(#cgTop)" filter="url(#cb2)" />
          <circle cx="1360" cy="390" r="140" fill="url(#cgTop)" filter="url(#cb2)" />

          {/* ── Layer 4: Near-white bright tops ── */}
          <circle cx="420" cy="320" r="95" fill="url(#cgHi)" filter="url(#cb3)" />
          <circle cx="670" cy="275" r="105" fill="url(#cgHi)" filter="url(#cb3)" />
          <circle cx="800" cy="255" r="115" fill="url(#cgHi)" filter="url(#cb3)" />
          <circle cx="930" cy="275" r="105" fill="url(#cgHi)" filter="url(#cb3)" />
          <circle cx="1180" cy="320" r="95" fill="url(#cgHi)" filter="url(#cb3)" />

          {/* ── Layer 5: Pure white specular crowns — sun-lit tops ── */}
          <circle cx="755" cy="228" r="60" fill="white" filter="url(#cb4)" opacity="0.85" />
          <circle cx="845" cy="228" r="55" fill="white" filter="url(#cb4)" opacity="0.8" />
          <circle cx="800" cy="215" r="45" fill="white" filter="url(#cb4)" opacity="0.9" />
          <circle cx="450" cy="295" r="42" fill="white" filter="url(#cb4)" opacity="0.7" />
          <circle cx="1150" cy="295" r="42" fill="white" filter="url(#cb4)" opacity="0.7" />
        </g>
      </svg>

      {/* Multi-stop gradient overlay — smooth white dissolve into next section */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.55) 70%, rgba(255,255,255,0.88) 85%, white 100%)'
      }} />
      {/* Side fades — soften hard left/right edges */}
      <div className="absolute inset-y-0 left-0 w-48 pointer-events-none" style={{
        background: 'linear-gradient(to right, white, transparent)'
      }} />
      <div className="absolute inset-y-0 right-0 w-48 pointer-events-none" style={{
        background: 'linear-gradient(to left, white, transparent)'
      }} />
    </div>
  );
}

/* ─── SKATING SVG DECORATION ─── */
function SkateDecoration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M20 55 C20 55 25 30 40 25 C55 20 60 35 55 45 C50 55 35 60 20 55Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15" />
      <circle cx="25" cy="62" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      <circle cx="55" cy="62" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      <line x1="20" y1="62" x2="60" y2="62" stroke="currentColor" strokeWidth="1" opacity="0.1" />
    </svg>
  );
}

/* ─── MAIN EXPORT ─── */
export default function GlobeStats() {
  const [stats, setStats] = useState({ students: 0, states: 0, clubs: 0, events: 0, certifiedCoaches: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/public');
        const payload = (response.data as any);
        const success = payload.success || payload.status === 'success';
        if (success) {
          const d = payload.data ?? payload;
          setStats({
            students: d.students || 0,
            states: d.states || 0,
            clubs: d.clubs || 0,
            events: d.events || 0,
            certifiedCoaches: d.certifiedCoaches || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { value: stats.states, suffix: '', label: 'States & UTs', color: 'text-gray-900', labelColor: 'text-gray-600' },
    { value: stats.clubs, suffix: '+', label: 'Affiliated Clubs', color: 'text-gray-900', labelColor: 'text-gray-600' },
    { value: stats.events, suffix: '+', label: 'National Events', color: 'text-gray-900', labelColor: 'text-gray-600' },
  ];

  return (
    <section className="relative overflow-hidden bg-white pb-16">
      {/* Skating SVG decorations */}
      <SkateDecoration className="absolute top-16 left-8 w-20 h-20 text-emerald-400 opacity-30" />
      <SkateDecoration className="absolute top-40 right-12 w-16 h-16 text-blue-400 opacity-20 rotate-12" />

      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-50/40 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Real impact, real numbers
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2 initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl lg:text-[2.75rem] font-headline font-bold text-gray-900 text-center mb-4 tracking-tight leading-tight">
            India&apos;s Skating Community<br className="hidden sm:block" /> Growing Every Day
          </motion.h2>

          {/* Big Number */}
          <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.12, type: 'spring', stiffness: 200 }} className="text-center mb-1">
            <span className="text-7xl sm:text-8xl lg:text-[7rem] font-headline font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400 leading-none tracking-tight">
              <AnimatedCounter target={stats.students} suffix="+" duration={2500} />
            </span>
          </motion.div>

          {/* Tooltip */}
          <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-medium shadow-xl shadow-gray-900/10">
              Registered Skaters Nationwide
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative rounded-full h-2.5 w-2.5 bg-green-400" />
              </span>
            </span>
          </motion.div>

          {/* Globe + Realistic Clouds */}
          <div className="relative mb-0"> {/* Reduced bottom margin */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.8 }} className="relative z-[1]">
              <CobeGlobe />
            </motion.div>
            <RealisticClouds />
          </div>
        </div>
      </div>

      {/* ═══ CLEAN TEXT STATS (No Cards) ═══ */}
      {/* Reduced top padding and added negative margin to pull closer to clouds */}
      <div className="relative z-10 pt-4 -mt-8 sm:-mt-12 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-around gap-10 sm:gap-4 text-center">
              {statCards.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="flex-1"
                >
                  <div className="relative z-10 group">
                    <span className={`block text-6xl md:text-7xl font-headline font-bold tracking-tight mb-2 ${stat.color}`}>
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </span>
                    <p className={`text-lg md:text-xl font-medium ${stat.labelColor} mt-2`}>
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    Award,
    Star,
    Shield,
    Users,
    ChevronRight,
    CheckCircle2,
    Zap,
    Heart,
    Target,
    ArrowRight,
    Trophy,
    Medal,
    Sparkles,
    GraduationCap,
    Footprints,
} from 'lucide-react';

/* ── Lottie Player Component ── */
function LottiePlayer({ src, className = '', style = {} }: { src: string; className?: string; style?: React.CSSProperties }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Dynamically load lottie-player web component
        if (typeof window !== 'undefined' && !customElements.get('lottie-player')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@lottiefiles/lottie-player@2.0.8/dist/lottie-player.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    useEffect(() => {
        if (!ref.current) return;
        // Create lottie-player element
        const existing = ref.current.querySelector('lottie-player');
        if (existing) return;
        const player = document.createElement('lottie-player');
        player.setAttribute('src', src);
        player.setAttribute('background', 'transparent');
        player.setAttribute('speed', '1');
        player.setAttribute('loop', '');
        player.setAttribute('autoplay', '');
        player.style.width = '100%';
        player.style.height = '100%';
        ref.current.appendChild(player);
    }, [src]);

    return <div ref={ref} className={className} style={style} />;
}

/* ── Animated Counter ── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        let frame: number;
        const duration = 1600;
        const start = performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [isInView, target]);

    return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Skating SVG Icon ── */
const SkatingIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <path d="M7 21h4l2-8-3-3-4 4 1 7z" />
        <path d="M15 10l2 2 4-1" />
        <path d="M17 21h-3l-1-4" />
        <line x1="3" y1="23" x2="8" y2="23" />
        <line x1="14" y1="23" x2="19" y2="23" />
    </svg>
);

/* ── Data ── */
const medals = [
    { grade: 'A / A+', marks: '70 – 100', medal: '🥇', label: 'Gold Medal', color: 'from-amber-400 to-yellow-500', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    { grade: 'B / B+', marks: '40 – 69', medal: '🥈', label: 'Silver Medal', color: 'from-slate-300 to-gray-400', bg: 'bg-slate-400/10 border-slate-400/20', text: 'text-slate-300' },
    { grade: 'C+', marks: '30 – 39', medal: '🥉', label: 'Bronze Medal', color: 'from-orange-400 to-amber-600', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
];

const skills = [
    { icon: Target, title: 'Balance & Posture', desc: 'Master core stability and correct skating stance' },
    { icon: Zap, title: 'Start & Acceleration', desc: 'Explosive starts and smooth speed building' },
    { icon: Footprints, title: 'Glide Technique', desc: 'Efficient gliding with minimal energy loss' },
    { icon: Shield, title: 'Turning & Braking', desc: 'Controlled turns and safe stopping methods' },
    { icon: Heart, title: 'Safety Protocols', desc: 'Rink discipline, gear check, and awareness' },
    { icon: Star, title: 'Performance Assessment', desc: 'Structured evaluation of overall technique' },
];

const whoCanJoin = [
    { emoji: '🛼', text: 'Beginner-level skaters' },
    { emoji: '🏫', text: 'School students' },
    { emoji: '🏟️', text: 'Club trainees' },
    { emoji: '🌟', text: 'First-time competitors' },
    { emoji: '🚀', text: 'Skaters entering structured pathways' },
];

const objectives = [
    'Establish strong skating fundamentals',
    'Develop balance, posture, control & speed',
    'Introduce national training standards',
    'Prepare for district & state-level events',
    'Build discipline, confidence & sportsmanship',
];

/* ── Stagger wrapper ── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function BeginnerProgramClient() {
    return (
        <main className="min-h-screen bg-dark-950 overflow-hidden">

            {/* ═══════ HERO ═══════ */}
            <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden">
                {/* Ambient blobs */}
                <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[180px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[160px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[140px]" />

                {/* Confetti dots */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                left: `${5 + Math.random() * 90}%`,
                                top: `${5 + Math.random() * 90}%`,
                                backgroundColor: ['#14b8a6', '#10b981', '#06b6d4', '#2dd4bf', '#22c55e'][i % 5],
                                opacity: 0.15 + Math.random() * 0.15,
                            }}
                            animate={{
                                y: [0, -15, 0],
                                scale: [1, 1.3, 1],
                            }}
                            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                        />
                    ))}
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text */}
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                                <Sparkles className="w-4 h-4" />
                                For Young Champions
                            </span>

                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
                                Beginner{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                                    Certification
                                </span>
                                <br />
                                Program
                            </h1>

                            <p className="text-dark-300 text-lg md:text-xl leading-relaxed max-w-xl mb-8">
                                A structured <strong className="text-white">national-level initiative</strong> by SSFI designed to introduce young skaters to the fundamentals of speed skating through a professional framework.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link href="/beginner-certification/register"
                                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.03] transition-all">
                                    <GraduationCap className="w-5 h-5" />
                                    Enroll Now
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/events"
                                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all">
                                    View Events
                                </Link>
                            </div>
                        </motion.div>

                        {/* Right: Mascot — kidscert.webp with 3D pop-out */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="relative flex items-center justify-center"
                            style={{ perspective: '1000px' }}
                        >
                            {/* Glow halo */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/15 rounded-3xl blur-[80px]" />
                            {/* Float animation */}
                            <motion.div
                                animate={{ y: [0, -18, 0], rotate: [-1, 1.5, -1] }}
                                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.45)) drop-shadow(0 15px 25px rgba(16,185,129,0.2))',
                                    transform: 'translateZ(40px)',
                                }}
                            >
                                <div className="relative w-80 h-96 sm:w-96 sm:h-[440px] mx-auto">
                                    <Image
                                        src="/images/mascot/kidscert.webp"
                                        alt="SSFI Beginner Mascot"
                                        fill
                                        className="object-contain object-bottom"
                                        sizes="320px"
                                        priority
                                    />
                                </div>
                            </motion.div>
                            {/* Ground shadow */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-5 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.2) 0%, transparent 70%)' }} />
                        </motion.div>
                    </div>

                    {/* Stats bar */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="mt-16 flex flex-wrap justify-center gap-4 md:gap-6">
                        {[
                            { icon: Users, value: 5000, suffix: '+', label: 'Kids Enrolled' },
                            { icon: Award, value: 28, suffix: '', label: 'States Active' },
                            { icon: Trophy, value: 500, suffix: '+', label: 'Medals Awarded' },
                            { icon: Star, value: 98, suffix: '%', label: 'Success Rate' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                                <s.icon className="w-5 h-5 text-emerald-400" />
                                <span className="text-xl font-extrabold text-white"><Counter target={s.value} suffix={s.suffix} /></span>
                                <span className="text-dark-400 text-sm">{s.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════ OBJECTIVES ═══════ */}
            <section className="py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">
                        {/* Mascot — coach.webp with 3D pop-out */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative order-2 lg:order-1 flex items-center justify-center"
                            style={{ perspective: '1000px' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 rounded-3xl blur-[60px]" />
                            <motion.div
                                animate={{ y: [0, -14, 0], rotate: [1, -1.5, 1] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    filter: 'drop-shadow(0 35px 50px rgba(0,0,0,0.4)) drop-shadow(0 12px 22px rgba(6,182,212,0.2))',
                                    transform: 'translateZ(40px)',
                                }}
                            >
                                <div className="relative w-72 h-80 sm:w-80 sm:h-[380px] mx-auto">
                                    <Image
                                        src="/images/mascot/coach.webp"
                                        alt="Coach Mascot"
                                        fill
                                        className="object-contain object-bottom"
                                        sizes="288px"
                                    />
                                </div>
                            </motion.div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-4 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.18) 0%, transparent 70%)' }} />
                        </motion.div>

                        {/* Objectives */}
                        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                            className="order-1 lg:order-2">
                            <motion.span variants={fadeUp}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold mb-6">
                                <Target className="w-4 h-4" />
                                Program Objectives
                            </motion.span>
                            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-white mb-8 tracking-tight">
                                Building Strong{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Foundations</span>
                            </motion.h2>

                            <div className="space-y-4">
                                {objectives.map((obj, i) => (
                                    <motion.div key={i} variants={fadeUp}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-dark-300 text-base font-medium group-hover:text-white transition-colors pt-1">{obj}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════ WHO CAN JOIN ═══════ */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold mb-6">
                            <Users className="w-4 h-4" />
                            Open for Everyone
                        </span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            Who Can{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Participate?</span>
                        </h2>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                        {whoCanJoin.map((item, i) => (
                            <motion.div key={i} variants={fadeUp}
                                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-green-500/25 hover:bg-green-500/[0.03] transition-all group">
                                <span className="text-3xl">{item.emoji}</span>
                                <span className="text-dark-300 font-semibold group-hover:text-white transition-colors">{item.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════ PROGRAM STRUCTURE (Skills Grid) ═══════ */}
            <section className="py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/[0.02] to-transparent" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                            <Zap className="w-4 h-4" />
                            What You'll Learn
                        </span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            Program{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Structure</span>
                        </h2>
                        <p className="text-dark-400 mt-4 max-w-2xl mx-auto">
                            A comprehensive curriculum covering every essential skill for beginner skaters
                        </p>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                        {skills.map((skill, i) => {
                            const colors = ['from-emerald-500 to-teal-500', 'from-teal-500 to-cyan-500', 'from-cyan-500 to-emerald-500', 'from-emerald-500 to-green-500', 'from-teal-500 to-emerald-500', 'from-green-500 to-emerald-500'];
                            const glows = ['shadow-emerald-500/20', 'shadow-teal-500/20', 'shadow-cyan-500/20', 'shadow-emerald-500/20', 'shadow-teal-500/20', 'shadow-green-500/20'];
                            return (
                                <motion.div key={i} variants={fadeUp}
                                    className="group p-6 rounded-2xl bg-dark-800/50 border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 hover:shadow-xl">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[i]} flex items-center justify-center mb-4 shadow-lg ${glows[i]} group-hover:scale-110 transition-transform`}>
                                        <skill.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2">{skill.title}</h3>
                                    <p className="text-dark-400 text-sm leading-relaxed">{skill.desc}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ═══════ MEDALS & CERTIFICATION ═══════ */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">
                        {/* Medals */}
                        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                            <motion.span variants={fadeUp}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold mb-6">
                                <Medal className="w-4 h-4" />
                                Certification & Recognition
                            </motion.span>
                            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                                Earn Your{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Medal</span>
                            </motion.h2>
                            <motion.p variants={fadeUp} className="text-dark-400 mb-8 max-w-lg">
                                Participants receive an Official SSFI Level 1 Beginner Certification along with performance-based medals.
                            </motion.p>

                            <div className="space-y-4">
                                {medals.map((m, i) => (
                                    <motion.div key={i} variants={fadeUp}
                                        className={`flex items-center gap-5 p-5 rounded-2xl border ${m.bg} hover:scale-[1.02] transition-all`}>
                                        <span className="text-5xl">{m.medal}</span>
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold ${m.text}`}>{m.label}</h3>
                                            <p className="text-dark-400 text-sm">Grade: <strong className="text-white">{m.grade}</strong></p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-dark-500 text-xs uppercase tracking-wider">Marks</span>
                                            <p className="text-white font-bold text-lg">{m.marks}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Certificate note */}
                            <motion.div variants={fadeUp}
                                className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                                <Award className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                <p className="text-dark-400 text-sm">
                                    All participants also receive a <strong className="text-white">Certificate of Completion</strong> as per SSFI guidelines.
                                </p>
                            </motion.div>
                        </motion.div>

                        {/* Mascot — kid.webp with 3D pop-out */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative flex items-center justify-center"
                            style={{ perspective: '1000px' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-3xl blur-[80px]" />
                            <motion.div
                                animate={{ y: [0, -16, 0], rotate: [-1, 1.5, -1] }}
                                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    filter: 'drop-shadow(0 38px 55px rgba(0,0,0,0.42)) drop-shadow(0 14px 24px rgba(245,158,11,0.22))',
                                    transform: 'translateZ(40px)',
                                }}
                            >
                                <div className="relative w-72 h-80 sm:w-80 sm:h-[380px] mx-auto">
                                    <Image
                                        src="/images/mascot/kid.webp"
                                        alt="Beginner Kid Mascot"
                                        fill
                                        className="object-contain object-bottom"
                                        sizes="288px"
                                    />
                                </div>
                            </motion.div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-4 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.2) 0%, transparent 70%)' }} />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════ WHY IT MATTERS ═══════ */}
            <section className="py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                            <Heart className="w-4 h-4" />
                            Why It Matters
                        </span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            The Path to{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Greatness</span>
                        </h2>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                        {[
                            { icon: Shield, title: 'Standardized Pathway', desc: 'Official entry-level program under SSFI', color: 'from-emerald-500 to-teal-500' },
                            { icon: Target, title: 'National Alignment', desc: 'Aligns with national development structures', color: 'from-emerald-500 to-teal-500' },
                            { icon: Users, title: 'Grassroots Growth', desc: 'Encourages participation at every level', color: 'from-teal-500 to-cyan-500' },
                            { icon: Trophy, title: 'Athlete Development', desc: 'Strong foundation for long-term progress', color: 'from-teal-500 to-emerald-500' },
                        ].map((item, i) => (
                            <motion.div key={i} variants={fadeUp}
                                className="text-center p-6 rounded-2xl bg-dark-800/40 border border-white/[0.05] hover:border-white/[0.1] transition-all group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <item.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                                <p className="text-dark-500 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════ VISION + CTA ═══════ */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="relative max-w-4xl mx-auto text-center rounded-3xl overflow-hidden">
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl" />
                        <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                        <div className="relative p-10 md:p-16">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">
                                Our Vision
                            </h2>
                            <p className="text-dark-300 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
                                Through the Beginner Certification Program, SSFI aims to create a <strong className="text-white">unified national development model</strong> for speed skating — ensuring young athletes across India receive professional guidance, fair evaluation, and clear progression pathways.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4">
                                <Link href="/beginner-certification/register"
                                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.03] transition-all">
                                    <GraduationCap className="w-5 h-5" />
                                    Get Started Today
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/affiliated-coaches"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all">
                                    Find a Coach
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award, Users, MapPin, Calendar, Trophy, Target, Star, ChevronRight,
  Medal, Shield, Eye, Rocket, GraduationCap, Globe, Flame, Flag,
} from 'lucide-react';

// Icon map — matches the fixed icon set in the CMS
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag, Trophy, MapPin, Calendar, Globe, Star, Rocket, GraduationCap, Flame, Award,
};

const MILESTONE_FALLBACK = [
  { id: '1', year: '2001', title: 'Foundation', description: 'SSFI founded with the first National Championship featuring 185 skaters.', icon: 'Flag' },
  { id: '2', year: '2005–2010', title: 'Expansion', description: 'Expansion into multiple districts and state-level competitions.', icon: 'MapPin' },
  { id: '3', year: '2011–2018', title: 'Structured Growth', description: 'Structured national calendar introduced; growth in participation across regions.', icon: 'Calendar' },
  { id: '4', year: '2019–2024', title: 'Grassroots & International', description: 'Strengthened grassroots programs and increased international exposure opportunities.', icon: 'Globe' },
  { id: '5', year: '2025–26', title: '25th National Championship', description: 'Successfully conducted the 25th National Speed Skating Championship, with 2000+ skaters and representation from 18 states.', icon: 'Trophy' },
  { id: '6', year: 'Today', title: 'Building the Future', description: 'Continuing to expand nationwide, building Team India and shaping the future of speed skating.', icon: 'Rocket' },
];

const missionPoints = [
  { icon: Flame, text: 'Promote grassroots development of speed skating across all states' },
  { icon: Trophy, text: 'Create transparent and merit-based competition pathways' },
  { icon: Globe, text: 'Provide national and international exposure opportunities' },
  { icon: GraduationCap, text: 'Develop certified coaches, referees, and technical officials' },
  { icon: Users, text: 'Encourage youth participation through structured championships' },
  { icon: Shield, text: 'Uphold sportsmanship, discipline, and excellence in competition' },
];

const teamMembers = [
  { name: 'Mr. Krishna Baisware', role: 'President', description: 'Co-founder and President of SSFI, Mr. Krishna Baisware has been instrumental in shaping the strategic direction and governance of speed skating in India since its inception.', icon: Star, gradient: 'from-amber-500 to-orange-500', glowColor: 'rgba(245, 158, 11, 0.15)' },
  { name: 'Shri S. Muruganantham', role: 'General Secretary', description: 'Co-founder and General Secretary of SSFI, Shri S. Muruganantham continues to drive the operational excellence and nationwide expansion of speed skating across India.', icon: Award, gradient: 'from-emerald-500 to-teal-500', glowColor: 'rgba(16, 185, 129, 0.15)' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
};

interface AboutPageClientProps {
  initialMilestones: any[] | null;
  initialStats: {
    students?: number;
    clubs?: number;
    states?: number;
    districts?: number;
    totalEvents?: number;
    championships?: number;
  } | null;
}

export default function AboutPageClient({ initialMilestones, initialStats }: AboutPageClientProps) {
  const milestones = initialMilestones || MILESTONE_FALLBACK;
  const statsData = initialStats || { students: 5600, clubs: 800, states: 36, districts: 640, totalEvents: 50, championships: 25 };

  const stats = [
    { label: 'Registered Skaters', value: `${statsData.students?.toLocaleString()}+`, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Active Clubs', value: `${statsData.clubs}+`, icon: Shield, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    { label: 'States Covered', value: statsData.states?.toString(), icon: MapPin, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { label: 'Districts', value: `${statsData.districts || 640}+`, icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Events Organized', value: `${statsData.totalEvents}+`, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Championships', value: statsData.championships?.toString() || '25', icon: Medal, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative py-28 md:py-36 overflow-hidden bg-dark-950">
        <div className="absolute top-10 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 -right-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-6 backdrop-blur-sm">
              <Award className="w-4 h-4" /> Est. 2001
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-white mb-8 tracking-tight leading-tight">
              About the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Speed Skating Federation</span>{' '}
              of India
            </h1>
            <p className="text-lg md:text-xl text-dark-300 leading-relaxed max-w-3xl mx-auto">
              The Speed Skating Federation of India (SSFI) was founded in 2001 with a vision to create a structured and competitive ecosystem for speed skating across the country.
            </p>
          </motion.div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-gray-900 mb-8">Our Story</h2>
            <p className="text-lg text-gray-600 leading-relaxed">The federation was established by <strong className="text-gray-900">Shri S. Muruganantham</strong> (General Secretary) and <strong className="text-gray-900">Mr. Krishna Baisware</strong> (President).</p>
            <p className="text-lg text-gray-600 leading-relaxed">The journey began with just <strong className="text-emerald-600">185 skaters</strong> in the first National Championship. SSFI has since grown nationwide, now active across <strong className="text-emerald-600">18 states</strong>.</p>
            <p className="text-lg text-gray-600 leading-relaxed">The <strong className="text-gray-900">25th National Speed Skating Championship 2025–26</strong> witnessed <strong className="text-emerald-600">2000+ skaters</strong>, reflecting the remarkable growth under SSFI&apos;s leadership.</p>
            <p className="text-lg text-gray-600 leading-relaxed">Today, SSFI builds pathways from district competitions to national and international representation, strengthening India&apos;s position in the global speed skating arena.</p>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 bg-dark-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/50 to-dark-950" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} custom={index} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className={`text-center p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm hover:scale-105 transition-transform duration-300 group`}>
                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
                <div className="text-3xl font-headline font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-dark-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-10 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-violet-200"><Eye className="w-7 h-7 text-white" /></div>
                <h2 className="text-3xl font-headline font-bold text-gray-900 mb-6">Our Vision</h2>
                <p className="text-lg text-gray-600 leading-relaxed">To establish India as a globally competitive force in speed skating by building a structured, inclusive, and high-performance sporting ecosystem.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-10 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-200"><Target className="w-7 h-7 text-white" /></div>
                <h2 className="text-3xl font-headline font-bold text-gray-900 mb-6">Our Mission</h2>
                <ul className="space-y-4">{missionPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5"><point.icon className="w-4 h-4 text-emerald-600" /></div>
                    <span className="text-gray-600 leading-relaxed">{point.text}</span>
                  </li>
                ))}</ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MILESTONES */}
      <section className="py-20 md:py-28 bg-dark-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 bg-emerald-500/5 rounded-full blur-[160px]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-4 backdrop-blur-sm">
              <Calendar className="w-4 h-4" /> Our Journey
            </span>
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-white mb-6 tracking-tight">Milestones That Define Us</h2>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">From 185 skaters to a 2000+ strong national championship — a journey of relentless growth.</p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/60 via-teal-500/40 to-transparent" />
            {milestones.map((milestone, index) => {
              const MilestoneIcon = ICON_MAP[(milestone as any).icon] || Flag;
              return (
                <motion.div key={(milestone as any).id || index} custom={index} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className={`relative flex items-center mb-10 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-14 md:text-right' : 'md:pl-14'} pl-20 md:pl-0`}>
                    <div className="bg-dark-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
                      <div className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                        <MilestoneIcon className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                        <span className="text-emerald-400 font-bold text-lg font-headline">{(milestone as any).year}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-1">{milestone.title}</h3>
                      <p className="text-dark-400 text-sm leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 border-4 border-dark-950 bg-emerald-500 shadow-lg shadow-emerald-500/30" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium mb-4">
              <Users className="w-4 h-4" /> Leadership
            </span>
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-gray-900 mb-6 tracking-tight">Meet Our Team</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">The visionaries who founded SSFI and continue to lead India&apos;s speed skating movement.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <motion.div key={member.name} custom={index} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="relative rounded-3xl p-8 md:p-10 border border-gray-100 bg-gray-50 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${member.glowColor}, transparent 70%)` }} />
                <div className="relative z-10">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    <member.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-gray-900 mb-1">{member.name}</h3>
                  <span className={`inline-block text-sm font-semibold bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent mb-4`}>{member.role}</span>
                  <p className="text-gray-600 leading-relaxed">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AFFILIATIONS */}
      <section className="py-20 md:py-28 bg-dark-950 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-4 backdrop-blur-sm">
              <Award className="w-4 h-4" /> Partners
            </span>
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-white mb-6 tracking-tight">Our Affiliations</h2>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">Proudly associated with India&apos;s premier sports and government bodies</p>
          </motion.div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { name: 'Bharat Skate India', logo: '/images/partners/bharatskate.webp' },
              { name: 'Fit India', logo: '/images/partners/fitindia.webp' },
              { name: 'Ministry of Corporate Affairs', logo: '/images/partners/mca.webp' },
              { name: 'NITI Aayog', logo: '/images/partners/nitiaayog.webp' },
            ].map((partner, index) => (
              <motion.div key={partner.name} custom={index} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.05, y: -4 }}
                className="flex flex-col items-center gap-3 group cursor-default">
                <div className="w-40 h-24 relative bg-white/5 rounded-2xl border border-white/10 group-hover:border-emerald-500/30 shadow-sm hover:shadow-lg transition-all p-4 flex items-center justify-center">
                  <Image src={partner.logo} alt={partner.name} fill className="object-contain p-3 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" sizes="160px" />
                </div>
                <span className="text-xs font-medium text-dark-400 group-hover:text-emerald-400 transition-colors text-center max-w-[140px]">{partner.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-white mb-4">Join the SSFI Family</h2>
              <p className="text-white/80 max-w-2xl mx-auto mb-10 text-lg leading-relaxed">Whether you&apos;re a skater, club, or state association, become part of India&apos;s premier speed skating community.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-lg shadow-black/10">
                  Register Now <ChevronRight className="w-5 h-5" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-all duration-300 backdrop-blur-sm border border-white/20">
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

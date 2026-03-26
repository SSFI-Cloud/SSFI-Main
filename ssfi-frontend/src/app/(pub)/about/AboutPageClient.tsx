'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award, Users, MapPin, Calendar, Trophy, Target, Star, ChevronRight,
  Medal, Shield, Eye, Rocket, GraduationCap, Globe, Flame, Flag,
} from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils/resolveImageUrl';

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

/* ── Hierarchy org-chart data (fallback — overridden by CMS if available) ── */
const HIERARCHY_FALLBACK = [
  { name: 'Mr. Krishna Baisware', role: 'President', photo: '/images/team/krishna-baisware.webp', displayOrder: 1 },
  { name: 'Shri S. Muruganantham', role: 'General Secretary', photo: '/images/team/muruganantham.webp', displayOrder: 2 },
];

// Filter helper — only show members with actual names (not TBD/empty)
const isRealMember = (m: { name: string }) => m.name && m.name !== 'TBD' && m.name.trim() !== '';

const orgChartCSS = `
@keyframes hGradient{0%{background-position:0% 0%}100%{background-position:0% 200%}}
@keyframes hGradientH{0%{background-position:0% 0%}100%{background-position:200% 0%}}
@keyframes hGlow{0%,100%{box-shadow:0 0 8px rgba(16,185,129,.25)}50%{box-shadow:0 0 20px rgba(16,185,129,.5)}}
.org-line-v{width:2px;background:linear-gradient(180deg,#10b981,#14b8a6,#0ea5e9,#10b981);background-size:100% 200%;animation:hGradient 3s linear infinite}
.org-line-h{height:2px;background:linear-gradient(90deg,#10b981,#14b8a6,#0ea5e9,#10b981);background-size:200% 100%;animation:hGradientH 3s linear infinite}
.org-avatar{animation:hGlow 3s ease-in-out infinite}
`;

function HierarchyNode({ name, role, photo, delay = 0 }: { name: string; role: string; photo: string; delay?: number }) {
  const photoUrl = resolveImageUrl(photo);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2">
      <div className="org-avatar relative w-20 h-20 md:w-24 md:h-24 rounded-full p-[2.5px] bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-400">
        <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
          {photoUrl ? (
            <Image src={photoUrl} alt={name} fill className="object-cover object-top" sizes="96px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"><Users className="w-8 h-8 md:w-10 md:h-10 text-gray-300" /></div>
          )}
        </div>
      </div>
      <h3 className="text-sm md:text-base font-semibold text-gray-900 text-center leading-tight">{name}</h3>
      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] md:text-xs font-semibold tracking-wide uppercase">{role}</span>
    </motion.div>
  );
}

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
  initialTeam?: any[] | null;
}

export default function AboutPageClient({ initialMilestones, initialStats, initialTeam }: AboutPageClientProps) {
  const milestones = initialMilestones || MILESTONE_FALLBACK;
  const statsData = initialStats || { students: 5600, clubs: 800, states: 36, districts: 640, totalEvents: 50, championships: 25 };

  // Team members from CMS, filtered to only real members (not TBD/empty)
  const allTeamMembers = (initialTeam && initialTeam.length > 0 ? initialTeam : HIERARCHY_FALLBACK).filter(isRealMember);
  // Split into top chain (President, General Secretary, etc.) and bottom row (Joint Secretary, Treasurer, etc.)
  const topRoles = ['Chief Patron', 'President', 'Vice President', 'General Secretary'];
  const hierarchyTop = allTeamMembers.filter(m => topRoles.includes(m.role));
  const hierarchyBottom = allTeamMembers.filter(m => !topRoles.includes(m.role));

  const stats = [
    { label: 'Registered Skaters', value: `${statsData.students?.toLocaleString()}+`, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200/60', accent: '#10b981' },
    { label: 'Active Clubs', value: `${statsData.clubs}+`, icon: Shield, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200/60', accent: '#14b8a6' },
    { label: 'States Covered', value: statsData.states?.toString(), icon: MapPin, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200/60', accent: '#0ea5e9' },
    { label: 'Districts', value: `${statsData.districts || 640}+`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200/60', accent: '#10b981' },
    { label: 'Events Organized', value: `${statsData.totalEvents}+`, icon: Trophy, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200/60', accent: '#14b8a6' },
    { label: 'Championships', value: statsData.championships?.toString() || '25', icon: Medal, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200/60', accent: '#14b8a6' },
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
            <p className="text-lg text-gray-600 leading-relaxed">The federation was established by <strong className="text-gray-900">Mr. Krishna Baisware</strong> (President) and <strong className="text-gray-900">Shri S. Muruganantham</strong> (General Secretary).</p>
            <p className="text-lg text-gray-600 leading-relaxed">The journey began with just <strong className="text-emerald-600">185 skaters</strong> in the first National Championship. SSFI has since grown nationwide, now active across <strong className="text-emerald-600">18 states</strong>.</p>
            <p className="text-lg text-gray-600 leading-relaxed">The <strong className="text-gray-900">25th National Speed Skating Championship 2025–26</strong> witnessed <strong className="text-emerald-600">2000+ skaters</strong>, reflecting the remarkable growth under SSFI&apos;s leadership.</p>
            <p className="text-lg text-gray-600 leading-relaxed">Today, SSFI builds pathways from district competitions to national and international representation, strengthening India&apos;s position in the global speed skating arena.</p>
          </motion.div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-10 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-200"><Eye className="w-7 h-7 text-white" /></div>
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

      {/* LEADERSHIP HIERARCHY */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: orgChartCSS }} />
        <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-emerald-50/40 rounded-full blur-[160px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium mb-4">
              <Users className="w-4 h-4" /> Leadership
            </span>
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-gray-900 mb-4 tracking-tight">
              Executive <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Committee</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">The leadership team steering India&apos;s speed skating movement forward.</p>
          </motion.div>

          {/* Org chart */}
          <div className="flex flex-col items-center max-w-4xl mx-auto">
            {/* Top chain — President, General Secretary, etc. */}
            {hierarchyTop.map((member, idx) => (
              <div key={member.role} className="flex flex-col items-center">
                {idx > 0 && <div className="org-line-v h-10 md:h-14" />}
                <HierarchyNode name={member.name} role={member.role} photo={member.photo} delay={idx * 0.12} />
              </div>
            ))}

            {/* Bottom branch — only show if there are real members */}
            {hierarchyBottom.length > 0 && (
              <>
                <div className="org-line-v h-10 md:h-14" />
                <div className="relative w-full max-w-md md:max-w-xl">
                  <div className="org-line-h absolute top-0 left-[16.67%] right-[16.67%]" />
                  <div className={`grid grid-cols-${Math.min(hierarchyBottom.length, 3)}`}>
                    {hierarchyBottom.map((member, idx) => (
                      <div key={member.role} className="flex flex-col items-center">
                        <div className="org-line-v h-10 md:h-14" />
                        <HierarchyNode name={member.name} role={member.role} photo={member.photo} delay={0.5 + idx * 0.12} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* STATS — Impact Numbers */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-50/60 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-50/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium mb-4">
              <Trophy className="w-4 h-4" /> Our Impact
            </span>
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-gray-900 mb-4 tracking-tight">
              Numbers That <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Speak</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Over two decades of building India&apos;s speed skating ecosystem — measured in impact.</p>
          </motion.div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-5 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                custom={index}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-md shadow-gray-100/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent opacity-40 pointer-events-none`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4 border ${stat.border}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl md:text-3xl font-headline font-bold text-gray-900 mb-1 tracking-tight">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-500">{stat.label}</div>
                </div>
                <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-60" style={{ background: `linear-gradient(to right, transparent, ${stat.accent}40, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AFFILIATIONS */}
      <section className="py-20 md:py-28 bg-dark-950 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
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

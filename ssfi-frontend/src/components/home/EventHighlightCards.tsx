'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Globe, Flag, Award } from 'lucide-react';

const cards = [
  {
    id: 'national',
    icon: Flag,
    title: 'National Events',
    description: 'Compete at the highest level in SSFI-sanctioned national championships across speed skating, artistic, and inline hockey.',
    image: '/images/mascot/10.webp',
    href: '/events?level=national',
    cardBg: 'from-amber-50 to-orange-50',
    iconBg: 'bg-amber-100 border-amber-200',
    iconColor: 'text-amber-600',
    accent: 'text-amber-600',
    shadowColor: 'shadow-amber-200/50',
    borderAccent: 'border-amber-100',
  },
  {
    id: 'international',
    icon: Globe,
    title: 'International Events',
    description: 'Represent India on the world stage. Qualify through national selections and compete in World Skate international tournaments.',
    image: '/images/mascot/8.webp',
    href: '/events?level=international',
    cardBg: 'from-emerald-50 to-teal-50',
    iconBg: 'bg-emerald-100 border-emerald-200',
    iconColor: 'text-emerald-600',
    accent: 'text-emerald-600',
    shadowColor: 'shadow-emerald-200/50',
    borderAccent: 'border-emerald-100',
  },
  {
    id: 'coach-cert',
    icon: Award,
    title: 'Coach Certification',
    description: 'Get officially certified by SSFI. Our structured program covers technique, safety, competition rules, and athlete development.',
    image: '/images/mascot/coach.webp',
    href: '/coach-certification',
    cardBg: 'from-violet-50 to-purple-50',
    iconBg: 'bg-violet-100 border-violet-200',
    iconColor: 'text-violet-600',
    accent: 'text-violet-600',
    shadowColor: 'shadow-violet-200/50',
    borderAccent: 'border-violet-100',
  },
];

export default function EventHighlightCards() {
  return (
    <section className="relative py-28 overflow-visible bg-gradient-to-b from-white via-gray-50/60 to-white">
      {/* Soft ambient glows */}
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-emerald-50/60 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-20 right-0 w-[400px] h-[400px] bg-emerald-50/40 rounded-full blur-[120px] opacity-60" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            What We Offer
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-gray-900 mb-6 tracking-tight">
            Events &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Programs</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            From grassroots competitions to world-class championships — find your path in the skating ecosystem.
          </p>
        </motion.div>

        {/* 3D Perspective Cards */}
        <div className="grid md:grid-cols-3 gap-10" style={{ perspective: '1200px' }}>
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Link href={card.href} className="group block h-full">
                  {/* 3D Card Container */}
                  <div
                    className={`
                      relative h-full rounded-3xl bg-gradient-to-br ${card.cardBg}
                      border ${card.borderAccent}
                      transition-all duration-700 ease-out
                      group-hover:shadow-2xl ${card.shadowColor}
                    `}
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.7s ease',
                    }}
                  >
                    {/* Image area with 3D pop-out effect */}
                    <div
                      className="relative h-80 overflow-visible flex items-end justify-center"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Background shape behind the image — sits on the card surface */}
                      <div
                        className={`absolute inset-4 top-4 rounded-2xl bg-gradient-to-br ${card.cardBg} opacity-60`}
                        style={{ transform: 'translateZ(0px)' }}
                      />

                      {/* The image pops OUT of the card along the z-axis */}
                      <div
                        className="relative w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                        style={{
                          transform: 'translateZ(40px) translateY(-30px)',
                          transformStyle: 'preserve-3d',
                          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))',
                        }}
                      >
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          className="object-contain object-bottom rounded-2xl"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="relative p-6 pt-2" style={{ transform: 'translateZ(20px)' }}>
                      {/* Icon badge */}
                      <div className="mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl ${card.iconBg} border flex items-center justify-center shadow-lg`}
                          style={{
                            transform: 'translateZ(30px)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                          }}
                        >
                          <Icon className={`w-6 h-6 ${card.iconColor}`} />
                        </div>
                      </div>

                      <h3 className="text-xl font-headline font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                        {card.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        {card.description}
                      </p>
                      <div className={`flex items-center gap-2 ${card.accent} text-sm font-semibold group-hover:gap-3 transition-all duration-300`}>
                        Explore
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Inline styles for 3D hover effect */}
      <style jsx global>{`
        .group:hover > div[style*="preserve-3d"] {
          transform: rotateY(-3deg) rotateX(3deg) translateZ(10px) !important;
        }
        .group:hover div[style*="translateZ(40px)"] {
          transform: translateZ(60px) translateY(-30px) scale(1.05) !important;
          filter: drop-shadow(0 30px 40px rgba(0,0,0,0.2)) !important;
        }
        .group:hover div[style*="translateZ(30px)"] {
          transform: translateZ(45px) !important;
        }
      `}</style>
    </section>
  );
}


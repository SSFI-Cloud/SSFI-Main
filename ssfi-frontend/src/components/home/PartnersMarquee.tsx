'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const partners = [
  { id: 1, name: 'Bharat Skate India', logo: '/images/partners/bharatskate.webp' },
  { id: 2, name: 'Fit India', logo: '/images/partners/fitindia.webp' },
  { id: 3, name: 'Ministry of Corporate Affairs', logo: '/images/partners/mca.webp' },
  { id: 4, name: 'NITI Aayog', logo: '/images/partners/nitiaayog.webp' },
];

export default function PartnersMarquee() {
  // Triplicate for seamless infinite scroll
  const items = [...partners, ...partners, ...partners];

  return (
    <section className="relative py-20 overflow-hidden bg-white">
      {/* Top subtle divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-sm font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trusted Partners
          </span>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-gray-900">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Partners</span> &amp; Affiliations
          </h2>
          <p className="text-gray-400 text-sm mt-2">Proudly associated with India&apos;s premier sports and government bodies</p>
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute top-0 left-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex marquee-track">
          {items.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex-shrink-0 mx-10 md:mx-16 flex flex-col items-center gap-3 group"
            >
              <div className="w-36 h-20 md:w-44 md:h-24 relative grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain"
                  sizes="176px"
                />
              </div>
              <span className="text-xs text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center whitespace-nowrap">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 20s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
      `}</style>
    </section>
  );
}

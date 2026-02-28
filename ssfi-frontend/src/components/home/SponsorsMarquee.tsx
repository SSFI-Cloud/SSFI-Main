// SponsorsMarquee.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const sponsors = [
  { id: 1, name: 'Sponsor 1', logo: '/images/sponsors/sponsor-1.png' },
  { id: 2, name: 'Sponsor 2', logo: '/images/sponsors/sponsor-2.png' },
  { id: 3, name: 'Sponsor 3', logo: '/images/sponsors/sponsor-3.png' },
  { id: 4, name: 'Sponsor 4', logo: '/images/sponsors/sponsor-4.png' },
  { id: 5, name: 'Sponsor 5', logo: '/images/sponsors/sponsor-5.png' },
  { id: 6, name: 'Sponsor 6', logo: '/images/sponsors/sponsor-6.png' },
];

export const SponsorsMarquee = () => {
  return (
    <section className="relative py-16 bg-dark-800/50 border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/5 text-gray-400 text-sm font-semibold mb-2">
            Our Partners
          </span>
          <h2 className="text-2xl font-bold text-white">Trusted by Leading Brands</h2>
        </motion.div>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        <div className="flex gap-12 animate-marquee">
          {[...sponsors, ...sponsors].map((sponsor, index) => (
            <div
              key={`${sponsor.id}-${index}`}
              className="flex-shrink-0 w-40 h-20 relative grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                fill
                className="object-contain"
                sizes="160px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsorsMarquee;

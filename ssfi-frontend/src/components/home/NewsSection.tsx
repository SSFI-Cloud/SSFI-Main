'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  publishedAt: string;
  category: string;
}

const NewsSection = () => {
  const [news] = useState<NewsArticle[]>([
    {
      id: 1,
      title: 'India Wins Gold at Asian Skating Championships 2026',
      slug: 'india-wins-gold-asian-championships-2026',
      excerpt: 'Our national team brings home 5 gold medals from the prestigious Asian Skating Championships held in Tokyo.',
      image: '/images/news/gold-medal.jpg',
      publishedAt: '2026-01-20T10:00:00Z',
      category: 'Championships',
    },
    {
      id: 2,
      title: 'New Training Facility Opens in Bangalore',
      slug: 'new-training-facility-bangalore',
      excerpt: 'State-of-the-art skating training facility inaugurated with world-class infrastructure and coaching staff.',
      image: '/images/news/facility.jpg',
      publishedAt: '2026-01-18T14:30:00Z',
      category: 'Infrastructure',
    },
    {
      id: 3,
      title: 'Registration Open for National Championship 2026',
      slug: 'registration-national-championship-2026',
      excerpt: 'Early bird registration now open for the 15th National Speed Skating Championship scheduled for March.',
      image: '/images/news/registration.jpg',
      publishedAt: '2026-01-15T09:00:00Z',
      category: 'Events',
    },
  ]);

  return (
    <section className="relative py-24 bg-dark-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-accent-500/10 text-accent-400 text-sm font-semibold mb-4 border border-accent-500/20">
              Latest Updates
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              News & Announcements
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl">
              Stay updated with the latest from SSFI
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="hidden md:block"
          >
            <Link
              href="/news"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold transition-all duration-300"
            >
              View All News
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Link href={`/news/${article.slug}`} className="block h-full">
                <div className="relative h-full rounded-2xl bg-dark-800/50 border border-white/5 overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all duration-300">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-accent-500/90 backdrop-blur-sm text-white text-xs font-semibold">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                      <Clock className="w-4 h-4" />
                      <time dateTime={article.publishedAt}>
                        {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                      </time>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-primary-400 transition-colors duration-300">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>

                    {/* Read More Link */}
                    <div className="flex items-center gap-2 text-accent-400 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Mobile View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center md:hidden"
        >
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-accent-500/50"
          >
            View All News
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsSection;

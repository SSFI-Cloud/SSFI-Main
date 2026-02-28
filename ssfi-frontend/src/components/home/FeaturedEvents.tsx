'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface Event {
  id: number;
  title: string;
  category: 'NATIONAL' | 'STATE' | 'DISTRICT';
  date: string;
  registrationEnd: string;
  venue: string;
  image: string;
  participants: number;
  entryFee: number;
  status: 'OPEN' | 'CLOSING_SOON' | 'COMPLETED';
}

const FeaturedEvents = () => {
  const [events] = useState<Event[]>([
    {
      id: 1,
      title: '15th National Speed Skating Championship',
      category: 'NATIONAL',
      date: '2026-03-15',
      registrationEnd: '2026-02-28',
      venue: 'Jawaharlal Nehru Stadium, New Delhi',
      image: '/images/events/national-championship.jpg',
      participants: 450,
      entryFee: 500,
      status: 'OPEN',
    },
    {
      id: 2,
      title: 'Karnataka State Roller Skating',
      category: 'STATE',
      date: '2026-02-20',
      registrationEnd: '2026-02-10',
      venue: 'Mysore Sports Complex, Mysore',
      image: '/images/events/state-championship.jpg',
      participants: 220,
      entryFee: 300,
      status: 'CLOSING_SOON',
    },
    {
      id: 3,
      title: 'District Level Artistic Skating',
      category: 'DISTRICT',
      date: '2026-02-05',
      registrationEnd: '2026-01-30',
      venue: 'District Sports Ground, Bangalore',
      image: '/images/events/district-event.jpg',
      participants: 150,
      entryFee: 200,
      status: 'CLOSING_SOON',
    },
  ]);

  const getCategoryColor = (category: Event['category']) => {
    switch (category) {
      case 'NATIONAL':
        return 'from-red-500 to-orange-500';
      case 'STATE':
        return 'from-blue-500 to-cyan-500';
      case 'DISTRICT':
        return 'from-purple-500 to-pink-500';
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-3 py-1 rounded-full bg-accent-500/20 text-accent-400 text-xs font-semibold border border-accent-500/30">
            Open for Registration
          </span>
        );
      case 'CLOSING_SOON':
        return (
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Closing Soon
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-semibold border border-gray-500/30">
            Completed
          </span>
        );
    }
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-semibold mb-4 border border-primary-500/20 font-body">
              Upcoming Events
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-4">
              Featured Championships
            </h2>
            <p className="text-xl font-body font-light text-gray-400 max-w-2xl">
              Register for upcoming skating events and championships across India
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
              href="/events"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold transition-all duration-300 font-body"
            >
              View All Events
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Events Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className="relative h-full rounded-2xl bg-dark-800/50 border border-white/5 overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all duration-300">
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(event.category)} text-white text-xs font-bold`}>
                      {event.category}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 group-hover:text-primary-400 transition-colors duration-300">
                    {event.title}
                  </h3>

                  <div className="space-y-3 mb-6">
                    {/* Date */}
                    <div className="flex items-center gap-3 text-gray-400">
                      <Calendar className="w-4 h-4 text-primary-400" />
                      <span className="text-sm">
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    {/* Venue */}
                    <div className="flex items-center gap-3 text-gray-400">
                      <MapPin className="w-4 h-4 text-accent-400" />
                      <span className="text-sm line-clamp-1">{event.venue}</span>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-3 text-gray-400">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">{event.participants} Participants</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className="text-xs text-gray-500">Entry Fee</p>
                      <p className="text-lg font-bold text-white">₹{event.entryFee}</p>
                    </div>

                    <Link
                      href={`/events/${event.id}`}
                      className="group/btn inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/50"
                    >
                      Register
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
                </div>
              </div>
            </motion.div>
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
            href="/events"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/50"
          >
            View All Events
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedEvents;

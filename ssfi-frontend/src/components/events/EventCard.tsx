'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils/resolveImageUrl';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ChevronRight,
  Ticket,
} from 'lucide-react';
import type { Event } from '@/types/event';
import {
  getStatusConfig,
  isRegistrationOpen,
  getDaysUntilEvent,
  formatEventDate,
  DISCIPLINES,
} from '@/types/event';

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const statusConfig = getStatusConfig(event.status);
  const daysUntil = getDaysUntilEvent(event.eventDate);
  const canRegister = isRegistrationOpen(event);
  const registrationCount = event._count?.registrations || 0;

  // Get discipline labels
  const disciplineLabels = (event.disciplines || [])
    .map((d) => DISCIPLINES.find((disc) => disc.value === d)?.label)
    .filter(Boolean)
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-dark-800/70 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
    >
      {/* Banner Image */}
      <div className="relative h-48 overflow-hidden">
        {event.bannerImage ? (
          <img
            src={resolveImageUrl(event.bannerImage)}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-teal-900/40 flex items-center justify-center">
            <Trophy className="w-16 h-16 text-emerald-700/50" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Days Until Badge */}
        {daysUntil > 0 && daysUntil <= 30 && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30 backdrop-blur-sm">
              {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days left`}
            </span>
          </div>
        )}

        {/* Event Level Badge */}
        <div className="absolute bottom-4 left-4">
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/10 text-white/80 backdrop-blur-sm shadow-sm">
            {event.eventLevel?.replace('_', ' ') || 'Level N/A'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {event.name}
        </h3>

        {/* Disciplines */}
        <div className="flex flex-wrap gap-1 mb-3">
          {disciplineLabels.map((label, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-dark-300 border border-white/10"
            >
              {label}
            </span>
          ))}
          {(event.disciplines?.length || 0) > 2 && (
            <span className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-dark-400 border border-white/10">
              +{(event.disciplines?.length || 0) - 2} more
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{formatEventDate(event.eventDate, event.eventEndDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <MapPin className="w-4 h-4 text-teal-400" />
            <span className="truncate">
              {event.venue}, {event.city}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-dark-300">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{registrationCount} registered</span>
            </div>
            {event.maxParticipants && (
              <span className="text-xs text-dark-500">
                {event.maxParticipants - registrationCount} spots left
              </span>
            )}
          </div>
        </div>

        {/* Fee & Registration */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <span className="text-xs text-dark-500">Entry Fee</span>
            <p className="text-lg font-bold text-white">
              {event.entryFee > 0 ? `₹${event.entryFee}` : 'Free'}
            </p>
          </div>

          <Link
            href={`/events/${event.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${canRegister
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white/5 text-dark-300 border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400'
              }`}
          >
            {canRegister ? (
              <>
                <Ticket className="w-4 h-4" />
                Register
              </>
            ) : (
              <>
                View Details
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Registration deadline indicator */}
      {canRegister && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
            initial={{ width: '100%' }}
            animate={{
              width: `${Math.max(
                0,
                ((new Date(event.registrationEndDate).getTime() - Date.now()) /
                  (new Date(event.registrationEndDate).getTime() -
                    new Date(event.registrationStartDate).getTime())) *
                100
              )}%`,
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

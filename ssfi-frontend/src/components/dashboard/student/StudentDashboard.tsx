'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User, Trophy, Calendar, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Phone, Mail, Building2, RefreshCw, MapPin, Ticket,
} from 'lucide-react';
import { StatusBadge, DashCard, StatCard, DashboardHero } from '../shared/DashboardComponents';
import { useDashboard } from '@/lib/hooks/useDashboard';
import type { StudentDashboardData } from '@/types/dashboard';
import CertificatesSection from './CertificatesSection';
import RenewalBanner from '@/components/common/RenewalBanner';

export default function StudentDashboardComponent() {
  const { fetchDashboard, data, isLoading, error } = useDashboard();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-500 border-t-transparent" />
    </div>
  );

  if (error || !data || data.role !== 'STUDENT') return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Failed to load dashboard</h3>
      <p className="text-sm text-gray-600 max-w-md text-center">{error || 'An error occurred. Please try again.'}</p>
      <button onClick={() => fetchDashboard()} className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center gap-2">
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  );

  const dashboard = data as unknown as StudentDashboardData;
  const { profile, membership, eventRegistrations, upcomingEvents, stats } = dashboard;

  const daysUntilExpiry = membership.expiryDate
    ? Math.ceil((new Date(membership.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const showRenewalBanner = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  return (
    <div className="space-y-6">
      {showRenewalBanner && (
        <RenewalBanner expiryDate={membership.expiryDate} daysUntilExpiry={daysUntilExpiry} userRole="STUDENT"
          onRenew={() => { window.location.href = '/dashboard/renew-membership'; }} />
      )}

      {/* Hero */}
      <DashboardHero
        name={`${profile.firstName} ${profile.lastName}`}
        role="Student Athlete"
        roleColor="green"
        subtitle={`${profile.ageCategory} · ${profile.state}, ${profile.district}`}
        stats={[
          { label: 'SSFI ID', value: profile.uid },
          { label: 'Events Registered', value: stats.totalEventsRegistered },
          { label: 'Upcoming', value: stats.upcomingEventsCount },
        ]}
        actions={
          profile.profilePhoto
            ? <img src={profile.profilePhoto} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-white/30" />
            : <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center"><User className="w-8 h-8 text-white" /></div>
        }
      />

      {/* Membership + Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Membership card */}
        <div className={`md:col-span-1 rounded-2xl border p-5 ${membership.isActive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Membership Status</p>
              <p className={`text-2xl font-bold mt-1 ${membership.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {membership.isActive ? 'Active' : 'Expired'}
              </p>
              {membership.expiryDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {membership.isActive ? 'Expires' : 'Expired'} {new Date(membership.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className={`p-2.5 rounded-xl ${membership.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
              {membership.isActive
                ? <CheckCircle2 className="w-6 h-6 text-gray-900" />
                : <AlertCircle className="w-6 h-6 text-gray-900" />}
            </div>
          </div>
          {(membership.needsRenewal || !membership.isActive) && (
            <Link href="/dashboard/renew-membership"
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">
              <RefreshCw className="w-4 h-4" /> Renew Membership
            </Link>
          )}
        </div>

        <StatCard title="Events Registered" value={stats.totalEventsRegistered} icon={Trophy}   color="blue"   delay={0.07} />
        <StatCard title="Upcoming Events"   value={stats.upcomingEventsCount}   icon={Calendar} color="green"  delay={0.14} />
      </div>

      {/* Club Info */}
      {profile.club && (
        <DashCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600">My Club</p>
            <p className="font-semibold text-gray-900 text-lg">{profile.club.name}</p>
            {profile.club.phone && <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> {profile.club.phone}</p>}
          </div>
          <StatusBadge status="ACTIVE" size="md" />
        </DashCard>
      )}

      {/* Certificates */}
      <CertificatesSection />

      {/* Events grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* My Registrations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">My Event Registrations</h3>
            </div>
            <Link href="/dashboard/my-events" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {eventRegistrations.length > 0 ? eventRegistrations.slice(0, 5).map((reg: any) => (
              <Link key={reg.id} href={`/dashboard/my-events/${reg.event.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-blue-500 uppercase leading-none">{new Date(reg.event.eventDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <span className="text-base font-bold text-gray-900 leading-tight">{new Date(reg.event.eventDate).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{reg.event.name}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> {reg.event.venue}, {reg.event.city}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={reg.status} />
                  {reg.status === 'CONFIRMED' && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 font-medium">e-Ticket</span>
                  )}
                </div>
              </Link>
            )) : (
              <div className="px-5 py-10 text-center">
                <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No event registrations yet</p>
                <Link href="/events" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <Ticket className="w-3 h-3" /> Browse Events
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Events You Can Join */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Events You Can Join</h3>
            </div>
            <Link href="/events" className="text-xs font-medium text-green-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-green-500 uppercase leading-none">{new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <span className="text-base font-bold text-gray-900 leading-tight">{new Date(event.eventDate).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.name}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}, {event.city}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-600">{event.entryFee ? `₹${event.entryFee}` : 'Free'}</p>
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-lg border border-green-100 font-medium">Register</span>
                </div>
              </Link>
            )) : (
              <div className="px-5 py-10 text-center">
                <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No eligible events available right now</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <DashCard className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Phone</p>
              <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
            </div>
          </div>
          {profile.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="text-sm font-medium text-gray-900 truncate">{profile.email}</p>
              </div>
            </div>
          )}
        </div>
      </DashCard>
    </div>
  );
}

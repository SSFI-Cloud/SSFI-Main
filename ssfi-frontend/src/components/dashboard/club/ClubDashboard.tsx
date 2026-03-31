'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, UserCheck, Trophy, Calendar, AlertCircle, ChevronRight, BarChart3 } from 'lucide-react';
import { StatCard, RecentList, StatusBadge, ChartCard, SimpleBarChart, DonutChart, QuickAction, DashboardHero, DashCard, RenewalCountdownBadge } from '../shared/DashboardComponents';
import { useDashboard } from '@/lib/hooks/useDashboard';
import type { ClubDashboardData } from '@/types/dashboard';
import renewalService, { RenewalStatus } from '@/services/renewal.service';
import RenewalBanner from '@/components/common/RenewalBanner';

export default function ClubDashboard() {
  const { fetchDashboard, data, isLoading, error } = useDashboard();
  const [renewalInfo, setRenewalInfo] = useState<RenewalStatus | null>(null);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { renewalService.getRenewalStatus().then(setRenewalInfo).catch(() => {}); }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent" />
    </div>
  );

  if (error || !data || data.role !== 'CLUB_OWNER') return (
    <div className="flex items-center justify-center h-96">
      <p className="text-red-500">{error || 'Failed to load dashboard'}</p>
    </div>
  );

  const dashboard = data as ClubDashboardData;

  const genderData = [
    { label: 'Male',   value: dashboard.statistics?.studentsByGender?.['MALE']   || 0, color: '#10b981' },
    { label: 'Female', value: dashboard.statistics?.studentsByGender?.['FEMALE'] || 0, color: '#14b8a6' },
    { label: 'Other',  value: dashboard.statistics?.studentsByGender?.['OTHER']  || 0, color: '#10b981' },
  ];

  const ageCategoryData = Object.entries(dashboard.statistics?.studentsByAgeCategory || {})
    .map(([label, value]) => ({ label, value: Number(value), color: 'bg-teal-500' }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <DashboardHero
        name={dashboard.club.name}
        role="Club Owner"
        roleColor="pink"
        subtitle={`${dashboard.club.district}, ${dashboard.club.state} · ${dashboard.club.code}`}
        stats={[
          { label: 'Total Students', value: dashboard.overview.totalStudents || 0 },
          { label: 'Approved', value: dashboard.overview.approvedStudents || 0 },
          { label: 'Events', value: dashboard.statistics?.totalEventRegistrations || 0 },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={renewalInfo?.accountStatus === 'EXPIRED' ? 'EXPIRED' : dashboard.club.status} size="md" />
          </div>
        }
      />

      {renewalInfo?.showNotification && <RenewalBanner expiryDate={renewalInfo.expiryDate} daysUntilExpiry={renewalInfo.daysUntilExpiry || 0} userRole="CLUB_OWNER" />}

      {/* Renewal countdown */}
      {renewalInfo && (
        <RenewalCountdownBadge
          daysUntilExpiry={renewalInfo.daysUntilExpiry}
          expiryDate={renewalInfo.expiryDate}
          accountStatus={renewalInfo.accountStatus}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Students"      value={dashboard.overview.totalStudents || 0}                      icon={Users}     color="pink"   href="/dashboard/students"              delay={0}    />
        <StatCard title="Approved"            value={dashboard.overview.approvedStudents || 0}                   icon={UserCheck} color="green"  delay={0.07} />
        <StatCard title="Event Registrations" value={dashboard.statistics?.totalEventRegistrations || 0}         icon={Trophy}    color="blue"   delay={0.14} />
      </div>

      {/* Expired memberships alert */}
      {(dashboard.overview.expiredMemberships || 0) > 0 && (
        <DashCard className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Expired Memberships</p>
              <p className="text-xs text-gray-500 mt-0.5">{dashboard.overview.expiredMemberships} students have expired memberships and need renewal</p>
            </div>
            <Link href="/dashboard/students?membership=expired" className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors border border-red-100">
              View List
            </Link>
          </div>
        </DashCard>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentList title="Recent Students" href="/dashboard/students" icon={Users} color="pink" delay={0.35}
            items={dashboard.recentActivity?.students || []}
            renderItem={(s: any) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                  {s.profilePhoto ? <img src={s.profilePhoto} alt={s.name || 'Student'} className="w-full h-full object-cover" /> : (s.name || 'U').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name || 'Unknown Student'}</p>
                  <p className="text-xs text-gray-600">{s.ageCategory} · {s.uid}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            )}
          />
        </div>
        <ChartCard title="Students by Gender" subtitle="Gender distribution" delay={0.42}>
          <DonutChart data={genderData} size={140} />
        </ChartCard>
      </div>

      {/* Charts + Events */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Students by Age Category" subtitle="Distribution across age groups" delay={0.49}>
          <SimpleBarChart data={ageCategoryData} />
        </ChartCard>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Upcoming Events</h3>
            </div>
            <Link href="/events" className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(dashboard.upcomingEvents || []).length > 0 ? (
              (dashboard.upcomingEvents || []).map((event: any) => (
                <Link key={event.id} href={`/events/${event.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-emerald-500 uppercase">{new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-gray-900 leading-tight">{new Date(event.eventDate).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.name}</p>
                    <p className="text-xs text-gray-600 truncate">{event.venue}, {event.city}</p>
                  </div>
                  {event.status === 'REGISTRATION_OPEN' && (
                    <span className="px-2 py-1 text-xs bg-green-50 text-green-600 font-medium rounded-lg border border-green-100 flex-shrink-0">Register</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-gray-600">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <QuickAction title="View Students"     description="Manage skaters"                icon={Users}     href="/dashboard/students"                 color="green"  />
          <QuickAction title="Reports"           description="Analytics & insights"          icon={BarChart3} href="/dashboard/reports"                   color="purple" />
          <QuickAction title="View Events"       description="Browse upcoming events"        icon={Calendar}  href="/events"                             color="teal"  />
        </div>
      </div>
    </div>
  );
}

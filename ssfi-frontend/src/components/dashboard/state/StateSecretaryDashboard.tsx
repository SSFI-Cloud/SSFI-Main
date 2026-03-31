'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Shield, Trophy, Calendar, Clock,
  IndianRupee, BarChart3, Building2,
  Bell,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import renewalService, { RenewalStatus } from '@/services/renewal.service';
import RenewalBanner from '@/components/common/RenewalBanner';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  DashboardHero, StatCard, RecentList,
  QuickAction, StatusBadge, RenewalCountdownBadge,
} from '../shared/DashboardComponents';

interface StateStats {
  totalDistricts: number; totalClubs: number; totalSkaters: number; activeEvents: number;
  pendingApprovals: { clubs: number; students: number; events: number };
  revenue: { total: number; thisMonth: number; growth: number };
}

export default function StateSecretaryDashboard() {
  const { user } = useAuth();
  const [stateName, setStateName] = useState<string | null>(null);
  const [stats, setStats] = useState<StateStats>({
    totalDistricts: 0, totalClubs: 0, totalSkaters: 0, activeEvents: 0,
    pendingApprovals: { clubs: 0, students: 0, events: 0 },
    revenue: { total: 0, thisMonth: 0, growth: 0 },
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewalInfo, setRenewalInfo] = useState<RenewalStatus | null>(null);
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    const loadDashboard = async (retryCount = 0): Promise<void> => {
      try {
        const { data } = await dashboardService.getDashboardStats();
        if (data) {
          if (data.stateName) setStateName(data.stateName);
          setStats({
            totalDistricts: data.overview.totalDistricts || 0,
            totalClubs: data.overview.totalClubs || 0,
            totalSkaters: data.overview.totalStudents || 0,
            activeEvents: data.overview.totalEvents || 0,
            pendingApprovals: { clubs: data.pendingApprovals.clubs || 0, students: data.pendingApprovals.students || 0, events: data.pendingApprovals.events || 0 },
            revenue: { total: data.revenue?.total || 0, thisMonth: data.revenue?.thisMonth || 0, growth: data.revenue?.growth || 0 },
          });
          const acts: any[] = [];
          (data.recentActivity?.clubs || []).forEach((c: any) => acts.push({ id: c.id, type: 'club', title: c.name, sub: c.district?.name || '', time: c.createdAt, status: c.status }));
          (data.recentActivity?.students || []).forEach((s: any) => acts.push({ id: s.id, type: 'student', title: s.name, sub: s.club?.name || '', time: s.createdAt, status: s.user?.approvalStatus }));
          acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setActivities(acts.slice(0, 6));
          setUpcomingEvents((data.recentActivity?.events || []).slice(0, 4).map((e: any) => ({ id: e.id, name: e.name, date: e.eventDate, registrations: e._count?.registrations || 0 })));
        }
      } catch (e) {
        if (retryCount < 1) {
          await new Promise(r => setTimeout(r, 1500));
          return loadDashboard(retryCount + 1);
        }
        console.error(e);
      } finally { setLoading(false); }
    };
    loadDashboard();
    renewalService.getRenewalStatus().then(setRenewalInfo).catch(() => {});
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      <DashboardHero
        name={user?.name || 'Secretary'}
        role="State Secretary"
        roleColor="blue"
        subtitle={stateName ? `${stateName} Skating Federation` : 'State Skating Federation'}
        stats={[
          { label: 'Districts', value: stats.totalDistricts },
          { label: 'Clubs', value: stats.totalClubs },
          { label: 'Skaters', value: stats.totalSkaters.toLocaleString() },
        ]}
      />

      {renewalInfo?.showNotification && (
        <RenewalBanner expiryDate={renewalInfo.expiryDate} daysUntilExpiry={renewalInfo.daysUntilExpiry || 0} userRole="STATE_SECRETARY" />
      )}

      {/* Renewal countdown */}
      {renewalInfo && (
        <RenewalCountdownBadge
          daysUntilExpiry={renewalInfo.daysUntilExpiry}
          expiryDate={renewalInfo.expiryDate}
          accountStatus={renewalInfo.accountStatus}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Districts" value={stats.totalDistricts} icon={Building2} color="blue" href="/dashboard/districts" delay={0} />
        <StatCard title="Clubs" value={stats.totalClubs} icon={Shield} color="purple" href="/dashboard/clubs" delay={0.07} />
        <StatCard title="Skaters" value={stats.totalSkaters.toLocaleString()} icon={Users} color="green" href="/dashboard/students" delay={0.14} />
        <StatCard title="This Month" value={formatCurrency(stats.revenue.thisMonth)} icon={IndianRupee} color="teal"
          trend={{ value: stats.revenue.growth, isPositive: stats.revenue.growth >= 0 }} delay={0.21} />
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        <RecentList title="Recent Activity" icon={Bell} color="blue" href="/dashboard/students" delay={0.35}
          items={activities}
          renderItem={(a: any) => (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.type === 'club' ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                {a.type === 'club' ? <Building2 className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                <p className="text-xs text-gray-600 truncate">{a.sub}</p>
              </div>
              <StatusBadge status={a.status || 'PENDING'} />
            </div>
          )}
        />
        <RecentList title="Upcoming Events" icon={Trophy} color="teal" href="/dashboard/events" delay={0.42}
          items={upcomingEvents}
          renderItem={(e: any) => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                <p className="text-xs text-gray-600">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} · {e.registrations} registered</p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <QuickAction title="Create Event" description="Set up a competition" icon={Trophy} href="/dashboard/events/new" color="teal" />
          <QuickAction title="View Students" description="Manage skaters" icon={Users} href="/dashboard/students" color="green" />
          <QuickAction title="Reports" description="Analytics & insights" icon={BarChart3} href="/dashboard/reports" color="blue" />
        </div>
      </div>
    </div>
  );
}

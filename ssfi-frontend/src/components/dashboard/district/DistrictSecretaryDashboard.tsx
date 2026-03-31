'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Shield, Trophy, Calendar, Clock, IndianRupee, Building2, Bell, BarChart3 } from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import renewalService, { RenewalStatus } from '@/services/renewal.service';
import RenewalBanner from '@/components/common/RenewalBanner';
import { useAuth } from '@/lib/hooks/useAuth';
import { DashboardHero, StatCard, RecentList, QuickAction, StatusBadge, RenewalCountdownBadge } from '../shared/DashboardComponents';

export default function DistrictSecretaryDashboard() {
  const { user } = useAuth();
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalClubs: 0, totalSkaters: 0, activeEvents: 0, pendingClubs: 0, pendingStudents: 0, revenue: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewalInfo, setRenewalInfo] = useState<RenewalStatus | null>(null);

  useEffect(() => {
    const loadDashboard = async (retryCount = 0): Promise<void> => {
      try {
        const { data } = await dashboardService.getDashboardStats();
        if (data) {
          if (data.districtName) setDistrictName(data.districtName);
          setStats({
            totalClubs: data.overview.totalClubs || 0,
            totalSkaters: data.overview.totalStudents || 0,
            activeEvents: data.overview.totalEvents || 0,
            pendingClubs: data.pendingApprovals.clubs || 0,
            pendingStudents: data.pendingApprovals.students || 0,
            revenue: data.revenue?.thisMonth || 0,
          });
          const acts: any[] = [];
          (data.recentActivity?.students || []).forEach((s: any) => acts.push({ id: s.id, type: 'student', title: s.name, sub: s.club?.name || 'No club', time: s.createdAt, status: s.user?.approvalStatus }));
          (data.recentActivity?.clubs || []).forEach((c: any) => acts.push({ id: c.id, type: 'club', title: c.name, sub: c.district?.name || '', time: c.createdAt, status: c.status }));
          acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setActivities(acts.slice(0, 6));
          setEvents((data.recentActivity?.events || []).slice(0, 4).map((e: any) => ({ id: e.id, name: e.name, date: e.eventDate, registrations: e._count?.registrations || 0 })));
          setClubs((data.recentActivity?.clubs || []).slice(0, 5).map((c: any) => ({ id: c.id, name: c.name, uid: c.uid, students: c._count?.students || 0, status: c.status })));
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

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent" /></div>;

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <DashboardHero name={user?.name || 'Secretary'} role="District Secretary" roleColor="purple"
        subtitle={districtName ? `${districtName} District` : 'District Dashboard'}
        stats={[{ label: 'Clubs', value: stats.totalClubs }, { label: 'Skaters', value: stats.totalSkaters }, { label: 'Events', value: stats.activeEvents }]}
      />

      {renewalInfo?.showNotification && <RenewalBanner expiryDate={renewalInfo.expiryDate} daysUntilExpiry={renewalInfo.daysUntilExpiry || 0} userRole="DISTRICT_SECRETARY" />}

      {/* Renewal countdown */}
      {renewalInfo && (
        <RenewalCountdownBadge
          daysUntilExpiry={renewalInfo.daysUntilExpiry}
          expiryDate={renewalInfo.expiryDate}
          accountStatus={renewalInfo.accountStatus}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clubs" value={stats.totalClubs} icon={Shield} color="purple" href="/dashboard/clubs" delay={0} />
        <StatCard title="Skaters" value={stats.totalSkaters} icon={Users} color="blue" href="/dashboard/students" delay={0.07} />
        <StatCard title="Events" value={stats.activeEvents} icon={Trophy} color="teal" href="/dashboard/events" delay={0.14} />
        <StatCard title="Revenue" value={fmt(stats.revenue)} icon={IndianRupee} color="green" delay={0.21} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <RecentList title="Recent Activity" icon={Bell} color="purple" href="/dashboard/students" delay={0.35}
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
        <RecentList title="Clubs" icon={Shield} color="purple" href="/dashboard/clubs" delay={0.42}
          items={clubs}
          renderItem={(c: any) => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-600">{c.uid} · {c.students} skaters</p>
              </div>
              <StatusBadge status={c.status || 'PENDING'} />
            </div>
          )}
        />
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <QuickAction title="Create Event" description="Set up a competition" icon={Trophy} href="/dashboard/events/new" color="teal" />
          <QuickAction title="View Students" description="Manage skaters" icon={Users} href="/dashboard/students" color="green" />
          <QuickAction title="Reports" description="Analytics & insights" icon={BarChart3} href="/dashboard/reports" color="purple" />
        </div>
      </div>
    </div>
  );
}

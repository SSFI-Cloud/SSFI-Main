'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Shield, Trophy, Calendar, Clock, CheckCircle, AlertTriangle, IndianRupee, TrendingUp, Building2, Bell, FileText, BarChart3 } from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import renewalService, { RenewalStatus } from '@/services/renewal.service';
import RenewalBanner from '@/components/common/RenewalBanner';
import { DashboardHero, StatCard, PendingApprovalCard, RecentList, QuickAction, DashCard, StatusBadge } from '../shared/DashboardComponents';

export default function DistrictSecretaryDashboard() {
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalClubs: 0, totalSkaters: 0, activeEvents: 0, pendingClubs: 0, pendingStudents: 0, revenue: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewalInfo, setRenewalInfo] = useState<RenewalStatus | null>(null);

  useEffect(() => {
    (async () => {
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
    renewalService.getRenewalStatus().then(setRenewalInfo).catch(() => {});
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent" /></div>;

  const totalPending = stats.pendingClubs + stats.pendingStudents;
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <DashboardHero name={districtName || 'Secretary'} role="District Secretary" roleColor="purple"
        subtitle={districtName ? `${districtName} District` : 'District Dashboard'}
        stats={[{ label: 'Clubs', value: stats.totalClubs }, { label: 'Skaters', value: stats.totalSkaters }, { label: 'Events', value: stats.activeEvents }]}
      />

      {renewalInfo?.showNotification && <RenewalBanner expiryDate={renewalInfo.expiryDate} daysUntilExpiry={renewalInfo.daysUntilExpiry || 0} userRole="DISTRICT_SECRETARY" />}

      {renewalInfo && (
        <DashCard className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-600">Membership</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={`font-bold ${renewalInfo.accountStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{renewalInfo.accountStatus}</span>
              <span className="text-gray-500">·</span>
              <span className="text-sm text-gray-500">Renews: <span className="font-medium text-gray-800">{renewalInfo.expiryDate ? new Date(renewalInfo.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span></span>
            </div>
          </div>
        </DashCard>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clubs" value={stats.totalClubs} icon={Shield} color="purple" href="/dashboard/clubs" subtitle={`${stats.pendingClubs} pending`} delay={0} />
        <StatCard title="Skaters" value={stats.totalSkaters} icon={Users} color="blue" href="/dashboard/students" subtitle={`${stats.pendingStudents} pending`} delay={0.07} />
        <StatCard title="Events" value={stats.activeEvents} icon={Trophy} color="amber" href="/dashboard/events" delay={0.14} />
        <StatCard title="Revenue" value={fmt(stats.revenue)} icon={IndianRupee} color="green" delay={0.21} />
      </div>

      {totalPending > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Pending Approvals ({totalPending})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.pendingStudents > 0 && <PendingApprovalCard title="Students" count={stats.pendingStudents} icon={Users} href="/dashboard/approvals/students" color="blue" />}
            {stats.pendingClubs > 0 && <PendingApprovalCard title="Club Applications" count={stats.pendingClubs} icon={Shield} href="/dashboard/approvals/clubs" color="purple" />}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <RecentList title="Recent Activity" icon={Bell} color="purple" href="/dashboard/students" delay={0.35}
          items={activities}
          renderItem={(a: any) => (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.type === 'club' ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction title="Create Event" description="Set up a competition" icon={Trophy} href="/dashboard/events/new" color="amber" />
          <QuickAction title="Approve Students" description="Review registrations" icon={CheckCircle} href="/dashboard/approvals/students" color="green" />
          <QuickAction title="Add Student" description="Register a skater" icon={Users} href="/dashboard/students/new" color="blue" />
          <QuickAction title="Reports" description="Analytics & insights" icon={BarChart3} href="/dashboard/reports" color="purple" />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bell, Settings, Calendar, UserPlus, TrendingUp, Trophy, RefreshCw } from 'lucide-react';

import { DashboardHero, QuickAction } from '../shared/DashboardComponents';
import { useDashboard } from '@/lib/hooks/useDashboard';
import type { AdminDashboardData } from '@/types/dashboard';
import { StatsSection } from './sections/StatsSection';
import { ApprovalsSection } from './sections/ApprovalsSection';
import { ChartsSection } from './sections/ChartsSection';
import { RecentActivitySection } from './sections/RecentActivitySection';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminDashboard() {
  const { fetchDashboard, data, isLoading, error } = useDashboard();
  const { user } = useAuth();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data || data.role !== 'GLOBAL_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500 text-sm">{error || 'Failed to load dashboard'}</p>
        <button onClick={() => fetchDashboard()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const dashboard = data as AdminDashboardData;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <DashboardHero
        name={user?.name || 'Admin'}
        role="Global Administrator"
        roleColor="red"
        subtitle={today}
        stats={[
          { label: 'Total Members', value: (dashboard.overview.totalStudents || 0).toLocaleString() },
          { label: 'Active Events', value: (dashboard.overview.totalEvents || 0).toLocaleString() },
          { label: 'Pending Reviews', value: (dashboard.pendingApprovals?.total || 0).toLocaleString() },
        ]}
        actions={
          <>
            <Link href="/dashboard/settings" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <Bell className="w-5 h-5" />
            </Link>
            <Link href="/dashboard/settings" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
          </>
        }
      />

      {/* Stats */}
      <StatsSection overview={dashboard.overview} />

      {/* Pending Approvals */}
      <ApprovalsSection approvals={dashboard.pendingApprovals} />

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction title="Create Event"       description="Set up a new competition"         icon={Trophy}    href="/dashboard/events/new"                    color="blue"   />
          <QuickAction title="Add Student"        description="Register a new student"           icon={UserPlus}  href="/dashboard/students/new"                  color="green"  />
          <QuickAction title="Registration Windows" description="Manage open periods"            icon={Calendar}  href="/dashboard/registration-windows"          color="purple" />
          <QuickAction title="View Reports"       description="Analytics & insights"             icon={TrendingUp} href="/dashboard/reports"                     color="teal"  />
        </div>
      </motion.div>

      {/* Charts */}
      <ChartsSection statistics={dashboard.statistics} />

      {/* Recent Activity */}
      <RecentActivitySection recentActivity={dashboard.recentActivity} />
    </div>
  );
}

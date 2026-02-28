import { Building2, Trophy, Users } from 'lucide-react';
import { RecentList, StatusBadge } from '../../shared/DashboardComponents';
import { AdminDashboardData } from '@/types/dashboard';

export function RecentActivitySection({ recentActivity }: { recentActivity: AdminDashboardData['recentActivity'] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <RecentList
        title="Recent Students" href="/dashboard/students"
        icon={Users} color="blue" delay={0.6}
        items={recentActivity?.students || []}
        renderItem={(s: any) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {s.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
              <p className="text-xs text-gray-600 truncate">{s.club?.name || 'No club'}</p>
            </div>
            <StatusBadge status={s.user?.approvalStatus || 'PENDING'} />
          </div>
        )}
      />
      <RecentList
        title="Recent Clubs" href="/dashboard/clubs"
        icon={Building2} color="purple" delay={0.67}
        items={recentActivity?.clubs || []}
        renderItem={(c: any) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
              <p className="text-xs text-gray-600 truncate">{c.district?.name || 'Unknown district'}</p>
            </div>
            <StatusBadge status={c.status} />
          </div>
        )}
      />
      <RecentList
        title="Recent Events" href="/dashboard/events"
        icon={Trophy} color="amber" delay={0.74}
        items={recentActivity?.events || []}
        renderItem={(e: any) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
              <p className="text-xs text-gray-600">{new Date(e.eventDate).toLocaleDateString('en-IN')} · {e._count?.registrations || 0} registered</p>
            </div>
            <StatusBadge status={e.status} />
          </div>
        )}
      />
    </div>
  );
}

import {
  Globe, MapPin, Building2, Users, Trophy,
} from 'lucide-react';
import { StatCard } from '../../shared/DashboardComponents';
import { DashboardOverview } from '@/types/dashboard';

export function StatsSection({ overview }: { overview: DashboardOverview }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <StatCard title="Total States"    value={overview.totalStates    || 0} icon={Globe}     color="blue"   href="/dashboard/states"    delay={0}   />
      <StatCard title="Total Districts" value={overview.totalDistricts || 0} icon={MapPin}    color="teal"   href="/dashboard/districts"  delay={0.07}/>
      <StatCard title="Total Clubs"     value={overview.totalClubs     || 0} icon={Building2} color="purple" href="/dashboard/clubs"       delay={0.14}/>
      <StatCard title="Total Students"  value={overview.totalStudents  || 0} icon={Users}     color="teal"  href="/dashboard/students"   delay={0.21}/>
      <StatCard title="Total Events"    value={overview.totalEvents    || 0} icon={Trophy}    color="teal"   href="/dashboard/events"     delay={0.28}/>
    </div>
  );
}

import { BarChart2, PieChart, TrendingUp } from 'lucide-react';
import { ChartCard, SimpleBarChart, DonutChart } from '../../shared/DashboardComponents';
import { DashboardStatistics } from '@/types/dashboard';

export function ChartsSection({ statistics }: { statistics: DashboardStatistics | undefined }) {
  const genderStats  = statistics?.studentsByGender || {};
  const statusStats  = statistics?.studentsByStatus || {};

  const genderData = [
    { label: 'Male',   value: genderStats['MALE']   || 0, color: '#3b82f6' },
    { label: 'Female', value: genderStats['FEMALE'] || 0, color: '#ec4899' },
    { label: 'Other',  value: genderStats['OTHER']  || 0, color: '#8b5cf6' },
  ];

  const statusData = [
    { label: 'Approved', value: statusStats['APPROVED'] || 0, color: 'bg-green-500' },
    { label: 'Pending',  value: statusStats['PENDING']  || 0, color: 'bg-amber-500' },
    { label: 'Rejected', value: statusStats['REJECTED'] || 0, color: 'bg-red-500' },
  ];

  const regData = (statistics?.registrationsByMonth || []).map(item => ({
    label: new Date(item.month).toLocaleDateString('en-IN', { month: 'short' }),
    value: item.count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <ChartCard title="Registration Trend" subtitle="Monthly student registrations" delay={0.4}>
        {regData.length > 0 ? <SimpleBarChart data={regData} /> : <p className="text-sm text-gray-600 text-center py-8">No data available</p>}
      </ChartCard>
      <ChartCard title="Students by Gender" subtitle="Gender distribution" delay={0.47}>
        <DonutChart data={genderData} />
      </ChartCard>
      <ChartCard title="Students by Status" subtitle="Approval status breakdown" delay={0.54}>
        <SimpleBarChart data={statusData} />
      </ChartCard>
    </div>
  );
}

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/dashboard/admin/AdminDashboard';
import StateSecretaryDashboard from '@/components/dashboard/state/StateSecretaryDashboard';
import DistrictSecretaryDashboard from '@/components/dashboard/district/DistrictSecretaryDashboard';
import ClubDashboard from '@/components/dashboard/club/ClubDashboard';
import StudentDashboard from '@/components/dashboard/student/StudentDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  switch (user.role) {
    case 'GLOBAL_ADMIN':
      return <AdminDashboard />;
    case 'STATE_SECRETARY':
      return <StateSecretaryDashboard />;
    case 'DISTRICT_SECRETARY':
      return <DistrictSecretaryDashboard />;
    case 'CLUB_OWNER':
      return <ClubDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      // Fallback for unknown roles or if role is missing
      return <StudentDashboard />;
  }
}

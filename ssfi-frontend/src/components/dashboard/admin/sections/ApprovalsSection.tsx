import { motion } from 'framer-motion';
import { MapPin, Building2, Users, UserPlus, AlertCircle } from 'lucide-react';
import { PendingApprovalCard } from '../../shared/DashboardComponents';
import { PendingApprovals } from '@/types/dashboard';

export function ApprovalsSection({ approvals }: { approvals: PendingApprovals | undefined }) {
  if (!approvals || (approvals.total || 0) === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
          <p className="text-xs text-gray-600">{approvals.total} item{(approvals.total || 0) !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(approvals.stateSecretaries || 0) > 0 && (
          <PendingApprovalCard title="State Secretaries" count={approvals.stateSecretaries || 0} icon={MapPin} href="/dashboard/approvals/state-secretaries" color="blue" delay={0} />
        )}
        {(approvals.districtSecretaries || 0) > 0 && (
          <PendingApprovalCard title="District Secretaries" count={approvals.districtSecretaries || 0} icon={Building2} href="/dashboard/approvals/district-secretaries" color="purple" delay={0.07} />
        )}
        {(approvals.clubs || 0) > 0 && (
          <PendingApprovalCard title="Clubs" count={approvals.clubs || 0} icon={Users} href="/dashboard/approvals/clubs" color="pink" delay={0.14} />
        )}
        {(approvals.students || 0) > 0 && (
          <PendingApprovalCard title="Students" count={approvals.students || 0} icon={UserPlus} href="/dashboard/approvals/students" color="green" delay={0.21} />
        )}
      </div>
    </motion.div>
  );
}

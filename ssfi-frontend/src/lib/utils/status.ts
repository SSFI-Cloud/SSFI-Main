export const getStatusColor = (status: string) => {
    if (!status) return { bg: 'bg-slate-500/10', text: 'text-slate-500' };

    switch (status.toUpperCase()) {
        case 'APPROVED':
        case 'ACTIVE':
        case 'COMPLETED':
        case 'PUBLISHED':
        case 'VERIFIED':
            return { bg: 'bg-green-500/10', text: 'text-green-500' };

        case 'PENDING':
        case 'ONGOING':
        case 'processing':
        case 'SUBMITTED':
            return { bg: 'bg-amber-500/10', text: 'text-amber-500' };

        case 'REJECTED':
        case 'INACTIVE':
        case 'CANCELLED':
        case 'BLOCKED':
        case 'SUSPENDED':
            return { bg: 'bg-red-500/10', text: 'text-red-500' };

        case 'DRAFT':
            return { bg: 'bg-slate-500/10', text: 'text-slate-500' };

        default:
            return { bg: 'bg-slate-500/10', text: 'text-slate-500' };
    }
};

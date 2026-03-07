import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import type { ReportScope } from '../services/report.service';

/** Extract scope from authenticated user */
function getUserScope(req: Request): ReportScope {
    const user = (req as any).user;
    if (!user) return { role: 'GLOBAL_ADMIN' };
    return {
        role: user.role,
        stateId: user.stateId,
        districtId: user.districtId,
        clubId: user.clubId,
        studentId: user.studentId,
    };
}

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scope = getUserScope(req);
        const data = await reportService.getDashboardStats(scope);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

export const getPaymentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scope = getUserScope(req);
        const data = await reportService.getPaymentStats(scope);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

/**
 * Export reports data as CSV
 * GET /api/v1/reports/export
 */
export const exportReportsCSV = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scope = getUserScope(req);
        const data = await reportService.getDashboardStats(scope);
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        const lines: string[] = [];

        // Section 1: Overview
        lines.push('=== SSFI Reports Export ===');
        lines.push(`Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`);
        lines.push(`Report Scope: ${data.roleLabels.title}`);
        lines.push('');
        lines.push('--- Overview ---');
        lines.push('Metric,Value');
        lines.push(`Total Students,${data.overview.totalStudents}`);
        lines.push(`Total Clubs,${data.overview.totalClubs}`);
        lines.push(`Total Events,${data.overview.totalEvents}`);
        lines.push(`Total Revenue,${data.overview.totalRevenue}`);
        lines.push(`Registrations Growth %,${data.overview.registrationsGrowth}`);
        lines.push(`Revenue Growth %,${data.overview.revenueGrowth}`);
        lines.push('');

        // Section 2: Pending Approvals (admin only)
        if (scope.role === 'GLOBAL_ADMIN') {
            lines.push('--- Pending Approvals ---');
            lines.push('Category,Count');
            lines.push(`State Secretaries,${data.overview.pendingApprovals.state}`);
            lines.push(`District Secretaries,${data.overview.pendingApprovals.district}`);
            lines.push(`Clubs,${data.overview.pendingApprovals.club}`);
            lines.push(`Students,${data.overview.pendingApprovals.student}`);
            lines.push('');
        }

        // Section 3: Monthly Trends
        lines.push('--- Monthly Trends ---');
        lines.push('Month,Registrations,Revenue');
        for (let i = 0; i < 12; i++) {
            lines.push(`${MONTHS[i]},${data.trends.monthlyRegistrations[i]},${data.trends.monthlyRevenue[i]}`);
        }
        lines.push('');

        // Section 4: Top breakdown
        if (data.analytics.topItems.length > 0) {
            lines.push(`--- ${data.analytics.tableLabel} ---`);
            lines.push(`${data.roleLabels.col1},Students,Clubs`);
            for (const item of data.analytics.topItems) {
                lines.push(`"${item.name}",${item.students},${item.clubs}`);
            }
        }

        const csvContent = lines.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=SSFI-Reports-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};

/**
 * Export payments data as CSV
 * GET /api/v1/reports/payments-export
 */
export const exportPaymentsCSV = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scope = getUserScope(req);
        const prisma = (await import('../config/prisma')).default;

        // Build user filter based on scope
        const whereFilter: Record<string, any> = {};
        if (scope.stateId) {
            whereFilter.user = { OR: [
                { student: { stateId: scope.stateId } },
                { clubOwner: { club: { stateId: scope.stateId } } },
            ]};
        } else if (scope.districtId) {
            whereFilter.user = { OR: [
                { student: { districtId: scope.districtId } },
                { clubOwner: { club: { districtId: scope.districtId } } },
            ]};
        } else if (scope.clubId) {
            whereFilter.user = { clubOwner: { clubId: scope.clubId } };
        } else if (scope.studentId) {
            whereFilter.user = { student: { id: scope.studentId } };
        }

        const payments = await prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5000,
            where: whereFilter,
            include: {
                user: { select: { email: true, uid: true } },
            },
        });

        const lines: string[] = [];
        lines.push('Order ID,Payment ID,Amount,Currency,Type,Status,User UID,User Email,Description,Date');

        for (const p of payments) {
            lines.push([
                p.razorpayOrderId || '',
                p.razorpayPaymentId || '',
                Number(p.amount),
                p.currency,
                p.paymentType,
                p.status,
                p.user?.uid || '',
                p.user?.email || '',
                `"${(p.description || '').replace(/"/g, '""')}"`,
                p.createdAt.toISOString(),
            ].join(','));
        }

        const csvContent = lines.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=SSFI-Payments-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};

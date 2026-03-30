import prisma from '../config/prisma';

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Scope filters based on user role.
 * - GLOBAL_ADMIN: no filter (global data)
 * - STATE_SECRETARY: filter by stateId
 * - DISTRICT_SECRETARY: filter by districtId
 * - CLUB_OWNER: filter by clubId
 * - STUDENT: filter by studentId (limited data)
 */
export interface ReportScope {
    role: string;
    stateId?: number;
    districtId?: number;
    clubId?: number;
    studentId?: number;
}

// Build Prisma where-clause for students based on scope
function studentWhere(scope: ReportScope, extra: Record<string, any> = {}) {
    const where: Record<string, any> = { ...extra };
    if (scope.stateId) where.stateId = scope.stateId;
    if (scope.districtId) where.districtId = scope.districtId;
    if (scope.clubId) where.clubId = scope.clubId;
    if (scope.studentId) where.id = scope.studentId;
    return where;
}

// Build Prisma where-clause for clubs based on scope
function clubWhere(scope: ReportScope, extra: Record<string, any> = {}) {
    const where: Record<string, any> = { ...extra };
    if (scope.stateId) where.stateId = scope.stateId;
    if (scope.districtId) where.districtId = scope.districtId;
    if (scope.clubId) where.id = scope.clubId;
    return where;
}

// Build Prisma where-clause for events based on scope
function eventWhere(scope: ReportScope, extra: Record<string, any> = {}) {
    const where: Record<string, any> = { ...extra };
    if (scope.stateId) where.stateId = scope.stateId;
    if (scope.districtId) where.districtId = scope.districtId;
    return where;
}

// Build Prisma where-clause for payments based on scope
function paymentWhere(scope: ReportScope, extra: Record<string, any> = {}) {
    const where: Record<string, any> = { ...extra };
    if (scope.clubId) {
        // Payments from users of this club
        where.user = { clubOwner: { clubId: scope.clubId } };
    } else if (scope.districtId) {
        where.user = { OR: [
            { student: { districtId: scope.districtId } },
            { clubOwner: { club: { districtId: scope.districtId } } },
        ]};
    } else if (scope.stateId) {
        where.user = { OR: [
            { student: { stateId: scope.stateId } },
            { clubOwner: { club: { stateId: scope.stateId } } },
        ]};
    } else if (scope.studentId) {
        where.user = { student: { id: scope.studentId } };
    }
    return where;
}

export const getDashboardStats = async (scope: ReportScope = { role: 'GLOBAL_ADMIN' }) => {
    const now = new Date();
    const year = now.getFullYear();
    const isAdmin = scope.role === 'GLOBAL_ADMIN';
    const isStudent = scope.role === 'STUDENT';

    // 1. Basic counts
    const [totalStudents, totalClubs, totalEvents, totalRevenueResult] = await Promise.all([
        prisma.student.count({ where: studentWhere(scope) }),
        prisma.club.count({ where: clubWhere(scope, { isActive: true }) }),
        isStudent
            ? prisma.eventRegistration.count({ where: { student: { id: scope.studentId } } })
            : prisma.event.count({ where: eventWhere(scope, { status: 'PUBLISHED' }) }),
        prisma.payment.aggregate({
            _sum: { amount: true },
            where: paymentWhere(scope, { status: 'COMPLETED' }),
        }),
    ]);

    // Pending approvals — only relevant for admin / state / district
    let pendingApprovals = { state: 0, district: 0, club: 0, student: 0, total: 0 };
    if (isAdmin) {
        const [pState, pDistrict, pClub, pStudent] = await Promise.all([
            prisma.stateSecretary.count({ where: { status: 'PENDING' } }),
            prisma.districtSecretary.count({ where: { status: 'PENDING' } }),
            prisma.club.count({ where: { status: 'PENDING' } }),
            prisma.user.count({ where: { role: 'STUDENT', approvalStatus: 'PENDING' } }),
        ]);
        pendingApprovals = { state: pState, district: pDistrict, club: pClub, student: pStudent, total: pState + pDistrict + pClub + pStudent };
    }

    // 2. Growth: last 30 days vs previous 30 days
    const today = startOfDay(now);
    const d30ago = new Date(today); d30ago.setDate(d30ago.getDate() - 30);
    const d60ago = new Date(today); d60ago.setDate(d60ago.getDate() - 60);

    const [studentsLast30, studentsPrev30, revLast30, revPrev30] = await Promise.all([
        prisma.student.count({ where: studentWhere(scope, { createdAt: { gte: d30ago } }) }),
        prisma.student.count({ where: studentWhere(scope, { createdAt: { gte: d60ago, lt: d30ago } }) }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: paymentWhere(scope, { status: 'COMPLETED', createdAt: { gte: d30ago } }) }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: paymentWhere(scope, { status: 'COMPLETED', createdAt: { gte: d60ago, lt: d30ago } }) }),
    ]);

    const growthPct = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    const registrationsGrowth = growthPct(studentsLast30, studentsPrev30);
    const revenueGrowth = growthPct(Number(revLast30._sum.amount || 0), Number(revPrev30._sum.amount || 0));

    // 3. Monthly trends for current year (12 months)
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const monthlyRegistrations: number[] = new Array(12).fill(0);
    const monthlyRevenue: number[] = new Array(12).fill(0);

    const [regByMonth, revByMonth] = await Promise.all([
        prisma.student.findMany({
            where: studentWhere(scope, { createdAt: { gte: yearStart, lt: yearEnd } }),
            select: { createdAt: true },
        }),
        prisma.payment.findMany({
            where: paymentWhere(scope, { status: 'COMPLETED', createdAt: { gte: yearStart, lt: yearEnd } }),
            select: { createdAt: true, amount: true },
        }),
    ]);

    regByMonth.forEach(r => { monthlyRegistrations[r.createdAt.getMonth()] += 1; });
    revByMonth.forEach(r => { monthlyRevenue[r.createdAt.getMonth()] += Number(r.amount); });

    // 4. Top breakdown (role-dependent)
    let topItems: { name: string; students: number; clubs: number }[] = [];

    if (isAdmin) {
        // Top states globally
        const studentsByState = await prisma.student.groupBy({
            by: ['stateId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });
        const stateIds = studentsByState.map(s => s.stateId).filter(Boolean) as number[];
        if (stateIds.length > 0) {
            const [states, clubsByState] = await Promise.all([
                prisma.state.findMany({ where: { id: { in: stateIds } }, select: { id: true, name: true } }),
                prisma.club.groupBy({ by: ['stateId'], _count: { id: true }, where: { stateId: { in: stateIds }, isActive: true } }),
            ]);
            topItems = studentsByState.map(item => ({
                name: states.find(s => s.id === item.stateId)?.name || 'Unknown',
                students: item._count.id,
                clubs: clubsByState.find(c => c.stateId === item.stateId)?._count.id || 0,
            }));
        }
    } else if (scope.stateId) {
        // Top districts within this state
        const studentsByDistrict = await prisma.student.groupBy({
            by: ['districtId'],
            _count: { id: true },
            where: { stateId: scope.stateId },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });
        const districtIds = studentsByDistrict.map(s => s.districtId).filter(Boolean) as number[];
        if (districtIds.length > 0) {
            const [districts, clubsByDist] = await Promise.all([
                prisma.district.findMany({ where: { id: { in: districtIds } }, select: { id: true, name: true } }),
                prisma.club.groupBy({ by: ['districtId'], _count: { id: true }, where: { districtId: { in: districtIds }, isActive: true } }),
            ]);
            topItems = studentsByDistrict.map(item => ({
                name: districts.find(d => d.id === item.districtId)?.name || 'Unknown',
                students: item._count.id,
                clubs: clubsByDist.find(c => c.districtId === item.districtId)?._count.id || 0,
            }));
        }
    } else if (scope.districtId) {
        // Top clubs within this district
        const studentsByClub = await prisma.student.groupBy({
            by: ['clubId'],
            _count: { id: true },
            where: { districtId: scope.districtId },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });
        const clubIds = studentsByClub.map(s => s.clubId).filter(Boolean) as number[];
        if (clubIds.length > 0) {
            const clubs = await prisma.club.findMany({ where: { id: { in: clubIds } }, select: { id: true, name: true } });
            topItems = studentsByClub.map(item => ({
                name: clubs.find(c => c.id === item.clubId)?.name || 'Unknown',
                students: item._count.id,
                clubs: 0,
            }));
        }
    } else if (scope.clubId) {
        // Age category breakdown for this club
        const studentsByAge: any[] = await (prisma.student.groupBy as any)({
            by: ['ageCategory'],
            _count: { _all: true },
            where: { clubId: scope.clubId },
            orderBy: { _count: { _all: 'desc' } },
            take: 5,
        });
        topItems = studentsByAge.map((item: any) => ({
            name: item.ageCategory || 'Unknown',
            students: item._count._all,
            clubs: 0,
        }));
    }

    // 5. Role-specific label metadata
    const roleLabels = getRoleLabels(scope.role);

    return {
        overview: {
            totalStudents,
            totalClubs,
            totalEvents,
            totalRevenue: Number(totalRevenueResult._sum.amount || 0),
            registrationsGrowth,
            revenueGrowth,
            pendingApprovals,
        },
        trends: { monthlyRegistrations, monthlyRevenue },
        analytics: { topItems, tableLabel: roleLabels.tableLabel, tableSubLabel: roleLabels.tableSubLabel },
        roleLabels,
    };
};

function getRoleLabels(role: string) {
    switch (role) {
        case 'GLOBAL_ADMIN':
            return { title: 'Reports & Analytics', subtitle: 'Comprehensive overview of association performance', tableLabel: 'State-wise Performance', tableSubLabel: 'Top states by registered students', col1: 'State' };
        case 'STATE_SECRETARY':
            return { title: 'State Reports', subtitle: 'Performance overview of your state', tableLabel: 'District-wise Performance', tableSubLabel: 'Top districts by registered students', col1: 'District' };
        case 'DISTRICT_SECRETARY':
            return { title: 'District Reports', subtitle: 'Performance overview of your district', tableLabel: 'Club-wise Performance', tableSubLabel: 'Top clubs by registered students', col1: 'Club' };
        case 'CLUB_OWNER':
            return { title: 'Club Reports', subtitle: 'Performance overview of your club', tableLabel: 'Age Category Breakdown', tableSubLabel: 'Students by age category', col1: 'Category' };
        case 'STUDENT':
            return { title: 'My Reports', subtitle: 'Your activity overview', tableLabel: '', tableSubLabel: '', col1: '' };
        default:
            return { title: 'Reports', subtitle: '', tableLabel: '', tableSubLabel: '', col1: '' };
    }
}

export const getPaymentStats = async (scope: ReportScope = { role: 'GLOBAL_ADMIN' }) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const payWhere = (extra: Record<string, any> = {}) => paymentWhere(scope, extra);

    const [totalResult, thisMonthResult, prevMonthResult, pendingCount, failedCount] = await Promise.all([
        prisma.payment.aggregate({ _sum: { amount: true }, where: payWhere({ status: 'COMPLETED' }) }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: payWhere({ status: 'COMPLETED', createdAt: { gte: monthStart } }) }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: payWhere({ status: 'COMPLETED', createdAt: { gte: prevMonthStart, lt: monthStart } }) }),
        prisma.payment.count({ where: payWhere({ status: 'PENDING' }) }),
        prisma.payment.count({ where: payWhere({ status: 'FAILED' }) }),
    ]);

    const thisMonth = Number(thisMonthResult._sum.amount || 0);
    const prevMonth = Number(prevMonthResult._sum.amount || 0);
    const monthGrowth = prevMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - prevMonth) / prevMonth) * 100);

    return {
        totalRevenue: Number(totalResult._sum.amount || 0),
        thisMonthRevenue: thisMonth,
        prevMonthRevenue: prevMonth,
        monthGrowth,
        pendingCount,
        failedCount,
    };
};

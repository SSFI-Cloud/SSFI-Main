import prisma from '../config/prisma';
function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const getDashboardStats = async () => {
    const now = new Date();
    const year = now.getFullYear();

    // 1. Basic counts
    const [
        totalStudents,
        totalClubs,
        totalEvents,
        totalRevenueResult,
        pendingStateSecretaries,
        pendingDistrictSecretaries,
        pendingClubs,
        pendingStudents,
    ] = await Promise.all([
        prisma.student.count(),
        prisma.club.count({ where: { isActive: true } }),
        prisma.event.count({ where: { status: 'PUBLISHED' } }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
        prisma.stateSecretary.count({ where: { status: 'PENDING' } }),
        prisma.districtSecretary.count({ where: { status: 'PENDING' } }),
        prisma.club.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { role: 'STUDENT', approvalStatus: 'PENDING' } }),
    ]);

    // 2. Growth: last 30 days vs previous 30 days
    const today = startOfDay(now);
    const d30ago = new Date(today); d30ago.setDate(d30ago.getDate() - 30);
    const d60ago = new Date(today); d60ago.setDate(d60ago.getDate() - 60);

    const [studentsLast30, studentsPrev30, revLast30, revPrev30] = await Promise.all([
        prisma.student.count({ where: { createdAt: { gte: d30ago } } }),
        prisma.student.count({ where: { createdAt: { gte: d60ago, lt: d30ago } } }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: d30ago } } }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: d60ago, lt: d30ago } } }),
    ]);

    const growthPct = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    const registrationsGrowth = growthPct(studentsLast30, studentsPrev30);
    const revenueGrowth = growthPct(Number(revLast30._sum.amount || 0), Number(revPrev30._sum.amount || 0));

    // 3. Monthly trends for current year (12 months)
    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year + 1, 0, 1);
    const monthlyRegistrations: number[] = new Array(12).fill(0);
    const monthlyRevenue: number[]       = new Array(12).fill(0);

    const [regByMonth, revByMonth] = await Promise.all([
        prisma.student.findMany({ where: { createdAt: { gte: yearStart, lt: yearEnd } }, select: { createdAt: true } }),
        prisma.payment.findMany({ where: { status: 'COMPLETED', createdAt: { gte: yearStart, lt: yearEnd } }, select: { createdAt: true, amount: true } }),
    ]);

    regByMonth.forEach(r => { monthlyRegistrations[r.createdAt.getMonth()] += 1; });
    revByMonth.forEach(r => { monthlyRevenue[r.createdAt.getMonth()] += Number(r.amount); });

    // 4. Top states: students + clubs
    const studentsByState = await prisma.student.groupBy({
        by: ['stateId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
    });

    const stateIds = studentsByState.map(s => s.stateId).filter(Boolean) as number[];

    const [states, clubsByState] = await Promise.all([
        prisma.state.findMany({ where: { id: { in: stateIds } }, select: { id: true, name: true } }),
        prisma.club.groupBy({ by: ['stateId'], _count: { id: true }, where: { stateId: { in: stateIds }, isActive: true } }),
    ]);

    const topStates = studentsByState.map(item => ({
        name: states.find(s => s.id === item.stateId)?.name || 'Unknown',
        students: item._count.id,
        clubs: clubsByState.find(c => c.stateId === item.stateId)?._count.id || 0,
    }));

    // 5. Recent transactions
    const recentTransactions = await prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
    });

    return {
        overview: {
            totalStudents,
            totalClubs,
            totalEvents,
            totalRevenue: Number(totalRevenueResult._sum.amount || 0),
            registrationsGrowth,
            revenueGrowth,
            pendingApprovals: {
                state: pendingStateSecretaries,
                district: pendingDistrictSecretaries,
                club: pendingClubs,
                student: pendingStudents,
                total: pendingStateSecretaries + pendingDistrictSecretaries + pendingClubs + pendingStudents,
            },
        },
        trends: {
            monthlyRegistrations,
            monthlyRevenue,
        },
        analytics: { topStates },
        recentActivity: recentTransactions.map(t => ({
            id: t.id,
            amount: Number(t.amount),
            type: t.paymentType,
            user: t.user?.email || 'Unknown',
            date: t.createdAt,
        })),
    };
};

export const getPaymentStats = async () => {
    const now = new Date();
    const monthStart     = startOfMonth(now);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalResult, thisMonthResult, prevMonthResult, pendingCount, failedCount] = await Promise.all([
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: monthStart } } }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: prevMonthStart, lt: monthStart } } }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
    ]);

    const thisMonth = Number(thisMonthResult._sum.amount || 0);
    const prevMonth = Number(prevMonthResult._sum.amount || 0);
    const monthGrowth = prevMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - prevMonth) / prevMonth) * 100);

    return {
        totalRevenue:     Number(totalResult._sum.amount || 0),
        thisMonthRevenue: thisMonth,
        prevMonthRevenue: prevMonth,
        monthGrowth,
        pendingCount,
        failedCount,
    };
};

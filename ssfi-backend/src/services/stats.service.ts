import prisma from '../config/prisma';
export class StatsService {
    async getPublicStats() {
        try {
            // Run queries in parallel for performance
            // Using same logic as Global Admin Dashboard for consistency
            const [
                statesCount,
                districtsCount,
                clubsCount,
                studentsCount,
                totalEventsCount,
                activeEventsCount,
                championshipsCount,
                certifiedCoachesCount
            ] = await Promise.all([
                // All active states
                prisma.state.count({ where: { isActive: true } }),
                // All active districts
                prisma.district.count({ where: { isActive: true } }),
                // Approved clubs only (matches admin dashboard)
                prisma.club.count({
                    where: { status: 'APPROVED' }
                }),
                // Approved students only (matches admin dashboard)
                prisma.student.count({
                    where: { user: { isApproved: true } }
                }),
                // All events (matches admin dashboard)
                prisma.event.count(),
                // Active/upcoming events
                prisma.event.count({
                    where: {
                        status: { in: ['PUBLISHED', 'ONGOING'] },
                        eventDate: { gte: new Date() }
                    }
                }),
                // Completed championships
                prisma.event.count({
                    where: { eventType: 'CHAMPIONSHIP', status: 'COMPLETED' }
                }),
                // Certified coaches — table may be empty, safe fallback
                prisma.coachCertRegistration.count({
                    where: { isCompleted: true, status: 'COMPLETED' }
                }).catch(() => 0)
            ]);

            // Check for admin stat overrides in SiteSettings.metadata
            let coachOverride: number | null = null;
            try {
                const settings = await prisma.siteSettings.findFirst();
                const metadata = settings?.metadata as any;
                if (metadata?.certifiedCoachesOverride) {
                    coachOverride = Number(metadata.certifiedCoachesOverride);
                }
            } catch {} // Silently ignore if settings don't exist

            return {
                students: studentsCount,
                clubs: clubsCount,
                activeEvents: activeEventsCount,
                totalEvents: totalEventsCount,
                states: statesCount,
                districts: districtsCount,
                championships: championshipsCount,
                certifiedCoaches: coachOverride ?? certifiedCoachesCount
            };
        } catch (error) {
            console.error('Error fetching public stats:', error);
            throw error;
        }
    }
}


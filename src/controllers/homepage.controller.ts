import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { StatsService } from '../services/stats.service';
import { getBanners } from '../services/cms.service';
import coachCertService from '../services/coach-cert.service';
import beginnerCertService from '../services/beginner-cert.service';

const statsService = new StatsService();

// ─── Helper (mirrors result.controller.ts) ─────────────────────────────────
function firstNameOnly(fullName: string): string {
  return (fullName || '').split(' ')[0];
}

// ─── Fetch recent results (extracted from resultController) ─────────────────
async function fetchRecentResults() {
  const events = await prisma.event.findMany({
    where: { isResultsPublished: true },
    orderBy: { eventDate: 'desc' },
    take: 3,
    select: {
      id: true, name: true, eventDate: true,
      city: true, category: true,
      raceResults: {
        where: { position: { lte: 3 } },
        orderBy: [{ ageCategory: 'asc' }, { position: 'asc' }],
        include: {
          student: {
            select: {
              name: true,
              state: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const slides: any[] = [];
  for (const event of events) {
    const byAge = new Map<string, any[]>();
    for (const r of event.raceResults) {
      if (!byAge.has(r.ageCategory)) byAge.set(r.ageCategory, []);
      byAge.get(r.ageCategory)!.push({
        position: r.position,
        firstName: firstNameOnly(r.student.name),
        state: r.student.state?.name || '—',
        skateCategory: r.skateCategory,
        raceType: r.raceType,
        gender: r.gender,
      });
    }
    for (const [ageCategory, entries] of byAge.entries()) {
      const seen = new Set<number>();
      const top3 = entries
        .filter((e) => {
          if (seen.has(e.position)) return false;
          seen.add(e.position);
          return true;
        })
        .slice(0, 3);
      slides.push({
        eventId: event.id,
        eventName: event.name,
        eventDate: event.eventDate,
        city: event.city,
        category: event.category,
        ageCategory,
        top3,
      });
    }
  }
  return slides;
}

// ─── Fetch team members for homepage ────────────────────────────────────────
async function fetchHomeTeamMembers() {
  return prisma.teamMember.findMany({
    where: { isActive: true, showOnHome: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      name: true,
      role: true,
      bio: true,
      photo: true,
      email: true,
      linkedinUrl: true,
      displayOrder: true,
      showOnHome: true,
    },
  });
}

// ─── Aggregate homepage endpoint ────────────────────────────────────────────
export const getHomepageData = async (_req: Request, res: Response) => {
  try {
    // Run ALL queries in parallel — single round-trip from the frontend
    const [banners, stats, coachPrograms, beginnerPrograms, recentResults, teamMembers] =
      await Promise.all([
        getBanners({ position: 'HOME_HERO', status: 'PUBLISHED' }),
        statsService.getPublicStats(),
        coachCertService.getActivePrograms(),
        beginnerCertService.getActivePrograms(),
        fetchRecentResults(),
        fetchHomeTeamMembers(),
      ]);

    res.json({
      success: true,
      data: {
        banners,
        stats,
        coachPrograms,
        beginnerPrograms,
        recentResults,
        teamMembers,
      },
    });
  } catch (error) {
    console.error('Homepage aggregate fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to load homepage data' });
  }
};

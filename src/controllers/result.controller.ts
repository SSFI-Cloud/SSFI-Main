import { Request, Response } from 'express';
import { issueCertificatesForEvent } from '../services/certificate.service';

import prisma from '../config/prisma';
// ─── PUBLIC HELPERS ───────────────────────────────────────────────────────

function firstNameOnly(fullName: string): string {
  return (fullName || '').split(' ')[0];
}

// ─────────────────────────────────────────────────────────────────────────────

export const resultController = {
    // Get distinct race categories available for an event based on registrations
    getEventRaceCategories: async (req: Request, res: Response) => {
        try {
            const eventId = Number(req.params.eventId);

            // Fetch all registrations to aggregate categories
            // Note: Grouping by JSON fields is not directly supported in Prisma, so we aggregate in memory
            const registrations = await prisma.eventRegistration.findMany({
                where: {
                    eventId,
                    status: { in: ['APPROVED', 'CONFIRMED'] }
                },
                select: {
                    skateCategory: true,
                    ageCategory: true,
                    selectedRaces: true,
                    student: {
                        select: {
                            gender: true
                        }
                    }
                }
            });

            // Aggregate unique combinations
            const categories = new Set<string>();

            registrations.forEach(reg => {
                const races = reg.selectedRaces as string[] || [];
                if (Array.isArray(races)) {
                    races.forEach(race => {
                        // Create a composite key for unique checking
                        // Format: SKATE_CATEGORY|AGE_CATEGORY|GENDER|RACE_TYPE
                        // Handle race format "RACE_500M" -> "500M", or just "500M"
                        const raceName = race.replace('RACE_', '');
                        const key = `${reg.skateCategory}|${reg.ageCategory}|${reg.student.gender}|${raceName}`;
                        categories.add(key);
                    });
                }
            });

            // Transform back to structured array
            const result = Array.from(categories).map(cat => {
                const [skateCategory, ageCategory, gender, raceType] = cat.split('|');
                return { skateCategory, ageCategory, gender, raceType };
            });

            // Sort logic could receive improvement, simple alpha sort for now
            result.sort((a, b) => a.skateCategory.localeCompare(b.skateCategory) || a.ageCategory.localeCompare(b.ageCategory));

            res.json(result);
        } catch (error) {
            console.error('Error fetching race categories:', error);
            res.status(500).json({ message: 'Failed to fetch race categories' });
        }
    },

    // Get participants for a specific race configuration
    getParticipantsForRace: async (req: Request, res: Response) => {
        try {
            const eventId = Number(req.params.eventId);
            const { skateCategory, ageCategory, gender, raceType } = req.query;

            if (!skateCategory || !ageCategory || !gender || !raceType) {
                return res.status(400).json({ message: 'Missing required filters' });
            }

            // 1. Get all confirmed registrations matching the specific categories
            const registrations = await prisma.eventRegistration.findMany({
                where: {
                    eventId,
                    status: { in: ['APPROVED', 'CONFIRMED'] },
                    skateCategory: String(skateCategory),
                    ageCategory: String(ageCategory),
                    student: {
                        gender: gender as any
                    }
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            membershipId: true,
                            club: { select: { name: true } },
                            district: { select: { name: true } }
                        }
                    },
                    event: true
                }
            });

            // 2. Filter in-memory for the specific race type in JSON array
            // Robust check: match "RACE_<Type>" or just "<Type>"
            const participants = registrations.filter(reg => {
                const races = reg.selectedRaces as string[] || [];
                return races.some(r => r === `RACE_${raceType}` || r === raceType);
            });

            // 3. Fetch existing results for this race slot
            const existingResults = await prisma.raceResult.findMany({
                where: {
                    eventId,
                    skateCategory: String(skateCategory),
                    ageCategory: String(ageCategory),
                    gender: gender as any,
                    raceType: String(raceType)
                }
            });

            // Map participants to include their result status
            const response = participants.map(reg => {
                const result = existingResults.find(r => r.studentId === reg.studentId);
                return {
                    ...reg.student,
                    registrationId: reg.id,
                    bibNumber: reg.student.membershipId ? `S${reg.student.membershipId.split('-').pop()}` : 'N/A',
                    result: result ? { position: result.position, timing: result.timing } : null
                };
            });

            res.json(response);

        } catch (error) {
            console.error('Error fetching participants:', error);
            res.status(500).json({ message: 'Failed to fetch participants' });
        }
    },

    // Save the winners (1st, 2nd, 3rd)
    saveRaceResult: async (req: Request, res: Response) => {
        try {
            const eventId = Number(req.params.eventId);
            const { skateCategory, ageCategory, gender, raceType, results } = req.body;

            // results is an array: [{ position: 1, studentId: 101, timing: ".." }, ...]

            if (!results || !Array.isArray(results)) {
                return res.status(400).json({ message: 'Invalid results format' });
            }

            // Transaction to handle updates
            await prisma.$transaction(async (tx) => {
                // Clear existing results for this specific slot to allow re-entry/updates
                // Or we can simple upsert. But deleting valid positions first ensures no duplicates if they swap winners.
                // Let's delete existing for this race-slot first.

                await tx.raceResult.deleteMany({
                    where: {
                        eventId,
                        skateCategory,
                        ageCategory,
                        gender: gender as any,
                        raceType
                    }
                });

                // Insert new results
                for (const res of results) {
                    if (res.studentId) {
                        await tx.raceResult.create({
                            data: {
                                eventId,
                                studentId: res.studentId,
                                raceType,
                                skateCategory,
                                ageCategory,
                                gender: gender as any,
                                position: res.position,
                                timing: res.timing
                            }
                        });
                    }
                }
            });

            res.json({ message: 'Results saved successfully' });

        } catch (error) {
            console.error('Error saving results:', error);
            res.status(500).json({ message: 'Failed to save results' });
        }
    },

    // ─── PUBLIC: Recent results for home-page slider ───────────────────────
    // Returns slides: one per (event × ageCategory) for the last 3 published events.
    // Each slide carries up to 3 result entries (positions 1–3).
    getPublicRecentResults: async (req: Request, res: Response) => {
        try {
            const events = await prisma.event.findMany({
                where: { isResultsPublished: true },
                orderBy: { eventDate: 'desc' },
                take: 3,
                select: {
                    id: true, name: true, eventDate: true,
                    city: true, category: true,
                    raceResults: {
                        where: { position: { lte: 5 } },
                        orderBy: [{ ageCategory: 'asc' }, { position: 'asc' }],
                        include: {
                            student: {
                                select: {
                                    name: true,
                                    state: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            });

            const slides: any[] = [];

            for (const event of events) {
                // Group by ageCategory
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
                    slides.push({
                        eventId: event.id,
                        eventName: event.name,
                        eventDate: event.eventDate,
                        city: event.city,
                        category: event.category,
                        ageCategory,
                        top5: entries,
                    });
                }
            }

            res.json({ success: true, data: slides });
        } catch (error) {
            console.error('Error fetching public recent results:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch results' });
        }
    },

    // ─── PUBLIC: All events with published results (for /results page) ────────
    getPublicAllEvents: async (req: Request, res: Response) => {
        try {
            const events = await prisma.event.findMany({
                where: { isResultsPublished: true },
                orderBy: { eventDate: 'desc' },
                select: {
                    id: true, name: true, eventDate: true,
                    city: true, category: true, venue: true,
                    _count: { select: { raceResults: true } }
                }
            });
            res.json({ success: true, data: events });
        } catch (error) {
            console.error('Error fetching public events:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch events' });
        }
    },

    // ─── PUBLIC: Full results for a single event (for /results page detail) ──
    // Returns results grouped by ageCategory → array of result rows.
    getPublicEventResults: async (req: Request, res: Response) => {
        try {
            const eventId = Number(req.params.eventId);

            const event = await prisma.event.findUnique({
                where: { id: eventId },
                select: {
                    id: true, name: true, eventDate: true,
                    city: true, isResultsPublished: true
                }
            });

            if (!event || !event.isResultsPublished) {
                return res.status(404).json({ success: false, message: 'Results not published' });
            }

            const rows = await prisma.raceResult.findMany({
                where: { eventId, position: { lte: 5 } },
                orderBy: [
                    { ageCategory: 'asc' },
                    { skateCategory: 'asc' },
                    { gender: 'asc' },
                    { position: 'asc' }
                ],
                include: {
                    student: {
                        select: {
                            name: true,
                            state: { select: { name: true } }
                        }
                    }
                }
            });

            // Group by ageCategory
            const grouped: Record<string, any[]> = {};
            for (const r of rows) {
                if (!grouped[r.ageCategory]) grouped[r.ageCategory] = [];
                grouped[r.ageCategory].push({
                    position: r.position,
                    firstName: firstNameOnly(r.student.name),
                    state: r.student.state?.name || '—',
                    skateCategory: r.skateCategory,
                    raceType: r.raceType,
                    gender: r.gender,
                });
            }

            res.json({ success: true, data: { event, grouped } });
        } catch (error) {
            console.error('Error fetching public event results:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch results' });
        }
    },

    // Publish/Unpublish results for an event — auto-issues certificates on publish
    toggleResultPublication: async (req: Request, res: Response) => {
        try {
            const eventId = Number(req.params.eventId);
            const { isPublished } = req.body;

            await prisma.event.update({
                where: { id: eventId },
                data: { isResultsPublished: isPublished }
            });

            let certSummary: { issued: number; skipped: number } | null = null;

            // Auto-issue certificates whenever results are published
            if (isPublished) {
                try {
                    certSummary = await issueCertificatesForEvent(eventId);
                } catch (certErr) {
                    console.error('Certificate issuance error (non-fatal):', certErr);
                }
            }

            res.json({
                message: `Results ${isPublished ? 'published' : 'unpublished'}`,
                certificates: certSummary,
            });
        } catch (error) {
            console.error('Error toggling publication:', error);
            res.status(500).json({ message: 'Failed to update publication status' });
        }
    }
};

import {
    EventRegistration,
    validateRaceSelection,
    getRaceRuleKey,
    RACE_RULES,
} from '../validators/eventRegistration.validator';
import { AppError } from '../utils/errors';
import { emailService } from './email.service';

import prisma from '../config/prisma';
// ==========================================
// EVENT LEVEL ELIGIBILITY CHECK
// ==========================================

/**
 * Enforces cascading eligibility:
 *  - DISTRICT events: open to all (no prerequisite)
 *  - STATE events: student must have a top-5 finish in any published DISTRICT event
 *  - NATIONAL events: student must have a top-5 finish in any published STATE event
 */
const checkEventLevelEligibility = async (studentId: number, eventLevel: string) => {
    const prerequisiteLevel: Record<string, string> = {
        STATE: 'DISTRICT',
        NATIONAL: 'STATE',
    };

    const requiredLevel = prerequisiteLevel[eventLevel];
    if (!requiredLevel) return; // DISTRICT events have no prerequisite

    // Check if student has a top-5 finish in any published event at the prerequisite level
    const qualifyingResult = await prisma.raceResult.findFirst({
        where: {
            studentId,
            position: { lte: 5 },
            event: {
                eventLevel: requiredLevel,
                isResultsPublished: true,
            },
        },
        select: { id: true },
    });

    if (!qualifyingResult) {
        const levelLabel = requiredLevel.charAt(0) + requiredLevel.slice(1).toLowerCase();
        throw new AppError(
            `This student must place in the top 5 at a ${levelLabel} level event to be eligible for ${eventLevel.charAt(0) + eventLevel.slice(1).toLowerCase()} level events.`,
            403
        );
    }
};

// ==========================================
// STUDENT LOOKUP FOR EVENT REGISTRATION
// ==========================================

export const lookupStudentForEvent = async (membershipId: string, eventId: number) => {
    const trimmed = membershipId.trim();

    // Build search conditions: full membershipId, user.uid, or short serial (e.g. S0978)
    const searchConditions: any[] = [
        { membershipId: trimmed },
        { user: { uid: trimmed } },
    ];

    // If input looks like a short serial (e.g. S0978, S1234), also search by endsWith
    if (/^S\d{4,}$/i.test(trimmed)) {
        searchConditions.push({ membershipId: { endsWith: `/${trimmed.toUpperCase()}` } });
    }

    const student = await prisma.student.findFirst({
        where: { OR: searchConditions },
        include: {
            club: { select: { id: true, name: true, code: true } },
            district: { select: { id: true, name: true } },
            state: { select: { id: true, name: true } },
            user: { select: { email: true, phone: true, approvalStatus: true, isActive: true } },
        },
    });

    if (!student) {
        throw new AppError('No student found with this SSFI UID. Please check and try again.', 404);
    }

    // Check approval status
    if (!student.user?.isActive) {
        throw new AppError('This account is inactive. Please contact SSFI.', 403);
    }
    if (student.user?.approvalStatus === 'PENDING') {
        throw new AppError('Your membership is pending approval. Please wait for approval before registering.', 403);
    }
    if (student.user?.approvalStatus === 'REJECTED') {
        throw new AppError('Your membership was not approved. Please contact SSFI.', 403);
    }

    // Find event
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            id: true,
            name: true,
            code: true,
            eventDate: true,
            eventLevel: true,
            paymentMode: true,
            registrationStartDate: true,
            registrationEndDate: true,
            status: true,
            entryFee: true,
            lateFee: true,
            lateFeeStartDate: true,
            ageCategories: true,
            maxParticipants: true,
            _count: { select: { registrations: true } },
        },
    });

    if (!event) {
        throw new AppError('Event not found', 404);
    }

    // Check event status
    if (!['PUBLISHED', 'ONGOING', 'REGISTRATION_OPEN'].includes(event.status)) {
        throw new AppError('Registration is not open for this event', 400);
    }

    // Check registration dates
    const now = new Date();
    if (now < new Date(event.registrationStartDate)) {
        throw new AppError(`Registration opens on ${new Date(event.registrationStartDate).toLocaleDateString()}`, 400);
    }
    if (now > new Date(event.registrationEndDate)) {
        throw new AppError('Registration has closed for this event', 400);
    }

    // Check max participants
    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
        throw new AppError('Event is full.', 400);
    }

    // Calculate age from DOB
    const dob = new Date(student.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Determine age category
    const ageCategory = age < 4 ? 'U-4' : age < 6 ? 'U-6' : age < 8 ? 'U-8' : age < 10 ? 'U-10' : age < 12 ? 'U-12' : age < 14 ? 'U-14' : age < 16 ? 'U-16' : 'ABOVE_16';

    // Check for existing registration
    const existingRegistration = await prisma.eventRegistration.findUnique({
        where: {
            eventId_studentId: {
                eventId,
                studentId: student.id
            }
        }
    });

    if (existingRegistration && existingRegistration.status !== 'CANCELLED') {
        throw new AppError('You are already registered for this event', 409);
    }

    // Check event-level eligibility (District→State→National progression)
    await checkEventLevelEligibility(student.id, event.eventLevel);

    // Calculate fee
    let totalFee = Number(event.entryFee);
    let isLateFee = false;
    if (event.lateFeeStartDate && event.lateFee && now >= new Date(event.lateFeeStartDate)) {
        totalFee += Number(event.lateFee);
        isLateFee = true;
    }

    // Parse name into first/last
    const nameParts = student.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
        student: {
            id: student.id,
            uid: student.membershipId || `STU-${student.id}`,
            firstName,
            lastName,
            fullName: student.name,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            age,
            ageCategory,
            profilePhoto: student.profilePhoto,
            email: student.user?.email || null,
            phone: student.user?.phone || null,
            club: student.club,
            district: student.district,
            state: student.state,
        },
        event: {
            id: event.id,
            name: event.name,
            code: event.code,
            eventDate: event.eventDate,
            paymentMode: event.paymentMode,
            entryFee: Number(event.entryFee),
            lateFee: Number(event.lateFee || 0),
            isLateFee,
            totalFee,
        },
        eligibility: {
            canRegister: true,
            ageCategory,
        },
    };
};

export const getAvailableRaces = async (skateCategory: string, ageGroup: string, eventId?: number) => {
    // Check for event-specific race config
    if (eventId) {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { raceConfig: true },
        });

        if (event?.raceConfig) {
            const config = event.raceConfig as any;
            const categories = config.categories || [];
            // Find matching category by name and age group
            const match = categories.find((cat: any) =>
                cat.name === skateCategory &&
                (!cat.ageGroups || cat.ageGroups.length === 0 || cat.ageGroups.includes(ageGroup))
            );
            if (match) {
                return {
                    ruleKey: match.name,
                    availableRaces: match.races || [],
                    minRaces: match.minRaces || 1,
                    maxRaces: match.maxRaces || match.races?.length || 3,
                    mandatoryRaces: match.mandatoryRaces || [],
                    description: `Choose ${match.minRaces || 1}-${match.maxRaces || 3} races`,
                };
            }
            throw new AppError('This category is not available for this event', 400);
        }
    }

    // Fall back to hardcoded defaults
    const ruleKey = getRaceRuleKey(skateCategory, ageGroup);
    const rule = RACE_RULES[ruleKey as keyof typeof RACE_RULES];
    if (!rule) throw new AppError('Invalid category combination', 400);

    return {
        ruleKey,
        availableRaces: rule.races,
        minRaces: rule.minRaces,
        maxRaces: rule.maxRaces,
        mandatoryRaces: rule.mandatory,
        description: rule.description,
    };
};

/**
 * Get available skate categories for a specific event.
 * If event has raceConfig, return only configured categories.
 * Otherwise return default categories.
 */
export const getEventCategories = async (eventId: number) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { raceConfig: true },
    });

    if (event?.raceConfig) {
        const config = event.raceConfig as any;
        const categories = config.categories || [];
        return categories.map((cat: any) => ({
            name: cat.name,
            label: cat.label || cat.name,
            ageGroups: cat.ageGroups || [],
        }));
    }

    // Default categories
    return [
        { name: 'BEGINNER', label: 'Beginner', ageGroups: [] },
        { name: 'RECREATIONAL', label: 'Recreational', ageGroups: [] },
        { name: 'QUAD', label: 'Quad', ageGroups: [] },
        { name: 'PRO_INLINE', label: 'Pro Inline', ageGroups: [] },
    ];
};

export const createEventRegistration = async (data: EventRegistration) => {
    const { student, event } = await lookupStudentForEvent(data.studentUid, data.eventId);

    // Try event-specific validation first
    const eventData = await prisma.event.findUnique({
        where: { id: data.eventId },
        select: { raceConfig: true },
    });

    let raceValidation: { valid: boolean; error?: string };
    if (eventData?.raceConfig) {
        // Validate against event-specific config
        const config = eventData.raceConfig as any;
        const categories = config.categories || [];
        const match = categories.find((cat: any) =>
            cat.name === data.skateCategory &&
            (!cat.ageGroups || cat.ageGroups.length === 0 || cat.ageGroups.includes(student.ageCategory))
        );
        if (!match) {
            raceValidation = { valid: false, error: 'This category is not available for this event' };
        } else {
            const min = match.minRaces || 1;
            const max = match.maxRaces || match.races?.length || 3;
            const count = data.selectedRaces.length;
            if (count < min || count > max) {
                raceValidation = { valid: false, error: `Please select between ${min} and ${max} races` };
            } else {
                raceValidation = { valid: true };
            }
        }
    } else {
        raceValidation = validateRaceSelection(
            data.skateCategory,
            student.ageCategory,
            data.selectedRaces
        );
    }

    if (!raceValidation.valid) {
        throw new AppError(raceValidation.error || 'Invalid race selection', 400);
    }

    const confirmationNumber = await generateConfirmationNumber(data.eventId);

    const registration = await prisma.eventRegistration.create({
        data: {
            eventId: data.eventId,
            studentId: student.id,
            clubId: student.club?.id,
            districtId: student.district?.id,
            stateId: student.state?.id,

            confirmationNumber,
            suitSize: data.suitSize,
            skateCategory: data.skateCategory,
            ageCategory: student.ageCategory,
            selectedRaces: data.selectedRaces,

            entryFee: event.entryFee,
            lateFee: event.isLateFee ? event.lateFee : 0,
            totalFee: event.totalFee,
            amountPaid: 0,

            // Offline events: confirm immediately, admin marks payment later
            status: event.paymentMode === 'OFFLINE' ? 'CONFIRMED' : 'PAYMENT_PENDING',
            paymentStatus: 'PENDING',

            remarks: data.remarks,
        },
        include: {
            event: { select: { id: true, name: true, code: true, eventDate: true, venue: true } },
            student: { select: { id: true, membershipId: true, name: true, profilePhoto: true } },
        },
    });

    // Send confirmation email (non-blocking)
    if (student.email) {
        emailService.sendEventRegistrationConfirmation(student.email, {
            studentName: student.fullName,
            ssfiUid: student.uid,
            confirmationNumber,
            eventName: registration.event.name,
            eventDate: new Date(registration.event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            venue: registration.event.venue || '',
            city: (registration.event as any).city || '',
            ageCategory: student.ageCategory,
            skateCategory: data.skateCategory,
            selectedRaces: data.selectedRaces,
            totalFee: event.totalFee,
            paymentStatus: 'PENDING',
        }).catch(() => {});
    }

    return registration;
};

const generateConfirmationNumber = async (eventId: number): Promise<string> => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { code: true },
    });
    if (!event) throw new AppError('Event not found', 404);

    const existingCount = await prisma.eventRegistration.count({ where: { eventId } });
    const sequence = (existingCount + 1).toString().padStart(5, '0');
    return `${event.code}-${sequence}`;
};

// ==========================================
// DEFAULT EXPORT
// ==========================================

// Helper to check access
const hasAccess = async (eventId: number, userId: number, userRole: string) => {
    if (userRole === 'GLOBAL_ADMIN') return true;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { creatorId: true } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.creatorId !== userId) throw new AppError('You do not have permission to view these registrations', 403);
    return true;
};

export const getEventRegistrations = async (eventId: number | string, query: any, userId: number, userRole: string) => {
    const id = Number(eventId);
    await hasAccess(id, userId, userRole);

    const { page = 1, limit = 20, search, status, paymentStatus, category, sort = 'createdAt', order = 'desc' } = query;
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Number(page) - 1) * take;

    const where: any = { eventId: id };

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (category) where.skateCategory = category;

    if (search) {
        where.OR = [
            { student: { name: { contains: search } } },
            { student: { membershipId: { contains: search } } },
            { confirmationNumber: { contains: search } },
            { club: { name: { contains: search } } }
        ];
    }

    const [registrations, total] = await Promise.all([
        prisma.eventRegistration.findMany({
            where,
            skip,
            take,
            orderBy: { [sort]: order },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        membershipId: true,
                        district: { select: { name: true } },
                        state: { select: { name: true } },
                        dateOfBirth: true,
                    }
                },
                club: { select: { name: true } },
                payment: { select: { status: true, amount: true, razorpayPaymentId: true } }
            }
        }),
        prisma.eventRegistration.count({ where })
    ]);

    return {
        registrations,
        meta: {
            total,
            page: Number(page),
            limit: take,
            totalPages: Math.ceil(total / take)
        }
    };
};

export const exportRegistrations = async (eventId: number | string, userId: number, userRole: string) => {
    const id = Number(eventId);
    await hasAccess(id, userId, userRole);

    const registrations = await prisma.eventRegistration.findMany({
        where: { eventId: id },
        orderBy: { createdAt: 'desc' },
        include: {
            student: {
                select: {
                    name: true,
                    membershipId: true,
                    district: { select: { name: true } },
                    state: { select: { name: true } },
                    dateOfBirth: true,
                    gender: true
                }
            },
            club: { select: { name: true } },
            payment: { select: { status: true, amount: true, razorpayPaymentId: true, paymentType: true } }
        }
    });

    // Simple CSV Generation
    const header = [
        'Registration ID', 'Student Name', 'UID', 'Club', 'District', 'State',
        'Category', 'Age Group', 'Races', 'Suit Size',
        'Status', 'Payment Status', 'Amount', 'Transaction ID', 'Reg Date'
    ];

    const rows = registrations.map(reg => [
        reg.confirmationNumber,
        reg.student.name,
        reg.student.membershipId || `STU-${reg.studentId}`,
        reg.club?.name || 'N/A',
        reg.student.district?.name || 'N/A',
        reg.student.state?.name || 'N/A',
        reg.skateCategory,
        reg.ageCategory,
        Array.isArray(reg.selectedRaces) ? (reg.selectedRaces as string[]).join(', ') : reg.selectedRaces,
        reg.suitSize,
        reg.status,
        reg.paymentStatus,
        reg.totalFee,
        reg.payment?.razorpayPaymentId || 'N/A',
        new Date(reg.createdAt).toLocaleDateString()
    ]);

    // CSV String Construction
    const csvContent = [
        header.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent; // Controller will handle headers/stream
};

export const getMyRegistration = async (eventId: number, userId: number) => {
    const student = await prisma.student.findFirst({
        where: { userId: userId }
    });

    if (!student) {
        throw new AppError('Student profile not found', 404);
    }

    const registration = await prisma.eventRegistration.findFirst({
        where: {
            eventId: eventId,
            studentId: student.id
        },
        include: {
            event: {
                select: {
                    id: true, name: true, code: true, eventDate: true, venue: true, city: true,
                    associationName: true, bannerImage: true
                }
            },
            student: { select: { id: true, membershipId: true, name: true, profilePhoto: true } },
            payment: true
        }
    });

    if (!registration) {
        throw new AppError('Registration not found', 404);
    }

    return registration;
};

export const createManualRegistration = async (data: EventRegistration, operatorId: number, operatorRole: string) => {
    // 1. Check Access
    if (operatorRole !== 'GLOBAL_ADMIN') {
        const event = await prisma.event.findUnique({ where: { id: data.eventId }, select: { creatorId: true } });
        if (!event || event.creatorId !== operatorId) {
            throw new AppError('Unauthorized to perform manual registration', 403);
        }
    }

    // 2. Lookup (re-using existing logic)
    const { student, event } = await lookupStudentForEvent(data.studentUid, data.eventId);

    // 3. Validate Races
    const raceValidation = validateRaceSelection(
        data.skateCategory,
        student.ageCategory,
        data.selectedRaces
    );
    if (!raceValidation.valid) {
        throw new AppError(raceValidation.error || 'Invalid race selection', 400);
    }

    // 4. Generate confirmation
    const confirmationNumber = await generateConfirmationNumber(data.eventId);

    // 5. Create Registration (Confirmed & Paid)
    const registration = await prisma.eventRegistration.create({
        data: {
            eventId: data.eventId,
            studentId: student.id,
            clubId: student.club?.id,
            districtId: student.district?.id,
            stateId: student.state?.id,

            confirmationNumber,
            suitSize: data.suitSize,
            skateCategory: data.skateCategory,
            ageCategory: student.ageCategory,
            selectedRaces: data.selectedRaces,

            entryFee: event.entryFee,
            lateFee: event.isLateFee ? event.lateFee : 0,
            totalFee: event.totalFee,
            amountPaid: 0, // Manual entry, no payment collected via gateway

            status: 'CONFIRMED',
            paymentStatus: 'COMPLETED', // Marked as completed

            remarks: `Manual Entry by Admin (ID: ${operatorId}). ${data.remarks || ''}`,
        },
        include: {
            event: { select: { id: true, name: true, code: true, eventDate: true, venue: true } },
            student: { select: { id: true, membershipId: true, name: true, profilePhoto: true } },
        },
    });

    return registration;
};

export default {
    lookupStudentForEvent,
    getAvailableRaces,
    getEventCategories,
    createEventRegistration,
    getEventRegistrations,
    exportRegistrations,
    createManualRegistration,
    getMyRegistration,
};

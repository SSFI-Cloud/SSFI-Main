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
// STUDENT LOOKUP FOR EVENT REGISTRATION
// ==========================================

export const lookupStudentForEvent = async (membershipId: string, eventId: number) => {
    // Find student by membershipId OR user.uid (handle both formats)
    const student = await prisma.student.findFirst({
        where: {
            OR: [
                { membershipId: membershipId.trim() },
                { user: { uid: membershipId.trim() } },
            ],
        },
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
    if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
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

export const getAvailableRaces = (skateCategory: string, ageGroup: string) => {
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

export const createEventRegistration = async (data: EventRegistration) => {
    const { student, event } = await lookupStudentForEvent(data.studentUid, data.eventId);

    const raceValidation = validateRaceSelection(
        data.skateCategory,
        student.ageCategory,
        data.selectedRaces
    );

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

            status: 'PAYMENT_PENDING',
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
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

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
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
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
    createEventRegistration,
    getEventRegistrations,
    exportRegistrations,
    createManualRegistration,
    getMyRegistration,
};

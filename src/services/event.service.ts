import { PrismaClient, Prisma, UserRole, EventCategory } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
// Helper to format event consistently
const formatEvent = (event: any) => ({
  id: event.id,
  name: event.name,
  code: event.code,
  description: event.description,
  eventLevel: event.eventLevel,
  eventType: event.eventType,
  eventDate: event.eventDate,
  eventEndDate: event.eventEndDate,
  registrationStartDate: event.registrationStartDate,
  registrationEndDate: event.registrationEndDate,
  venue: event.venue,
  city: event.city,
  stateId: event.stateId,
  state: event.state,
  district: event.district,
  status: event.status,
  paymentMode: event.paymentMode,
  raceConfig: event.raceConfig,
  entryFee: Number(event.entryFee),
  lateFee: Number(event.lateFee),
  maxParticipants: event.maxParticipants,
  currentEntries: event._count?.registrations || 0,
  ageCategories: event.ageCategories,
  bannerImage: event.bannerImage,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
  creatorId: event.creatorId // Added so frontend can check ownership
});

export const createEvent = async (data: any, userId: number) => {
  // 1. Get User Hierarchy
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clubOwner: { select: { id: true, clubId: true, club: { select: { districtId: true, stateId: true } } } },
      districtPerson: { select: { id: true, districtId: true, district: { select: { stateId: true } } } },
      statePerson: { select: { id: true, stateId: true } }
    }
  });

  if (!user) throw new AppError('User not found', 404);

  let stateId = Number(data.stateId) || undefined;
  let districtId = Number(data.districtId) || undefined;

  // 2. Enforce Hierarchy
  if (user.role === 'CLUB_OWNER' && user.clubOwner?.club) {
    districtId = user.clubOwner.club.districtId;
    stateId = user.clubOwner.club.stateId || undefined;
  } else if (user.role === 'DISTRICT_SECRETARY' && user.districtPerson) {
    districtId = user.districtPerson.districtId;
    stateId = user.districtPerson.district.stateId;
  } else if (user.role === 'STATE_SECRETARY' && user.statePerson) {
    stateId = user.statePerson.stateId;
  }

  // 3. Create Event
  const event = await prisma.event.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      eventLevel: data.eventLevel,
      category: data.eventLevel as EventCategory,
      eventType: data.eventType || 'COMPETITION',
      status: 'DRAFT', // Default to draft
      eventDate: new Date(data.eventDate),
      eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : undefined,
      registrationStartDate: new Date(data.registrationStartDate),
      registrationEndDate: new Date(data.registrationEndDate),
      venue: data.venue,
      city: data.city,
      paymentMode: data.paymentMode || 'ONLINE',
      entryFee: Number(data.entryFee),
      lateFee: Number(data.lateFee || 0),
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : undefined,
      raceConfig: data.raceConfig || undefined,
      ageCategories: data.ageCategories,
      bannerImage: data.bannerImage,
      creatorId: userId,
      stateId,
      districtId
    }
  });

  return formatEvent(event);
};

export const updateEvent = async (id: number, data: any, userId: number, userRole: string) => {
  // 1. Check ownership
  const existingEvent = await prisma.event.findUnique({ where: { id } });
  if (!existingEvent) throw new AppError('Event not found', 404);

  if (userRole !== 'GLOBAL_ADMIN' && existingEvent.creatorId !== userId) {
    throw new AppError('You do not have permission to edit this event', 403);
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code, // careful allowing code update
      description: data.description,
      eventLevel: data.eventLevel,
      eventType: data.eventType,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : undefined,
      registrationStartDate: data.registrationStartDate ? new Date(data.registrationStartDate) : undefined,
      registrationEndDate: data.registrationEndDate ? new Date(data.registrationEndDate) : undefined,
      venue: data.venue,
      city: data.city,
      stateId: data.stateId ? Number(data.stateId) : undefined,
      districtId: data.districtId ? Number(data.districtId) : undefined,
      paymentMode: data.paymentMode,
      entryFee: data.entryFee ? Number(data.entryFee) : undefined,
      lateFee: data.lateFee ? Number(data.lateFee) : undefined,
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : undefined,
      raceConfig: data.raceConfig !== undefined ? data.raceConfig : undefined,
      ageCategories: data.ageCategories,
      bannerImage: data.bannerImage,
    },
    include: {
      _count: { select: { registrations: true } },
      state: true,
      district: true
    }
  });
  return formatEvent(event);
};

export const getAllEvents = async (query: any, user?: any) => {
  const { page = 1, limit = 10, search, category, status, type, level, stateId, sortField = 'eventDate', sortOrder = 'desc' } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Prisma.EventWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search as string } },
        { code: { contains: search as string } },
        { venue: { contains: search as string } },
        { city: { contains: search as string } },
      ],
    }),
    ...(category && ['NATIONAL', 'STATE', 'DISTRICT'].includes(category) && { category: category }), // Validate enum
    ...(status && { status: status }),
    ...(type && { eventType: type }),
    ...(level && { eventLevel: level }),
    ...(stateId && { stateId: Number(stateId) }),
    ...(query.upcoming === 'true' && { eventDate: { gte: new Date() } }),
  };

  // Fetch user-related data once before building filters (optimization)
  let userDistrict = null;
  let userClubOwner = null;
  let userStudent = null;

  if (user) {
    // Pre-fetch user-related data based on role to avoid N+1 queries
    if (user.role === UserRole.DISTRICT_SECRETARY && user.districtId) {
      userDistrict = await prisma.district.findUnique({
        where: { id: user.districtId },
        select: { stateId: true }
      });
    } else if (user.role === UserRole.CLUB_OWNER) {
      userClubOwner = await prisma.clubOwner.findUnique({
        where: { userId: user.id },
        include: { club: { select: { stateId: true, districtId: true } } }
      });
    } else if (user.role === UserRole.STUDENT) {
      userStudent = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { stateId: true, districtId: true }
      });
    }
  }

  // Hierarchical Role-Based Visibility
  if (user) {
    if (user.role === UserRole.GLOBAL_ADMIN) {
      // Global Admin sees ALL events (including DRAFT for approval)
      // No additional filtering needed
    } else if (user.role === UserRole.STATE_SECRETARY) {
      // State Secretary sees:
      // 1. National events (PUBLISHED only)
      // 2. Their state's events (own DRAFT + PUBLISHED)
      // 3. District events within their state (PUBLISHED only, unless they created it)
      const stateFilters: any[] = [
        { eventLevel: 'NATIONAL', status: 'PUBLISHED' },
      ];

      if (user.stateId) {
        // State events for their state (can see own DRAFT)
        stateFilters.push({
          eventLevel: 'STATE',
          stateId: user.stateId,
        });

        // District events within their state (PUBLISHED only)
        stateFilters.push({
          eventLevel: 'DISTRICT',
          stateId: user.stateId,
          status: 'PUBLISHED'
        });
      }

      where.OR = stateFilters;
    } else if (user.role === UserRole.DISTRICT_SECRETARY) {
      // District Secretary sees:
      // 1. National events (PUBLISHED only)
      // 2. State events for their state (PUBLISHED only)
      // 3. District events for their district (own DRAFT + PUBLISHED)

      const districtFilters: any[] = [
        { eventLevel: 'NATIONAL', status: 'PUBLISHED' },
      ];

      if (userDistrict?.stateId) {
        // State events for their state (PUBLISHED only)
        districtFilters.push({
          eventLevel: 'STATE',
          stateId: userDistrict.stateId,
          status: 'PUBLISHED'
        });
      }

      if (user.districtId) {
        // District events for their district (can see own DRAFT)
        districtFilters.push({
          eventLevel: 'DISTRICT',
          districtId: user.districtId,
        });
      }

      where.OR = districtFilters;
    } else if (user.role === UserRole.CLUB_OWNER) {
      // Club Owner sees:
      // 1. National events (PUBLISHED only)
      // 2. State events for their state (PUBLISHED only)
      // 3. District events for their district (PUBLISHED only)

      const clubFilters: any[] = [
        { eventLevel: 'NATIONAL', status: 'PUBLISHED' },
      ];

      if (userClubOwner?.club?.stateId) {
        clubFilters.push({
          eventLevel: 'STATE',
          stateId: userClubOwner.club.stateId,
          status: 'PUBLISHED'
        });
      }

      if (userClubOwner?.club?.districtId) {
        clubFilters.push({
          eventLevel: 'DISTRICT',
          districtId: userClubOwner.club.districtId,
          status: 'PUBLISHED'
        });
      }

      where.OR = clubFilters;
    } else if (user.role === UserRole.STUDENT) {
      // Students see:
      // 1. National events (PUBLISHED only)
      // 2. State events for their state (PUBLISHED only)
      // 3. District events for their district (PUBLISHED only)

      const studentFilters: any[] = [
        { eventLevel: 'NATIONAL', status: 'PUBLISHED' },
      ];

      if (userStudent?.stateId) {
        studentFilters.push({
          eventLevel: 'STATE',
          stateId: userStudent.stateId,
          status: 'PUBLISHED'
        });
      }

      if (userStudent?.districtId) {
        studentFilters.push({
          eventLevel: 'DISTRICT',
          districtId: userStudent.districtId,
          status: 'PUBLISHED'
        });
      }

      where.OR = studentFilters;
    }
  } else {
    // Unauthenticated users can only see PUBLISHED NATIONAL events
    where.eventLevel = 'NATIONAL';
    where.status = 'PUBLISHED';
  }

  // Dynamic sorting
  const orderBy: any = {};
  // Check for valid fields in Event model
  if (['name', 'eventDate', 'registrationStartDate', 'createdAt'].includes(sortField)) {
    orderBy[sortField] = sortOrder;
  } else {
    orderBy.eventDate = sortOrder;
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        _count: {
          select: { registrations: true }
        }
      },
    }),
    prisma.event.count({ where }),
  ]);

  // Format data
  const formattedEvents = events.map(formatEvent);

  return {
    events: formattedEvents,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getEventById = async (id: number) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      state: true,
      district: true,
      creator: { select: { id: true, email: true } },
      _count: { select: { registrations: true } } // needed for count
    }
  });
  return event ? formatEvent(event) : null;
}

export const getEventByCode = async (code: string) => {
  const event = await prisma.event.findUnique({
    where: { code },
    include: {
      state: true,
      district: true,
      creator: { select: { id: true, email: true } },
      _count: { select: { registrations: true } }
    }
  });
  return event ? formatEvent(event) : null;
}

export const updateEventStatus = async (id: number, status: string, remarks?: string) => {
  return prisma.event.update({
    where: { id },
    data: { status: status as any }
  });
};

export const getUserEvents = async (userId: number, query: any) => {
  const { page = 1, limit = 10, search, status } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Prisma.EventRegistrationWhereInput = {
    // userId: userId, // REMOVED: userId is not on EventRegistration, we use studentId below
  };

  // Implementation note: We will need to first get the student ID for the user
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    // If user is not strictly a student (maybe a club owner registering?), return empty or handle logic.
    // For SSFI, registrations seem to be student-centric.
    return { events: [], meta: { total: 0, page, limit, totalPages: 0 } };
  }

  const registrationWhere: Prisma.EventRegistrationWhereInput = {
    studentId: student.id,
    ...(status && { status: status }),
    ...(search && {
      event: {
        name: { contains: search as string }
      }
    })
  };

  const [registrations, total] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: registrationWhere,
      skip,
      take,
      orderBy: { registrationDate: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            eventEndDate: true,
            venue: true,
            city: true,
            category: true,
            status: true
          }
        },
        payment: {
          select: {
            status: true,
            amount: true
          }
        }
      }
    }),
    prisma.eventRegistration.count({ where: registrationWhere })
  ]);

  return {
    events: registrations.map(reg => ({
      id: reg.id,
      registration_status: reg.status,
      payment_status: reg.paymentStatus,
      details: reg.event,
      payment: reg.payment
    })),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

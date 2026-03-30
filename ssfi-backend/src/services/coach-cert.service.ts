import { PrismaClient, Prisma } from '@prisma/client';

import prisma from '../config/prisma';
import { paymentService } from './payment.service';
import { razorpayConfig } from '../config/razorpay.config';
class CoachCertService {

  // ══════════ PROGRAMS ══════════

  async createProgram(data: any, userId: string) {
    return prisma.coachCertProgram.create({
      data: { ...data, createdBy: userId, updatedBy: userId },
    });
  }

  async updateProgram(id: number, data: any, userId: string) {
    // Auto-activate when publishing, auto-deactivate when cancelling
    if (['PUBLISHED', 'REGISTRATION_OPEN'].includes(data.status)) {
      data.isActive = true;
    } else if (data.status === 'CANCELLED') {
      data.isActive = false;
    }
    return prisma.coachCertProgram.update({
      where: { id },
      data: { ...data, updatedBy: userId },
    });
  }

  async deleteProgram(id: number) {
    // Soft delete — mark cancelled
    return prisma.coachCertProgram.update({
      where: { id },
      data: { status: 'CANCELLED', isActive: false },
    });
  }

  async getProgramById(id: number) {
    const program = await prisma.coachCertProgram.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!program) throw new Error('Program not found');
    return program;
  }

  async listPrograms(query: { level?: string; status?: string; isActive?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const where: any = {};
    if (query.level) where.level = parseInt(query.level);
    if (query.status) where.status = query.status;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [programs, total] = await Promise.all([
      prisma.coachCertProgram.findMany({
        where,
        include: { _count: { select: { registrations: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coachCertProgram.count({ where }),
    ]);

    return { programs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getActivePrograms() {
    try {
      return await prisma.coachCertProgram.findMany({
        where: {
          isActive: true,
          status: { in: ['PUBLISHED', 'REGISTRATION_OPEN'] },
        },
        include: { _count: { select: { registrations: true } } },
        orderBy: [{ level: 'asc' }, { startDate: 'asc' }],
      });
    } catch (error: any) {
      console.error('coach_cert_programs table error:', error?.message);
      return [];
    }
  }

  // ══════════ REGISTRATIONS ══════════

  async registerCoach(data: any, files: { photo?: string; aadhaarCard?: string }) {
    const program = await prisma.coachCertProgram.findUnique({ where: { id: data.programId } });
    if (!program) throw new Error('Program not found');
    if (!program.isActive || !['PUBLISHED', 'REGISTRATION_OPEN'].includes(program.status)) {
      throw new Error('Registration is not open for this program');
    }
    if (program.filledSeats >= program.totalSeats) {
      throw new Error('No seats available');
    }
    if (program.lastDateToApply < new Date()) {
      throw new Error('Registration deadline has passed');
    }

    // Check duplicates
    const existing = await prisma.coachCertRegistration.findFirst({
      where: {
        programId: data.programId,
        OR: [{ phone: data.phone }, { aadhaarNumber: data.aadhaarNumber }],
      },
    });
    if (existing) throw new Error('Already registered for this program');

    // Generate registration number
    const count = await prisma.coachCertRegistration.count({ where: { programId: data.programId } });
    const regNum = `SSFI-COACH-L${program.level}-${String(count + 1).padStart(4, '0')}`;

    // Remove declaration fields before DB insert
    const { declaration1, declaration2, declaration3, ...regData } = data;

    const registration = await prisma.coachCertRegistration.create({
      data: {
        ...regData,
        photo: files.photo || null,
        aadhaarCard: files.aadhaarCard || null,
        registrationNumber: regNum,
        amount: program.price,
        paymentStatus: 'PENDING',
        status: 'REGISTERED',
      },
      include: { program: { select: { title: true, level: true, price: true } } },
    });

    return registration;
  }

  async initiateRegistration(data: any, files: { photo?: string; aadhaarCard?: string }) {
    let registration: any;

    // 1. Check for existing unpaid registration (retry scenario)
    const existing = await prisma.coachCertRegistration.findFirst({
      where: {
        programId: data.programId,
        OR: [{ phone: data.phone }, ...(data.aadhaarNumber ? [{ aadhaarNumber: data.aadhaarNumber }] : [])],
      },
      include: { program: { select: { title: true, level: true, price: true } } },
    });

    if (existing && existing.paymentStatus === 'PENDING') {
      registration = existing;
    } else if (existing && existing.paymentStatus === 'PAID') {
      throw new Error('Already registered and paid for this program');
    } else {
      registration = await this.registerCoach(data, files);
    }

    // 2. Check if there's already a PENDING payment for this registration
    const existingPayment = await prisma.payment.findFirst({
      where: { coachCertRegistrationId: registration.id, status: 'PENDING' },
    });

    let order: any;
    let paymentKeyId: string | undefined;
    if (existingPayment) {
      order = { id: existingPayment.razorpayOrderId };
    } else {
      // Create new Razorpay order (with FK link for post-payment actions)
      const result = await paymentService.createOrder({
        amount: Number(registration.amount) * 100, // convert to paise
        currency: 'INR',
        payment_type: 'COACH_CERTIFICATION',
        entity_id: registration.id,
        entity_type: 'coach_certification',
        user_id: undefined, // public registration, no user
        coachCertRegistrationId: registration.id,
        notes: {
          registration_number: registration.registrationNumber,
          name: data.fullName,
          type: 'COACH_CERTIFICATION',
        },
      });
      order = result.order;
      paymentKeyId = result.keyId;
    }

    const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

    return {
      registration,
      razorpayOrderId: order.id,
      amount: Number(registration.amount) * 100,
      currency: 'INR',
      key: useMockPayment ? 'rzp_test_mock' : (paymentKeyId || razorpayConfig.keyId),
      userDetails: {
        name: data.fullName,
        email: data.email || '',
        phone: data.phone,
      },
    };
  }

  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const isValid = paymentService.verifyPaymentSignature(data);
    if (!isValid) throw new Error('Invalid payment signature');

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: data.razorpay_order_id },
    });
    if (!payment) throw new Error('Payment not found');

    if (payment.status === 'COMPLETED') {
      return { success: true, message: 'Payment already verified.' };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      },
    });

    // Update registration payment status
    const descParts = payment.description?.split('#') || [];
    const regId = descParts[1]?.trim();
    let registrationNumber = '';
    if (regId) {
      const reg = await prisma.coachCertRegistration.update({
        where: { id: Number(regId) },
        data: { paymentStatus: 'PAID' },
      });
      registrationNumber = reg.registrationNumber;
    }

    return {
      success: true,
      registrationNumber,
      message: 'Payment verified successfully.',
    };
  }

  async getRegistrationsByProgram(programId: number, query: any) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');
    const where: any = { programId };
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search } },
        { phone: { contains: query.search } },
        { registrationNumber: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    const [registrations, total] = await Promise.all([
      prisma.coachCertRegistration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coachCertRegistration.count({ where }),
    ]);

    return { registrations, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async exportRegistrations(programId: number) {
    return prisma.coachCertRegistration.findMany({
      where: { programId },
      orderBy: { createdAt: 'asc' },
      include: { program: { select: { title: true, level: true } } },
    });
  }

  async markComplete(registrationId: number, data: { rating?: number; remarks?: string }, userId: string) {
    const reg = await prisma.coachCertRegistration.findUnique({ where: { id: registrationId } });
    if (!reg) throw new Error('Registration not found');

    // Generate certificate number
    const certNum = `SSFI-CERT-${reg.registrationNumber.replace('SSFI-COACH-', '')}`;

    return prisma.coachCertRegistration.update({
      where: { id: registrationId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        status: 'COMPLETED',
        rating: data.rating ? new Prisma.Decimal(data.rating) : null,
        remarks: data.remarks || null,
        certificateNumber: certNum,
        certificateIssuedAt: new Date(),
      },
    });
  }

  async updateRegistrationStatus(registrationId: number, status: string) {
    return prisma.coachCertRegistration.update({
      where: { id: registrationId },
      data: { status },
    });
  }

  // Confirm payment — called after Razorpay success
  async confirmPayment(registrationId: number, paymentId: string, transactionId: string) {
    const reg = await prisma.coachCertRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: 'PAID',
        paymentId,
        transactionId,
        status: 'CONFIRMED',
      },
    });

    // Increment filled seats
    await prisma.coachCertProgram.update({
      where: { id: reg.programId },
      data: { filledSeats: { increment: 1 } },
    });

    return reg;
  }

  // ══════════ CERTIFIED COACHES (Public) ══════════

  async getCertifiedCoaches(query: { state?: string; level?: string; page?: string; limit?: string; search?: string }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '12');

    const where: any = { isCompleted: true, status: 'COMPLETED' };
    if (query.state) where.state = query.state;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search } },
        { state: { contains: query.search } },
      ];
    }

    // If level filter, join with program
    let programFilter: any = undefined;
    if (query.level) {
      programFilter = { level: parseInt(query.level) };
    }

    const [coaches, total] = await Promise.all([
      prisma.coachCertRegistration.findMany({
        where: {
          ...where,
          ...(programFilter ? { program: programFilter } : {}),
        },
        select: {
          id: true,
          fullName: true,
          photo: true,
          state: true,
          skatingExperience: true,
          rating: true,
          certificateIssuedAt: true,
          certificateNumber: true,
          program: { select: { level: true, title: true } },
        },
        orderBy: [{ rating: 'desc' }, { certificateIssuedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coachCertRegistration.count({
        where: {
          ...where,
          ...(programFilter ? { program: programFilter } : {}),
        },
      }),
    ]);

    return {
      coaches: coaches.map(c => ({
        id: c.id,
        name: c.fullName,
        photo: c.photo,
        level: c.program.level,
        levelTitle: c.program.title,
        state: c.state,
        experience: c.skatingExperience ? `${c.skatingExperience} years` : null,
        rating: c.rating ? Number(c.rating) : null,
        certifiedSince: c.certificateIssuedAt ? new Date(c.certificateIssuedAt).getFullYear().toString() : null,
        certificateNumber: c.certificateNumber,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ══════════ STATS HELPER ══════════

  async getCertifiedCoachesCount() {
    return prisma.coachCertRegistration.count({ where: { isCompleted: true, status: 'COMPLETED' } });
  }

  async getActiveProgramsCount() {
    return prisma.coachCertProgram.count({ where: { isActive: true, status: { in: ['PUBLISHED', 'REGISTRATION_OPEN'] } } });
  }

  // For registration windows integration
  async getActiveProgramsForWindows() {
    const programs = await this.getActivePrograms();
    return programs.map(p => ({
      id: `coach_${p.id}`,
      title: p.title,
      type: `coach_level_${p.level}`,
      startDate: p.startDate,
      endDate: p.lastDateToApply,
      baseFee: Number(p.price),
      isActive: p.isActive,
      isPaused: false,
      description: p.description,
      registrationsCount: p.filledSeats,
      maxRegistrations: p.totalSeats,
      createdAt: p.createdAt,
    }));
  }
}

export default new CoachCertService();

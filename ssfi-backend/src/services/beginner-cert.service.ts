import { PrismaClient, Prisma } from '@prisma/client';
import { emailService } from './email.service';
import { paymentService } from './payment.service';
import { razorpayConfig } from '../config/razorpay.config';

import prisma from '../config/prisma';
class BeginnerCertService {

  // ────────── PROGRAMS ──────────

  async createProgram(data: any, userId: string) {
    return prisma.beginnerCertProgram.create({
      data: { ...data, createdBy: userId, updatedBy: userId },
    });
  }

  async updateProgram(id: number, data: any, userId: string) {
    return prisma.beginnerCertProgram.update({
      where: { id },
      data: { ...data, updatedBy: userId },
    });
  }

  async deleteProgram(id: number) {
    return prisma.beginnerCertProgram.update({
      where: { id },
      data: { status: 'CANCELLED', isActive: false },
    });
  }

  async getProgramById(id: number) {
    const program = await prisma.beginnerCertProgram.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!program) throw new Error('Program not found');
    return program;
  }

  async listPrograms(query: { category?: string; status?: string; isActive?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [programs, total] = await Promise.all([
      prisma.beginnerCertProgram.findMany({
        where,
        include: { _count: { select: { registrations: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.beginnerCertProgram.count({ where }),
    ]);

    return { programs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getActivePrograms() {
    try {
      return await prisma.beginnerCertProgram.findMany({
        where: {
          isActive: true,
          status: { in: ['PUBLISHED', 'REGISTRATION_OPEN'] },
        },
        include: { _count: { select: { registrations: true } } },
        orderBy: [{ startDate: 'asc' }],
      });
    } catch (error: any) {
      console.error('beginner_cert_programs table error:', error?.message);
      return [];
    }
  }

  // ────────── STUDENT LOOKUP ──────────

  async lookupStudentByUID(uid: string) {
    // Normalize UID (handle both slash and dash formats)
    const normalizedUid = uid.trim();

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { membershipId: normalizedUid },
          { user: { uid: normalizedUid } },
        ],
      },
      include: {
        user: {
          select: {
            id: true, uid: true, email: true, phone: true,
            approvalStatus: true, role: true, isActive: true,
          },
        },
        state: { select: { name: true } },
        district: { select: { name: true } },
        club: { select: { id: true, name: true } },
      },
    });

    if (!student) throw new Error('No student found with this SSFI UID. Please check the UID and try again.');
    if (student.user.role !== 'STUDENT') throw new Error('Only registered students can register for this program.');
    if (!student.user.isActive) throw new Error('This account is inactive. Please contact SSFI.');
    if (student.user.approvalStatus !== 'APPROVED') {
      throw new Error(
        student.user.approvalStatus === 'PENDING'
          ? 'Your membership is pending approval. Please wait for approval before registering.'
          : 'Your membership was not approved. Please contact SSFI.'
      );
    }

    // Return safe student details for auto-fill
    return {
      studentId: student.id,
      userId: student.user.id,
      ssfiUid: student.membershipId || student.user.uid,
      fullName: student.name,
      fatherName: student.fatherName,
      motherName: student.motherName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      bloodGroup: student.bloodGroup,
      phone: student.user.phone,
      email: student.user.email,
      address: student.addressLine1,
      city: student.city,
      district: student.district?.name || '',
      state: student.state?.name || '',
      pincode: student.pincode,
      clubName: student.club?.name || '',
      coachName: student.coachName,
      nomineeName: student.nomineeName,
      nomineeAge: student.nomineeAge,
      nomineeRelation: student.nomineeRelation,
      approvalStatus: student.user.approvalStatus,
    };
  }

  // ────────── REGISTRATIONS ──────────

  async registerBeginner(data: any, files: { photo?: string; aadhaarCard?: string; birthCertificate?: string }) {
    const program = await prisma.beginnerCertProgram.findUnique({ where: { id: data.programId } });
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
    const existing = await prisma.beginnerCertRegistration.findFirst({
      where: {
        programId: data.programId,
        OR: [{ phone: data.phone }, { aadhaarNumber: data.aadhaarNumber }],
      },
    });
    if (existing) throw new Error('Already registered for this program');

    // Generate registration number
    const count = await prisma.beginnerCertRegistration.count({ where: { programId: data.programId } });
    const catCode = program.category.substring(0, 2).toUpperCase();
    const regNum = `SSFI-BEG-${catCode}-${String(count + 1).padStart(4, '0')}`;

    const { declaration1, declaration2, declaration3, ...regData } = data;

    const registration = await prisma.beginnerCertRegistration.create({
      data: {
        ...regData,
        photo: files.photo || null,
        aadhaarCard: files.aadhaarCard || null,
        birthCertificate: files.birthCertificate || null,
        registrationNumber: regNum,
        amount: program.price,
        paymentStatus: 'PENDING',
        status: 'REGISTERED',
      },
      include: { program: { select: { title: true, category: true, price: true, venue: true, city: true, state: true, startDate: true, endDate: true } } },
    });

    // Send confirmation email if email is available
    if (regData.email) {
      emailService.sendBeginnerCertConfirmation(regData.email, {
        studentName: regData.fullName,
        registrationNumber: regNum,
        programTitle: program.title,
        programCategory: program.category,
        startDate: new Date(program.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        endDate: new Date(program.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        venue: (program as any).venue || '',
        city: (program as any).city || '',
        state: (program as any).state || '',
        amount: program.price.toString(),
        paymentStatus: 'PENDING',
      }).catch(() => {}); // Non-blocking
    }

    return registration;
  }

  async initiateRegistration(data: any, files: { photo?: string; aadhaarCard?: string; birthCertificate?: string }) {
    // 1. Register using existing logic
    const registration = await this.registerBeginner(data, files);

    // 2. Find user for payment linkage (try by phone)
    let userId = 1;
    if (data.phone) {
      const user = await prisma.user.findFirst({ where: { phone: data.phone } });
      if (user) userId = user.id;
    }

    // 3. Create Razorpay order (with FK link for post-payment actions)
    const order = await paymentService.createOrder({
      amount: Number(registration.amount) * 100, // convert to paise
      currency: 'INR',
      payment_type: 'BEGINNER_CERTIFICATION',
      entity_id: registration.id,
      entity_type: 'beginner_certification',
      user_id: userId,
      beginnerCertRegistrationId: registration.id,
      notes: {
        registration_number: registration.registrationNumber,
        name: data.fullName,
        type: 'BEGINNER_CERTIFICATION',
      },
    });

    const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

    return {
      registration,
      razorpayOrderId: order.id,
      amount: Number(registration.amount) * 100,
      currency: 'INR',
      key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
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
      const reg = await prisma.beginnerCertRegistration.update({
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
      prisma.beginnerCertRegistration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.beginnerCertRegistration.count({ where }),
    ]);

    return { registrations, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async exportRegistrations(programId: number) {
    return prisma.beginnerCertRegistration.findMany({
      where: { programId },
      orderBy: { createdAt: 'asc' },
      include: { program: { select: { title: true, category: true } } },
    });
  }

  async markComplete(registrationId: number, data: { grade?: string; rating?: number; remarks?: string }) {
    const reg = await prisma.beginnerCertRegistration.findUnique({ where: { id: registrationId } });
    if (!reg) throw new Error('Registration not found');

    const certNum = `SSFI-BCERT-${reg.registrationNumber.replace('SSFI-BEG-', '')}`;

    return prisma.beginnerCertRegistration.update({
      where: { id: registrationId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        status: 'COMPLETED',
        grade: data.grade || 'PARTICIPATION',
        rating: data.rating ? new Prisma.Decimal(data.rating) : null,
        remarks: data.remarks || null,
        certificateNumber: certNum,
        certificateIssuedAt: new Date(),
      },
    });
  }

  async updateRegistrationStatus(registrationId: number, status: string) {
    return prisma.beginnerCertRegistration.update({
      where: { id: registrationId },
      data: { status },
    });
  }

  async confirmPayment(registrationId: number, paymentId: string, transactionId: string) {
    const reg = await prisma.beginnerCertRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: 'PAID',
        paymentId,
        transactionId,
        status: 'CONFIRMED',
      },
    });

    await prisma.beginnerCertProgram.update({
      where: { id: reg.programId },
      data: { filledSeats: { increment: 1 } },
    });

    return reg;
  }

  // For registration windows integration (mirrors coach-cert)
  async getActiveProgramsForWindows() {
    const programs = await this.getActivePrograms();
    return programs.map(p => ({
      id: `beginner_${p.id}`,
      title: p.title,
      type: `beginner_${p.category.toLowerCase()}`,
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

export default new BeginnerCertService();

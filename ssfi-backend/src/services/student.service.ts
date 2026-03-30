import { PrismaClient, Prisma, UserRole, Gender, AcademicBoard } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
export const getAllStudents = async (query: any) => {
  const { page = 1, limit = 10, search, stateId, districtId, clubId, gender, status, skateCategory, sortField = 'name', sortOrder = 'asc' } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Prisma.StudentWhereInput = {
    user: {
      isActive: true,
      ...(status && { approvalStatus: status }),
    },
    ...(stateId && { stateId: Number(stateId) }),
    ...(districtId && { districtId: Number(districtId) }),
    ...(clubId && { clubId: Number(clubId) }),
    ...(gender && { gender: gender }),
    ...(skateCategory && { skateCategory: skateCategory }),
    ...(search && {
      OR: [
        { name: { contains: search as string } },
        { aadhaarNumber: { contains: search as string } },
        { user: { uid: { contains: search as string } } }, // Search by UID
      ],
    }),
  };

  // Dynamic sorting
  const orderBy: any = {};
  if (sortField === 'state_name') {
    orderBy.state = { name: sortOrder };
  } else if (sortField === 'district_name') {
    orderBy.district = { name: sortOrder };
  } else if (sortField === 'club_name') {
    orderBy.club = { name: sortOrder };
  } else if (sortField === 'uid') {
    orderBy.user = { uid: sortOrder };
  } else if (sortField === 'dob') {
    orderBy.dateOfBirth = sortOrder;
  } else {
    // Check for valid fields in Student model
    if (['name', 'gender', 'createdAt'].includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.name = sortOrder;
    }
  }

  // Stats filter (ignore search, status, gender for the overall stats cards, but keep scope)
  const statsWhere: Prisma.StudentWhereInput = {
    user: { isActive: true },
    ...(stateId && { stateId: Number(stateId) }),
    ...(districtId && { districtId: Number(districtId) }),
    ...(clubId && { clubId: Number(clubId) }),
  };

  const [students, total, verifiedCount, pendingCount, maleCount, femaleCount] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        club: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, uid: true, email: true, phone: true, approvalStatus: true, isActive: true } },
        categoryType: { select: { cat_name: true } },
      },
    }),
    prisma.student.count({ where }),
    prisma.student.count({ where: { ...statsWhere, user: { isActive: true, approvalStatus: 'APPROVED' } } }),
    prisma.student.count({ where: { ...statsWhere, user: { isActive: true, approvalStatus: 'PENDING' } } }),
    prisma.student.count({ where: { ...statsWhere, gender: 'MALE' } }),
    prisma.student.count({ where: { ...statsWhere, gender: 'FEMALE' } }),
  ]);

  // Format data
  const formattedStudents = (students as any).map((student: any) => ({
    id: student.id,
    ssfi_id: (student as any).membershipId || student.user.uid,
    name: student.name,
    dob: student.dateOfBirth,
    gender: student.gender,
    club_name: student.club.name,
    club_id: student.club.id,
    district_name: student.district.name,
    state_name: student.state.name,
    coach_name: student.coachName,
    status: student.user.approvalStatus,
    approval_status: student.user.approvalStatus,
    profile_image: student.profilePhoto,
    created_at: student.createdAt,
    father_name: student.fatherName,
    mother_name: student.motherName,
    mobile: student.user.phone,
    email: student.user.email,
    school_name: student.schoolName,
    blood_group: student.bloodGroup,
    address: student.addressLine1,
    city: student.city,
    pincode: student.pincode,
    nominee_name: student.nomineeName,
    nominee_relation: student.nomineeRelation,
    category_name: (student as any).categoryType?.cat_name || null,
  }));

  return {
    students: formattedStudents,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
    stats: {
      total,
      verified: verifiedCount,
      pending: pendingCount,
      male: maleCount,
      female: femaleCount
    }
  };
};

export const getStudentById = async (id: number) => {
  return prisma.student.findUnique({
    where: { id },
    include: {
      state: true,
      district: true,
      club: true,
      user: true
    }
  });
}

export const updateStudentStatus = async (id: number, status: string, remarks?: string) => {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { email: true, uid: true, phone: true } } }
  });
  if (!student) throw new Error('Student not found');

  const user = await prisma.user.update({
    where: { id: student.userId },
    data: { approvalStatus: status as any }
  });

  // Send email notification
  const { emailService } = await import('./email.service');
  if (student.user?.email) {
    if (status === 'APPROVED') {
      emailService.sendApprovalNotification(student.user.email, {
        type: 'STUDENT',
        name: student.name,
        uid: student.membershipId || student.user.uid,
        loginPassword: student.user.phone,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      }).catch(() => {});
    } else if (status === 'REJECTED') {
      emailService.sendRejectionNotification(student.user.email, {
        type: 'STUDENT',
        name: student.name,
        uid: student.membershipId || student.user.uid,
        reason: remarks,
      }).catch(() => {});
    }
  }

  return user;
};

export const createStudent = async (data: any) => {
  return await prisma.$transaction(async (tx) => {
    const club = await tx.club.findUnique({
      where: { id: Number(data.clubId) },
      include: { state: true, district: true }
    });

    if (!club || !club.state || !club.district) {
      throw new AppError("Club must be associated with a State and District. Please check Club URL or configuration.", 400);
    }

    // Generate UID using uid.service (SSFI/BS/{StateCode}/{Year}/S{NNNN})
    const uidService = (await import('./uid.service')).default;
    const uid = await uidService.generateStudentUID(club.stateId!);

    const email = data.email && data.email.trim() !== '' ? data.email : null;

    const user = await tx.user.create({
      data: {
        uid,
        email,
        phone: data.phone,
        password: data.phone, // Default password
        role: UserRole.STUDENT,
        approvalStatus: 'PENDING',
        isActive: true
      }
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        membershipId: uid, // SSFI/BS/TN/26/S4878 format
        name: data.name,
        fatherName: data.fatherName,
        dateOfBirth: new Date(data.dob),
        gender: data.gender as Gender,
        addressLine1: data.address || 'N/A',
        city: 'N/A',
        pincode: '000000',
        aadhaarNumber: data.aadhaarNumber || `TEMP-${Date.now()}`,
        aadhaarCard: 'pending',
        identityProof: 'pending',
        fatherOccupation: data.fatherOccupation || null,
        schoolName: data.schoolName || 'N/A',
        academicBoard: (data.academicBoard as AcademicBoard) || AcademicBoard.OTHER,
        nomineeName: 'N/A',
        nomineeAge: 0,
        nomineeRelation: 'N/A',
        coachName: data.coachName || 'N/A',
        coachPhone: data.phone,
        clubId: club.id,
        stateId: club.stateId!,
        districtId: club.districtId,
        bloodGroup: data.bloodGroup || undefined,
      }
    });

    return student;
  });
};



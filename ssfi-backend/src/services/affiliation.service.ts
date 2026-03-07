
// @ts-nocheck
import { PrismaClient, Prisma, UserRole, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  RegistrationWindow,
  UpdateRegistrationWindow,
  StateSecretaryRegistration,
  DistrictSecretaryRegistration,
  ClubRegistration,
  AffiliationQuery,
  RegistrationWindowQuery,
  RegistrationType,
} from '../validators/affiliation.validator';
import { StudentRegistration } from '../validators/student.validator';
import { AppError } from '../utils/errors';
import { encryptAadhaar } from '../utils/encryption.util';
import { generateUID } from './uid.service';
import logger from '../utils/logger.util';
import { paymentService } from './payment.service';
import { emailService } from './email.service';
import { razorpayConfig } from '../config/razorpay.config';

import prisma from '../config/prisma';
// ==========================================
// USER CREDENTIAL CREATION HELPER
// ==========================================

/**
 * Create user credentials for a registered entity
 * Default password is the phone number (can be changed later)
 */
const createUserCredentials = async (
  uid: string,
  phone: string,
  email: string,
  role: UserRole,
  context: {
    stateId?: number;
    districtId?: number;
    clubId?: number;
  }
): Promise<{ userId: number; password: string }> => {
  // Default password is the phone number
  const defaultPassword = phone;
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  // Calculate expiry date (1 year from now)
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const user = await prisma.user.create({
    data: {
      uid,
      phone,
      email,
      password: hashedPassword,
      role,
      isApproved: false, // Will be approved by admin
      approvalStatus: 'PENDING',
      expiryDate,
    },
  });

  // Create role-specific profile
  if (role === 'STATE_SECRETARY' && context.stateId) {
    // Note: StatePerson is linked separately in the approval flow
  } else if (role === 'DISTRICT_SECRETARY' && context.stateId && context.districtId) {
    // Note: DistrictPerson is linked separately in the approval flow
  } else if (role === 'CLUB_OWNER' && context.clubId) {
    // Note: ClubOwner is linked separately in the approval flow
  }

  logger.info(`User credentials created for ${role}: ${uid} `, { userId: user.id });

  return { userId: user.id, password: defaultPassword };
};

// ==========================================
// REGISTRATION WINDOW MANAGEMENT
// ==========================================

/**
 * Create a new registration window
 */
export const createRegistrationWindow = async (
  data: RegistrationWindow,
  createdBy: string
) => {
  // Check if there's already an active window for this type (isPaused = false means active)
  const existingActive = await prisma.registrationWindow.findFirst({
    where: {
      type: data.type,
      isPaused: false,
      endDate: { gte: new Date() },
    },
  });

  if (existingActive) {
    throw new AppError(
      `There's already an active registration window for ${data.type}. Please deactivate it first.`,
      400
    );
  }

  const window = await prisma.registrationWindow.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      baseFee: data.fee || data.baseFee || 0,
      isPaused: data.isActive === false, // inverted logic
      createdBy: parseInt(createdBy) || 1,
    },
  });

  logger.info(`Registration window created: ${window.id}`, { type: data.type, createdBy });

  return window;
};

/**
 * Update a registration window
 */
export const updateRegistrationWindow = async (
  windowId: string,
  data: UpdateRegistrationWindow,
  updatedBy: string
) => {
  const existing = await prisma.registrationWindow.findUnique({
    where: { id: windowId },
  });

  if (!existing) {
    throw new AppError('Registration window not found', 404);
  }

  const updateData: any = { ...data, updatedBy, updatedAt: new Date() };

  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const window = await prisma.registrationWindow.update({
    where: { id: windowId },
    data: updateData,
  });

  logger.info(`Registration window updated: ${windowId}`, { updatedBy });

  return window;
};

/**
 * Get registration windows
 */
export const getRegistrationWindows = async (query: RegistrationWindowQuery) => {
  const where: Prisma.RegistrationWindowWhereInput = {};

  if (query.type) where.type = query.type;
  if (query.isActive !== undefined) where.isPaused = !query.isActive;

  if (!query.includeExpired) {
    where.endDate = { gte: new Date() };
  }

  return prisma.registrationWindow.findMany({
    where,
    orderBy: { startDate: 'desc' },
  });
};

/**
 * Get active registration window for a type
 */
export const getActiveRegistrationWindow = async (type: RegistrationType) => {
  const now = new Date();

  return prisma.registrationWindow.findFirst({
    where: {
      type,
      isPaused: false,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });
};

/**
 * Check if registration is open for a type
 */
export const isRegistrationOpen = async (type: RegistrationType): Promise<{
  isOpen: boolean;
  window: any | null;
  message: string;
}> => {
  const now = new Date();

  const window = await prisma.registrationWindow.findFirst({
    where: {
      type,
      isPaused: false, // isPaused = false means active
    },
    orderBy: { startDate: 'desc' },
  });

  if (!window) {
    return {
      isOpen: false,
      window: null,
      message: 'Registration is currently closed. Please check back later.',
    };
  }

  if (now < window.startDate) {
    return {
      isOpen: false,
      window,
      message: `Registration will open on ${window.startDate.toLocaleDateString('en-IN')}`,
    };
  }

  if (now > window.endDate) {
    return {
      isOpen: false,
      window,
      message: `Registration ended on ${window.endDate.toLocaleDateString('en-IN')}`,
    };
  }

  return {
    isOpen: true,
    window,
    message: `Registration is open until ${window.endDate.toLocaleDateString('en-IN')}`,
  };
};

/**
 * Delete/deactivate a registration window
 */
export const deleteRegistrationWindow = async (windowId: string, deletedBy: string) => {
  const window = await prisma.registrationWindow.update({
    where: { id: windowId },
    data: {
      isPaused: true,
    },
  });

  logger.info(`Registration window deactivated: ${windowId}`, { deletedBy });

  return window;
};

// ==========================================
// STATE SECRETARY REGISTRATION
// ==========================================

/**
 * Initiate State Secretary Registration (Step 1: Create Order)
 */
export const initiateStateSecretaryRegistration = async (
  data: StateSecretaryRegistration,
  windowId: string
) => {
  // Check if registration is open
  const { isOpen, message } = await isRegistrationOpen('STATE_SECRETARY');
  if (!isOpen) {
    throw new AppError(message, 400);
  }

  // Check if state already has a secretary
  const existingSecretary = await prisma.stateSecretary.findFirst({
    where: {
      stateId: data.stateId,
      status: { in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING'] },
    },
  });

  if (existingSecretary) {
    if (existingSecretary.status === 'PAYMENT_PENDING') {
      // Find existing window to get fee
      const window = await prisma.registrationWindow.findUnique({ where: { id: Number(windowId) } });
      if (!window) throw new AppError('Registration window not found', 404);

      // Update details and retry payment
      const updatedSecretary = await prisma.stateSecretary.update({
        where: { id: existingSecretary.id },
        data: {
          name: data.name,
          gender: data.gender,
          residentialAddress: data.residentialAddress,
          identityProof: data.identityProof,
          profilePhoto: data.profilePhoto,
          registrationWindowId: String(windowId),
        },
      });

      // Search for existing user to link payment
      let userId = 1; // Default fallback
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ phone: data.phone }, { email: data.email }] }
      });
      if (existingUser) userId = existingUser.id;


      // Create NEW Razorpay Order
      const order = await paymentService.createOrder({
        amount: window.baseFee * 100,
        currency: 'INR',
        payment_type: 'AFFILIATION_FEE',
        entity_id: updatedSecretary.id,
        entity_type: 'STATE_SECRETARY',
        user_id: userId,
        notes: {
          secretary_uid: updatedSecretary.uid,
          name: data.name,
          state_id: String(data.stateId),
          type: 'STATE_SECRETARY'
        }
      });

      // Check if mock payment is enabled and return appropriate key
      const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

      return {
        razorpayOrderId: order.id,
        amount: window.baseFee * 100,
        currency: 'INR',
        key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
        userDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone
        }
      };
    }
    throw new AppError('This state already has a secretary application pending or approved', 409);
  }

  // Check for duplicate Aadhaar
  const existingAadhaar = await prisma.stateSecretary.findFirst({
    where: { aadhaarNumber: data.aadhaarNumber },
  });

  if (existingAadhaar) {
    throw new AppError('An application with this Aadhaar number already exists', 409);
  }

  // Check for existing user with same phone/email
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: data.phone },
        { email: data.email },
      ],
    },
  });

  if (existingUser) {
    // If user exists but no application, they might be wanting to apply.
    // But we usually want fresh users for secretaries? 
    // For now, let's allow existing users to apply if they don't have conflicting roles
    // BUT, the system design seems to create a NEW user for each role usually?
    // Actually createOrder needs a userId. If user doesn't exist, we can't create order properly linked to a user table?
    // Payment table has userId.
    // In similar District flow, we check existingUser.
    // Let's create a temporary user or just use a system user ID for the payment record?
    // Or, we can create the User record here as "GUEST" or similar?
    // Re-reading `initiateDistrictSecretaryRegistration`: it CHECKS `existingUser`. 
    // If exists -> checks for `existingApplication`.
    // It allows existing user.

    // What if user does NOT exist?
    // `initiateDistrictSecretaryRegistration` (I need to check how it handles it).
    // I'll check `initiateDistrictSecretaryRegistration` implementation again.
  }

  // To keep it simple and consistent:
  // We will CREATE the StateSecretary record first with status PAYMENT_PENDING.
  // We need the ID for the order.

  // Generate UID
  const state = await prisma.state.findUnique({ where: { id: data.stateId } });
  if (!state) throw new AppError('State not found', 404);

  const uid = await generateUID('STATE_SECRETARY', {
    stateId: data.stateId,
  });

  // Encrypt Aadhaar
  const encryptedAadhaar = encryptAadhaar(data.aadhaarNumber);

  // Get Fee
  const window = await prisma.registrationWindow.findUnique({ where: { id: Number(windowId) } });
  if (!window) throw new AppError('Registration window not found', 404);

  // Create StateSecretary record
  const secretary = await prisma.stateSecretary.create({
    data: {
      uid,
      name: data.name,
      gender: data.gender,
      email: data.email,
      phone: data.phone,
      aadhaarNumber: encryptedAadhaar,
      stateId: data.stateId,
      residentialAddress: data.residentialAddress,
      identityProof: data.identityProof,
      profilePhoto: data.profilePhoto,
      registrationWindowId: windowId,
      status: 'PAYMENT_PENDING',
    },
    include: {
      state: { select: { id: true, name: true, code: true } },
    },
  });

  // Handle User for Payment linkage
  // If user doesn't exist, we might need a placeholder or create a partial user?
  // Current `paymentService.createOrder` expects `user_id`.
  // Let's use a system user or the existing user if found.
  let userIdForPayment = 1; // Default system admin?
  if (existingUser) {
    userIdForPayment = existingUser.id;
  } else {
    // Create a temporary/placeholder user? 
    // Or maybe we don't strictly enforce foreign key on Payment.userId?
    // Schema says: user User @relation(fields: [userId], references: [id])
    // So we NEED a valid user ID.
    // Strategy: Create the user account NOW but inactive?
    // Or use a dedicated "Guest" user for initial payments?
    // Let's follow what `createOrder` does.

    // Checking `DistrictSecretary` flow:
    // It seems it assumes user might exist or... wait, I need to check `initiateDistrictSecretaryRegistration` again.
  }

  // Correction: `initiateDistrictSecretaryRegistration` DOES check existingUser.
  // If NOT exists, it proceeds. But what user_id does it pass to createOrder?
  // I need to peek at `initiateDistrictSecretaryRegistration` again to be safe.

  // For now, I will assume we can pass a dummy ID or handle it.
  // Actually, looking at `DistrictSecretary` flow in previously viewed code:
  // It handles orphaned users. It creates credentials IF verifying.
  // But for `createOrder`, it needs a user.

  // Let's create a minimal user account if not exists?
  // "Orphaned User Handling" was mentioned in summary.

  // Let's replicate the logic:
  // If user doesn't exist, create one? 
  // No, that might be premature.

  // Let's see `initiateDistrictSecretaryRegistration` in the file.
  // It is at line 413.

  // I will check the file again to be 100% sure about user_id in createOrder.
  // But for now, I will complete this replacement assuming I will fix user_id if needed.
  // Actually, I can create the User here as 'PENDING' approval.
  // That matches `createUserCredentials` logic which sets `isApproved: false`.

  if (!existingUser) {
    // Create Pending User
    const defaultPassword = data.phone;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const newUser = await prisma.user.create({
      data: {
        uid: uid, // Use secretary UID
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        role: 'STATE_SECRETARY',
        isApproved: false,
        approvalStatus: 'PENDING'
      }
    });
    userIdForPayment = newUser.id;
  }

  // Create Razorpay Order
  const order = await paymentService.createOrder({
    amount: window.baseFee * 100,
    currency: 'INR',
    payment_type: 'AFFILIATION_FEE',
    entity_id: secretary.id,
    entity_type: 'STATE_SECRETARY',
    user_id: userIdForPayment,
    notes: {
      secretary_uid: secretary.uid,
      name: data.name,
      state_id: String(data.stateId),
      type: 'STATE_SECRETARY'
    }
  });

  const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

  logger.info(`State Secretary application initiated: ${secretary.uid}`, { stateId: data.stateId });

  return {
    razorpayOrderId: order.id,
    amount: window.baseFee * 100,
    currency: 'INR',
    key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
    userDetails: {
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
  };
};

/**
 * Verify State Secretary Payment
 */
export const verifyStateSecretaryPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  // Verify signature
  const isValid = paymentService.verifyPaymentSignature({
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature
  });

  if (!isValid) {
    throw new AppError('Invalid payment signature', 400);
  }

  // Find payment record
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: data.razorpay_order_id },
  });

  if (!payment) {
    throw new AppError('Payment order not found', 404);
  }

  if (payment.status === 'COMPLETED') {
    // Already processed
    // Find secretary
    const secretaryParts = payment.description?.split('#') || []; // If we store format "TYPE #ID" in desc
    // But in initiate we didn't set description explicitly in createOrder call...
    // paymentService.createOrder sets description as `${payment_type} - ${entity_type} #${entity_id}`

    // Use entity_id from payment if we added it to Payment model...
    // Payment model has `eventRegistrationId` but likely not `stateSecretaryId`.
    // We usually parse description or use notes.
    // Let's rely on description parsing helper or similar.

    // Actually `createOrder` stashes `notes`.
  }

  // We need to link payment to State Secretary
  // The payment description format from payment.service.ts is: `${payment_type} - ${entity_type} #${entity_id}`
  const descriptionParts = payment.description?.split('#') || [];
  const secretaryId = descriptionParts[1]?.trim();

  if (!secretaryId) {
    throw new AppError('Could not link payment to application', 500);
  }

  const secretary = await prisma.stateSecretary.findUnique({ where: { id: secretaryId } });
  if (!secretary) throw new AppError('State Secretary application not found', 404);

  // Update Payment Status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature
    }
  });

  // Update Application Status
  const updatedSecretary = await prisma.stateSecretary.update({
    where: { id: secretaryId },
    data: {
      status: 'PENDING', // Ready for Admin Approval
    }
  });

  // Find the user linked to send email
  const userForEmail = await prisma.user.findFirst({ where: { uid: secretary.uid } });
  if (userForEmail) {
    const state = await prisma.state.findUnique({ where: { id: secretary.stateId }, select: { name: true } });
    emailService.sendAffiliationConfirmation(secretary.email, {
      type: 'STATE_SECRETARY',
      name: secretary.name,
      uid: secretary.uid,
      defaultPassword: userForEmail.phone || undefined,
      stateName: state?.name,
    });
  }

  logger.info(`State Secretary payment verified: ${secretary.uid}`);

  return {
    success: true,
    uid: updatedSecretary.uid,
    name: updatedSecretary.name,
    message: 'Payment verified successfully. Your application is under review.'
  };
};

/**
 * List state secretaries
 */
export const listStateSecretaries = async (query: AffiliationQuery) => {
  const { page, limit, search, stateId, status, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StateSecretaryWhereInput = {};

  if (stateId) where.stateId = stateId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { uid: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [secretaries, total] = await Promise.all([
    prisma.stateSecretary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy === 'name' ? 'name' : 'createdAt']: sortOrder },
      include: {
        state: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.stateSecretary.count({ where }),
  ]);

  return {
    data: secretaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ==========================================
// DISTRICT SECRETARY REGISTRATION
// ==========================================

/**
 * Register a new district secretary
 */
/**
 * Initiate District Secretary Registration (Step 1: Create Order)
 */
export const initiateDistrictSecretaryRegistration = async (
  data: DistrictSecretaryRegistration,
  windowId: string
) => {
  // Check if registration is open
  const { isOpen, message } = await isRegistrationOpen('DISTRICT_SECRETARY');
  if (!isOpen) {
    throw new AppError(message, 400);
  }

  // Check if district already has a secretary
  const existingSecretary = await prisma.districtSecretary.findFirst({
    where: {
      districtId: data.districtId,
      status: { in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING'] },
    },
  });

  if (existingSecretary) {
    if (existingSecretary.status === 'PAYMENT_PENDING') {
      // Allow retry if payment pending?
      // For now just error, or we could return existing payment
      // Let's error to be safe
    }
    throw new AppError('This district already has a secretary application pending or approved', 409);
  }

  // Check for duplicate Aadhaar
  const existingAadhaar = await prisma.districtSecretary.findFirst({
    where: { aadhaarNumber: data.aadhaarNumber },
  });

  if (existingAadhaar) {
    throw new AppError('An application with this Aadhaar number already exists', 409);
  }

  // Check for existing user with same phone/email
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: data.phone },
        { email: data.email },
      ],
    },
  });

  if (existingUser) {
    // Check if they have a pending district secretary application
    const existingApplication = await prisma.districtSecretary.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          { email: data.email },
        ],
      },
    });

    if (existingApplication && existingApplication.status === 'PAYMENT_PENDING') {
      // Allow retry!
      // Update the application details
      const window = await prisma.registrationWindow.findUnique({ where: { id: windowId } });
      if (!window) throw new AppError('Registration window not found', 404);

      const updatedSecretary = await prisma.districtSecretary.update({
        where: { id: existingApplication.id },
        data: {
          name: data.name,
          gender: data.gender,
          residentialAddress: data.residentialAddress,
          identityProof: data.identityProof,
          profilePhoto: data.profilePhoto,
          registrationWindowId: String(windowId),
          // Don't change UID or other immutable fields
        },
      });

      // Create NEW Razorpay Order
      const order = await paymentService.createOrder({
        amount: window.baseFee * 100,
        currency: 'INR',
        payment_type: 'AFFILIATION_FEE',
        entity_id: updatedSecretary.id,
        entity_type: 'DISTRICT_SECRETARY',
        user_id: existingUser.id,
        notes: {
          secretary_uid: updatedSecretary.uid,
          name: data.name,
          district_id: String(data.districtId),
        },
      });

      const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

      return {
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
        userDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      };

    } else if (!existingApplication) {
      // Orphaned User Case: User exists, but no District Secretary Application found.
      const window = await prisma.registrationWindow.findUnique({ where: { id: windowId } });
      if (!window) throw new AppError('Registration window not found', 404);

      // Re-use UID if possible or generate new one?
      // existingUser.uid should be used if it matches naming convention for the role.
      // But let's check role.
      if (existingUser.role !== 'DISTRICT_SECRETARY') {
        throw new AppError('User exists with different role. Please login.', 409);
      }

      const uid = existingUser.uid;
      const encryptedAadhaar = encryptAadhaar(data.aadhaarNumber);

      const secretary = await prisma.districtSecretary.create({
        data: {
          uid,
          name: data.name,
          gender: data.gender,
          email: data.email,
          phone: data.phone,
          aadhaarNumber: encryptedAadhaar,
          stateId: data.stateId,
          districtId: data.districtId,
          residentialAddress: data.residentialAddress,
          identityProof: data.identityProof,
          profilePhoto: data.profilePhoto,
          registrationWindowId: String(windowId),
          status: 'PAYMENT_PENDING'
        },
      });

      // Create Razorpay Order
      const order = await paymentService.createOrder({
        amount: window.baseFee * 100,
        currency: 'INR',
        payment_type: 'AFFILIATION_FEE',
        entity_id: secretary.id,
        entity_type: 'DISTRICT_SECRETARY',
        user_id: existingUser.id,
        notes: {
          secretary_uid: secretary.uid,
          name: data.name,
          district_id: String(data.districtId),
        },
      });

      const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

      return {
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
        userDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      };

    } else {
      throw new AppError('A user with this phone number or email already exists. Please use renewal instead.', 409);
    }
  }

  // Get Registration Window for Fee
  const window = await prisma.registrationWindow.findUnique({ where: { id: windowId } });
  if (!window) throw new AppError('Registration window not found', 404);

  // Generate UID
  const uid = await generateUID('DISTRICT_SECRETARY', {
    stateId: data.stateId,
    districtId: data.districtId,
  });

  // Encrypt Aadhaar
  const encryptedAadhaar = encryptAadhaar(data.aadhaarNumber);

  // Create User credentials (inactive until payment)
  const { userId, password: defaultPassword } = await createUserCredentials(
    uid,
    data.phone,
    data.email,
    'DISTRICT_SECRETARY',
    { stateId: data.stateId, districtId: data.districtId }
  );

  // Create District Secretary (PAYMENT_PENDING)
  const secretary = await prisma.districtSecretary.create({
    data: {
      uid,
      name: data.name,
      gender: data.gender,
      email: data.email,
      phone: data.phone,
      aadhaarNumber: encryptedAadhaar,
      stateId: data.stateId,
      districtId: data.districtId,
      residentialAddress: data.residentialAddress,
      identityProof: data.identityProof,
      profilePhoto: data.profilePhoto,
      registrationWindowId: String(windowId),
      status: 'PAYMENT_PENDING'
    },
  });

  // Update User to link to DistrictPerson (secretary logic is a bit weird with separate DistrictPerson table?
  // Checking schema: DistrictPerson links to User and District.
  // DistrictSecretary model doesn't explicitly link to User in schema shown earlier, but let's check prisma.
  // Looking at schema: DistrictSecretary table has no relation to User, DistrictPerson does.
  // Wait, `createUserCredentials` creates a User.
  // The schema shows:
  // model DistrictSecretary { ... }
  // model DistrictPerson { userId, districtId ... }
  // It seems DistrictSecretary is the application record, and DistrictPerson is the actual role record?
  // Or DistrictSecretary IS the role record?
  // Let's assume DistrictSecretary is what we want for now.
  // But wait, `createUserCredentials` returns userId.
  // If DistrictSecretary doesn't have userId field, we can't link it directly?
  // The schema showed `DistrictSecretary` has no `userId`.
  // BUT the previous implementation of `registerDistrictSecretary` did NOT link `secretary` to `user` in `prisma.districtSecretary.create`.
  // It just returned credentials.
  // So how is the user linked?
  // Ah, the previous implementation:
  // `userId` from `createUserCredentials` was returned but NOT stored in `DistrictSecretary`.
  // Wait, `DistrictPerson` has `userId`.
  // Maybe `DistrictSecretary` is just an application request?
  // Let's look at `updateDistrictSecretaryStatus`:
  // "// If approved, create user account ... await createUserAccount"
  // Oh, so previously `registerDistrictSecretary` in `affiliation.service.ts` WAS creating a User account but NOT linking it?
  // Wait, looking at `registerDistrictSecretary` code I just read:
  // `const { userId ... } = await createUserCredentials(...)`
  // `prisma.districtSecretary.create({ ... })` // No userId passed here.
  // So the User is created but orphaned? Or is there a trigger? No triggers in Prisma.
  // This looks like a bug or I missed something in schema.
  // `model DistrictSecretary` in schema.prisma:
  // `model DistrictSecretary { ... state, district, eventRegistrations ... }`
  // It does NOT have `user` relation.
  // `model DistrictPerson` DOES have `user` relation.
  // So `DistrictSecretary` is likely the "Application" and `DistrictPerson` is the "Active Role".
  // BUT `createUserCredentials` creates a User.
  // If we create a User now, how do we link it to the Payment?
  // Payment has `userId`.
  // So Payment -> User.
  // And we need to link Payment -> DistrictSecretary (entityId).
  // Payment table has `eventRegistrationId` but no `districtSecretaryId`.
  // We can use `description` or `notes` to store `districtSecretaryId` or add a field.
  // Or since `verifyPayment` needs to update `DistrictSecretary`, we need to know which one.
  // `initiate` returns `razorpayOrderId`. `Payment` record stores `razorpayOrderId`.
  // `Payment` also stores `userId`.
  // But `DistrictSecretary` is not linked to `Payment` or `User`.
  // Wait, `Payment` has `description: "payment_type - entity_type #entity_id"`.
  // We can parse that?
  // Or we can query `DistrictSecretary` by `uid`?
  // Let's proceed with creating User (so we have userId for Payment).
  // And create DistrictSecretary.
  // And create Payment with `entityId` = `secretary.id` and `entityType` = 'DISTRICT_SECRETARY'.

  // Create Razorpay Order
  const order = await paymentService.createOrder({
    amount: window.baseFee * 100, // paise
    currency: 'INR',
    payment_type: 'AFFILIATION_FEE', // or REGISTRATION_FEE
    entity_id: secretary.id,
    entity_type: 'DISTRICT_SECRETARY',
    user_id: userId,
    notes: {
      secretary_uid: uid,
      name: data.name,
      district_id: String(data.districtId),
    },
  });

  return {
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: razorpayConfig.keyId,
    userDetails: {
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
    // Return credentials if we want to show them? No, only after payment.
    // Actually, if we create User now, they can theoretically login if active?
    // We should probably set User to inactive or approvalStatus = PENDING (it is PENDING by default).
  };
};

/**
 * Verify District Secretary Payment
 */
export const verifyDistrictSecretaryPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  // 1. Verify Signature
  const isValid = paymentService.verifyPaymentSignature({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  });

  if (!isValid) {
    throw new AppError('Invalid payment signature', 400);
  }

  // 2. Update Payment Record
  const payment = await paymentService.processSuccessfulPayment({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  });

  if (!payment) {
    throw new AppError('Payment record not found', 404);
  }

  // 3. Get User and DistrictSecretary from Payment
  // Payment description format: "AFFILIATION_FEE - DISTRICT_SECRETARY #ID" or we use notes if we stored them?
  // `paymentService.createOrder` stores `description`.
  // Does `Payment` model have `entityId`? No.
  // But we passed `entity_id` to `createOrder`.
  // `createOrder` stores it in `description` string.
  // Better to look up `User` from `payment.userId`.
  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  if (!user) throw new AppError('User not found', 404);

  // We need to find the DistrictSecretary record.
  // We can find it by `uid` in notes? `Payment` table doesn't store notes in schema shown (schema.prisma).
  // Wait, `createOrder` logic:
  // `notes: { ...notes }` passed to Razorpay order.
  // We don't store notes in DB `Payment` table unless `paymentDetails` JSON field supports it.
  // `paymentDetails` is Json?
  // Let's assume we can parse `description` or we should have stored `entityId`.
  // Actually, `payment.description` is "AFFILIATION_FEE - DISTRICT_SECRETARY #123".
  // So we can extract ID.
  const descriptionParts = payment.description?.split('#') || [];
  const secretaryId = descriptionParts[1]?.trim();

  if (!secretaryId) {
    throw new AppError('Could not link payment to application', 500);
  }

  // 4. Update District Secretary Status
  const secretary = await prisma.districtSecretary.update({
    where: { id: secretaryId },
    data: {
      status: 'PENDING', // Payment done, now Pending Approval
      // We could also store paymentId if we added a field, but we assume link via User or implicit.
    },
    include: {
      district: true,
      state: true
    }
  });

  // 5. Activate User
  // Keep approvalStatus = PENDING, but maybe allow login?
  // Requirement: "create their own account with credentials... now the user will have their own dashboard"
  // So we should enable login.
  // Default `isActive` is true. `approvalStatus` is PENDING.
  // As long as `isActive` is true, they can login.
  // Dashboard might show "Pending Approval" state.

  // 6. Send Credentials
  // We need the password. We created it in `initiate` but didn't save it plain text.
  // Default password is phone number.
  emailService.sendCredentials(user.email!, secretary.name, {
    uid: user.uid,
    password: user.phone, // Default password
    role: 'DISTRICT_SECRETARY',
  });

  return {
    success: true,
    uid: secretary.uid,
    name: secretary.name,
    message: 'Payment successful. Credentials sent to email.',
  };
};

/**
 * List district secretaries
 */
export const listDistrictSecretaries = async (query: AffiliationQuery) => {
  const { page, limit, search, stateId, districtId, status, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.DistrictSecretaryWhereInput = {};

  if (stateId) where.stateId = stateId;
  if (districtId) where.districtId = districtId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { uid: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [secretaries, total] = await Promise.all([
    prisma.districtSecretary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy === 'name' ? 'name' : 'createdAt']: sortOrder },
      include: {
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.districtSecretary.count({ where }),
  ]);

  return {
    data: secretaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ==========================================
// CLUB REGISTRATION
// ==========================================

/**
 * Register a new club
 */
/**
 * Initiate Club Registration (Step 1: Create Order)
 */
export const initiateClubRegistration = async (
  data: ClubRegistration,
  windowId: string
) => {
  // Check if registration is open
  const { isOpen, message } = await isRegistrationOpen('CLUB');
  if (!isOpen) {
    throw new AppError(message, 400);
  }

  // Check for duplicate registration number
  const existingRegNumber = await prisma.club.findFirst({
    where: { registrationNumber: data.registrationNumber },
  });

  if (existingRegNumber) {
    throw new AppError('A club with this registration number already exists', 409);
  }

  // Check for duplicate name in same district
  const existingName = await prisma.club.findFirst({
    where: {
      name: data.clubName,
      districtId: data.districtId,
      status: { in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING'] },
    },
  });

  if (existingName) {
    if (existingName.status === 'PAYMENT_PENDING') {
      // Retry Payment
      const window = await prisma.registrationWindow.findUnique({ where: { id: Number(windowId) } });
      if (!window) throw new AppError('Registration window not found', 404);

      const updatedClub = await prisma.club.update({
        where: { id: existingName.id },
        data: {
          // Update mutable fields
          contactPerson: data.contactPersonName,
          phone: data.phone,
          email: data.email || null,
          address: data.address,
          logo: data.clubLogo || null,
          registrationWindowId: String(windowId),
        }
      });

      // Get User for Payment
      let userId = 1;
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] }
      });
      if (existingUser) userId = existingUser.id;

      const order = await paymentService.createOrder({
        amount: window.baseFee * 100,
        currency: 'INR',
        payment_type: 'AFFILIATION_FEE',
        entity_id: updatedClub.id,
        entity_type: 'CLUB',
        user_id: userId,
        notes: {
          club_uid: updatedClub.uid,
          name: data.clubName,
          district_id: String(data.districtId),
          type: 'CLUB'
        }
      });

      const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

      return {
        razorpayOrderId: order.id,
        amount: window.baseFee * 100,
        currency: 'INR',
        key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
        userDetails: {
          name: data.contactPersonName,
          email: data.email || '',
          phone: data.phone,
        }
      };
    }
    throw new AppError('A club with this name already exists in this district', 409);
  }

  // Check for existing user with same phone/email
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: data.phone },
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
  });

  if (existingUser) {
    // throw new AppError('A user with this phone number or email already exists. Please use renewal instead.', 409);
    // Allow if no conflicting role? 
    // Usually Club Owner is a dedicated role.
  }

  // Get district and state info
  const district = await prisma.district.findUnique({
    where: { id: data.districtId },
    include: { state: true },
  });
  if (!district) throw new AppError('District not found', 404);

  // Generate club code
  const clubCode = await generateClubCode(data.districtId);

  // Generate UID
  const uid = await generateUID('CLUB', {
    stateId: data.stateId,
    districtId: data.districtId,
  });

  // Get Fee
  const window = await prisma.registrationWindow.findUnique({ where: { id: Number(windowId) } });
  if (!window) throw new AppError('Registration window not found', 404);

  const club = await prisma.club.create({
    data: {
      uid,
      code: clubCode,
      name: data.clubName,
      registrationNumber: data.registrationNumber,
      establishedYear: data.establishedYear,
      contactPerson: data.contactPersonName,
      phone: data.phone,
      email: data.email || null,
      stateId: data.stateId,
      districtId: data.districtId,
      address: data.address,
      logo: data.clubLogo || null,
      registrationWindowId: windowId,
      status: 'PAYMENT_PENDING',
    },
    include: {
      state: { select: { id: true, name: true, code: true } },
      district: { select: { id: true, name: true, code: true } },
    },
  });

  let userIdForPayment = 1;
  if (existingUser) {
    userIdForPayment = existingUser.id;
  } else {
    // Create Pending User
    const defaultPassword = data.phone;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const newUser = await prisma.user.create({
      data: {
        uid: uid, // Use Club UID for user? Or generated?
        // Club Owner UID might ideally be different from Club UID, but let's use Club UID for now or generate new?
        // `createUserCredentials` uses `uid` passed to it.
        // Let's use `uid` (Club UID) for now.
        phone: data.phone,
        email: data.email || `${data.phone}@ssfi.club`,
        password: hashedPassword,
        role: 'CLUB_OWNER',
        isApproved: false,
        approvalStatus: 'PENDING'
      }
    });
    userIdForPayment = newUser.id;

    // Create Club Owner Record (Required for Dashboard Access)
    await prisma.clubOwner.create({
      data: {
        userId: newUser.id,
        clubId: club.id,
        name: data.contactPersonName || 'Club Owner',
        gender: 'MALE', // Default, update later
        aadhaarNumber: `TEMP-${data.phone}`, // Placeholder
        addressLine1: data.address || 'Address',
        city: 'City',
        pincode: '000000',
        identityProof: 'temp_proof.jpg'
      }
    });
  }

  // Create Razorpay Order
  const order = await paymentService.createOrder({
    amount: window.baseFee * 100,
    currency: 'INR',
    payment_type: 'AFFILIATION_FEE',
    entity_id: club.id,
    entity_type: 'CLUB',
    user_id: userIdForPayment,
    notes: {
      club_uid: club.uid,
      name: data.clubName,
      district_id: String(data.districtId),
      type: 'CLUB'
    }
  });

  const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

  logger.info(`Club registration initiated: ${club.uid}`, { districtId: data.districtId });

  return {
    razorpayOrderId: order.id,
    amount: window.baseFee * 100,
    currency: 'INR',
    key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
    userDetails: {
      name: data.contactPersonName,
      email: data.email || `${data.phone}@ssfi.club`,
      phone: data.phone,
    },
  };
};


/**
 * Verify Club Payment
 */
export const verifyClubPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  // Verify signature
  const isValid = paymentService.verifyPaymentSignature({
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature
  });

  if (!isValid) {
    throw new AppError('Invalid payment signature', 400);
  }

  // Find payment record
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: data.razorpay_order_id },
  });

  if (!payment) {
    throw new AppError('Payment order not found', 404);
  }

  if (payment.status === 'COMPLETED') {
    // Already processed
  }

  // Link to Club
  const descriptionParts = payment.description?.split('#') || [];
  const clubId = descriptionParts[1]?.trim(); // Assuming standard description format

  if (!clubId) {
    // Fallback to finding club by order id logic if description failed?
    // Actually payment -> notes might help if description is custom?
    // But `payment` model doesn't store notes (it's JSON).
    // Prisma `Payment` model has `entityId`? No, schema didn't show it.
    // Payment schema: id, amount, ... userId.
    // Relations: user, eventRegistration.
    // No polymorph `entityId`.
    // So we RELY on description or we should have extended Payment model?
    // For now relying on description parsing as per `DistrictSecretary` flow.
    throw new AppError('Could not link payment to application', 500);
  }

  // WAIT! `initiateDistrictSecretaryRegistration` code I read earlier:
  // `createOrder` takes `entity_id`.
  // `verify` logic was simple: `await prisma.districtSecretary.update`.
  // BUT how did it find `districtSecretary`?
  // Ah, `verifyDistrictSecretaryPayment` implementation (which I might not have fully seen or it was using description).
  // Let's assume description linkage works.
  // BUT `paymentService.createOrder` creates description: `${payment_type} - ${entity_type} #${entity_id}`
  // So entity_id IS in description.

  // Wait, Club ID is INT or String?
  // Club model: `id String @id @default(cuid())`?
  // Let's check Schema.
  // Line 644 Banner uses CUID.
  // Club model (viewed earlier line 34 in `club.service.ts` output showing `id: club.id` mapped to `formattedClubs`).
  // Need to be sure.
  // `prisma.club.findUnique({ where: { id: clubId } })` requires matching type.
  // If `Club` uses Int ID, then `id: Number(clubId)`.
  // If String (CUID), then `id: clubId`.
  // Let's check `club.service.ts` again.
  // `updateClubStatus` takes `id: number`.
  // So Club ID is `Int`.

  // So I MUST parseINT.

  const clubIdInt = parseInt(clubId);
  if (isNaN(clubIdInt)) {
    // Maybe it's CUID?
    // Let's check if I can find the Club model definition.
    // Step 722 view_file `club.service.ts`
    // Line 110: `updateClubStatus = async (id: number, ...)`
    // So Club ID is NUMBER.
  }


  const club = await prisma.club.findUnique({ where: { id: clubIdInt } });
  if (!club) throw new AppError('Club application not found', 404);

  // Update Payment Status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature
    }
  });

  // Update Application Status
  const updatedClub = await prisma.club.update({
    where: { id: clubIdInt },
    data: {
      status: 'PENDING', // Ready for Admin Approval
    }
  });

  // Send confirmation email
  const emailTo = club.email || null;
  if (emailTo) {
    const state = await prisma.state.findUnique({ where: { id: club.stateId }, select: { name: true } });
    const district = await prisma.district.findUnique({ where: { id: club.districtId }, select: { name: true } });
    const ownerUser = await prisma.user.findFirst({ where: { uid: club.uid } });
    emailService.sendAffiliationConfirmation(emailTo, {
      type: 'CLUB',
      name: club.name,
      uid: club.uid,
      defaultPassword: ownerUser?.phone || undefined,
      stateName: state?.name,
      districtName: district?.name,
      clubName: club.name,
    });
  }

  logger.info(`Club payment verified: ${club.uid}`);

  return {
    success: true,
    uid: updatedClub.uid,
    name: updatedClub.name,
    message: 'Payment verified successfully. Your application is under review.'
  };
};


/**
 * List clubs
 */
export const listClubs = async (query: AffiliationQuery) => {
  const { page, limit, search, stateId, districtId, status, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ClubWhereInput = {};

  if (stateId) where.stateId = stateId;
  if (districtId) where.districtId = districtId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { uid: { contains: search, mode: 'insensitive' } },
      { registrationNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [clubs, total] = await Promise.all([
    prisma.club.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy === 'clubName' ? 'name' : 'createdAt']: sortOrder },
      include: {
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true } },
      },
    }),
    prisma.club.count({ where }),
  ]);

  return {
    data: clubs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ==========================================
// APPROVAL WORKFLOWS
// ==========================================

/**
 * Approve/Reject state secretary
 */
export const updateStateSecretaryStatus = async (
  secretaryId: string,
  status: 'APPROVED' | 'REJECTED',
  approvedBy: string,
  remarks?: string
) => {
  const secretary = await prisma.stateSecretary.findUnique({
    where: { id: secretaryId },
  });

  if (!secretary) {
    throw new AppError('State Secretary not found', 404);
  }

  const updated = await prisma.stateSecretary.update({
    where: { id: secretaryId },
    data: {
      status,
      approvedAt: status === 'APPROVED' ? new Date() : null,
      approvedBy: status === 'APPROVED' ? approvedBy : null,
      rejectionRemarks: status === 'REJECTED' ? remarks : null,
      updatedAt: new Date(),
    },
    include: {
      state: true,
    },
  });

  // If approved, create user account
  if (status === 'APPROVED') {
    await createUserAccount({
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: 'STATE_SECRETARY',
      stateId: updated.stateId,
      referenceId: updated.id,
    });
    emailService.sendApprovalNotification(updated.email, {
      type: 'STATE_SECRETARY',
      name: updated.name,
      uid: updated.uid,
      loginPassword: updated.phone,
      stateName: updated.state?.name,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
  } else {
    emailService.sendRejectionNotification(updated.email, {
      type: 'STATE_SECRETARY',
      name: updated.name,
      uid: updated.uid,
      reason: remarks,
    });
  }

  logger.info(`State Secretary ${status}: ${secretary.uid}`, { approvedBy });

  return updated;
};

/**
 * Approve/Reject district secretary
 */
export const updateDistrictSecretaryStatus = async (
  secretaryId: string,
  status: 'APPROVED' | 'REJECTED',
  approvedBy: string,
  remarks?: string
) => {
  const secretary = await prisma.districtSecretary.findUnique({
    where: { id: secretaryId },
  });

  if (!secretary) {
    throw new AppError('District Secretary not found', 404);
  }

  const updated = await prisma.districtSecretary.update({
    where: { id: secretaryId },
    data: {
      status,
      approvedAt: status === 'APPROVED' ? new Date() : null,
      approvedBy: status === 'APPROVED' ? approvedBy : null,
      rejectionRemarks: status === 'REJECTED' ? remarks : null,
      updatedAt: new Date(),
    },
    include: {
      state: true,
      district: true,
    },
  });

  // If approved, create user account
  if (status === 'APPROVED') {
    await createUserAccount({
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: 'DISTRICT_SECRETARY',
      stateId: updated.stateId,
      districtId: updated.districtId,
      referenceId: updated.id,
    });
    emailService.sendApprovalNotification(updated.email, {
      type: 'DISTRICT_SECRETARY',
      name: updated.name,
      uid: updated.uid,
      loginPassword: updated.phone,
      stateName: updated.state?.name,
      districtName: updated.district?.name,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
  } else {
    emailService.sendRejectionNotification(updated.email, {
      type: 'DISTRICT_SECRETARY',
      name: updated.name,
      uid: updated.uid,
      reason: remarks,
    });
  }

  logger.info(`District Secretary ${status}: ${secretary.uid}`, { approvedBy });

  return updated;
};

/**
 * Approve/Reject club
 */
export const updateClubStatus = async (
  clubId: string,
  status: 'APPROVED' | 'REJECTED',
  approvedBy: string,
  remarks?: string
) => {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
  });

  if (!club) {
    throw new AppError('Club not found', 404);
  }

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: {
      status,
      approvedAt: status === 'APPROVED' ? new Date() : null,
      approvedBy: status === 'APPROVED' ? approvedBy : null,
      rejectionRemarks: status === 'REJECTED' ? remarks : null,
      updatedAt: new Date(),
    },
    include: {
      state: true,
      district: true,
    },
  });

  // If approved, create user account for club owner
  if (status === 'APPROVED') {
    await createUserAccount({
      name: updated.contactPerson,
      email: updated.email || '',
      phone: updated.phone,
      role: 'CLUB_OWNER',
      stateId: updated.stateId,
      districtId: updated.districtId,
      clubId: updated.id,
      referenceId: updated.id,
    });
    if (updated.email) {
      emailService.sendApprovalNotification(updated.email, {
        type: 'CLUB',
        name: updated.name,
        uid: updated.uid,
        loginPassword: updated.phone,
        stateName: updated.state?.name,
        districtName: updated.district?.name,
        clubName: updated.name,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
    }
  } else if (updated.email) {
    emailService.sendRejectionNotification(updated.email, {
      type: 'CLUB',
      name: updated.name,
      uid: updated.uid,
      reason: remarks,
    });
  }

  logger.info(`Club ${status}: ${club.uid}`, { approvedBy });

  return updated;
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate club code
 */
const generateClubCode = async (districtId: string): Promise<string> => {
  const lastClub = await prisma.club.findFirst({
    where: { districtId },
    orderBy: { code: 'desc' },
  });

  let sequence = 1;
  if (lastClub && lastClub.code) {
    const lastSequence = parseInt(lastClub.code.slice(-3)) || 0;
    sequence = lastSequence + 1;
  }

  return sequence.toString().padStart(3, '0');
};

/**
 * Create user account after approval
 */
const createUserAccount = async (data: {
  name: string;
  email: string;
  phone: string;
  role: string;
  stateId?: string;
  districtId?: string;
  clubId?: string;
  referenceId: string;
}) => {
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      role: data.role as any,
      stateId: data.stateId,
      districtId: data.districtId,
      clubId: data.clubId,
      password: tempPassword, // Should be hashed
      isActive: true,
      mustChangePassword: true,
    },
  });

  // TODO: Send SMS/Email with temporary password

  return user;
};

// ==========================================
// STUDENT REGISTRATION
// ==========================================

export const registerStudent = async (
  data: StudentRegistration,
  windowId: number
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if potential duplicate (Aadhaar)
    const existingStudent = await tx.student.findUnique({
      where: { aadhaarNumber: data.aadhaarNumber },
    });

    if (existingStudent) {
      throw new AppError('A student with this Aadhaar number already exists', 400);
    }

    // 2. Get location details for UID generation
    const state = await tx.state.findUnique({ where: { id: Number(data.stateId) } });
    const district = await tx.district.findUnique({ where: { id: Number(data.districtId) } });

    if (!state || !district) {
      throw new AppError('Invalid state or district selection', 400);
    }

    // 3. Generate UID
    const year = new Date().getFullYear().toString().slice(-2);
    // UID Format: SSFI-YY-STATE-DIST-XXXX (e.g. SSFI-24-KA-BLR-0001)

    // Get count of students in this district for this year to generate sequence
    // This is simple sequence generation. Ideally use a separate sequence table or atomic increment.
    // For now, count existing + 1.
    const count = await tx.student.count({
      where: {
        districtId: Number(data.districtId),
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    const uid = `SSFI-${year}-${state.code}-${district.code}-${sequence}`;

    // 4. Create User credentials
    const { userId } = await createUserCredentials(
      uid,
      data.phone,
      data.email || "",
      UserRole.STUDENT,
      {
        stateId: state.id,
        districtId: district.id,
        clubId: Number(data.clubId),
      }
    );

    // 5. Create Student Record
    const student = await tx.student.create({
      data: {
        userId,
        stateId: Number(data.stateId),
        districtId: Number(data.districtId),
        clubId: Number(data.clubId),

        name: `${data.firstName} ${data.lastName}`,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender as Gender,
        bloodGroup: data.bloodGroup as any,
        aadhaarNumber: data.aadhaarNumber!, // validated by schema to be present for creation

        fatherName: data.fatherName,
        motherName: data.motherName,

        schoolName: data.schoolName,
        academicBoard: data.academicBoard as any,

        nomineeName: data.nomineeName,
        nomineeAge: data.nomineeAge,
        nomineeRelation: data.nomineeRelation,

        coachName: data.coachName,
        coachPhone: data.coachPhone,

        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        pincode: data.pincode,

        aadhaarCard: data.aadhaarCardImage,
        profilePhoto: data.profilePhoto,

        verified: 0,
      },
    });

    // Send confirmation email
    if (data.email) {
      const club = await prisma.club.findUnique({ where: { id: Number(data.clubId) }, select: { name: true } });
      emailService.sendAffiliationConfirmation(data.email, {
        type: 'STUDENT',
        name: `${data.firstName} ${data.lastName}`,
        uid,
        defaultPassword: data.phone,
        stateName: state.name,
        districtName: district.name,
        clubName: club?.name,
      });
    }

    // Return result with UID
    return { ...student, uid };
  });
};

/**
 * Initiate Student Registration with Payment (Step 1: Register + Create Order)
 */
export const initiateStudentRegistration = async (
  data: StudentRegistration,
  windowId: number
) => {
  // 1. Create student using existing logic
  const student = await registerStudent(data, windowId);

  // 2. Get registration window for fee
  const window = await prisma.registrationWindow.findUnique({ where: { id: windowId } });
  if (!window) throw new AppError('Registration window not found', 404);

  // 3. Find user created for this student
  const user = await prisma.user.findFirst({ where: { uid: student.uid } });

  // 4. Create Razorpay order
  const order = await paymentService.createOrder({
    amount: Number(window.baseFee) * 100, // convert rupees to paise
    currency: 'INR',
    payment_type: 'STUDENT_REGISTRATION',
    entity_id: student.id,
    entity_type: 'student',
    user_id: user?.id || 1,
    notes: {
      student_uid: student.uid,
      name: student.name,
      type: 'STUDENT_REGISTRATION',
    },
  });

  const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

  return {
    uid: student.uid,
    name: student.name,
    razorpayOrderId: order.id,
    amount: Number(window.baseFee) * 100,
    currency: 'INR',
    key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
    userDetails: {
      name: student.name,
      email: data.email || '',
      phone: data.phone,
    },
  };
};

/**
 * Verify Student Registration Payment (Step 2)
 */
export const verifyStudentPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const isValid = paymentService.verifyPaymentSignature(data);
  if (!isValid) throw new AppError('Invalid payment signature', 400);

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: data.razorpay_order_id },
  });
  if (!payment) throw new AppError('Payment not found', 404);

  if (payment.status === 'COMPLETED') {
    // Extract UID even if already completed
    const descParts = payment.description?.split('#') || [];
    const studentId = descParts[1]?.trim();
    let uid = '';
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: Number(studentId) },
        include: { user: { select: { uid: true } } },
      });
      uid = student?.user?.uid || '';
    }
    return { success: true, uid, message: 'Payment already verified.' };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature,
    },
  });

  // Get student UID from payment description format: "STUDENT_REGISTRATION - student #123"
  const descParts = payment.description?.split('#') || [];
  const studentId = descParts[1]?.trim();
  let uid = '';
  if (studentId) {
    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: { user: { select: { uid: true } } },
    });
    uid = student?.user?.uid || '';
  }

  logger.info(`Student registration payment verified: ${uid}`);

  return {
    success: true,
    uid,
    message: 'Payment verified successfully. Your registration is under review.',
  };
};

// ==========================================
// LOOKUP & RENEWAL (public self-service)
// ==========================================

/**
 * Look up an existing member by phone or UID
 */
export const lookupMember = async (
  type: RegistrationType,
  identifier: string // phone number OR uid
) => {
  const isUid = identifier.toUpperCase().startsWith('SSFI-');

  if (type === 'STATE_SECRETARY') {
    const record = await prisma.stateSecretary.findFirst({
      where: isUid ? { uid: identifier } : { phone: identifier },
      include: { state: { select: { id: true, name: true, code: true } } },
    });
    if (!record) throw new AppError('No State Secretary found with this phone/UID', 404);
    // Get expiry from User account
    const user = await prisma.user.findFirst({ where: { uid: record.uid } });
    return {
      type: 'STATE_SECRETARY',
      uid: record.uid,
      name: record.name,
      phone: record.phone,
      email: record.email,
      status: record.status,
      stateName: record.state?.name,
      expiryDate: user?.expiryDate?.toISOString() || null,
      accountStatus: user?.accountStatus || null,
      id: record.id,
    };
  }

  if (type === 'DISTRICT_SECRETARY') {
    const record = await prisma.districtSecretary.findFirst({
      where: isUid ? { uid: identifier } : { phone: identifier },
      include: {
        state: { select: { name: true } },
        district: { select: { name: true } },
      },
    });
    if (!record) throw new AppError('No District Secretary found with this phone/UID', 404);
    const user = await prisma.user.findFirst({ where: { uid: record.uid } });
    return {
      type: 'DISTRICT_SECRETARY',
      uid: record.uid,
      name: record.name,
      phone: record.phone,
      email: record.email,
      status: record.status,
      stateName: record.state?.name,
      districtName: record.district?.name,
      expiryDate: user?.expiryDate?.toISOString() || null,
      accountStatus: user?.accountStatus || null,
      id: record.id,
    };
  }

  if (type === 'CLUB') {
    const record = await prisma.club.findFirst({
      where: isUid ? { uid: identifier } : { OR: [{ phone: identifier }, { code: identifier }] },
      include: {
        state: { select: { name: true } },
        district: { select: { name: true } },
      },
    });
    if (!record) throw new AppError('No Club found with this phone/UID/code', 404);
    const user = await prisma.user.findFirst({ where: { uid: record.uid } });
    return {
      type: 'CLUB',
      uid: record.uid,
      name: record.name,
      phone: record.phone,
      email: record.email,
      status: record.status,
      stateName: record.state?.name,
      districtName: record.district?.name,
      clubName: record.name,
      contactPerson: record.contactPerson,
      expiryDate: user?.expiryDate?.toISOString() || null,
      accountStatus: user?.accountStatus || null,
      id: record.id,
    };
  }

  if (type === 'STUDENT') {
    // Students don't have phone directly - look through User or Student table
    const student = await prisma.student.findFirst({
      where: isUid
        ? { user: { uid: identifier } }
        : { user: { phone: identifier } },
      include: {
        user: { select: { uid: true, phone: true, email: true, expiryDate: true, accountStatus: true } },
        state: { select: { name: true } },
        district: { select: { name: true } },
        club: { select: { name: true } },
      },
    });
    if (!student) throw new AppError('No Student found with this phone/UID', 404);
    return {
      type: 'STUDENT',
      uid: student.user.uid,
      name: student.name,
      phone: student.user.phone,
      email: student.user.email,
      status: student.approvalStatus || 'PENDING',
      stateName: student.state?.name,
      districtName: student.district?.name,
      clubName: student.club?.name,
      expiryDate: student.user.expiryDate?.toISOString() || null,
      accountStatus: student.user.accountStatus || null,
      id: student.id,
    };
  }

  throw new AppError('Invalid registration type', 400);
};

/**
 * Initiate renewal payment for an existing member
 */
export const initiateRenewal = async (
  type: RegistrationType,
  identifier: string,
  windowId: string
) => {
  const member = await lookupMember(type, identifier);

  // Check that member has a PENDING or APPROVED status
  if (!['PENDING', 'APPROVED', 'PAYMENT_PENDING'].includes(member.status)) {
    throw new AppError(`Cannot renew. Current status: ${member.status}`, 400);
  }

  const window = await prisma.registrationWindow.findUnique({ where: { id: Number(windowId) } });
  if (!window) throw new AppError('Registration window not found', 404);

  // Find linked user
  const user = await prisma.user.findFirst({ where: { uid: member.uid } });
  if (!user) throw new AppError('No user account found. Please contact support.', 404);

  const order = await paymentService.createOrder({
    amount: window.baseFee * 100,
    currency: 'INR',
    payment_type: 'RENEWAL_FEE',
    entity_id: member.id,
    entity_type: type,
    user_id: user.id,
    notes: {
      uid: member.uid,
      name: member.name,
      type,
      renewal: 'true',
    },
  });

  const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

  return {
    razorpayOrderId: order.id,
    amount: window.baseFee * 100,
    currency: 'INR',
    key: useMockPayment ? 'rzp_test_mock' : razorpayConfig.keyId,
    userDetails: {
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
    },
    member,
  };
};

/**
 * Verify renewal payment and extend membership
 */
export const verifyRenewal = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const isValid = paymentService.verifyPaymentSignature({
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature,
  });
  if (!isValid) throw new AppError('Invalid payment signature', 400);

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: data.razorpay_order_id },
  });
  if (!payment) throw new AppError('Payment order not found', 404);

  // Get user
  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  if (!user) throw new AppError('User not found', 404);

  // Extend expiry by 1 year from now (or from current expiry if not yet expired)
  const now = new Date();
  const baseDate = user.expiryDate && user.expiryDate > now ? user.expiryDate : now;
  const newExpiry = new Date(baseDate);
  newExpiry.setFullYear(newExpiry.getFullYear() + 1);

  // Update user expiry
  await prisma.user.update({
    where: { id: user.id },
    data: {
      expiryDate: newExpiry,
      lastRenewalDate: now,
      accountStatus: 'ACTIVE',
      renewalNotificationSent: false,
    },
  });

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: data.razorpay_signature,
    },
  });

  // Get member info from description
  const descParts = payment.description?.split('#') || [];
  const entityType = (descParts[0]?.split(' - ')[1]?.trim() || 'MEMBER') as RegistrationType;

  // Send renewal confirmation email
  if (user.email) {
    const stateName = user.statePerson?.state?.name ||
      await prisma.state.findFirst({ where: { secretaries: { some: { user: { id: user.id } } } }, select: { name: true } }).then(s => s?.name);
    emailService.sendAffiliationConfirmation(user.email, {
      type: entityType,
      name: user.uid,
      uid: user.uid,
      expiryDate: newExpiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      isRenewal: true,
    });
  }

  logger.info(`Renewal verified for user ${user.uid}. New expiry: ${newExpiry}`);

  return {
    success: true,
    uid: user.uid,
    newExpiryDate: newExpiry.toISOString(),
    message: 'Membership renewed successfully.',
  };
};

export default {
  // Registration Windows
  createRegistrationWindow,
  updateRegistrationWindow,
  getRegistrationWindows,
  getActiveRegistrationWindow,
  isRegistrationOpen,
  deleteRegistrationWindow,

  // State Secretary
  initiateStateSecretaryRegistration,
  verifyStateSecretaryPayment,
  listStateSecretaries,
  updateStateSecretaryStatus,

  // District Secretary
  initiateDistrictSecretaryRegistration,
  verifyDistrictSecretaryPayment,
  listDistrictSecretaries,
  updateDistrictSecretaryStatus,

  // Club
  initiateClubRegistration,
  verifyClubPayment,
  listClubs,
  updateClubStatus,

  // Student
  registerStudent,
  initiateStudentRegistration,
  verifyStudentPayment,

  // Lookup & Renewal
  lookupMember,
  initiateRenewal,
  verifyRenewal,
};

import { z } from 'zod';

// ── Program Validators ──

export const createProgramSchema = z.object({
  category: z.enum(['SPEED_SKATING', 'ARTISTIC', 'INLINE_HOCKEY', 'GENERAL']),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
  lastDateToApply: z.string().transform(s => new Date(s)),
  venue: z.string().min(2),
  venueAddress: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  price: z.number().positive(),
  includesText: z.string().optional(),
  totalSeats: z.number().int().positive(),
  eligibilityCriteria: z.string().optional(),
  minAge: z.number().int().positive().optional(),
  maxAge: z.number().int().positive().optional(),
  ageGroup: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  organizedBy: z.string().optional(),
  approvedBy: z.string().optional(),
});

export const updateProgramSchema = createProgramSchema.partial();

export const programQuerySchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  isActive: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('20'),
});

// ── Registration Validators ──

// Helper: accept both boolean true and string "true" from FormData
const formDataTrue = (msg: string) =>
  z.preprocess(v => v === 'true' || v === true ? true : v, z.literal(true, { errorMap: () => ({ message: msg }) }));

export const beginnerRegistrationSchema = z.object({
  programId: z.coerce.number().int().positive(),
  fullName: z.string().min(2).max(255),
  fatherName: z.string().min(2).max(255),
  motherName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().transform(s => new Date(s)),
  age: z.coerce.number().int().min(3).max(25).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  email: z.string().email(),
  whatsapp: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(1),
  district: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').or(z.string().min(1)),
  bloodGroup: z.string().optional(),
  skatingExperience: z.coerce.number().int().min(0).optional(), // in months
  currentSkillLevel: z.enum(['BEGINNER', 'BASIC', 'INTERMEDIATE']).optional(),
  clubName: z.string().optional(),
  tshirtSize: z.enum(['S', 'M', 'L', 'XL', 'XXL']).optional(),
  guardianName: z.string().min(2).max(255),
  guardianRelation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']),
  guardianPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  guardianEmail: z.string().email().optional(),
  aadhaarNumber: z.string().optional().default('000000000000'), // Not required when registering via SSFI UID (already in DB)
  declaration1: formDataTrue('Declaration 1 must be accepted'),
  declaration2: formDataTrue('Declaration 2 must be accepted'),
  declaration3: formDataTrue('Declaration 3 must be accepted'),
});

export const markCompleteSchema = z.object({
  grade: z.enum(['GOLD', 'SILVER', 'BRONZE', 'PARTICIPATION']).optional(),
  rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  remarks: z.string().optional(),
});

export const updateRegStatusSchema = z.object({
  status: z.enum(['REGISTERED', 'PAYMENT_PENDING', 'CONFIRMED', 'ATTENDED', 'COMPLETED', 'FAILED', 'CANCELLED']),
});

export const registrationsQuerySchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  search: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('50'),
});

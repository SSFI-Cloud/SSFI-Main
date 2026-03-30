import { z } from 'zod';

// ── Program Validators ──

export const createProgramSchema = z.object({
  level: z.number().int().min(1).max(3),
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
  minExperience: z.number().int().min(0).optional(),
  prerequisiteLevel: z.number().int().min(1).max(3).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  organizedBy: z.string().optional(),
  approvedBy: z.string().optional(),
});

export const updateProgramSchema = createProgramSchema.partial();

export const programQuerySchema = z.object({
  level: z.string().optional(),
  status: z.string().optional(),
  isActive: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('20'),
});

// ── Registration Validators ──

// Helper: accept both boolean true and string "true" from FormData
const formDataTrue = (msg: string) =>
  z.preprocess(v => v === 'true' || v === true ? true : v, z.literal(true, { errorMap: () => ({ message: msg }) }));

export const coachRegistrationSchema = z.object({
  programId: z.coerce.number().int().positive(),
  fullName: z.string().min(2).max(255),
  fatherName: z.string().min(2).max(255),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().transform(s => new Date(s)),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  bloodGroup: z.string().optional(),
  skatingExperience: z.coerce.number().int().min(0).optional(),
  tshirtSize: z.enum(['S', 'M', 'L', 'XL', 'XXL']).optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  declaration1: formDataTrue('Declaration 1 must be accepted'),
  declaration2: formDataTrue('Declaration 2 must be accepted'),
  declaration3: formDataTrue('Declaration 3 must be accepted'),
});

export const markCompleteSchema = z.object({
  rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  remarks: z.string().optional(),
});

export const updateRegStatusSchema = z.object({
  status: z.enum(['REGISTERED', 'PAYMENT_PENDING', 'CONFIRMED', 'ATTENDED', 'COMPLETED', 'FAILED', 'CANCELLED']),
});

export const certifiedCoachesQuerySchema = z.object({
  state: z.string().optional(),
  level: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('12'),
  search: z.string().optional(),
});

export const registrationsQuerySchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  search: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('50'),
});

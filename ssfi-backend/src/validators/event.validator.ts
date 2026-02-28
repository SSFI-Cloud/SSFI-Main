import { z } from 'zod';

// Event status enum
export const EventStatusEnum = z.enum([
  'DRAFT',
  'PUBLISHED',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
]);

// Event level enum
export const EventLevelEnum = z.enum([
  'NATIONAL',
  'STATE',
  'DISTRICT',
  'CLUB',
  'INTER_SCHOOL',
  'OPEN',
]);

// Event type enum
export const EventTypeEnum = z.enum([
  'CHAMPIONSHIP',
  'TOURNAMENT',
  'COMPETITION',
  'TRAINING_CAMP',
  'WORKSHOP',
  'EXHIBITION',
]);

// Skating discipline enum
export const DisciplineEnum = z.enum([
  'SPEED_SKATING',
  'ARTISTIC_SKATING',
  'ROLLER_HOCKEY',
  'INLINE_FREESTYLE',
  'AGGRESSIVE_SKATING',
  'DOWNHILL',
]);

// Age categories for events
export const AgeCategoryEnum = z.enum([
  'U-6',
  'U-8',
  'U-10',
  'U-12',
  'U-14',
  'U-16',
  'U-18',
  'U-21',
  'SENIOR',
  'MASTERS',
  'OPEN',
]);

// Create Event Schema
export const createEventSchema = z.object({
  // Basic Info
  name: z.string()
    .min(5, 'Event name must be at least 5 characters')
    .max(200, 'Event name must be less than 200 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  shortDescription: z.string()
    .max(500, 'Short description must be less than 500 characters')
    .optional(),
  
  // Event Type & Level
  eventType: EventTypeEnum,
  eventLevel: EventLevelEnum,
  disciplines: z.array(DisciplineEnum).min(1, 'Select at least one discipline'),
  
  // Dates
  eventDate: z.string().refine((date) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }, 'Event date must be in the future'),
  eventEndDate: z.string().optional(),
  registrationStartDate: z.string(),
  registrationEndDate: z.string(),
  
  // Location
  venue: z.string()
    .min(5, 'Venue must be at least 5 characters')
    .max(500, 'Venue must be less than 500 characters'),
  venueAddress: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  city: z.string()
    .min(2, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  stateId: z.string().optional(),
  districtId: z.string().optional(),
  
  // Eligibility
  ageCategories: z.array(AgeCategoryEnum).min(1, 'Select at least one age category'),
  eligibleStates: z.array(z.string()).optional(), // Empty = all states eligible
  eligibleDistricts: z.array(z.string()).optional(),
  minParticipants: z.number().min(1).optional(),
  maxParticipants: z.number().min(1).optional(),
  
  // Fees
  entryFee: z.number().min(0, 'Entry fee cannot be negative'),
  lateFee: z.number().min(0).optional(),
  lateFeeStartDate: z.string().optional(),
  
  // Certificate Configuration
  certificateConfig: z.object({
    championshipTitle: z.string().optional(),
    associationName: z.string().optional(),
    registrationNumber: z.string().optional(),
    secretarySignature: z.string().optional(),
    presidentSignature: z.string().optional(),
  }).optional(),
  
  // Media
  bannerImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  
  // Settings
  requiresApproval: z.boolean().default(false),
  allowMultipleCategories: z.boolean().default(true),
  publishResults: z.boolean().default(false),
});

// Update Event Schema
export const updateEventSchema = createEventSchema.partial();

// Event Registration Schema
export const eventRegistrationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  disciplines: z.array(DisciplineEnum).min(1, 'Select at least one discipline'),
  ageCategory: AgeCategoryEnum,
  remarks: z.string().max(500).optional(),
});

// Bulk Registration Schema (for club owners)
export const bulkRegistrationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  registrations: z.array(z.object({
    studentId: z.string(),
    categories: z.array(z.string()),
    disciplines: z.array(DisciplineEnum),
    ageCategory: AgeCategoryEnum,
  })).min(1, 'At least one registration is required'),
});

// Event Query Schema
export const eventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  search: z.string().optional(),
  status: EventStatusEnum.optional(),
  eventLevel: EventLevelEnum.optional(),
  eventType: EventTypeEnum.optional(),
  discipline: DisciplineEnum.optional(),
  stateId: z.string().optional(),
  districtId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  upcoming: z.coerce.boolean().optional(),
  sortBy: z.enum(['eventDate', 'createdAt', 'name', 'registrationEndDate']).default('eventDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Event Registration Query Schema
export const registrationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  eventId: z.string().optional(),
  studentId: z.string().optional(),
  clubId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED']).optional(),
  ageCategory: AgeCategoryEnum.optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
});

// Result Entry Schema
export const resultEntrySchema = z.object({
  eventId: z.string(),
  registrationId: z.string(),
  position: z.number().min(1).max(100),
  category: z.string(),
  discipline: DisciplineEnum,
  time: z.string().optional(), // For speed skating
  score: z.number().optional(), // For artistic
  remarks: z.string().optional(),
});

// Types
export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type EventRegistration = z.infer<typeof eventRegistrationSchema>;
export type BulkRegistration = z.infer<typeof bulkRegistrationSchema>;
export type EventQuery = z.infer<typeof eventQuerySchema>;
export type RegistrationQuery = z.infer<typeof registrationQuerySchema>;
export type ResultEntry = z.infer<typeof resultEntrySchema>;
export type EventStatus = z.infer<typeof EventStatusEnum>;
export type EventLevel = z.infer<typeof EventLevelEnum>;
export type EventType = z.infer<typeof EventTypeEnum>;
export type Discipline = z.infer<typeof DisciplineEnum>;
export type AgeCategory = z.infer<typeof AgeCategoryEnum>;

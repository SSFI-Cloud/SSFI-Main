import { z } from 'zod';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

// Skate Category Types
export const SkateCategoryEnum = z.enum([
    'BEGINNER',
    'RECREATIONAL',
    'QUAD',
    'PRO_INLINE',
]);

// Available Races
export const RaceTypeEnum = z.enum([
    'RACE_200M',
    'RACE_400M',
    'RACE_1000M',
    'ROAD_100M',
    'ROAD_2000M',
    'POINT_TO_POINT',
]);

// Suit Sizes
export const SuitSizeEnum = z.enum([
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
    'KIDS_4', 'KIDS_6', 'KIDS_8', 'KIDS_10', 'KIDS_12',
]);

// Age Groups for race selection rules
export const AgeGroupEnum = z.enum([
    'U-4', 'U-6', 'U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'ABOVE_16',
]);

// Registration Status
export const RegistrationStatusEnum = z.enum([
    'PENDING',
    'PAYMENT_PENDING',
    'CONFIRMED',
    'CANCELLED',
    'REFUNDED',
]);

// Payment Status
export const PaymentStatusEnum = z.enum([
    'PENDING',
    'PROCESSING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'BYPASSED', // For admin manual entries
]);

// ==========================================
// RACE SELECTION RULES
// ==========================================

export const RACE_RULES = {
    BEGINNER: {
        races: ['RACE_200M', 'RACE_400M'],
        minRaces: 2,
        maxRaces: 2,
        mandatory: ['RACE_200M', 'RACE_400M'],
        description: '200M & 400M are compulsory',
    },
    RECREATIONAL: {
        races: ['RACE_200M', 'RACE_400M', 'RACE_1000M'],
        minRaces: 2,
        maxRaces: 2,
        mandatory: [],
        description: 'Choose any 2 races (200M, 400M, 1000M)',
    },
    QUAD_JUNIOR: { // U-4, U-6, U-8
        races: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M'],
        minRaces: 2,
        maxRaces: 2,
        mandatory: [],
        description: 'Choose any 2 races (200M, 400M, 1000M, Road 100M)',
    },
    QUAD_SENIOR: { // U-10, U-12, U-14, U-16, Above 16
        races: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M', 'ROAD_2000M', 'POINT_TO_POINT'],
        minRaces: 3,
        maxRaces: 3,
        mandatory: [],
        description: 'Choose any 3 races (200M, 400M, 1000M, Road 100M, Road 2000M, Point to Point)',
    },
    PRO_INLINE_JUNIOR: { // U-4, U-6, U-8
        races: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M'],
        minRaces: 2,
        maxRaces: 2,
        mandatory: [],
        description: 'Choose any 2 races (200M, 400M, 1000M, Road 100M)',
    },
    PRO_INLINE_SENIOR: { // U-10, U-12, U-14, U-16, Above 16
        races: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M', 'ROAD_2000M', 'POINT_TO_POINT'],
        minRaces: 3,
        maxRaces: 3,
        mandatory: [],
        description: 'Choose any 3 races (200M, 400M, 1000M, Road 100M, Road 2000M, Point to Point)',
    },
};

// Helper to get race rule key
export const getRaceRuleKey = (category: string, ageGroup: string): string => {
    const juniorAgeGroups = ['U-4', 'U-6', 'U-8'];
    const isJunior = juniorAgeGroups.includes(ageGroup);

    if (category === 'BEGINNER') return 'BEGINNER';
    if (category === 'RECREATIONAL') return 'RECREATIONAL';
    if (category === 'QUAD') return isJunior ? 'QUAD_JUNIOR' : 'QUAD_SENIOR';
    if (category === 'PRO_INLINE') return isJunior ? 'PRO_INLINE_JUNIOR' : 'PRO_INLINE_SENIOR';

    return 'RECREATIONAL'; // Default fallback
};

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

// Student lookup by UID
export const studentLookupSchema = z.object({
    uid: z.string().min(1, 'Student UID is required'),
    eventId: z.coerce.number().min(1, 'Event ID is required'), // Coerced to number
});

// Event registration schema
export const eventRegistrationSchema = z.object({
    eventId: z.coerce.number().min(1, 'Event ID is required'),
    studentId: z.coerce.number().min(1, 'Student ID is required'),
    studentUid: z.string().min(1, 'Student UID is required'),

    // Selections
    suitSize: SuitSizeEnum,
    skateCategory: SkateCategoryEnum,
    selectedRaces: z.array(RaceTypeEnum).min(2, 'Select at least 2 races'),

    // Optional remarks
    remarks: z.string().max(500).optional(),
});

// Validate race selection based on rules
export const validateRaceSelection = (
    skateCategory: string,
    ageGroup: string,
    selectedRaces: string[]
): { valid: boolean; error?: string } => {
    const ruleKey = getRaceRuleKey(skateCategory, ageGroup);
    const rule = RACE_RULES[ruleKey as keyof typeof RACE_RULES];

    if (!rule) {
        return { valid: false, error: 'Invalid category combination' };
    }

    // Check minimum races
    if (selectedRaces.length < rule.minRaces) {
        return { valid: false, error: `You must select at least ${rule.minRaces} races` };
    }

    // Check maximum races
    if (selectedRaces.length > rule.maxRaces) {
        return { valid: false, error: `You can select at most ${rule.maxRaces} races` };
    }

    // Check mandatory races
    for (const mandatoryRace of rule.mandatory) {
        if (!selectedRaces.includes(mandatoryRace)) {
            return { valid: false, error: `${mandatoryRace.replace('_', ' ')} is mandatory for ${skateCategory}` };
        }
    }

    // Check if selected races are allowed
    for (const race of selectedRaces) {
        if (!rule.races.includes(race)) {
            return { valid: false, error: `${race.replace('_', ' ')} is not available for ${skateCategory} in ${ageGroup}` };
        }
    }

    return { valid: true };
};

// Admin manual registration (bypass payment)
export const adminManualRegistrationSchema = z.object({
    eventId: z.coerce.number().min(1, 'Event ID is required'),
    studentId: z.coerce.number().min(1, 'Student ID is required'),
    studentUid: z.string().min(1, 'Student UID is required'), // Made mandatory to match Service type
    suitSize: SuitSizeEnum,
    skateCategory: SkateCategoryEnum,
    selectedRaces: z.array(RaceTypeEnum).min(2),
    remarks: z.string().optional(),
    bypassPayment: z.literal(true),
});

// Registration query
export const registrationQuerySchema = z.object({
    eventId: z.coerce.number().optional(),
    studentId: z.coerce.number().optional(),
    clubId: z.coerce.number().optional(),
    districtId: z.coerce.number().optional(),
    stateId: z.coerce.number().optional(),
    status: RegistrationStatusEnum.optional(),
    paymentStatus: PaymentStatusEnum.optional(),
    skateCategory: SkateCategoryEnum.optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type SkateCategory = z.infer<typeof SkateCategoryEnum>;
export type RaceType = z.infer<typeof RaceTypeEnum>;
export type SuitSize = z.infer<typeof SuitSizeEnum>;
export type AgeGroup = z.infer<typeof AgeGroupEnum>;
export type RegistrationStatus = z.infer<typeof RegistrationStatusEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export type StudentLookup = z.infer<typeof studentLookupSchema>;
export type EventRegistration = z.infer<typeof eventRegistrationSchema>;
export type AdminManualRegistration = z.infer<typeof adminManualRegistrationSchema>;
export type RegistrationQuery = z.infer<typeof registrationQuerySchema>;

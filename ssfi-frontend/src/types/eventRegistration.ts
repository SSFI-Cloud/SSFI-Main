// Event Registration Types

// ==========================================
// ENUMS
// ==========================================

export type SkateCategory = 'BEGINNER' | 'RECREATIONAL' | 'QUAD' | 'PRO_INLINE';
export type RaceType = 'RACE_200M' | 'RACE_400M' | 'RACE_1000M' | 'ROAD_100M' | 'ROAD_2000M' | 'POINT_TO_POINT';
export type SuitSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'KIDS_4' | 'KIDS_6' | 'KIDS_8' | 'KIDS_10' | 'KIDS_12';
export type RegistrationStatus = 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'BYPASSED';

// ==========================================
// STUDENT LOOKUP RESPONSE
// ==========================================

export interface StudentLookupResponse {
    student: {
        id: number; // Changed to number
        uid: string;
        firstName: string;
        lastName: string;
        fullName: string;
        dateOfBirth: string | Date; // Can be string from JSON
        gender: string;
        age: number;
        ageCategory: string;
        profilePhoto?: string;
        club?: { id: number; name: string; code: string };
        district?: { id: number; name: string };
        state?: { id: number; name: string };
    };
    event: {
        id: number; // Changed to number
        name: string;
        code: string;
        eventDate: string | Date;
        entryFee: number;
        lateFee?: number;
        isLateFee: boolean;
        totalFee: number;
    };
    eligibility: {
        canRegister: boolean;
        ageCategory: string;
    };
}

// ==========================================
// RACE RULES
// ==========================================

export interface RaceRule {
    ruleKey: string;
    availableRaces: RaceType[];
    minRaces: number;
    maxRaces: number;
    mandatoryRaces: RaceType[];
    description: string;
}

// ==========================================
// REGISTRATION
// ==========================================

export interface EventRegistration {
    id: number; // Changed to number
    confirmationNumber: string;
    eventId: number;
    studentId: number;
    clubId?: number;
    districtId?: number;
    stateId?: number;

    suitSize: SuitSize;
    skateCategory: SkateCategory;
    ageCategory: string;
    selectedRaces: RaceType[];

    entryFee: number;
    lateFee: number;
    totalFee: number;

    status: RegistrationStatus;
    paymentStatus: PaymentStatus;
    paymentId?: string;
    paymentMethod?: string;

    remarks?: string;
    adminAddedBy?: string;

    confirmedAt?: string;
    paidAt?: string;
    cancelledAt?: string;

    createdAt: string;
    updatedAt: string;

    event?: {
        id: number;
        name: string;
        code: string;
        eventDate: string;
        venue: string;
        city?: string;
        status: string;
        bannerImage?: string;
    };
    student?: {
        id: number;
        uid: string;
        firstName: string;
        lastName: string;
        ageCategory: string;
        gender: string;
        profilePhoto?: string;
    };
    club?: { id: number; name: string };
    district?: { id: number; name: string };
    state?: { id: number; name: string };
}

export interface RegistrationFormData {
    eventId: number | string; // Allow string from URL params
    studentId: number | string;
    studentUid: string;
    suitSize: SuitSize;
    skateCategory: SkateCategory;
    selectedRaces: RaceType[];
    remarks?: string;
}

// ==========================================
// CONSTANTS
// ==========================================

export const SKATE_CATEGORIES: { value: SkateCategory; label: string; description: string }[] = [
    { value: 'BEGINNER', label: 'Beginner', description: '200M & 400M compulsory' },
    { value: 'RECREATIONAL', label: 'Recreational', description: 'Choose any 2 races' },
    { value: 'QUAD', label: 'Quad', description: 'Based on age group' },
    { value: 'PRO_INLINE', label: 'Pro Inline', description: 'Based on age group' },
];

export const RACE_OPTIONS: { value: RaceType; label: string; shortLabel: string }[] = [
    { value: 'RACE_200M', label: '200 Meters', shortLabel: '200M' },
    { value: 'RACE_400M', label: '400 Meters', shortLabel: '400M' },
    { value: 'RACE_1000M', label: '1000 Meters', shortLabel: '1000M' },
    { value: 'ROAD_100M', label: 'Road 100 Meters', shortLabel: 'Road 100M' },
    { value: 'ROAD_2000M', label: 'Road 2000 Meters', shortLabel: 'Road 2000M' },
    { value: 'POINT_TO_POINT', label: 'Point to Point', shortLabel: 'P2P' },
];

export const SUIT_SIZES: { value: SuitSize; label: string; category: 'adult' | 'kids' }[] = [
    { value: 'KIDS_4', label: 'Kids 4', category: 'kids' },
    { value: 'KIDS_6', label: 'Kids 6', category: 'kids' },
    { value: 'KIDS_8', label: 'Kids 8', category: 'kids' },
    { value: 'KIDS_10', label: 'Kids 10', category: 'kids' },
    { value: 'KIDS_12', label: 'Kids 12', category: 'kids' },
    { value: 'XS', label: 'XS', category: 'adult' },
    { value: 'S', label: 'S', category: 'adult' },
    { value: 'M', label: 'M', category: 'adult' },
    { value: 'L', label: 'L', category: 'adult' },
    { value: 'XL', label: 'XL', category: 'adult' },
    { value: 'XXL', label: 'XXL', category: 'adult' },
    { value: 'XXXL', label: 'XXXL', category: 'adult' },
];

// ==========================================
// FRONTEND ONLY LOGIC COPIED FOR CONVENIENCE
// ==========================================
// Race Rules Logic (Same as backend validator but for frontend UI feedback)
const JUNIOR_AGE_GROUPS = ['U-4', 'U-6', 'U-8'];

export const getRaceRules = (category: SkateCategory, ageGroup: string): RaceRule => {
    const isJunior = JUNIOR_AGE_GROUPS.includes(ageGroup);

    switch (category) {
        case 'BEGINNER':
            return {
                ruleKey: 'BEGINNER',
                availableRaces: ['RACE_200M', 'RACE_400M'],
                minRaces: 2,
                maxRaces: 2,
                mandatoryRaces: ['RACE_200M', 'RACE_400M'],
                description: '200M & 400M are compulsory for Beginners',
            };
        case 'RECREATIONAL':
            return {
                ruleKey: 'RECREATIONAL',
                availableRaces: ['RACE_200M', 'RACE_400M', 'RACE_1000M'],
                minRaces: 2,
                maxRaces: 2,
                mandatoryRaces: [],
                description: 'Choose any 2 races (200M, 400M, 1000M)',
            };
        case 'QUAD':
            if (isJunior) {
                return {
                    ruleKey: 'QUAD_JUNIOR',
                    availableRaces: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M'],
                    minRaces: 2,
                    maxRaces: 2,
                    mandatoryRaces: [],
                    description: 'Choose any 2 races (200M, 400M, 1000M, Road 100M)',
                };
            }
            return {
                ruleKey: 'QUAD_SENIOR',
                availableRaces: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M', 'ROAD_2000M', 'POINT_TO_POINT'],
                minRaces: 3,
                maxRaces: 3,
                mandatoryRaces: [],
                description: 'Choose any 3 races (200M, 400M, 1000M, Road 100M, Road 2000M, Point to Point)',
            };
        case 'PRO_INLINE':
            if (isJunior) {
                return {
                    ruleKey: 'PRO_INLINE_JUNIOR',
                    availableRaces: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M'],
                    minRaces: 2,
                    maxRaces: 2,
                    mandatoryRaces: [],
                    description: 'Choose any 2 races (200M, 400M, 1000M, Road 100M)',
                };
            }
            return {
                ruleKey: 'PRO_INLINE_SENIOR',
                availableRaces: ['RACE_200M', 'RACE_400M', 'RACE_1000M', 'ROAD_100M', 'ROAD_2000M', 'POINT_TO_POINT'],
                minRaces: 3,
                maxRaces: 3,
                mandatoryRaces: [],
                description: 'Choose any 3 races (200M, 400M, 1000M, Road 100M, Road 2000M, Point to Point)',
            };
        default:
            return {
                ruleKey: 'UNKNOWN',
                availableRaces: [],
                minRaces: 0,
                maxRaces: 0,
                mandatoryRaces: [],
                description: 'Unknown category',
            };
    }
};

export const validateRaceSelection = (
    category: SkateCategory,
    ageGroup: string,
    selectedRaces: RaceType[]
): { valid: boolean; error?: string } => {
    const rules = getRaceRules(category, ageGroup);

    if (selectedRaces.length < rules.minRaces) {
        return { valid: false, error: `Please select at least ${rules.minRaces} race(s)` };
    }

    if (selectedRaces.length > rules.maxRaces) {
        return { valid: false, error: `You can only select up to ${rules.maxRaces} race(s)` };
    }

    for (const mandatory of rules.mandatoryRaces) {
        if (!selectedRaces.includes(mandatory)) {
            const raceLabel = RACE_OPTIONS.find(r => r.value === mandatory)?.label || mandatory;
            return { valid: false, error: `${raceLabel} is mandatory for ${category}` };
        }
    }

    return { valid: true };
};

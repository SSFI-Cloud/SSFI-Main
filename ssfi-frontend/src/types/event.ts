
export type EventLevel = 'NATIONAL' | 'STATE' | 'DISTRICT' | 'CLUB' | 'INTER_SCHOOL' | 'OPEN';

export type EventType = 'CHAMPIONSHIP' | 'TOURNAMENT' | 'COMPETITION' | 'TRAINING_CAMP' | 'WORKSHOP' | 'EXHIBITION';

export type Discipline = 'SPEED' | 'ARTISTIC' | 'HOCKEY' | 'INLINE_FREESTYLE' | 'AGGRESSIVE' | 'DOWNHILL';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export type AgeCategory = 'U-6' | 'U-8' | 'U-10' | 'U-12' | 'U-14' | 'U-16' | 'U-18' | 'U-21' | 'SENIOR' | 'MASTERS' | 'OPEN';

export interface Event {
    id: string;
    name: string;
    slug: string;
    description: string;
    eventLevel: EventLevel;
    eventType: EventType;
    disciplines: Discipline[];
    eventDate: string;
    eventEndDate?: string;
    registrationStartDate: string;
    registrationEndDate: string;
    venue: string;
    city: string;
    stateId: string;
    districtId?: string;
    organizerName: string;
    organizerContact: string;
    status: EventStatus;
    entryFee: number;
    lateFee: number;
    lateFeeStartDate?: string;
    minAge?: number;
    maxAge?: number;
    ageCategories: AgeCategory[]; // Added
    maxParticipants?: number;
    allowMultipleCategories?: boolean;
    requiresApproval?: boolean;
    currentEntries: number;
    bannerImage?: string;
    brochureUrl?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        registrations: number;
    };
}

export interface EventListResponse {
    events: Event[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface EventRegistration {
    id: string;
    eventId: string;
    studentId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    registrationDate: string;
    feeAmount: number;
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
    paymentId?: string;
    bibNumber?: string;
    category: string;
    discipline: Discipline;
    event?: Event;
    student?: any; // Avoiding circular dependency for now
}

export interface RegistrationListResponse {
    registrations: EventRegistration[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface EventStats {
    totalRegistrations: number;
    revenue: number;
    byDiscipline: Record<string, number>;
    byCategory: Record<string, number>;
    byState: Record<string, number>;
    dailyRegistrations: { date: string; count: number }[];
}

export interface EventQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    eventLevel?: EventLevel;
    eventType?: EventType;
    discipline?: Discipline;
    stateId?: string;
    upcoming?: boolean;
    sortBy?: 'eventDate' | 'name' | 'registrationEndDate';
    sortOrder?: 'asc' | 'desc';
}

export interface RegistrationQueryParams {
    page?: number;
    limit?: number;
    eventId?: string;
    studentId?: string;
    status?: string;
    paymentStatus?: string;
}

export interface EventRegistrationFormData {
    eventId: string;
    studentId?: string;
    disciplines: Discipline[];
    categories: string[];
    ageCategory: AgeCategory;
    remarks?: string;
}

export const EVENT_LEVELS: { value: EventLevel; label: string }[] = [
    { value: 'NATIONAL', label: 'National' },
    { value: 'STATE', label: 'State' },
    { value: 'DISTRICT', label: 'District' },
    { value: 'CLUB', label: 'Club' },
    { value: 'INTER_SCHOOL', label: 'Inter-School' },
    { value: 'OPEN', label: 'Open' },
];

export const EVENT_TYPES: { value: EventType; label: string }[] = [
    { value: 'CHAMPIONSHIP', label: 'Championship' },
    { value: 'TOURNAMENT', label: 'Tournament' },
    { value: 'COMPETITION', label: 'Competition' },
    { value: 'TRAINING_CAMP', label: 'Training Camp' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'EXHIBITION', label: 'Exhibition' },
];

export const DISCIPLINES: { value: Discipline; label: string; icon: string }[] = [
    { value: 'SPEED', label: 'Speed Skating', icon: '🏃' },
    { value: 'ARTISTIC', label: 'Artistic Skating', icon: '💃' },
    { value: 'HOCKEY', label: 'Roller Hockey', icon: '🏒' },
    { value: 'INLINE_FREESTYLE', label: 'Inline Freestyle', icon: '🎿' },
    { value: 'AGGRESSIVE', label: 'Aggressive Skating', icon: '🛹' },
    { value: 'DOWNHILL', label: 'Downhill', icon: '⛷️' },
];

export const AGE_CATEGORIES: { value: AgeCategory; label: string }[] = [
    { value: 'U-6', label: 'U-6 (Below 6 years)' },
    { value: 'U-8', label: 'U-8 (6-8 years)' },
    { value: 'U-10', label: 'U-10 (8-10 years)' },
    { value: 'U-12', label: 'U-12 (10-12 years)' },
    { value: 'U-14', label: 'U-14 (12-14 years)' },
    { value: 'U-16', label: 'U-16 (14-16 years)' },
    { value: 'U-18', label: 'U-18 (16-18 years)' },
    { value: 'U-21', label: 'U-21 (18-21 years)' },
    { value: 'SENIOR', label: 'Senior (Above 21)' },
    { value: 'MASTERS', label: 'Masters (Above 35)' },
    { value: 'OPEN', label: 'Open' },
];

// Helper Functions

export const getStatusConfig = (status: EventStatus) => {
    switch (status) {
        case 'REGISTRATION_OPEN':
            return { label: 'Registration Open', color: 'text-green-400', bgColor: 'bg-green-500/20' };
        case 'REGISTRATION_CLOSED':
            return { label: 'Registration Closed', color: 'text-red-400', bgColor: 'bg-red-500/20' };
        case 'ONGOING':
            return { label: 'Ongoing', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
        case 'COMPLETED':
            return { label: 'Completed', color: 'text-slate-400', bgColor: 'bg-slate-500/20' };
        case 'CANCELLED':
            return { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20' };
        case 'PUBLISHED':
            // Changed from "Coming Soon" to "Registration Open" contextually, or just "Published"
            // Since backend uses PUBLISHED for active events, we treat it as potentially open.
            return { label: 'Published', color: 'text-green-400', bgColor: 'bg-green-500/20' };
        default:
            return { label: 'Draft', color: 'text-slate-400', bgColor: 'bg-slate-500/20' };
    }
};

export const getDaysUntilEvent = (date: string) => {
    if (!date) return 0;
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isRegistrationOpen = (event: Event) => {
    // Allow PUBLISHED or ONGOING or REGISTRATION_OPEN
    const validStatuses = ['PUBLISHED', 'ONGOING', 'REGISTRATION_OPEN'];
    if (!validStatuses.includes(event.status)) return false;

    if (!event.registrationStartDate || !event.registrationEndDate) return false;

    const now = new Date();
    const start = new Date(event.registrationStartDate);
    const end = new Date(event.registrationEndDate);

    return now >= start && now <= end;
};

export const formatEventDate = (startDate: string, endDate?: string) => {
    if (!startDate) return 'Date TBA';

    try {
        const start = new Date(startDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        if (!endDate) return start;

        const end = new Date(endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        return start === end ? start : `${start} - ${end}`;
    } catch (e) {
        return 'Invalid Date';
    }
};

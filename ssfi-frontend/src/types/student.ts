// Constants
export const GENDERS = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

// Student Types
export interface Student {
    id: string;
    uid: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    phone: string;
    email?: string;
    aadhaarNumber?: string;

    // Family
    fatherName: string;
    motherName: string;
    guardianPhone: string;
    guardianEmail?: string;

    // School
    schoolName?: string;
    schoolClass?: string;

    // Nominee
    nomineeName: string;
    nomineeRelation: string;
    nomineeAge: number;
    nomineePhone: string;

    // Club
    stateId: string;
    districtId: string;
    clubId: string;
    coachName?: string;
    coachPhone?: string;

    // Address
    address: string;
    city: string;
    state: string;
    pincode: string;

    // Documents
    photoUrl?: string;
    aadhaarUrl?: string;
    birthCertificateUrl?: string;

    // Status
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    ageCategory?: string;
    createdAt: string;
    updatedAt: string;
}

export interface StudentRegistrationData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    phone: string;
    email?: string;
    aadhaarNumber?: string;

    fatherName: string;
    motherName: string;
    guardianPhone: string;
    guardianEmail?: string;
    schoolName?: string;
    schoolClass?: string;

    nomineeName: string;
    nomineeRelation: string;
    nomineeAge: number;
    nomineePhone: string;

    // Club/Coach Details
    clubId: string;
    coachName?: string;
    coachPhone?: string;
    coachEmail?: string;

    // Location & Address
    stateId: string;
    districtId: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    pincode: string;

    // File paths/URLs for preview/storage
    aadhaarCardImage?: string;
    profilePhoto?: string;
    birthCertificate?: string;

    // File objects for upload
    photoFile?: File;
    aadhaarFile?: File;
    birthCertificateFile?: File;
    termsAccepted: boolean;
}

export interface State {
    id: string;
    name: string;
    code: string;
}

export interface District {
    id: string;
    name: string;
    stateId: string;
}

export interface Club {
    id: string;
    name: string;
    districtId: string;
    address?: string;
}

export interface StudentListResponse {
    students: Student[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface StudentStatsResponse {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byState: Record<string, number>;
    byAgeCategory: Record<string, number>;
}

export interface StudentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    stateId?: string;
    districtId?: string;
    clubId?: string;
    ageCategory?: string;
}

export interface AgeCategory {
    id: string;
    name: string;
    minAge: number;
    maxAge: number;
}

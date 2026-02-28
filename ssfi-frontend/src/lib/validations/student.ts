import { z } from 'zod';

// Phone regex for Indian numbers
const phoneRegex = /^[6-9]\d{9}$/;

// Personal Info Schema
const personalInfoSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodGroup: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Please enter valid 10-digit mobile number'),
    email: z.string().email('Please enter valid email address').optional().or(z.literal('')),
    aadhaarNumber: z.string().length(12, 'Aadhaar must be 12 digits').optional(),
});

// Family & School Schema
const familySchoolSchema = z.object({
    fatherName: z.string().min(2, 'Father name is required').max(100),
    motherName: z.string().min(2, 'Mother name is required').max(100),
    guardianPhone: z.string().regex(phoneRegex, 'Please enter valid mobile number'),
    guardianEmail: z.string().email().optional().or(z.literal('')),
    schoolName: z.string().optional(),
    schoolClass: z.string().optional(),
});

// Nominee Schema
const nomineeSchema = z.object({
    nomineeName: z.string().min(2, 'Nominee name is required'),
    nomineeRelation: z.string().min(1, 'Relation is required'),
    nomineeAge: z.number().min(18, 'Nominee must be 18+').max(100),
    nomineePhone: z.string().regex(phoneRegex, 'Please enter valid mobile number'),
});

// Club & Coach Schema
const clubCoachSchema = z.object({
    stateId: z.string().min(1, 'State is required'),
    districtId: z.string().min(1, 'District is required'),
    clubId: z.string().min(1, 'Club is required'),
    coachName: z.string().optional(),
    coachPhone: z.string().optional(),
});

// Address Schema
const addressSchema = z.object({
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().length(6, 'Pincode must be 6 digits'),
});

// Documents Schema
const documentsSchema = z.object({
    photoFile: z.any().optional(),
    aadhaarFile: z.any().optional(),
    birthCertificateFile: z.any().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, 'You must accept terms'),
});

// Complete Registration Schema
export const registrationSchema = z.object({
    ...personalInfoSchema.shape,
    ...familySchoolSchema.shape,
    ...nomineeSchema.shape,
    ...clubCoachSchema.shape,
    ...addressSchema.shape,
    ...documentsSchema.shape,
});

// Export individual step schemas
export { personalInfoSchema, familySchoolSchema, nomineeSchema, clubCoachSchema, addressSchema, documentsSchema };

// Step-wise schemas for validation
export const stepSchemas = {
    1: personalInfoSchema,
    2: familySchoolSchema,
    3: nomineeSchema,
    4: clubCoachSchema,
    5: addressSchema,
    6: documentsSchema,
};

export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type DocumentsData = z.infer<typeof documentsSchema>;
export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type FamilySchoolData = z.infer<typeof familySchoolSchema>;
export type NomineeData = z.infer<typeof nomineeSchema>;
export type ClubCoachData = z.infer<typeof clubCoachSchema>;
export type AddressData = z.infer<typeof addressSchema>;

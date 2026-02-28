import { z } from 'zod';

// Phone number validation (Indian format)
const phoneRegex = /^[6-9]\d{9}$/;

// Aadhaar number validation (12 digits)
const aadhaarRegex = /^\d{12}$/;

// Gender enum
export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);

// Blood group enum
export const BloodGroupEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

// Academic board enum
export const AcademicBoardEnum = z.enum(['STATE', 'CBSE', 'ICSE', 'OTHER']);

// Nominee relation enum
export const NomineeRelationEnum = z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER']);

// Step 1: Personal Information
export const studentPersonalInfoSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters'),
  dateOfBirth: z.string()
    .refine((date) => {
      const dob = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 3 && age <= 50;
    }, 'Age must be between 3 and 50 years'),
  gender: GenderEnum,
  bloodGroup: BloodGroupEnum,
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(phoneRegex, 'Invalid Indian phone number'),
});

// Step 2: Family & School Information
export const studentFamilySchoolSchema = z.object({
  fatherName: z.string()
    .min(2, 'Father\'s name must be at least 2 characters')
    .max(100, 'Father\'s name must be less than 100 characters'),
  motherName: z.string()
    .min(2, 'Mother\'s name must be at least 2 characters')
    .max(100, 'Mother\'s name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  schoolName: z.string()
    .min(3, 'School name must be at least 3 characters')
    .max(200, 'School name must be less than 200 characters'),
  academicBoard: AcademicBoardEnum,
  className: z.string()
    .min(1, 'Class is required')
    .max(20, 'Class must be less than 20 characters'),
});

// Step 3: Nominee Information (for Insurance)
export const studentNomineeSchema = z.object({
  nomineeName: z.string()
    .min(2, 'Nominee name must be at least 2 characters')
    .max(100, 'Nominee name must be less than 100 characters'),
  nomineeAge: z.number()
    .min(18, 'Nominee must be at least 18 years old')
    .max(100, 'Nominee age must be less than 100'),
  nomineeRelation: NomineeRelationEnum,
  nomineePhone: z.string()
    .regex(phoneRegex, 'Invalid Indian phone number')
    .optional()
    .or(z.literal('')),
});

// Step 4: Club & Coach Information
export const studentClubCoachSchema = z.object({
  clubId: z.string()
    .min(1, 'Please select a club'),
  coachName: z.string()
    .min(2, 'Coach name must be at least 2 characters')
    .max(100, 'Coach name must be less than 100 characters'),
  coachPhone: z.string()
    .regex(phoneRegex, 'Invalid Indian phone number'),
  coachEmail: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
});

// Step 5: Address Information
export const studentAddressSchema = z.object({
  addressLine1: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters'),
  addressLine2: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  stateId: z.string()
    .min(1, 'Please select a state'),
  districtId: z.string()
    .min(1, 'Please select a district'),
  pincode: z.string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

// Step 6: Document Information
export const studentDocumentSchema = z.object({
  aadhaarNumber: z.string()
    .regex(aadhaarRegex, 'Aadhaar number must be 12 digits'),
  aadhaarCardImage: z.string()
    .min(1, 'Aadhaar card image is required'),
  profilePhoto: z.string()
    .min(1, 'Profile photo is required'),
  birthCertificate: z.string()
    .optional()
    .or(z.literal('')),
});

// Complete Student Registration Schema
export const studentRegistrationSchema = z.object({
  // Step 1: Personal Info
  ...studentPersonalInfoSchema.shape,
  // Step 2: Family & School
  ...studentFamilySchoolSchema.shape,
  // Step 3: Nominee
  ...studentNomineeSchema.shape,
  // Step 4: Club & Coach
  ...studentClubCoachSchema.shape,
  // Step 5: Address
  ...studentAddressSchema.shape,
  // Step 6: Documents
  ...studentDocumentSchema.shape,
  // Terms acceptance
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

// Update Student Schema (partial, for profile updates)
export const updateStudentSchema = studentRegistrationSchema.partial().omit({
  aadhaarNumber: true, // Cannot change Aadhaar
  termsAccepted: true,
});

// Student Query Schema (for filtering/searching)
export const studentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  clubId: z.string().optional(),
  districtId: z.string().optional(),
  stateId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  gender: GenderEnum.optional(),
  ageCategory: z.string().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'dateOfBirth']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types derived from schemas
export type StudentPersonalInfo = z.infer<typeof studentPersonalInfoSchema>;
export type StudentFamilySchool = z.infer<typeof studentFamilySchoolSchema>;
export type StudentNominee = z.infer<typeof studentNomineeSchema>;
export type StudentClubCoach = z.infer<typeof studentClubCoachSchema>;
export type StudentAddress = z.infer<typeof studentAddressSchema>;
export type StudentDocument = z.infer<typeof studentDocumentSchema>;
export type StudentRegistration = z.infer<typeof studentRegistrationSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;

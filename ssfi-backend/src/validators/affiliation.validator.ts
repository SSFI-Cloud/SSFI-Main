import { z } from 'zod';

export const RegistrationTypeEnum = z.enum(['STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB', 'STUDENT']);
export type RegistrationType = z.infer<typeof RegistrationTypeEnum>;

export const registrationWindowSchema = z.object({
    type: RegistrationTypeEnum,
    title: z.string().min(3),
    description: z.string().optional(),
    instructions: z.string().optional(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    fee: z.number().min(0),
    isActive: z.boolean().default(true),
});

export type RegistrationWindow = z.infer<typeof registrationWindowSchema>;

export const updateRegistrationWindowSchema = registrationWindowSchema.partial();
export type UpdateRegistrationWindow = z.infer<typeof updateRegistrationWindowSchema>;

export const registrationWindowQuerySchema = z.object({
    type: RegistrationTypeEnum.optional(),
    isActive: z.boolean().optional(),
    includeExpired: z.boolean().optional(),
});
export type RegistrationWindowQuery = z.infer<typeof registrationWindowQuerySchema>;

// Shared schemas
const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
const phoneSchema = z.string().min(10).max(15);
export const stateSecretaryRegistrationSchema = z.object({
    name: z.string().min(2),
    gender: genderEnum,
    email: z.string().email(),
    phone: phoneSchema,
    stateId: z.number().int().or(z.string().transform(val => parseInt(val, 10))),
    residentialAddress: z.string().min(5),
    associationName: z.string().min(2).optional(),
    identityProof: z.string().optional().or(z.literal('')),
    profilePhoto: z.string().optional(),
    logo: z.string().optional(),
    associationRegistrationCopy: z.string().optional(),
    presidentName: z.string().min(2).optional(),
    presidentPhoto: z.string().optional(),
    isSelfSecretary: z.boolean().optional().or(z.string().transform(val => val === 'true')),
});
export type StateSecretaryRegistration = z.infer<typeof stateSecretaryRegistrationSchema>;

export const districtSecretaryRegistrationSchema = stateSecretaryRegistrationSchema.extend({
    districtId: z.number().int().or(z.string().transform(val => parseInt(val, 10))),
});
export type DistrictSecretaryRegistration = z.infer<typeof districtSecretaryRegistrationSchema>;

export const clubRegistrationSchema = z.object({
    clubName: z.string().min(2),
    registrationNumber: z.string().optional().or(z.literal('')),
    establishedYear: z.number().int().or(z.string().transform(val => parseInt(val, 10))).pipe(z.number().int().min(1900).max(new Date().getFullYear())),
    contactPersonName: z.string().min(2),
    phone: phoneSchema,
    email: z.string().email().optional().or(z.literal('')),
    stateId: z.number().int().or(z.string().transform(val => parseInt(val, 10))),
    districtId: z.number().int().or(z.string().transform(val => parseInt(val, 10))),
    address: z.string().min(5),
    clubLogo: z.string().optional(),
});
export type ClubRegistration = z.infer<typeof clubRegistrationSchema>;

export const affiliationQuerySchema = z.object({
    page: z.string().transform(val => parseInt(val, 10)).optional().default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).optional().default('10'),
    search: z.string().optional(),
    stateId: z.string().transform(val => parseInt(val, 10)).optional(),
    districtId: z.string().transform(val => parseInt(val, 10)).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type AffiliationQuery = z.infer<typeof affiliationQuerySchema>;

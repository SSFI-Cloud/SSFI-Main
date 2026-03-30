import { z } from 'zod';

export const initializeDigilockerSchema = z.object({
  redirectUrl: z
    .string()
    .url('Redirect URL must be a valid URL')
    .startsWith('https', 'Redirect URL must use HTTPS'),
});

export const checkStatusSchema = z.object({
  clientId: z
    .string()
    .min(1, 'Client ID is required'),
});

export type InitializeDigilockerInput = z.infer<typeof initializeDigilockerSchema>;
export type CheckStatusInput = z.infer<typeof checkStatusSchema>;

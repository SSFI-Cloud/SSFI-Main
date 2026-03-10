// Razorpay Configuration
// Environment variables required:
// RAZORPAY_KEY_ID - Your Razorpay Key ID
// RAZORPAY_KEY_SECRET - Your Razorpay Key Secret
// RAZORPAY_WEBHOOK_SECRET - Webhook secret for signature verification

import Razorpay from 'razorpay';

// Only throw error if in production and keys are missing
const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

if (!keyId || !keySecret) {
    console.warn('⚠️ Razorpay credentials not configured - payment features will be disabled');
}

// Create instance only if keys are available
export const razorpayInstance = keyId && keySecret ? new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
}) : null;

export const razorpayConfig = {
    keyId,
    keySecret,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: 'INR',

    // Payment types and their base amounts (in paise)
    paymentTypes: {
        STUDENT_REGISTRATION: {
            name: 'Student Registration',
            baseAmount: 50000, // ₹500
            description: 'SSFI Student/Skater Registration Fee',
        },
        CLUB_AFFILIATION: {
            name: 'Club Affiliation',
            baseAmount: 200000, // ₹2000
            description: 'SSFI Club Affiliation Fee',
        },
        EVENT_REGISTRATION: {
            name: 'Event Registration',
            baseAmount: 0, // Variable - depends on event
            description: 'Event Registration Fee',
        },
        MEMBERSHIP_RENEWAL: {
            name: 'Membership Renewal',
            baseAmount: 50000, // ₹500
            description: 'SSFI Annual Membership Renewal',
        },
        COACH_CERTIFICATION: {
            name: 'Coach Certification',
            baseAmount: 0, // Variable - depends on program
            description: 'SSFI Coach Certification Fee',
        },
        BEGINNER_CERTIFICATION: {
            name: 'Beginner Certification',
            baseAmount: 0, // Variable - depends on program
            description: 'SSFI Beginner Certification Fee',
        },
        AFFILIATION_FEE: {
            name: 'Affiliation Fee',
            baseAmount: 0, // Variable - depends on registration window
            description: 'SSFI Affiliation / Registration Fee',
        },
        DONATION: {
            name: 'Donation',
            baseAmount: 0, // Variable - donor chooses
            description: 'Donation to SSFI',
        },
    },

    // Callback URLs
    callbackUrls: {
        success: `${process.env.FRONTEND_URL || 'https://ssfiskate.com'}/payment/success`,
        failure: `${process.env.FRONTEND_URL || 'https://ssfiskate.com'}/payment/failure`,
        webhook: `${process.env.BACKEND_URL || 'https://api.ssfiskate.com'}/api/v1/payments/webhook`,
    },
};

export type PaymentType = keyof typeof razorpayConfig.paymentTypes;

export const isRazorpayConfigured = (): boolean => {
    return !!(razorpayInstance && keyId && keySecret);
};

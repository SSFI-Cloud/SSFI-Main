// Payment Types for Razorpay Integration

export type PaymentStatus = 'pending' | 'processing' | 'captured' | 'failed' | 'refunded';

export type PaymentType = 'STUDENT_REGISTRATION' | 'CLUB_AFFILIATION' | 'EVENT_REGISTRATION' | 'MEMBERSHIP_RENEWAL' | 'COACH_CERTIFICATION' | 'BEGINNER_CERTIFICATION' | 'AFFILIATION_FEE' | 'DONATION';

export interface CreateOrderRequest {
    amount: number; // In paise
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
    payment_type: PaymentType;
    entity_id: number;
    entity_type: string;
    user_id?: number;
    // Optional FK links for direct entity association
    coachCertRegistrationId?: number;
    beginnerCertRegistrationId?: number;
    donationId?: number;
}

export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
}

export interface VerifyPaymentRequest {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface PaymentRecord {
    id: number;
    order_id: string;
    payment_id?: string;
    signature?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method?: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
    email?: string;
    contact?: string;
    fee?: number;
    tax?: number;
    error_code?: string;
    error_description?: string;
    created_at: Date;
    updated_at: Date;
}

export interface RazorpayPaymentEntity {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    bank: string | null;
    wallet: string | null;
    vpa: string | null;
    email: string;
    contact: string;
    fee: number;
    tax: number;
    order_id: string;
    captured: boolean;
    created_at: number;
}

export interface WebhookEvent {
    event: string;
    payload: {
        payment?: {
            entity: RazorpayPaymentEntity;
        };
        order?: {
            entity: RazorpayOrder;
        };
    };
}

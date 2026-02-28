// Payment Types for Frontend
export type PaymentType = 'STUDENT_REGISTRATION' | 'CLUB_AFFILIATION' | 'EVENT_REGISTRATION' | 'MEMBERSHIP_RENEWAL';

export interface CreateOrderPayload {
    amount: number; // In rupees (will be converted to paise)
    payment_type: PaymentType;
    entity_id: number;
    entity_type: string;
    notes?: Record<string, string>;
}

export interface VerifyPaymentPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface PaymentFailurePayload {
    order_id: string;
    payment_id?: string;
    error_code: string;
    error_description: string;
    error_source?: string;
    error_reason?: string;
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

export interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    handler: (response: RazorpayResponse) => void;
    modal?: {
        ondismiss?: () => void;
        escape?: boolean;
        backdropclose?: boolean;
    };
}

export interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface RazorpayError {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
        order_id: string;
        payment_id?: string;
    };
}

export interface CheckoutConfig {
    key_id: string;
    currency: string;
    payment_types: Record<PaymentType, {
        name: string;
        baseAmount: number;
        description: string;
    }>;
    callback_urls: {
        success: string;
        failure: string;
    };
}

export interface PaymentRecord {
    id: number;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    status: string;
    paymentType: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

// Extend Window interface for Razorpay
declare global {
    interface Window {
        Razorpay: new (options: RazorpayCheckoutOptions) => {
            open: () => void;
            on: (event: string, handler: (response: RazorpayError) => void) => void;
        };
    }
}

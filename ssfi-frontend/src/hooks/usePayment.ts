// usePayment Hook - Handles Razorpay payment flow
'use client';

import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import type {
    PaymentType,
    CreateOrderPayload,
    VerifyPaymentPayload,
    PaymentFailurePayload,
    RazorpayOrder,
    RazorpayCheckoutOptions,
    RazorpayResponse,
    RazorpayError,
    CheckoutConfig,
    PaymentRecord,
} from '@/types/payment';

interface UsePaymentOptions {
    onSuccess?: (payment: PaymentRecord) => void;
    onFailure?: (error: RazorpayError) => void;
    onDismiss?: () => void;
}

interface UsePaymentReturn {
    isLoading: boolean;
    error: string | null;
    config: CheckoutConfig | null;
    currentOrder: RazorpayOrder | null;
    initiatePayment: (payload: CreateOrderPayload, prefill?: { name?: string; email?: string; contact?: string }) => Promise<void>;
    verifyPayment: (payload: VerifyPaymentPayload) => Promise<PaymentRecord | null>;
    getPaymentStatus: (orderId: string) => Promise<PaymentRecord | null>;
    loadRazorpayScript: () => Promise<boolean>;
}

export function usePayment(options: UsePaymentOptions = {}): UsePaymentReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<CheckoutConfig | null>(null);
    const [currentOrder, setCurrentOrder] = useState<RazorpayOrder | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const { onSuccess, onFailure, onDismiss } = options;

    // Load Razorpay script
    const loadRazorpayScript = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            if (scriptLoaded || (typeof window !== 'undefined' && window.Razorpay)) {
                setScriptLoaded(true);
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
                setScriptLoaded(true);
                resolve(true);
            };
            script.onerror = () => {
                console.error('Failed to load Razorpay script');
                resolve(false);
            };
            document.body.appendChild(script);
        });
    }, [scriptLoaded]);

    // Fetch checkout configuration
    const fetchConfig = useCallback(async () => {
        try {
            const response = await apiClient.get('/payments/checkout-config');
            if (response.data.status === 'success') {
                setConfig(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch checkout config:', err);
        }
    }, []);

    // Load config on mount
    useEffect(() => {
        fetchConfig();
        loadRazorpayScript();
    }, [fetchConfig, loadRazorpayScript]);

    // Create order
    const createOrder = useCallback(async (payload: CreateOrderPayload): Promise<RazorpayOrder | null> => {
        try {
            const response = await apiClient.post('/payments/create-order', payload);
            if (response.data.status !== 'success') {
                throw new Error(response.data.message || 'Failed to create order');
            }
            return response.data.data.order;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || err.message || 'Failed to create order');
        }
    }, []);

    // Verify payment
    const verifyPayment = useCallback(async (payload: VerifyPaymentPayload): Promise<PaymentRecord | null> => {
        try {
            const response = await apiClient.post('/payments/verify', payload);
            if (response.data.status !== 'success') {
                throw new Error(response.data.message || 'Payment verification failed');
            }
            return response.data.data.payment;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || err.message || 'Payment verification failed');
        }
    }, []);

    // Report payment failure
    const reportFailure = useCallback(async (payload: PaymentFailurePayload): Promise<void> => {
        try {
            await apiClient.post('/payments/failure', payload);
        } catch (err) {
            console.error('Failed to report payment failure:', err);
        }
    }, []);

    // Get payment status
    const getPaymentStatus = useCallback(async (orderId: string): Promise<PaymentRecord | null> => {
        try {
            const response = await apiClient.get(`/payments/status/${orderId}`);
            if (response.data.status !== 'success') {
                return null;
            }
            return response.data.data.payment;
        } catch (err) {
            console.error('Failed to get payment status:', err);
            return null;
        }
    }, []);

    // Initiate payment - Main function to start payment flow
    const initiatePayment = useCallback(async (
        payload: CreateOrderPayload,
        prefill?: { name?: string; email?: string; contact?: string }
    ): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            // Ensure script is loaded
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                throw new Error('Failed to load payment gateway');
            }

            // Create order
            const order = await createOrder(payload);
            if (!order) {
                throw new Error('Failed to create payment order');
            }

            setCurrentOrder(order);

            // Get payment type config for description
            const paymentTypeConfig = config?.payment_types[payload.payment_type];

            // Razorpay checkout options
            const checkoutOptions: RazorpayCheckoutOptions = {
                key: config?.key_id || '',
                amount: order.amount,
                currency: order.currency,
                name: 'Speed Skating Federation of India',
                description: paymentTypeConfig?.description || 'Payment',
                order_id: order.id,
                prefill: prefill || {},
                notes: order.notes,
                theme: {
                    color: '#3B82F6',
                },
                handler: async (response: RazorpayResponse) => {
                    try {
                        setIsLoading(true);
                        const payment = await verifyPayment(response);
                        if (payment) {
                            onSuccess?.(payment);
                        }
                    } catch (err: any) {
                        setError(err.message);
                    } finally {
                        setIsLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setIsLoading(false);
                        onDismiss?.();
                    },
                    escape: false,
                    backdropclose: false,
                },
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(checkoutOptions);

            razorpay.on('payment.failed', async (response: RazorpayError) => {
                console.error('Payment failed:', response);

                // Report failure to backend
                await reportFailure({
                    order_id: response.metadata.order_id,
                    payment_id: response.metadata.payment_id,
                    error_code: response.code,
                    error_description: response.description,
                    error_source: response.source,
                    error_reason: response.reason,
                });

                setError(response.description);
                onFailure?.(response);
                setIsLoading(false);
            });

            razorpay.open();
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    }, [config, createOrder, verifyPayment, reportFailure, loadRazorpayScript, onSuccess, onFailure, onDismiss]);

    return {
        isLoading,
        error,
        config,
        currentOrder,
        initiatePayment,
        verifyPayment,
        getPaymentStatus,
        loadRazorpayScript,
    };
}

export default usePayment;

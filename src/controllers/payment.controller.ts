// Payment Controller - Handles HTTP requests for payment operations
import { Request, Response, NextFunction } from 'express';
import { paymentService, PaymentService } from '../services/payment.service';
import { razorpayConfig } from '../config/razorpay.config';
import type { CreateOrderRequest, VerifyPaymentRequest, PaymentType } from '../types/payment.types';

class PaymentController {

    /**
     * Create a new payment order
     * POST /api/v1/payments/create-order
     */
    async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const {
                amount,
                payment_type,
                entity_id,
                entity_type,
                notes,
            } = req.body;

            // Validate required fields
            if (!amount || !payment_type || !entity_id || !entity_type) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields: amount, payment_type, entity_id, entity_type',
                });
            }

            // Validate payment type
            if (!razorpayConfig.paymentTypes[payment_type as PaymentType]) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid payment type',
                });
            }

            // Generate receipt ID
            const receipt = PaymentService.generateReceiptId(payment_type);

            // Create order request
            const orderRequest: CreateOrderRequest = {
                amount: amount * 100, // Convert to paise
                receipt,
                payment_type,
                entity_id,
                entity_type,
                user_id: userId,
                notes: {
                    ...notes,
                    payment_type,
                    entity_id: entity_id.toString(),
                    entity_type,
                },
            };

            // Create order
            const order = await paymentService.createOrder(orderRequest);

            return res.status(200).json({
                status: 'success',
                message: 'Order created successfully',
                data: {
                    order,
                    key_id: razorpayConfig.keyId,
                },
            });
        } catch (error: any) {
            console.error('Create order error:', error);
            next(error);
        }
    }

    /**
     * Verify payment after completion
     * POST /api/v1/payments/verify
     */
    async verifyPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            }: VerifyPaymentRequest = req.body;

            // Validate required fields
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing payment verification parameters',
                });
            }

            // Process successful payment
            const payment = await paymentService.processSuccessfulPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            });

            return res.status(200).json({
                status: 'success',
                message: 'Payment verified successfully',
                data: { payment },
            });
        } catch (error: any) {
            console.error('Verify payment error:', error);
            return res.status(400).json({
                status: 'error',
                message: error.message || 'Payment verification failed',
            });
        }
    }

    /**
     * Handle payment failure
     * POST /api/v1/payments/failure
     */
    async handleFailure(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                order_id,
                payment_id,
                error_code,
                error_description,
                error_source,
                error_reason,
            } = req.body;

            if (!order_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing order_id',
                });
            }

            await paymentService.processFailedPayment(
                order_id,
                payment_id,
                error_code || 'UNKNOWN',
                error_description || 'Payment failed',
                error_source,
                error_reason
            );

            return res.status(200).json({
                status: 'success',
                message: 'Payment failure recorded',
            });
        } catch (error: any) {
            console.error('Handle failure error:', error);
            next(error);
        }
    }

    /**
     * Get payment status by order ID
     * GET /api/v1/payments/status/:orderId
     */
    async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { orderId } = req.params;

            if (!orderId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing order ID',
                });
            }

            const payment = await paymentService.getPaymentByOrderId(orderId);

            if (!payment) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Payment not found',
                });
            }

            return res.status(200).json({
                status: 'success',
                data: { payment },
            });
        } catch (error: any) {
            console.error('Get payment status error:', error);
            next(error);
        }
    }

    /**
     * Get all payments (admin)
     * GET /api/v1/payments
     */
    async getPayments(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

            const result = await paymentService.listPayments(userId, req.query);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error('Get payments error:', error);
            next(error);
        }
    }

    /**
     * Get all payments (admin - with filters)
     * GET /api/v1/payments/admin
     */
    async getPaymentsAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                status,
                payment_type,
                entity_id,
                entity_type,
                user_id,
                from_date,
                to_date,
                page = '1',
                limit = '10',
            } = req.query;

            const filters = {
                status: status as any,
                payment_type: payment_type as PaymentType,
                entity_id: entity_id ? parseInt(entity_id as string) : undefined,
                entity_type: entity_type as string,
                user_id: user_id ? parseInt(user_id as string) : undefined,
                from_date: from_date ? new Date(from_date as string) : undefined,
                to_date: to_date ? new Date(to_date as string) : undefined,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
            };

            const result = await paymentService.getPayments(filters);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error('Get payments admin error:', error);
            next(error);
        }
    }

    /**
     * Initiate refund
     * POST /api/v1/payments/refund
     */
    async initiateRefund(req: Request, res: Response, next: NextFunction) {
        try {
            const { payment_id, amount, reason } = req.body;

            if (!payment_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing payment_id',
                });
            }

            const refund = await paymentService.initiateRefund(
                payment_id,
                amount ? amount * 100 : undefined,
                { reason: reason || 'Refund requested' }
            );

            return res.status(200).json({
                status: 'success',
                message: 'Refund initiated successfully',
                data: { refund },
            });
        } catch (error: any) {
            console.error('Initiate refund error:', error);
            next(error);
        }
    }

    /**
     * Get checkout configuration
     * GET /api/v1/payments/checkout-config
     */
    async getCheckoutConfig(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).json({
                status: 'success',
                data: {
                    key_id: razorpayConfig.keyId,
                    currency: razorpayConfig.currency,
                    payment_types: razorpayConfig.paymentTypes,
                    callback_urls: {
                        success: razorpayConfig.callbackUrls.success,
                        failure: razorpayConfig.callbackUrls.failure,
                    },
                },
            });
        } catch (error: any) {
            console.error('Get checkout config error:', error);
            next(error);
        }
    }

    /**
     * Get payment receipt / details
     * GET /api/v1/payments/:id/receipt
     */
    async getReceipt(req: Request, res: Response, next: NextFunction) {
        try {
            const paymentId = parseInt(req.params.id);
            if (!paymentId || isNaN(paymentId)) {
                return res.status(400).json({ status: 'error', message: 'Invalid payment ID' });
            }

            const prisma = (await import('../config/prisma')).default;

            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                include: {
                    user: {
                        select: {
                            uid: true,
                            email: true,
                            phone: true,
                            role: true,
                            student: { select: { name: true } },
                            clubOwner: { select: { name: true } },
                            statePerson: { select: { name: true } },
                            districtPerson: { select: { name: true } },
                        },
                    },
                },
            });

            if (!payment) {
                return res.status(404).json({ status: 'error', message: 'Payment not found' });
            }

            const userName =
                payment.user?.student?.name ||
                payment.user?.clubOwner?.name ||
                payment.user?.statePerson?.name ||
                payment.user?.districtPerson?.name ||
                'N/A';

            return res.status(200).json({
                status: 'success',
                data: {
                    id: payment.id,
                    amount: Number(payment.amount),
                    currency: payment.currency,
                    paymentType: payment.paymentType,
                    status: payment.status,
                    razorpayOrderId: payment.razorpayOrderId,
                    razorpayPaymentId: payment.razorpayPaymentId,
                    description: payment.description,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                    user: {
                        name: userName,
                        uid: payment.user?.uid,
                        email: payment.user?.email,
                        phone: payment.user?.phone,
                        role: payment.user?.role,
                    },
                },
            });
        } catch (error: any) {
            console.error('Get receipt error:', error);
            next(error);
        }
    }

    /**
     * Handle Razorpay webhook
     * POST /api/v1/payments/webhook
     */
    async handleWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            const signature = req.headers['x-razorpay-signature'] as string;
            const body = JSON.stringify(req.body);

            // Verify webhook signature
            const isValid = paymentService.verifyWebhookSignature(body, signature);
            if (!isValid) {
                console.error('Invalid webhook signature');
                return res.status(400).json({ status: 'error', message: 'Invalid signature' });
            }

            const event = req.body;
            const eventType = event.event;

            console.log(`Webhook received: ${eventType}`);

            switch (eventType) {
                case 'payment.captured':
                    const payment = event.payload.payment.entity;
                    await paymentService.processSuccessfulPayment({
                        razorpay_order_id: payment.order_id,
                        razorpay_payment_id: payment.id,
                        razorpay_signature: signature,
                    });
                    break;

                case 'payment.failed':
                    const failedPayment = event.payload.payment.entity;
                    await paymentService.processFailedPayment(
                        failedPayment.order_id,
                        failedPayment.id,
                        failedPayment.error_code || 'UNKNOWN',
                        failedPayment.error_description || 'Payment failed'
                    );
                    break;

                default:
                    console.log(`Unhandled webhook event: ${eventType}`);
            }

            return res.status(200).json({ status: 'ok' });
        } catch (error: any) {
            console.error('Webhook error:', error);
            return res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
        }
    }
}

export const paymentController = new PaymentController();

// Legacy exports for backward compatibility
export const createOrder = paymentController.createOrder.bind(paymentController);
export const verifyPayment = paymentController.verifyPayment.bind(paymentController);
export const getAllPayments = paymentController.getPayments.bind(paymentController);

// Payment Service - Handles all Razorpay operations
import crypto from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { razorpayInstance, razorpayConfig, isRazorpayConfigured } from '../config/razorpay.config';
import type {
    CreateOrderRequest,
    RazorpayOrder,
    VerifyPaymentRequest,
    PaymentRecord,
    PaymentStatus,
    RazorpayPaymentEntity,
    PaymentType,
} from '../types/payment.types';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
export class PaymentService {

    /**
     * Create a Razorpay order
     */
    async createOrder(request: CreateOrderRequest): Promise<RazorpayOrder> {
        const {
            amount, currency = 'INR', receipt, notes, payment_type, entity_id, entity_type, user_id,
            coachCertRegistrationId, beginnerCertRegistrationId, donationId,
        } = request;

        // Build common payment data
        const buildPaymentData = (orderId: string) => {
            const data: any = {
                razorpayOrderId: orderId,
                amount: amount / 100,
                status: 'PENDING',
                paymentType: payment_type,
                userId: user_id || 0,
                description: `${payment_type} - ${entity_type} #${entity_id}`,
            };
            // Link event registration if applicable
            if (entity_type === 'event_registration' || payment_type === 'EVENT_REGISTRATION') {
                data.eventRegistrationId = Number(entity_id);
            }
            // Link coach cert registration
            if (coachCertRegistrationId) data.coachCertRegistrationId = coachCertRegistrationId;
            // Link beginner cert registration
            if (beginnerCertRegistrationId) data.beginnerCertRegistrationId = beginnerCertRegistrationId;
            // Link donation
            if (donationId) data.donationId = donationId;
            return data;
        };

        // Check if Razorpay is configured or Mock Mode is enabled
        const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

        if (useMockPayment || !isRazorpayConfigured() || !razorpayInstance) {
            // Return mock order for development
            console.warn('Using Mock Payment Order');
            const mockOrder = this.createMockOrder(amount, currency, receipt || `receipt_${Date.now()}`, notes || {});

            await prisma.payment.create({ data: buildPaymentData(mockOrder.id) });
            return mockOrder;
        }

        try {
            // Create order in Razorpay
            const order = await razorpayInstance.orders.create({
                amount,
                currency,
                receipt: receipt || PaymentService.generateReceiptId(payment_type),
                notes: {
                    ...notes,
                    payment_type,
                    entity_id: entity_id.toString(),
                    entity_type,
                },
            }) as RazorpayOrder;

            await prisma.payment.create({ data: buildPaymentData(order.id) });
            return order;
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw new AppError('Failed to create payment order', 500);
        }
    }

    /**
     * Create mock order for development
     */
    private createMockOrder(amount: number, currency: string, receipt: string, notes: Record<string, string>): RazorpayOrder {
        const mockOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        return {
            id: mockOrderId,
            entity: 'order',
            amount,
            amount_paid: 0,
            amount_due: amount,
            currency,
            receipt,
            status: 'created',
            attempts: 0,
            notes,
            created_at: Math.floor(Date.now() / 1000),
        };
    }

    /**
     * Verify payment signature
     */
    verifyPaymentSignature(params: VerifyPaymentRequest): boolean {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

        // Skip verification for mock orders
        if (razorpay_order_id.startsWith('order_mock_')) {
            return true;
        }

        if (!razorpayConfig.keySecret) {
            console.warn('Razorpay key secret not configured');
            return true; // Allow in development
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.keySecret)
            .update(body.toString())
            .digest('hex');

        return expectedSignature === razorpay_signature;
    }

    /**
     * Process successful payment
     */
    async processSuccessfulPayment(params: VerifyPaymentRequest): Promise<PaymentRecord | null> {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

        // Verify signature
        const isValid = this.verifyPaymentSignature(params);
        if (!isValid) {
            throw new AppError('Invalid payment signature', 400);
        }

        try {
            // Update payment record in database
            const updatedPayment = await prisma.payment.updateMany({
                where: { razorpayOrderId: razorpay_order_id },
                data: {
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: 'COMPLETED',
                },
            });

            // Fetch payment details from Razorpay if configured
            if (isRazorpayConfigured() && razorpayInstance && !razorpay_order_id.startsWith('order_mock_')) {
                const payment = await razorpayInstance.payments.fetch(razorpay_payment_id) as RazorpayPaymentEntity;
                // Could store additional details like method, bank, etc.
            }

            // Fetch and return updated record
            const paymentRecord = await prisma.payment.findFirst({
                where: { razorpayOrderId: razorpay_order_id },
            });

            // Process post-payment actions
            if (paymentRecord) {
                await this.processPostPaymentActions(paymentRecord);
            }

            return paymentRecord as unknown as PaymentRecord;
        } catch (error) {
            console.error('Error processing successful payment:', error);
            throw new AppError('Failed to process payment', 500);
        }
    }

    /**
     * Process failed payment
     */
    async processFailedPayment(
        orderId: string,
        paymentId: string | null,
        errorCode: string,
        errorDescription: string,
        errorSource?: string,
        errorReason?: string
    ): Promise<void> {
        try {
            // Update payment status
            await prisma.payment.updateMany({
                where: { razorpayOrderId: orderId },
                data: {
                    razorpayPaymentId: paymentId,
                    status: 'FAILED',
                },
            });

            // Log failure - PaymentFailure model doesn't exist in schema
            // TODO: Add PaymentFailure model to schema if failure logging is needed
            console.error('Payment failed:', {
                orderId,
                paymentId,
                errorCode,
                errorMessage: errorDescription,
            });
        } catch (error) {
            console.error('Error processing failed payment:', error);
        }
    }

    /**
     * Process post-payment actions based on payment type.
     * Handles both frontend-verified and webhook-captured payments.
     * Some services (affiliation, coach-cert, beginner-cert) also have their own
     * verifyPayment() that does entity updates — these act as fallback/webhook handlers.
     */
    private async processPostPaymentActions(payment: any): Promise<void> {
        const paymentType = payment.paymentType;
        const eventRegId = payment.eventRegistrationId;

        try {
            switch (paymentType) {
                case 'STUDENT_REGISTRATION': {
                    const studentId = this.extractEntityId(payment.description);
                    if (studentId) {
                        console.log(`[PostPayment] Student #${studentId} payment captured`);
                    }
                    break;
                }

                case 'AFFILIATION_FEE':
                case 'CLUB_AFFILIATION': {
                    const entityType = this.extractEntityType(payment.description);
                    const entityIdStr = this.extractEntityIdStr(payment.description);
                    if (!entityIdStr || !entityType) {
                        console.warn(`[PostPayment] Could not parse entity from: ${payment.description}`);
                        break;
                    }
                    if (entityType === 'STATE_SECRETARY') {
                        await prisma.stateSecretary.update({
                            where: { id: entityIdStr },
                            data: { status: 'PENDING' },
                        });
                        console.log(`[PostPayment] StateSecretary ${entityIdStr} → PENDING (paid)`);
                    } else if (entityType === 'DISTRICT_SECRETARY') {
                        await prisma.districtSecretary.update({
                            where: { id: entityIdStr },
                            data: { status: 'PENDING' },
                        });
                        console.log(`[PostPayment] DistrictSecretary ${entityIdStr} → PENDING (paid)`);
                    } else if (entityType === 'CLUB') {
                        await prisma.club.update({
                            where: { id: Number(entityIdStr) },
                            data: { isActive: true },
                        });
                        console.log(`[PostPayment] Club #${entityIdStr} activated`);
                    }
                    break;
                }

                case 'EVENT_REGISTRATION':
                    if (eventRegId) {
                        await prisma.eventRegistration.update({
                            where: { id: eventRegId },
                            data: {
                                paymentStatus: 'PAID',
                                status: 'CONFIRMED',
                            },
                        });
                        console.log(`[PostPayment] EventRegistration #${eventRegId} confirmed`);
                    }
                    break;

                case 'COACH_CERTIFICATION': {
                    const coachRegId = payment.coachCertRegistrationId || this.extractEntityId(payment.description);
                    if (coachRegId) {
                        await prisma.coachCertRegistration.update({
                            where: { id: coachRegId },
                            data: { paymentStatus: 'PAID' },
                        });
                        console.log(`[PostPayment] CoachCertRegistration #${coachRegId} → PAID`);
                    }
                    break;
                }

                case 'BEGINNER_CERTIFICATION': {
                    const beginnerRegId = payment.beginnerCertRegistrationId || this.extractEntityId(payment.description);
                    if (beginnerRegId) {
                        await prisma.beginnerCertRegistration.update({
                            where: { id: beginnerRegId },
                            data: { paymentStatus: 'PAID' },
                        });
                        console.log(`[PostPayment] BeginnerCertRegistration #${beginnerRegId} → PAID`);
                    }
                    break;
                }

                case 'DONATION': {
                    if (payment.donationId) {
                        await prisma.donation.update({
                            where: { id: payment.donationId },
                            data: { status: 'COMPLETED' },
                        });
                        console.log(`[PostPayment] Donation #${payment.donationId} → COMPLETED`);
                    }
                    break;
                }

                case 'MEMBERSHIP_RENEWAL': {
                    const renewalEntityId = this.extractEntityId(payment.description);
                    console.log(`[PostPayment] Membership renewal captured for entity #${renewalEntityId}`);
                    break;
                }

                default:
                    console.log(`[PostPayment] Unhandled payment type: ${paymentType}`);
            }
        } catch (error) {
            console.error(`[PostPayment] Error processing ${paymentType}:`, error);
        }
    }

    /** Extract numeric entity ID from description: "TYPE - ENTITY #123" */
    private extractEntityId(description: string | null): number | null {
        if (!description) return null;
        const match = description.match(/#(\d+)\s*$/);
        return match ? parseInt(match[1], 10) : null;
    }

    /** Extract entity ID as string (for cuid IDs): "TYPE - ENTITY #cuid123" */
    private extractEntityIdStr(description: string | null): string | null {
        if (!description) return null;
        const match = description.match(/#(\S+)\s*$/);
        return match ? match[1] : null;
    }

    /** Extract entity type from description: "TYPE - ENTITY_TYPE #id" */
    private extractEntityType(description: string | null): string | null {
        if (!description) return null;
        const match = description.match(/- (\S+) #/);
        return match ? match[1] : null;
    }

    /**
     * Get payment by order ID
     */
    async getPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
        const payment = await prisma.payment.findFirst({
            where: { razorpayOrderId: orderId },
            include: {
                eventRegistration: {
                    include: {
                        event: { select: { name: true, eventDate: true } }
                    }
                }
            }
        });
        return payment as unknown as PaymentRecord;
    }

    /**
     * Get payment by payment ID
     */
    async getPaymentByPaymentId(paymentId: string): Promise<PaymentRecord | null> {
        const payment = await prisma.payment.findFirst({
            where: { razorpayPaymentId: paymentId },
        });
        return payment as unknown as PaymentRecord;
    }

    /**
     * Get all payments with filters
     */
    async getPayments(filters: {
        status?: PaymentStatus;
        payment_type?: PaymentType;
        entity_id?: number;
        entity_type?: string;
        user_id?: number;
        from_date?: Date;
        to_date?: Date;
        page?: number;
        limit?: number;
    }): Promise<{ payments: PaymentRecord[]; total: number }> {
        const { page = 1, limit = 10, from_date, to_date, status, user_id, payment_type } = filters;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status.toUpperCase();
        if (user_id) where.userId = user_id;
        if (payment_type) where.paymentType = payment_type;
        if (from_date || to_date) {
            where.createdAt = {};
            if (from_date) where.createdAt.gte = from_date;
            if (to_date) where.createdAt.lte = to_date;
        }

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    eventRegistration: {
                        include: {
                            event: { select: { name: true, eventDate: true } }
                        }
                    }
                }
            }),
            prisma.payment.count({ where }),
        ]);

        return {
            payments: payments as unknown as PaymentRecord[],
            total,
        };
    }

    /**
     * Initiate refund
     */
    async initiateRefund(paymentId: string, amount?: number, notes?: Record<string, string>): Promise<any> {
        if (!isRazorpayConfigured() || !razorpayInstance) {
            throw new AppError('Razorpay not configured', 500);
        }

        try {
            const refund = await razorpayInstance.payments.refund(paymentId, {
                amount,
                notes,
            });

            // Update payment status
            await prisma.payment.updateMany({
                where: { razorpayPaymentId: paymentId },
                data: { status: 'REFUNDED' },
            });

            return refund;
        } catch (error) {
            console.error('Error initiating refund:', error);
            throw new AppError('Failed to initiate refund', 500);
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(body: string, signature: string): boolean {
        if (!razorpayConfig.webhookSecret) {
            console.warn('Webhook secret not configured');
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.webhookSecret)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Generate receipt ID
     */
    static generateReceiptId(prefix: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Legacy support: Simple createOrder for existing code
     */
    async createOrderSimple(amount: number, currency = 'INR', description?: string, userId?: number, metadata: any = {}) {
        return this.createOrder({
            amount: amount * 100, // Convert to paise
            currency,
            payment_type: 'EVENT_REGISTRATION',
            entity_id: metadata.eventId || 0,
            entity_type: 'event',
            user_id: userId,
            notes: { description: description || '' },
        });
    }

    /**
     * Legacy support: verifyPayment for existing code
     */
    async verifyPaymentLegacy(
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
        userId: number,
        registrationId?: number
    ) {
        const result = await this.processSuccessfulPayment({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        });

        if (registrationId) {
            await prisma.eventRegistration.update({
                where: { id: registrationId },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED',
                },
            });
        }

        return result;
    }

    /**
     * Legacy support: listPayments for existing code
     */
    async listPayments(userId: number, query: any) {
        const { page = 1, limit = 10, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where: Prisma.PaymentWhereInput = {
            userId,
            ...(status && { status: status as any }),
            ...(search && {
                OR: [
                    { razorpayPaymentId: { contains: search as string } },
                    { razorpayOrderId: { contains: search as string } },
                    { description: { contains: search as string } }
                ]
            })
        };

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    eventRegistration: {
                        include: {
                            event: { select: { name: true, eventDate: true } }
                        }
                    }
                }
            }),
            prisma.payment.count({ where })
        ]);

        return {
            payments,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    }
}

export const paymentService = new PaymentService();

// Legacy exports for backward compatibility
export const createOrder = (amount: number, currency: string, description?: string, userId?: number, metadata?: any) =>
    paymentService.createOrderSimple(amount, currency, description, userId, metadata);

export const verifyPayment = (orderId: string, paymentId: string, signature: string, userId: number, registrationId?: number) =>
    paymentService.verifyPaymentLegacy(orderId, paymentId, signature, userId, registrationId);

export const listPayments = (userId: number, query: any) =>
    paymentService.listPayments(userId, query);

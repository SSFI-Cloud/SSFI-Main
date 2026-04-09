import prisma from '../config/prisma';
import { paymentService } from './payment.service';
import { razorpayConfig } from '../config/razorpay.config';
import { AppError } from '../utils/errors';

interface CreateDonationInput {
    donorName: string;
    donorEmail: string;
    donorPhone?: string;
    amount: number; // in rupees
    message?: string;
    isAnonymous?: boolean;
}

/**
 * Create a donation and Razorpay order — no auth required.
 */
export async function createDonation(input: CreateDonationInput) {
    const { donorName, donorEmail, donorPhone, amount, message, isAnonymous } = input;

    if (!amount || amount < 1) {
        throw new AppError('Minimum donation is ₹1', 400);
    }
    if (amount > 500000) {
        throw new AppError('Maximum single donation is ₹5,00,000', 400);
    }

    // 1. Create donation record
    const donation = await prisma.donation.create({
        data: {
            donorName,
            donorEmail,
            donorPhone: donorPhone || null,
            amount,
            currency: 'INR',
            message: message || null,
            isAnonymous: isAnonymous || false,
            status: 'PENDING',
        },
    });

    // 2. Create Razorpay order linked to donation
    const result = await paymentService.createOrder({
        amount: amount * 100, // convert to paise
        currency: 'INR',
        payment_type: 'DONATION',
        entity_id: donation.id,
        entity_type: 'donation',
        user_id: 0, // no user for guest donations
        donationId: donation.id,
        notes: {
            donor_name: donorName,
            donor_email: donorEmail,
            type: 'DONATION',
        },
    });

    const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true' && process.env.NODE_ENV !== 'production';

    return {
        donation,
        razorpayOrderId: result.order.id,
        amount: amount * 100, // paise for Razorpay modal
        currency: 'INR',
        key: useMockPayment ? 'rzp_test_mock' : result.keyId,
    };
}

/**
 * Verify donation payment after Razorpay checkout.
 */
export async function verifyDonationPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}) {
    const isValid = paymentService.verifyPaymentSignature(data);
    if (!isValid) throw new AppError('Invalid payment signature', 400);

    const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: data.razorpay_order_id },
    });
    if (!payment) throw new AppError('Payment not found', 404);

    if (payment.status === 'COMPLETED') {
        return { success: true, message: 'Donation already verified.' };
    }

    // Update payment status
    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: 'COMPLETED',
            razorpayPaymentId: data.razorpay_payment_id,
            razorpaySignature: data.razorpay_signature,
        },
    });

    // Update donation status
    if (payment.donationId) {
        await prisma.donation.update({
            where: { id: payment.donationId },
            data: { status: 'COMPLETED' },
        });
    }

    return {
        success: true,
        message: 'Thank you for your donation!',
    };
}

/**
 * Get paginated list of donations (admin).
 */
export async function getDonations(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
        where.OR = [
            { donorName: { contains: query.search } },
            { donorEmail: { contains: query.search } },
        ];
    }

    const [donations, total] = await Promise.all([
        prisma.donation.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                payment: {
                    select: {
                        razorpayPaymentId: true,
                        razorpayOrderId: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.donation.count({ where }),
    ]);

    return {
        donations,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get donation statistics (admin).
 */
export async function getDonationStats() {
    const [totalResult, countResult] = await Promise.all([
        prisma.donation.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true },
            _count: true,
            _avg: { amount: true },
        }),
        prisma.donation.count(),
    ]);

    return {
        totalRaised: Number(totalResult._sum.amount || 0),
        completedCount: totalResult._count,
        totalCount: countResult,
        avgDonation: Number(totalResult._avg.amount || 0),
    };
}

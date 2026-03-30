import { Request, Response, NextFunction } from 'express';
import * as donationService from '../services/donation.service';

/**
 * POST /donate — public, no auth
 */
export const createDonation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { donorName, donorEmail, donorPhone, amount, message, isAnonymous } = req.body;

        if (!donorName || !donorEmail || !amount) {
            return res.status(400).json({
                success: false,
                message: 'donorName, donorEmail, and amount are required.',
            });
        }

        const result = await donationService.createDonation({
            donorName,
            donorEmail,
            donorPhone,
            amount: Number(amount),
            message,
            isAnonymous: isAnonymous === true,
        });

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /donate/verify — public, signature verified
 */
export const verifyDonationPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification fields.',
            });
        }

        const result = await donationService.verifyDonationPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /admin/donations — GLOBAL_ADMIN
 */
export const listDonations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, status, search } = req.query;
        const result = await donationService.getDonations({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status: status as string | undefined,
            search: search as string | undefined,
        });
        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /admin/donations/stats — GLOBAL_ADMIN
 */
export const getDonationStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await donationService.getDonationStats();
        return res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

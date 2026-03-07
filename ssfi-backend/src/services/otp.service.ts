import { AppError } from '../utils/errors';
import { emailService } from './email.service';

import prisma from '../config/prisma';
class OTPService {
  /**
   * Generate random numeric OTP
   */
  generateOTP(length: number = parseInt(process.env.OTP_LENGTH || '6')): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  /**
   * Calculate OTP expiry time
   */
  getOTPExpiry(): Date {
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
    return expiry;
  }

  /**
   * Send OTP via email
   * Looks up the user by phone to get their email address
   */
  async sendOTP(phone: string): Promise<string> {
    const otp = this.generateOTP();
    const otpExpiry = this.getOTPExpiry();
    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || '10';

    // Save OTP to DB
    const user = await prisma.user.update({
      where: { phone },
      data: { otp, otpExpiry },
      select: { email: true, uid: true },
    });

    if (user.email) {
      // Send via email
      emailService.sendOTPEmail(user.email, otp, parseInt(expiryMinutes));
    } else {
      // No email on record — log to console in dev, fail gracefully in prod
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️  No email for phone ${phone}. OTP: ${otp}`);
      } else {
        throw new AppError('No email address found for this account. Please contact SSFI support.', 400);
      }
    }

    // Always return OTP in development for easy testing
    if (process.env.NODE_ENV === 'development') {
      return otp;
    }

    return 'OTP sent to your registered email address';
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { otp: true, otpExpiry: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.otp || !user.otpExpiry) {
      throw new AppError('No OTP found. Please request a new one.', 400);
    }

    if (new Date() > user.otpExpiry) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    if (user.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    return true;
  }

  /**
   * Clear OTP after successful verification
   */
  async clearOTP(phone: string): Promise<void> {
    await prisma.user.update({
      where: { phone },
      data: { otp: null, otpExpiry: null },
    });
  }

  /**
   * Send OTP for registration phone verification
   */
  async sendRegistrationOTP(phone: string): Promise<void> {
    await this.sendOTP(phone);
  }

  /**
   * Send OTP for password reset
   */
  async sendPasswordResetOTP(phone: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return; // Don't reveal if user exists
    await this.sendOTP(phone);
  }

  /**
   * Rate limit check — prevent OTP spam
   */
  async checkRateLimit(phone: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { otpExpiry: true },
    });

    if (!user) return true;

    if (user.otpExpiry && new Date() < user.otpExpiry) {
      const timeDiff = user.otpExpiry.getTime() - new Date().getTime();
      const minutesRemaining = Math.ceil(timeDiff / 60000);

      if (minutesRemaining > (parseInt(process.env.OTP_EXPIRY_MINUTES || '10') - 1)) {
        throw new AppError('Please wait before requesting a new OTP', 429);
      }
    }

    return true;
  }
}

export default new OTPService();

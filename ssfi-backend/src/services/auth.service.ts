import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import otpService from './otp.service';
import uidService from './uid.service';

import prisma from '../config/prisma';
interface RegisterData {
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
  context?: {
    stateId?: number;
    districtId?: number;
    clubId?: number;
    stateCode?: string;
    districtCode?: string;
    clubCode?: string;
  };
}

interface LoginResponse {
  user: {
    id: number;
    uid: string;
    name?: string;
    profile_photo?: string;
    phone: string;
    email?: string;
    role: UserRole;
    isApproved: boolean;
    expiryDate?: Date | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  /**
   * Generate JWT Access Token
   */
  generateAccessToken(
    userId: number,
    uid: string,
    role: UserRole,
    phone: string,
    email?: string,
    stateId?: number,
    districtId?: number,
    clubId?: number,
    studentId?: number
  ): string {
    return jwt.sign(
      { id: userId, uid, role, phone, email, stateId, districtId, clubId, studentId },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '24h' } as jwt.SignOptions
    );
  }

  /**
   * Generate JWT Refresh Token
   */
  generateRefreshToken(userId: number): string {
    return jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' } as jwt.SignOptions
    );
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  /**
   * Compare password
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Calculate expiry date (1 year from now)
   */
  calculateExpiryDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ userId: number; uid: string }> {
    const { phone, email, password, role, context } = data;

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      throw new AppError('Phone number already registered', 400);
    }

    // Generate UID
    let uidRole: 'STUDENT' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB' | null = null;
    let uidContext: { stateId?: number; districtId?: number; clubId?: number } = {};

    switch (role) {
      case UserRole.STUDENT:
        uidRole = 'STUDENT';
        uidContext = { stateId: context?.stateId, districtId: context?.districtId, clubId: context?.clubId };
        break;
      case UserRole.STATE_SECRETARY:
        uidRole = 'STATE_SECRETARY';
        uidContext = { stateId: context?.stateId };
        break;
      case UserRole.DISTRICT_SECRETARY:
        uidRole = 'DISTRICT_SECRETARY';
        uidContext = { stateId: context?.stateId, districtId: context?.districtId };
        break;
      case UserRole.CLUB_OWNER:
        uidRole = 'CLUB';
        uidContext = { stateId: context?.stateId, districtId: context?.districtId };
        break;
    }

    let uid = '';
    if (uidRole) {
      // If we don't have IDs but have codes, we might need to lookup. 
      // Assuming context has IDs for now as per interface. 
      // If codes are present but IDs missing, force lookup (simplified for now to rely on IDs)
      uid = await uidService.generateUID(uidRole, uidContext);
    } else {
      // Fallback for non-standard roles or Global Admin
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      uid = `SSFI-${role.substring(0, 3)}-${randomPart}`;
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Calculate expiry date (Global Admin doesn't expire)
    const expiryDate = role === UserRole.GLOBAL_ADMIN ? null : this.calculateExpiryDate();

    // Create user
    const user = await prisma.user.create({
      data: {
        uid,
        phone,
        email,
        password: hashedPassword,
        role,
        expiryDate,
        isApproved: role === UserRole.GLOBAL_ADMIN, // Auto-approve Global Admin
        approvalStatus: role === UserRole.GLOBAL_ADMIN ? 'APPROVED' : 'PENDING'
      }
    });

    // Send OTP for phone verification
    await otpService.sendOTP(phone);

    return {
      userId: user.id,
      uid: user.uid
    };
  }

  /**
   * Login user — accepts phone number or SSFI UID as identifier
   */
  async login(identifier: string, password: string): Promise<LoginResponse> {
    // Detect if identifier is a phone number or UID
    const isPhone = /^[6-9]\d{9}$/.test(identifier);

    // Find user — prefer approved+active user, fall back to any match
    const baseWhere = isPhone ? { phone: identifier } : { uid: identifier };
    const userSelect = {
      id: true,
      uid: true,
      phone: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
      isApproved: true,
      otpVerified: true,
      expiryDate: true,
      statePerson: {
        select: { stateId: true, name: true, profilePhoto: true }
      },
      districtPerson: {
        select: { districtId: true, name: true, profilePhoto: true }
      },
      clubOwner: {
        select: { clubId: true, name: true, profilePhoto: true }
      },
      student: {
        select: { id: true, clubId: true, name: true, profilePhoto: true }
      }
    };

    // Try approved user first, then any user
    const user = await prisma.user.findFirst({
      where: { ...baseWhere, isApproved: true, isActive: true },
      select: userSelect,
    }) || await prisma.user.findFirst({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // OTP verification check removed — no phone OTP flow exists in the system
    // All user accounts are created through admin approval or registration flows

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is approved (except Global Admin)
    if (!user.isApproved && user.role !== UserRole.GLOBAL_ADMIN) {
      throw new AppError('Your account is pending approval', 403);
    }

    // Check if account has expired - ALLOW login but frontend will handle renewal prompt
    // if (user.expiryDate && new Date() > user.expiryDate) {
    //   throw new AppError('Your membership has expired. Please renew to continue.', 403);
    // }

    // Extract role-specific IDs and name
    const stateId = user.statePerson?.stateId;
    const districtId = user.districtPerson?.districtId;
    const clubId = user.role === 'CLUB_OWNER' ? user.clubOwner?.clubId : user.student?.clubId;
    const studentId = user.student?.id;

    // Get name from the appropriate person record
    const userName = user.statePerson?.name
      || user.districtPerson?.name
      || user.clubOwner?.name
      || user.student?.name
      || undefined;
    const profilePhoto = user.statePerson?.profilePhoto
      || user.districtPerson?.profilePhoto
      || user.clubOwner?.profilePhoto
      || user.student?.profilePhoto
      || undefined;

    // Generate tokens
    const accessToken = this.generateAccessToken(
      user.id,
      user.uid,
      user.role,
      user.phone,
      user.email || undefined,
      stateId,
      districtId,
      clubId,
      studentId
    );
    const refreshToken = this.generateRefreshToken(user.id);

    // Update refresh token and last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLogin: new Date()
      }
    });

    return {
      user: {
        id: user.id,
        uid: user.uid,
        name: userName,
        profile_photo: profilePhoto,
        phone: user.phone,
        email: user.email || undefined,
        role: user.role,
        isApproved: user.isApproved,
        expiryDate: user.expiryDate
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        otp: true,
        otpExpiry: true,
        otpVerified: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.otpVerified) {
      throw new AppError('Phone number already verified', 400);
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

    // Mark as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpVerified: true,
        otp: null,
        otpExpiry: null
      }
    });

    return true;
  }

  /**
   * Resend OTP
   */
  async resendOTP(phone: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, otpVerified: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.otpVerified) {
      throw new AppError('Phone number already verified', 400);
    }

    await otpService.sendOTP(phone);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as { id: number };

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          uid: true,
          phone: true,
          email: true,
          role: true,
          refreshToken: true,
          isActive: true
        }
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(
        user.id,
        user.uid,
        user.role,
        user.phone,
        user.email || undefined
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
  }

  /**
   * Change password
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isValid = await this.comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(phone: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true }
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    await otpService.sendOTP(phone);
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(phone: string, otp: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        otp: true,
        otpExpiry: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.otp || !user.otpExpiry) {
      throw new AppError('No OTP found. Please request password reset again.', 400);
    }

    if (new Date() > user.otpExpiry) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    if (user.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null
      }
    });
  }
  /**
   * Get full profile (user + role-specific fields)
   */
  async getFullProfile(userId: number): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uid: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        accountStatus: true,
        registrationDate: true,
        expiryDate: true,
        statePerson: {
          select: {
            name: true,
            gender: true,
            aadhaarNumber: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            pincode: true,
            profilePhoto: true,
            state: { select: { id: true, name: true } },
          },
        },
        districtPerson: {
          select: {
            name: true,
            gender: true,
            aadhaarNumber: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            pincode: true,
            profilePhoto: true,
            district: { select: { id: true, name: true, state: { select: { id: true, name: true } } } },
          },
        },
        clubOwner: {
          select: {
            name: true,
            gender: true,
            aadhaarNumber: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            pincode: true,
            profilePhoto: true,
            club: { select: { id: true, name: true } },
          },
        },
        student: {
          select: {
            name: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            aadhaarNumber: true,
            fatherName: true,
            motherName: true,
            fatherOccupation: true,
            schoolName: true,
            academicBoard: true,
            nomineeName: true,
            nomineeAge: true,
            nomineeRelation: true,
            coachName: true,
            coachPhone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            pincode: true,
            profilePhoto: true,
            state: { select: { id: true, name: true } },
            district: { select: { id: true, name: true } },
            club: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) throw new AppError('User not found', 404);

    // Flatten role-specific profile into a clean object
    const profile = user.statePerson || user.districtPerson || user.clubOwner || user.student;
    return {
      id: user.id,
      uid: user.uid,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      accountStatus: user.accountStatus,
      registrationDate: user.registrationDate,
      expiryDate: user.expiryDate,
      profile: profile || null,
    };
  }

  /**
   * Update Profile — role-specific fields only (NOT phone, email, aadhaar)
   */
  async updateProfile(userId: number, data: Record<string, any>): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new AppError('User not found', 404);

    // Fields that are NEVER editable via this endpoint
    delete data.phone;
    delete data.email;
    delete data.aadhaarNumber;
    delete data.aadhaarCard;
    delete data.identityProof;

    // Allowed fields per role
    const commonFields = ['name', 'gender', 'addressLine1', 'addressLine2', 'city', 'pincode'];
    const studentFields = [...commonFields, 'dateOfBirth', 'bloodGroup', 'fatherName', 'motherName', 'fatherOccupation', 'schoolName', 'academicBoard', 'nomineeName', 'nomineeAge', 'nomineeRelation', 'coachName', 'coachPhone', 'stateId', 'districtId', 'clubId'];

    const allowedFields = user.role === 'STUDENT' ? studentFields : commonFields;

    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === 'dateOfBirth' && data[key]) {
          updateData[key] = new Date(data[key]);
        } else if (key === 'nomineeAge' && data[key]) {
          updateData[key] = Number(data[key]);
        } else if (['stateId', 'districtId', 'clubId'].includes(key) && data[key]) {
          updateData[key] = Number(data[key]);
        } else {
          updateData[key] = data[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    // Update the right profile table based on role
    if (user.role === 'STATE_SECRETARY') {
      await prisma.statePerson.update({ where: { userId }, data: updateData });
    } else if (user.role === 'DISTRICT_SECRETARY') {
      await prisma.districtPerson.update({ where: { userId }, data: updateData });
    } else if (user.role === 'CLUB_OWNER') {
      await prisma.clubOwner.update({ where: { userId }, data: updateData });
    } else if (user.role === 'STUDENT') {
      await prisma.student.update({ where: { userId }, data: updateData });
    } else {
      throw new AppError('Profile update not available for this role', 400);
    }

    // Return updated full profile
    return this.getFullProfile(userId);
  }
}

export default new AuthService();

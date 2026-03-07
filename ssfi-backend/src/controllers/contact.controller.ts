import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response.util';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types';
import { emailService } from '../services/email.service';

import prisma from '../config/prisma';

// ── PUBLIC: Submit contact form ───────────────────────────────────────────────

export const submitContactForm = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    throw new AppError('Name, email, and message are required', 400);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email address', 400);
  }

  // 1. Save to database
  const saved = await prisma.contactMessage.create({
    data: { name, email, phone: phone || null, subject: subject || null, message },
  });

  // 2. Send notification email (fire-and-forget — don't fail if email fails)
  emailService.sendContactFormNotification({
    name,
    email,
    phone: phone || undefined,
    subject: subject || undefined,
    message,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Your message has been received. We will get back to you within 24 hours.',
    data: { id: saved.id },
  });
});

// ── ADMIN: View inbox ─────────────────────────────────────────────────────────

/** GET /contact/messages — paginated inbox */
export const listContactMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const onlyUnread = req.query.unread === 'true';
  const skip = (page - 1) * limit;

  const where = onlyUnread ? { isRead: false } : {};

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return successResponse(res, {
    data: {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount: await prisma.contactMessage.count({ where: { isRead: false } }),
    },
  });
});

/** GET /contact/messages/:id */
export const getContactMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) throw new AppError('Message not found', 404);

  // Auto-mark as read when opened
  if (!msg.isRead) {
    await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  return successResponse(res, { data: { ...msg, isRead: true } });
});

/** PATCH /contact/messages/:id/read */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) throw new AppError('Message not found', 404);

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });

  return successResponse(res, { message: 'Marked as read', data: updated });
});

/** DELETE /contact/messages/:id */
export const deleteContactMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) throw new AppError('Message not found', 404);

  await prisma.contactMessage.delete({ where: { id } });
  return successResponse(res, { message: 'Message deleted' });
});


import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response.util';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types';

import prisma from '../config/prisma';
// ── Nodemailer transporter (generic SMTP) ─────────────────────────────────────
// Configure via .env:
//   SMTP_HOST=smtp.example.com
//   SMTP_PORT=587
//   SMTP_SECURE=false          (true for port 465 SSL)
//   SMTP_USER=your@email.com
//   SMTP_PASS=yourpassword
//   SMTP_FROM_NAME=SSFI Website
//   SMTP_FROM_EMAIL=noreply@ssfiskate.com
//   CONTACT_RECEIVER_EMAIL=admin@ssfiskate.com

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const FROM_ADDRESS = `"${process.env.SMTP_FROM_NAME || 'SSFI Website'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;
const RECEIVER_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || '';

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

  // 2. Send notification email (non-blocking — don't fail if email fails)
  if (RECEIVER_EMAIL && process.env.SMTP_HOST) {
    try {
      const transporter = createTransporter();

      const subjectLine = subject
        ? `Contact Form: ${subject}`
        : `New Contact Form Message from ${name}`;

      await transporter.sendMail({
        from: FROM_ADDRESS,
        to: RECEIVER_EMAIL,
        replyTo: `"${name}" <${email}>`,
        subject: subjectLine,
        html: buildEmailHtml({ name, email, phone, subject, message }),
        text: buildEmailText({ name, email, phone, subject, message }),
      });
    } catch (emailErr) {
      // Log but don't fail the request — message is already saved to DB
      console.error('[Contact] Email sending failed:', emailErr);
    }
  }

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

// ── Email template helpers ────────────────────────────────────────────────────

interface EmailData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

function buildEmailHtml(data: EmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f6f8; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #10b981, #0d9488); padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 28px 32px; }
    .field { margin-bottom: 18px; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .value { font-size: 15px; color: #111827; }
    .message-box { background: #f9fafb; border-left: 4px solid #10b981; border-radius: 6px; padding: 16px; margin-top: 8px; font-size: 15px; color: #374151; line-height: 1.6; white-space: pre-wrap; }
    .footer { background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Contact Form Message</h1>
      <p>Speed Skating Federation of India — Website</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">From</div>
        <div class="value">${escapeHtml(data.name)}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${escapeHtml(data.email)}" style="color:#10b981;">${escapeHtml(data.email)}</a></div>
      </div>
      ${data.phone ? `<div class="field"><div class="label">Phone</div><div class="value">${escapeHtml(data.phone)}</div></div>` : ''}
      ${data.subject ? `<div class="field"><div class="label">Subject</div><div class="value">${escapeHtml(data.subject)}</div></div>` : ''}
      <hr class="divider" />
      <div class="field">
        <div class="label">Message</div>
        <div class="message-box">${escapeHtml(data.message)}</div>
      </div>
    </div>
    <div class="footer">
      This message was submitted via the contact form on ssfiskate.com
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText(data: EmailData): string {
  return [
    '=== New Contact Form Message — SSFI Website ===',
    '',
    `From:    ${data.name}`,
    `Email:   ${data.email}`,
    data.phone ? `Phone:   ${data.phone}` : null,
    data.subject ? `Subject: ${data.subject}` : null,
    '',
    '--- Message ---',
    data.message,
    '',
    '--- Sent from ssfiskate.com contact form ---',
  ]
    .filter(line => line !== null)
    .join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

import { Request, Response } from 'express';
import { generateCertificatePDF, buildCertificateData, issueCertificatesForEvent } from '../services/certificate.service';

import prisma from '../config/prisma';
export const certificateController = {

  // ── STUDENT: Get my certificates ─────────────────────────────────────────────
  getMyCertificates: async (req: Request, res: Response) => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID not found' });
      }

      const certs = await prisma.certificate.findMany({
        where: { studentId },
        include: {
          event: {
            select: {
              id: true, name: true, eventDate: true, eventEndDate: true,
              city: true, venue: true, category: true,
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      });

      const result = certs.map(c => ({
        id:                c.id,
        certificateNumber: c.certificateNumber,
        eventId:           c.eventId,
        eventName:         c.event.name,
        eventDate:         c.event.eventDate,
        eventEndDate:      c.event.eventEndDate,
        city:              c.event.city,
        venue:             c.event.venue,
        eventCategory:     c.event.category,
        skateCategory:     c.category,
        position:          c.position,
        issuedAt:          c.issuedAt,
        downloadUrl:       `/api/v1/certificates/${c.id}/download`,
      }));

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
    }
  },

  // ── STUDENT / ADMIN: Download a single certificate as PDF ────────────────────
  downloadCertificate: async (req: Request, res: Response) => {
    try {
      const certId = Number(req.params.id);
      if (isNaN(certId)) return res.status(400).json({ success: false, message: 'Invalid certificate ID' });

      const cert = await prisma.certificate.findUnique({ where: { id: certId } });
      if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

      // Authorization: student can only download their own
      if (req.user?.role === 'STUDENT' && cert.studentId !== req.user.studentId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const data   = await buildCertificateData(certId);
      const buffer = await generateCertificatePDF(data);

      const filename = `SSFI_Certificate_${cert.certificateNumber}.pdf`;
      res.setHeader('Content-Type',        'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length',       buffer.length);
      res.send(buffer);

    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate certificate' });
    }
  },

  // ── ADMIN: Preview certificate in browser (inline) ───────────────────────────
  previewCertificate: async (req: Request, res: Response) => {
    try {
      const certId = Number(req.params.id);
      const data   = await buildCertificateData(certId);
      const buffer = await generateCertificatePDF(data);

      res.setHeader('Content-Type',        'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
      res.setHeader('Content-Length',       buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json({ success: false, message: 'Preview failed' });
    }
  },

  // ── ADMIN: Issue all certificates for an event (called when results published) ─
  issueCertificates: async (req: Request, res: Response) => {
    try {
      const eventId = Number(req.params.eventId);
      if (isNaN(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID' });

      const { issued, skipped } = await issueCertificatesForEvent(eventId);
      res.json({
        success: true,
        message: `Certificates issued: ${issued}, already existed: ${skipped}`,
        data: { issued, skipped },
      });
    } catch (error) {
      console.error('Error issuing certificates:', error);
      res.status(500).json({ success: false, message: 'Failed to issue certificates' });
    }
  },

  // ── ADMIN: List all certificates for an event ─────────────────────────────────
  getEventCertificates: async (req: Request, res: Response) => {
    try {
      const eventId = Number(req.params.eventId);
      const certs = await prisma.certificate.findMany({
        where: { eventId },
        include: {
          student: { select: { name: true, membershipId: true } },
          event:   { select: { name: true, eventDate: true } },
        },
        orderBy: { issuedAt: 'asc' },
      });

      res.json({ success: true, data: certs });
    } catch (error) {
      console.error('Error fetching event certificates:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
    }
  },

  // ── PUBLIC: Verify a certificate by cert number ───────────────────────────────
  verifyCertificate: async (req: Request, res: Response) => {
    try {
      const { certNumber } = req.params;
      const cert = await prisma.certificate.findFirst({
        where: { certificateNumber: certNumber },
        include: {
          student: { select: { name: true, membershipId: true } },
          event:   { select: { name: true, eventDate: true, city: true } },
        },
      });

      if (!cert) {
        return res.status(404).json({ success: false, valid: false, message: 'Certificate not found' });
      }

      res.json({
        success: true,
        valid: true,
        data: {
          certificateNumber: cert.certificateNumber,
          studentName:       cert.student.name,
          membershipId:      cert.student.membershipId,
          eventName:         cert.event.name,
          eventDate:         cert.event.eventDate,
          city:              cert.event.city,
          issuedAt:          cert.issuedAt,
        },
      });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ success: false, message: 'Verification failed' });
    }
  },
};

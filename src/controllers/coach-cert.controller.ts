import { Request, Response } from 'express';
import coachCertService from '../services/coach-cert.service';
import {
  createProgramSchema, updateProgramSchema, programQuerySchema,
  coachRegistrationSchema, markCompleteSchema, updateRegStatusSchema,
  certifiedCoachesQuerySchema, registrationsQuerySchema,
} from '../validators/coach-cert.validator';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { deleteCachePattern } from '../utils/cache.util';

// ══════════ PROGRAMS ══════════

export const createProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createProgramSchema.parse(req.body);
  const program = await coachCertService.createProgram(data, req.user!.id.toString());
  deleteCachePattern('/coach-cert');
  return successResponse(res, { statusCode: 201, message: 'Program created successfully', data: program });
});

export const updateProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const data = updateProgramSchema.parse(req.body);
  const program = await coachCertService.updateProgram(id, data, req.user!.id.toString());
  deleteCachePattern('/coach-cert');
  return successResponse(res, { message: 'Program updated successfully', data: program });
});

export const deleteProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await coachCertService.deleteProgram(id);
  deleteCachePattern('/coach-cert');
  return successResponse(res, { message: 'Program cancelled successfully' });
});

export const getProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const program = await coachCertService.getProgramById(id);
  return successResponse(res, { data: program });
});

export const listPrograms = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = programQuerySchema.parse(req.query);
  const result = await coachCertService.listPrograms(query);
  return successResponse(res, { data: result });
});

export const getActivePrograms = asyncHandler(async (req: Request, res: Response) => {
  const programs = await coachCertService.getActivePrograms();
  return successResponse(res, { data: programs });
});

// ══════════ REGISTRATIONS ══════════

export const registerCoach = asyncHandler(async (req: Request, res: Response) => {
  const data = coachRegistrationSchema.parse(req.body);
  const files: { photo?: string; aadhaarCard?: string } = {};
  if (req.files && typeof req.files === 'object') {
    const f = req.files as { [key: string]: Express.Multer.File[] };
    if (f.photo?.[0]) files.photo = f.photo[0].path;
    if (f.aadhaarCard?.[0]) files.aadhaarCard = f.aadhaarCard[0].path;
  }
  const registration = await coachCertService.registerCoach(data, files);
  return successResponse(res, { statusCode: 201, message: 'Registration successful', data: registration });
});

export const initiateRegistration = asyncHandler(async (req: Request, res: Response) => {
  const data = coachRegistrationSchema.parse(req.body);
  const files: { photo?: string; aadhaarCard?: string } = {};
  if (req.files && typeof req.files === 'object') {
    const f = req.files as { [key: string]: Express.Multer.File[] };
    if (f.photo?.[0]) files.photo = f.photo[0].path;
    if (f.aadhaarCard?.[0]) files.aadhaarCard = f.aadhaarCard[0].path;
  }
  const result = await coachCertService.initiateRegistration(data, files);
  return successResponse(res, { statusCode: 201, message: 'Registration initiated. Please complete payment.', data: result });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment details' });
  }
  const result = await coachCertService.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  return successResponse(res, { message: result.message, data: result });
});

export const getProgramRegistrations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const programId = parseInt(req.params.id);
  const query = registrationsQuerySchema.parse(req.query);
  const result = await coachCertService.getRegistrationsByProgram(programId, query);
  return successResponse(res, { data: result });
});

export const exportRegistrations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const programId = parseInt(req.params.id);
  const registrations = await coachCertService.exportRegistrations(programId);

  // Dynamic import to avoid top-level dependency if not installed yet
  let ExcelJS: any;
  try {
    ExcelJS = require('exceljs');
  } catch {
    return res.status(500).json({ success: false, message: 'ExcelJS not installed. Run: npm install exceljs' });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Registrations');

  sheet.columns = [
    { header: 'Reg No', key: 'registrationNumber', width: 22 },
    { header: 'Name', key: 'fullName', width: 25 },
    { header: 'Father Name', key: 'fatherName', width: 25 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'DOB', key: 'dateOfBirth', width: 14 },
    { header: 'Phone', key: 'phone', width: 14 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'State', key: 'state', width: 18 },
    { header: 'District', key: 'district', width: 18 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'Blood Group', key: 'bloodGroup', width: 12 },
    { header: 'Experience (Yrs)', key: 'skatingExperience', width: 16 },
    { header: 'T-Shirt', key: 'tshirtSize', width: 10 },
    { header: 'Aadhaar', key: 'aadhaarNumber', width: 16 },
    { header: 'Payment', key: 'paymentStatus', width: 12 },
    { header: 'Amount', key: 'amount', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Completed', key: 'isCompleted', width: 12 },
    { header: 'Rating', key: 'rating', width: 8 },
    { header: 'Certificate No', key: 'certificateNumber', width: 25 },
  ];

  registrations.forEach(r => {
    sheet.addRow({
      ...r,
      dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString('en-IN') : '',
      amount: Number(r.amount),
      rating: r.rating ? Number(r.rating) : '',
      isCompleted: r.isCompleted ? 'Yes' : 'No',
    });
  });

  // Style header row
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=coach-cert-registrations-${programId}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});

export const markComplete = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const data = markCompleteSchema.parse(req.body);
  const reg = await coachCertService.markComplete(id, data, req.user!.id.toString());
  return successResponse(res, { message: 'Marked as completed', data: reg });
});

export const updateRegistrationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = updateRegStatusSchema.parse(req.body);
  const reg = await coachCertService.updateRegistrationStatus(id, status);
  return successResponse(res, { message: 'Status updated', data: reg });
});

// ══════════ PUBLIC: CERTIFIED COACHES ══════════

export const getCertifiedCoaches = asyncHandler(async (req: Request, res: Response) => {
  const query = certifiedCoachesQuerySchema.parse(req.query);
  const result = await coachCertService.getCertifiedCoaches(query);
  return successResponse(res, { data: result });
});

export default {
  createProgram, updateProgram, deleteProgram, getProgram, listPrograms, getActivePrograms,
  registerCoach, initiateRegistration, verifyPayment, getProgramRegistrations, exportRegistrations,
  markComplete, updateRegistrationStatus, getCertifiedCoaches,
};

import { Request, Response } from 'express';
import beginnerCertService from '../services/beginner-cert.service';
import {
  createProgramSchema, updateProgramSchema, programQuerySchema,
  beginnerRegistrationSchema, markCompleteSchema, updateRegStatusSchema,
  registrationsQuerySchema,
} from '../validators/beginner-cert.validator';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { deleteCachePattern } from '../utils/cache.util';

// ────────── PROGRAMS ──────────

export const createProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createProgramSchema.parse(req.body);
  const program = await beginnerCertService.createProgram(data, req.user!.id.toString());
  deleteCachePattern('/beginner-cert');
  return successResponse(res, { statusCode: 201, message: 'Program created successfully', data: program });
});

export const updateProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const data = updateProgramSchema.parse(req.body);
  const program = await beginnerCertService.updateProgram(id, data, req.user!.id.toString());
  deleteCachePattern('/beginner-cert');
  return successResponse(res, { message: 'Program updated successfully', data: program });
});

export const deleteProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await beginnerCertService.deleteProgram(id);
  deleteCachePattern('/beginner-cert');
  return successResponse(res, { message: 'Program cancelled successfully' });
});

export const getProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const program = await beginnerCertService.getProgramById(id);
  return successResponse(res, { data: program });
});

export const listPrograms = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = programQuerySchema.parse(req.query);
  const result = await beginnerCertService.listPrograms(query);
  return successResponse(res, { data: result });
});

export const getActivePrograms = asyncHandler(async (req: Request, res: Response) => {
  const programs = await beginnerCertService.getActivePrograms();
  return successResponse(res, { data: programs });
});

export const lookupStudent = asyncHandler(async (req: Request, res: Response) => {
  const uid = (req.query.uid as string || '').trim();
  if (!uid) {
    return res.status(400).json({ success: false, message: 'SSFI UID is required' });
  }
  const student = await beginnerCertService.lookupStudentByUID(uid);
  return successResponse(res, { data: student });
});

// ────────── REGISTRATIONS ──────────

export const registerBeginner = asyncHandler(async (req: Request, res: Response) => {
  const data = beginnerRegistrationSchema.parse(req.body);
  const files: { photo?: string; aadhaarCard?: string; birthCertificate?: string } = {};
  if (req.files && typeof req.files === 'object') {
    const f = req.files as { [key: string]: Express.Multer.File[] };
    if (f.photo?.[0]) files.photo = f.photo[0].path;
    if (f.aadhaarCard?.[0]) files.aadhaarCard = f.aadhaarCard[0].path;
    if (f.birthCertificate?.[0]) files.birthCertificate = f.birthCertificate[0].path;
  }
  const registration = await beginnerCertService.registerBeginner(data, files);
  return successResponse(res, { statusCode: 201, message: 'Registration successful', data: registration });
});

export const initiateRegistration = asyncHandler(async (req: Request, res: Response) => {
  const data = beginnerRegistrationSchema.parse(req.body);
  const files: { photo?: string; aadhaarCard?: string; birthCertificate?: string } = {};
  if (req.files && typeof req.files === 'object') {
    const f = req.files as { [key: string]: Express.Multer.File[] };
    if (f.photo?.[0]) files.photo = f.photo[0].path;
    if (f.aadhaarCard?.[0]) files.aadhaarCard = f.aadhaarCard[0].path;
    if (f.birthCertificate?.[0]) files.birthCertificate = f.birthCertificate[0].path;
  }
  const result = await beginnerCertService.initiateRegistration(data, files);
  return successResponse(res, { statusCode: 201, message: 'Registration initiated. Please complete payment.', data: result });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment details' });
  }
  const result = await beginnerCertService.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  return successResponse(res, { message: result.message, data: result });
});

export const getProgramRegistrations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const programId = parseInt(req.params.id);
  const query = registrationsQuerySchema.parse(req.query);
  const result = await beginnerCertService.getRegistrationsByProgram(programId, query);
  return successResponse(res, { data: result });
});

export const exportRegistrations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const programId = parseInt(req.params.id);
  const registrations = await beginnerCertService.exportRegistrations(programId);

  let ExcelJS: any;
  try {
    ExcelJS = require('exceljs');
  } catch {
    return res.status(500).json({ success: false, message: 'ExcelJS not installed. Run: npm install exceljs' });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Registrations');

  sheet.columns = [
    { header: 'Reg No', key: 'registrationNumber', width: 24 },
    { header: 'Name', key: 'fullName', width: 25 },
    { header: 'Father Name', key: 'fatherName', width: 25 },
    { header: 'Mother Name', key: 'motherName', width: 25 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'DOB', key: 'dateOfBirth', width: 14 },
    { header: 'Age', key: 'age', width: 6 },
    { header: 'Phone', key: 'phone', width: 14 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'State', key: 'state', width: 18 },
    { header: 'District', key: 'district', width: 18 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'Blood Group', key: 'bloodGroup', width: 12 },
    { header: 'Exp (Months)', key: 'skatingExperience', width: 14 },
    { header: 'Skill Level', key: 'currentSkillLevel', width: 14 },
    { header: 'Club', key: 'clubName', width: 20 },
    { header: 'T-Shirt', key: 'tshirtSize', width: 10 },
    { header: 'Guardian', key: 'guardianName', width: 25 },
    { header: 'Guardian Phone', key: 'guardianPhone', width: 14 },
    { header: 'Aadhaar', key: 'aadhaarNumber', width: 16 },
    { header: 'Payment', key: 'paymentStatus', width: 12 },
    { header: 'Amount', key: 'amount', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Grade', key: 'grade', width: 14 },
    { header: 'Rating', key: 'rating', width: 8 },
    { header: 'Certificate No', key: 'certificateNumber', width: 28 },
  ];

  // Mask Aadhaar numbers — even admin exports should not contain full Aadhaar
  const maskAadhaar = (v: string | null) => v && v.length >= 4 ? 'XXXX-XXXX-' + v.slice(-4) : v;

  registrations.forEach(r => {
    sheet.addRow({
      ...r,
      dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString('en-IN') : '',
      amount: Number(r.amount),
      rating: r.rating ? Number(r.rating) : '',
      aadhaarNumber: maskAadhaar(r.aadhaarNumber),
    });
  });

  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=beginner-cert-registrations-${programId}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});

export const markComplete = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const data = markCompleteSchema.parse(req.body);
  const reg = await beginnerCertService.markComplete(id, data);
  return successResponse(res, { message: 'Marked as completed', data: reg });
});

export const updateRegistrationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = updateRegStatusSchema.parse(req.body);
  const reg = await beginnerCertService.updateRegistrationStatus(id, status);
  return successResponse(res, { message: 'Status updated', data: reg });
});

export default {
  createProgram, updateProgram, deleteProgram, getProgram, listPrograms, getActivePrograms,
  lookupStudent, registerBeginner, initiateRegistration, verifyPayment, getProgramRegistrations,
  exportRegistrations, markComplete, updateRegistrationStatus,
};

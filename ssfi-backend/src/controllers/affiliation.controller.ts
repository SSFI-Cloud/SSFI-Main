// @ts-nocheck
import { Request, Response } from 'express';
import affiliationService from '../services/affiliation.service';
import {
  registrationWindowSchema,
  updateRegistrationWindowSchema,
  stateSecretaryRegistrationSchema,
  districtSecretaryRegistrationSchema,
  clubRegistrationSchema,
  affiliationQuerySchema,
  registrationWindowQuerySchema,
  RegistrationTypeEnum,
} from '../validators/affiliation.validator';
import { studentRegistrationSchema } from '../validators/student.validator';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types';

// ==========================================
// REGISTRATION WINDOW CONTROLLERS (ADMIN)
// ==========================================

/**
 * @desc    Create a registration window
 * @route   POST /api/v1/affiliations/windows
 * @access  Private (Global Admin)
 */
export const createRegistrationWindow = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = registrationWindowSchema.parse(req.body);

  const window = await affiliationService.createRegistrationWindow(
    validatedData,
    String(req.user!.id)
  );

  return successResponse(res, {
    statusCode: 201,
    message: 'Registration window created successfully',
    data: window,
  });
});

/**
 * @desc    Update a registration window
 * @route   PUT /api/v1/affiliations/windows/:id
 * @access  Private (Global Admin)
 */
export const updateRegistrationWindow = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const validatedData = updateRegistrationWindowSchema.parse(req.body);

  const window = await affiliationService.updateRegistrationWindow(
    id,
    validatedData,
    String(req.user!.id)
  );

  return successResponse(res, {
    message: 'Registration window updated successfully',
    data: window,
  });
});

/**
 * @desc    Get all registration windows
 * @route   GET /api/v1/affiliations/windows
 * @access  Private (Global Admin)
 */
export const getRegistrationWindows = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = registrationWindowQuerySchema.parse(req.query);

  const windows = await affiliationService.getRegistrationWindows(query);

  return successResponse(res, {
    message: 'Registration windows retrieved successfully',
    data: windows,
  });
});

/**
 * @desc    Delete/deactivate a registration window
 * @route   DELETE /api/v1/affiliations/windows/:id
 * @access  Private (Global Admin)
 */
export const deleteRegistrationWindow = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await affiliationService.deleteRegistrationWindow(id, String(req.user!.id));

  return successResponse(res, {
    message: 'Registration window deactivated successfully',
  });
});

// ==========================================
// PUBLIC REGISTRATION STATUS CHECK
// ==========================================

/**
 * @desc    Check registration status for a type
 * @route   GET /api/v1/affiliations/status/:type
 * @access  Public
 */
export const checkRegistrationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;

  const validType = RegistrationTypeEnum.safeParse(type);
  if (!validType.success) {
    throw new AppError('Invalid registration type', 400);
  }

  const status = await affiliationService.isRegistrationOpen(validType.data);

  return successResponse(res, {
    message: 'Registration status retrieved',
    data: status,
  });
});

/**
 * @desc    Get all registration statuses
 * @route   GET /api/v1/affiliations/status
 * @access  Public
 */
export const getAllRegistrationStatuses = asyncHandler(async (req: Request, res: Response) => {
  const [stateSecretary, districtSecretary, club, student] = await Promise.all([
    affiliationService.isRegistrationOpen('STATE_SECRETARY'),
    affiliationService.isRegistrationOpen('DISTRICT_SECRETARY'),
    affiliationService.isRegistrationOpen('CLUB'),
    affiliationService.isRegistrationOpen('STUDENT'),
  ]);

  return successResponse(res, {
    message: 'Registration statuses retrieved',
    data: {
      STATE_SECRETARY: stateSecretary,
      DISTRICT_SECRETARY: districtSecretary,
      CLUB: club,
      STUDENT: student,
    },
  });
});

// ==========================================
// STATE SECRETARY CONTROLLERS
// ==========================================

/**
 * @desc    Register as State Secretary
 * @route   POST /api/v1/affiliations/state-secretary
 * @access  Public (when registration is open)
 */
export const registerStateSecretary = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = stateSecretaryRegistrationSchema.parse(req.body);

  // Get active window
  const { isOpen, window, message } = await affiliationService.isRegistrationOpen('STATE_SECRETARY');

  if (!isOpen || !window) {
    throw new AppError(message, 400);
  }

  const secretary = await affiliationService.registerStateSecretary(
    validatedData,
    window.id
  );

  return successResponse(res, {
    statusCode: 201,
    message: 'State Secretary registration submitted successfully. Pending approval.',
    data: {
      uid: secretary.uid,
      name: secretary.name,
      state: secretary.state,
    },
  });
});

/**
 * @desc    Get all state secretaries
 * @route   GET /api/v1/affiliations/state-secretary
 * @access  Private (Global Admin)
 */
export const listStateSecretaries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = affiliationQuerySchema.parse(req.query);

  const result = await affiliationService.listStateSecretaries(query);

  return successResponse(res, {
    message: 'State secretaries retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Approve/Reject state secretary
 * @route   PUT /api/v1/affiliations/state-secretary/:id/status
 * @access  Private (Global Admin)
 */
export const updateStateSecretaryStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Invalid status. Must be APPROVED or REJECTED', 400);
  }

  if (status === 'REJECTED' && !remarks) {
    throw new AppError('Remarks are required when rejecting', 400);
  }

  const secretary = await affiliationService.updateStateSecretaryStatus(
    id,
    status,
    String(req.user!.id),
    remarks
  );

  return successResponse(res, {
    message: `State Secretary ${status.toLowerCase()} successfully`,
    data: secretary,
  });
});

// ==========================================
// DISTRICT SECRETARY CONTROLLERS
// ==========================================

/**
 * @desc    Initiate District Secretary Registration
 * @route   POST /api/v1/affiliations/district-secretary/initiate
 * @access  Public (when registration is open)
 */
export const initiateDistrictSecretaryRegistration = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  // Note: req.body might contain file fields if multipart/form-data is used, but z.parse handles it?
  // Zod expects strings, but files are in req.files
  // The validator `districtSecretaryRegistrationSchema` expects `identityProof` and `profilePhoto` as strings (paths or base64?)
  // The `upload.middleware` handles file upload and puts files in `req.files`.
  // We need to map `req.files` to `req.body` paths usually.

  // Helper to attach file paths to body
  const body = { ...req.body };
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files.identityProof?.[0]) {
      body.identityProof = files.identityProof[0].path;
    }
    if (files.profilePhoto?.[0]) {
      body.profilePhoto = files.profilePhoto[0].path;
    }
  }

  const validatedData = districtSecretaryRegistrationSchema.parse(body);

  // Get active window
  const { isOpen, window, message } = await affiliationService.isRegistrationOpen('DISTRICT_SECRETARY');

  if (!isOpen || !window) {
    throw new AppError(message, 400);
  }

  const result = await affiliationService.initiateDistrictSecretaryRegistration(
    validatedData,
    window.id
  );

  return successResponse(res, {
    statusCode: 200, // OK, not Created yet fully
    message: 'Registration initiated. Please complete payment.',
    data: result,
  });
});

/**
 * @desc    Verify District Secretary Payment
 * @route   POST /api/v1/affiliations/district-secretary/verify
 * @access  Public
 */
export const verifyDistrictSecretaryPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment details', 400);
  }

  const result = await affiliationService.verifyDistrictSecretaryPayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  return successResponse(res, {
    message: result.message,
    data: result,
  });
});

/**
 * @desc    Get all district secretaries
 * @route   GET /api/v1/affiliations/district-secretary
 * @access  Private (Global Admin, State Secretary)
 */
export const listDistrictSecretaries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = affiliationQuerySchema.parse(req.query);

  // State secretary can only see their state
  if (req.user!.role === 'STATE_SECRETARY') {
    query.stateId = req.user!.stateId;
  }

  const result = await affiliationService.listDistrictSecretaries(query);

  return successResponse(res, {
    message: 'District secretaries retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Approve/Reject district secretary
 * @route   PUT /api/v1/affiliations/district-secretary/:id/status
 * @access  Private (Global Admin, State Secretary)
 */
export const updateDistrictSecretaryStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Invalid status. Must be APPROVED or REJECTED', 400);
  }

  if (status === 'REJECTED' && !remarks) {
    throw new AppError('Remarks are required when rejecting', 400);
  }

  const secretary = await affiliationService.updateDistrictSecretaryStatus(
    id,
    status,
    String(req.user!.id),
    remarks
  );

  return successResponse(res, {
    message: `District Secretary ${status.toLowerCase()} successfully`,
    data: secretary,
  });
});

// ==========================================
// CLUB CONTROLLERS
// ==========================================

/**
 * @desc    Register a Club
 * @route   POST /api/v1/affiliations/club
 * @access  Public (when registration is open)
 */
export const registerClub = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = clubRegistrationSchema.parse(req.body);

  // Get active window
  const { isOpen, window, message } = await affiliationService.isRegistrationOpen('CLUB');

  if (!isOpen || !window) {
    throw new AppError(message, 400);
  }

  const club = await affiliationService.registerClub(
    validatedData,
    window.id
  );

  return successResponse(res, {
    statusCode: 201,
    message: 'Club registration submitted successfully. Pending approval.',
    data: {
      uid: club.uid,
      name: club.name,
      code: club.code,
      state: club.state,
      district: club.district,
    },
  });
});

/**
 * @desc    Get all clubs
 * @route   GET /api/v1/affiliations/club
 * @access  Private (Global Admin, State Secretary, District Secretary)
 */
export const listClubs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = affiliationQuerySchema.parse(req.query);

  // Apply hierarchy filter
  if (req.user!.role === 'STATE_SECRETARY') {
    query.stateId = req.user!.stateId;
  } else if (req.user!.role === 'DISTRICT_SECRETARY') {
    query.districtId = req.user!.districtId;
  }

  const result = await affiliationService.listClubs(query);

  return successResponse(res, {
    message: 'Clubs retrieved successfully',
    data: result,
  });
});

/**
 * @desc    Approve/Reject club
 * @route   PUT /api/v1/affiliations/club/:id/status
 * @access  Private (Global Admin, State Secretary, District Secretary)
 */
export const updateClubStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Invalid status. Must be APPROVED or REJECTED', 400);
  }

  if (status === 'REJECTED' && !remarks) {
    throw new AppError('Remarks are required when rejecting', 400);
  }

  const club = await affiliationService.updateClubStatus(
    id,
    status,
    String(req.user!.id),
    remarks
  );

  return successResponse(res, {
    message: `Club ${status.toLowerCase()} successfully`,
    data: club,
  });
});

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

/**
 * @desc    Register a Student
 * @route   POST /api/v1/affiliations/student
 * @access  Public (when registration is open)
 */
export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  // Helper to attach file paths to body
  const body = { ...req.body };
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files.profilePhoto?.[0]) {
      body.profilePhoto = files.profilePhoto[0].path;
    }
    if (files.aadhaarCardImage?.[0]) {
      body.aadhaarCardImage = files.aadhaarCardImage[0].path;
    }
    if (files.birthCertificate?.[0]) {
      body.birthCertificate = files.birthCertificate[0].path;
    }
  }

  // Handle number/boolean parsing from FormData
  if (body.termsAccepted === 'true') body.termsAccepted = true;
  if (body.nomineeAge) body.nomineeAge = Number(body.nomineeAge);

  const validatedData = studentRegistrationSchema.parse(body);

  // Get active window
  const { isOpen, window, message } = await affiliationService.isRegistrationOpen('STUDENT');

  if (!isOpen || !window) {
    throw new AppError(message, 400);
  }

  const student = await affiliationService.registerStudent(
    validatedData,
    window.id
  );

  return successResponse(res, {
    statusCode: 201,
    message: 'Student registration submitted successfully.',
    data: {
      uid: student.uid,
      name: student.name,
      club: student.club,
    },
  });
});

/**
 * @desc    Initiate Student Registration with Payment
 * @route   POST /api/v1/affiliations/student/initiate
 * @access  Public (when registration is open)
 */
export const initiateStudentRegistration = asyncHandler(async (req: Request, res: Response) => {
  // Same body/file parsing as registerStudent
  const body = { ...req.body };
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files.profilePhoto?.[0]) body.profilePhoto = files.profilePhoto[0].path;
    if (files.aadhaarCardImage?.[0]) body.aadhaarCardImage = files.aadhaarCardImage[0].path;
    if (files.birthCertificate?.[0]) body.birthCertificate = files.birthCertificate[0].path;
  }

  if (body.termsAccepted === 'true') body.termsAccepted = true;
  if (body.nomineeAge) body.nomineeAge = Number(body.nomineeAge);

  const validatedData = studentRegistrationSchema.parse(body);

  const { isOpen, window, message } = await affiliationService.isRegistrationOpen('STUDENT');
  if (!isOpen || !window) {
    throw new AppError(message, 400);
  }

  const result = await affiliationService.initiateStudentRegistration(validatedData, window.id);

  return successResponse(res, {
    statusCode: 201,
    message: 'Registration initiated. Please complete payment.',
    data: result,
  });
});

/**
 * @desc    Verify Student Registration Payment
 * @route   POST /api/v1/affiliations/student/verify
 * @access  Public
 */
export const verifyStudentPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment details', 400);
  }

  const result = await affiliationService.verifyStudentPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  return successResponse(res, {
    message: result.message,
    data: result,
  });
});

// ==========================================
// LOOKUP & RENEWAL CONTROLLERS
// ==========================================

/**
 * @desc    Look up an existing member
 * @route   GET /api/v1/affiliations/lookup?type=X&identifier=Y
 * @access  Public
 */
export const lookupMember = asyncHandler(async (req: Request, res: Response) => {
  const { type, identifier } = req.query as { type: string; identifier: string };

  if (!type || !identifier) {
    throw new AppError('type and identifier query params are required', 400);
  }

  const validType = RegistrationTypeEnum.safeParse(type);
  if (!validType.success) {
    throw new AppError('Invalid registration type', 400);
  }

  const member = await affiliationService.lookupMember(validType.data, identifier.trim());

  return successResponse(res, {
    message: 'Member found',
    data: member,
  });
});

/**
 * @desc    Initiate renewal payment
 * @route   POST /api/v1/affiliations/renew/initiate
 * @access  Public
 */
export const initiateRenewal = asyncHandler(async (req: Request, res: Response) => {
  const { type, identifier } = req.body;

  if (!type || !identifier) {
    throw new AppError('type and identifier are required', 400);
  }

  const validType = RegistrationTypeEnum.safeParse(type);
  if (!validType.success) {
    throw new AppError('Invalid registration type', 400);
  }

  const { isOpen, window, message } = await affiliationService.isRegistrationOpen(validType.data);
  if (!isOpen || !window) {
    throw new AppError(message, 400);
  }

  const result = await affiliationService.initiateRenewal(
    validType.data,
    identifier.trim(),
    window.id
  );

  return successResponse(res, {
    message: 'Renewal payment initiated. Please complete payment.',
    data: result,
  });
});

/**
 * @desc    Verify renewal payment
 * @route   POST /api/v1/affiliations/renew/verify
 * @access  Public
 */
export const verifyRenewal = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment details', 400);
  }

  const result = await affiliationService.verifyRenewal({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  return successResponse(res, {
    message: result.message,
    data: result,
  });
});

export default {
  // Registration Windows
  createRegistrationWindow,
  updateRegistrationWindow,
  getRegistrationWindows,
  deleteRegistrationWindow,

  // Status Check
  checkRegistrationStatus,
  getAllRegistrationStatuses,

  // State Secretary
  registerStateSecretary,
  listStateSecretaries,
  updateStateSecretaryStatus,

  // District Secretary
  initiateDistrictSecretaryRegistration,
  verifyDistrictSecretaryPayment,
  listDistrictSecretaries,
  updateDistrictSecretaryStatus,

  // Club
  registerClub,
  listClubs,
  updateClubStatus,

  // Student
  registerStudent,
  initiateStudentRegistration,
  verifyStudentPayment,

  // Lookup & Renewal
  lookupMember,
  initiateRenewal,
  verifyRenewal,
};

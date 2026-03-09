import { Router } from 'express';
import affiliationController from '../controllers/affiliation.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { injectScopeFilters, verifyApprovalScope } from '../middleware/scope.middleware';
import { uploadFields } from '../middleware/upload.middleware';

const router = Router();

// File upload configuration
const secretaryUpload = uploadFields([
  { name: 'identityProof', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
]);

const clubUpload = uploadFields([
  { name: 'clubLogo', maxCount: 1 },
]);

// ==========================================
// PUBLIC ROUTES (Registration Status)
// ==========================================

/**
 * @route   GET /api/v1/affiliations/status
 * @desc    Get all registration statuses
 * @access  Public
 */
router.get('/status', affiliationController.getAllRegistrationStatuses);

/**
 * @route   GET /api/v1/affiliations/status/:type
 * @desc    Check registration status for a specific type
 * @access  Public
 */
router.get('/status/:type', affiliationController.checkRegistrationStatus);

// ==========================================
// PUBLIC REGISTRATION ROUTES
// ==========================================

/**
 * @route   POST /api/v1/affiliations/state-secretary
 * @desc    Register as State Secretary
 * @access  Public (when registration is open)
 */
router.post('/state-secretary', secretaryUpload, affiliationController.registerStateSecretary);

/**
 * @route   POST /api/v1/affiliations/district-secretary/initiate
 * @desc    Initiate District Secretary Registration
 * @access  Public (when registration is open)
 */
router.post('/district-secretary/initiate', secretaryUpload, affiliationController.initiateDistrictSecretaryRegistration);

/**
 * @route   POST /api/v1/affiliations/district-secretary/verify
 * @desc    Verify District Secretary Payment
 * @access  Public
 */
router.post('/district-secretary/verify', affiliationController.verifyDistrictSecretaryPayment);

/**
 * @route   POST /api/v1/affiliations/club
 * @desc    Register a Club
 * @access  Public (when registration is open)
 */
router.post('/club', clubUpload, affiliationController.registerClub);

const studentUpload = uploadFields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  // Note: aadhaarCardImage removed — KYC OTP verification replaces document upload
]);

/**
 * @route   POST /api/v1/affiliations/student/initiate
 * @desc    Initiate Student Registration with Payment
 * @access  Public (when registration is open)
 */
router.post('/student/initiate', studentUpload, affiliationController.initiateStudentRegistration);

/**
 * @route   POST /api/v1/affiliations/student/verify
 * @desc    Verify Student Registration Payment
 * @access  Public
 */
router.post('/student/verify', affiliationController.verifyStudentPayment);

/**
 * @route   POST /api/v1/affiliations/student
 * @desc    Register a Student
 * @access  Public (when registration is open)
 */
router.post('/student', studentUpload, affiliationController.registerStudent);

/**
 * @route   GET /api/v1/affiliations/lookup
 * @desc    Look up an existing member by phone or UID
 * @access  Public
 * @query   type (STATE_SECRETARY|DISTRICT_SECRETARY|CLUB|STUDENT), identifier (phone/uid)
 */
router.get('/lookup', affiliationController.lookupMember);

/**
 * @route   POST /api/v1/affiliations/renew/initiate
 * @desc    Initiate membership renewal payment
 * @access  Public
 */
router.post('/renew/initiate', affiliationController.initiateRenewal);

/**
 * @route   POST /api/v1/affiliations/renew/verify
 * @desc    Verify renewal payment
 * @access  Public
 */
router.post('/renew/verify', affiliationController.verifyRenewal);

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================

router.use(authenticate);

// ==========================================
// REGISTRATION WINDOW MANAGEMENT (Admin Only)
// ==========================================

/**
 * @route   GET /api/v1/affiliations/windows
 * @desc    Get all registration windows
 * @access  Private (Global Admin)
 */
router.get(
  '/windows',
  requireRole('GLOBAL_ADMIN'),
  affiliationController.getRegistrationWindows
);

/**
 * @route   POST /api/v1/affiliations/windows
 * @desc    Create a registration window
 * @access  Private (Global Admin)
 */
router.post(
  '/windows',
  requireRole('GLOBAL_ADMIN'),
  affiliationController.createRegistrationWindow
);

/**
 * @route   PUT /api/v1/affiliations/windows/:id
 * @desc    Update a registration window
 * @access  Private (Global Admin)
 */
router.put(
  '/windows/:id',
  requireRole('GLOBAL_ADMIN'),
  affiliationController.updateRegistrationWindow
);

/**
 * @route   DELETE /api/v1/affiliations/windows/:id
 * @desc    Delete/deactivate a registration window
 * @access  Private (Global Admin)
 */
router.delete(
  '/windows/:id',
  requireRole('GLOBAL_ADMIN'),
  affiliationController.deleteRegistrationWindow
);

// ==========================================
// STATE SECRETARY MANAGEMENT
// ==========================================

/**
 * @route   GET /api/v1/affiliations/state-secretaries
 * @desc    Get all state secretaries
 * @access  Private (Global Admin)
 */
router.get(
  '/state-secretaries',
  requireRole('GLOBAL_ADMIN'),
  affiliationController.listStateSecretaries
);

/**
 * @route   PUT /api/v1/affiliations/state-secretary/:id/status
 * @desc    Approve/Reject state secretary
 * @access  Private (Global Admin)
 */
router.put(
  '/state-secretary/:id/status',
  requireRole('GLOBAL_ADMIN'),
  affiliationController.updateStateSecretaryStatus
);

// ==========================================
// DISTRICT SECRETARY MANAGEMENT
// ==========================================

/**
 * @route   GET /api/v1/affiliations/district-secretaries
 * @desc    Get all district secretaries (scoped by user's state)
 * @access  Private (Global Admin, State Secretary)
 */
router.get(
  '/district-secretaries',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  injectScopeFilters,
  affiliationController.listDistrictSecretaries
);

/**
 * @route   PUT /api/v1/affiliations/district-secretary/:id/status
 * @desc    Approve/Reject district secretary (must be in user's state)
 * @access  Private (Global Admin, State Secretary)
 */
router.put(
  '/district-secretary/:id/status',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  verifyApprovalScope('district_secretary'),
  affiliationController.updateDistrictSecretaryStatus
);

// ==========================================
// CLUB MANAGEMENT
// ==========================================

/**
 * @route   GET /api/v1/affiliations/clubs
 * @desc    Get all clubs (scoped by user's state/district)
 * @access  Private (Global Admin, State Secretary, District Secretary)
 */
router.get(
  '/clubs',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'),
  injectScopeFilters,
  affiliationController.listClubs
);

/**
 * @route   PUT /api/v1/affiliations/club/:id/status
 * @desc    Approve/Reject club (must be in user's state/district)
 * @access  Private (Global Admin, State Secretary, District Secretary)
 */
router.put(
  '/club/:id/status',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'),
  verifyApprovalScope('club'),
  affiliationController.updateClubStatus
);

export default router;


import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../utils/errors';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = [
  'uploads/documents',
  'uploads/photos',
  'uploads/signatures',
  'uploads/banners',
  'uploads/certificates',
  'uploads/temp'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';

    if (file.fieldname.includes('photo') || file.fieldname.includes('image') || file.fieldname.includes('logo')) {
      uploadPath = 'uploads/photos';
    } else if (file.fieldname.includes('document') || file.fieldname.includes('identity') || file.fieldname.includes('aadhaar')) {
      uploadPath = 'uploads/documents';
    } else if (file.fieldname.includes('signature')) {
      uploadPath = 'uploads/signatures';
    } else if (file.fieldname.includes('banner')) {
      uploadPath = 'uploads/banners';
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Get allowed types based on field name
  let allowedTypes: string[] = [];

  if (file.fieldname.includes('photo') || file.fieldname.includes('image') ||
    file.fieldname.includes('banner') || file.fieldname.includes('logo') ||
    file.fieldname.includes('signature')) {
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  } else if (file.fieldname.includes('aadhaar') || file.fieldname.includes('identity') ||
    file.fieldname.includes('document')) {
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  } else {
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      400
    ));
  }
};

// File size limits
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  files: 10
};

// Base upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits
});

/**
 * Single file upload
 */
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};

/**
 * Multiple files upload
 */
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Multiple fields upload
 */
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
  return upload.fields(fields);
};

/**
 * Profile photo upload configuration
 * Used for: Student photos, Secretary photos, Club owner photos
 */
export const uploadProfilePhoto = uploadSingle('profilePhoto');

/**
 * Document upload configuration
 * Used for: Aadhaar cards, Identity proofs
 */
export const uploadDocument = uploadSingle('document');

/**
 * Event banner upload
 */
export const uploadEventBanner = uploadSingle('bannerImage');

/**
 * Signature uploads (for certificates)
 */
export const uploadSignatures = uploadFields([
  { name: 'secretarySignature', maxCount: 1 },
  { name: 'presidentSignature', maxCount: 1 }
]);

/**
 * Student registration document upload
 */
export const uploadStudentDocuments = uploadFields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 }
]);

/**
 * Gallery images upload
 */
export const uploadGalleryImages = uploadMultiple('images', 20);

/**
 * Sponsor logo upload
 */
export const uploadSponsorLogo = uploadSingle('logo');

/**
 * Slider image upload
 */
export const uploadSliderImage = uploadSingle('image');

/**
 * Club/State/District logo upload
 */
export const uploadLogo = uploadSingle('logo');

/**
 * Secretary/Admin registration documents
 */
export const uploadSecretaryDocuments = uploadFields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'identityProof', maxCount: 1 }
]);

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfilePhoto,
  uploadDocument,
  uploadEventBanner,
  uploadSignatures,
  uploadStudentDocuments,
  uploadGalleryImages,
  uploadSponsorLogo,
  uploadSliderImage,
  uploadLogo,
  uploadSecretaryDocuments
};

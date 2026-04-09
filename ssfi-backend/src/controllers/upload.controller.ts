import { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response.util';
import { AppError } from '../utils/errors';

// ── Directory setup ───────────────────────────────────────────────────────────

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

const UPLOAD_CONFIGS = {
  hero: {
    dir: path.join(UPLOAD_BASE, 'hero'),
    width: 1920,
    height: 1080,
    // Center-crop for hero (landscape)
    position: 'center' as const,
  },
  team: {
    dir: path.join(UPLOAD_BASE, 'team'),
    width: 480,
    height: 600,
    // Top-center crop for team portraits (keeps face in frame)
    position: 'top' as const,
  },
  news: {
    dir: path.join(UPLOAD_BASE, 'news'),
    width: 1200,
    height: 630,
    position: 'center' as const,
  },
};

// Ensure all upload directories exist
Object.values(UPLOAD_CONFIGS).forEach(cfg => {
  if (!fs.existsSync(cfg.dir)) {
    fs.mkdirSync(cfg.dir, { recursive: true });
  }
});

// Temp directory for multer raw uploads
const TEMP_DIR = path.join(UPLOAD_BASE, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── Multer (memory storage — we process with sharp before saving) ─────────────

const multerMemoryStorage = multer.memoryStorage();

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP, or GIF images are allowed', 400));
  }
};

export const uploadImageMiddleware = multer({
  storage: multerMemoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single('image');

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * POST /upload/image?type=hero|team|news
 *
 * Accepts: multipart/form-data with field "image"
 * Returns: { url: "/uploads/hero/abc123.webp" }
 *
 * Processing:
 *   - hero  → resize/crop 1920×1080, center crop, WebP q=85
 *   - team  → resize/crop 480×600,  top-center crop, WebP q=85
 *   - news  → resize/crop 1200×630, center crop, WebP q=85
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string;

  if (!type || !['hero', 'team', 'news'].includes(type)) {
    throw new AppError('Query param ?type= must be one of: hero, team, news', 400);
  }

  if (!req.file) {
    throw new AppError('No image file provided. Use field name "image"', 400);
  }

  const cfg = UPLOAD_CONFIGS[type as keyof typeof UPLOAD_CONFIGS];

  try {
    // Process with sharp: resize to exact dimensions, crop from position, convert to WebP
    const processedBuffer = await sharp(req.file.buffer)
      .resize(cfg.width, cfg.height, {
        fit: 'cover',         // crop to fill — no letterboxing
        position: cfg.position, // 'top' for team photos, 'center' for hero/news
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Return as base64 data URI — stored in DB, survives redeployments
    const base64 = `data:image/webp;base64,${processedBuffer.toString('base64')}`;

    return successResponse(res, {
      statusCode: 201,
      message: 'Image uploaded and processed successfully',
      data: { url: base64, type },
    });
  } catch (err) {
    throw new AppError('Image processing failed. Please try a different image.', 500);
  }
});

/**
 * DELETE /upload/image  — body: { url: "/uploads/team/abc.webp" }
 * Deletes a previously uploaded image from disk.
 */
export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    throw new AppError('Body must include { url: string }', 400);
  }

  // Security: only allow deleting from our uploads directories
  const safePrefixes = ['/uploads/hero/', '/uploads/team/', '/uploads/news/'];
  const isAllowed = safePrefixes.some(prefix => url.startsWith(prefix));
  if (!isAllowed) {
    throw new AppError('Cannot delete files outside of managed upload directories', 403);
  }

  // Path traversal protection: resolve and verify path stays within uploads dir
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const filePath = path.resolve(process.cwd(), url);
  if (!filePath.startsWith(uploadsDir)) {
    throw new AppError('Access denied', 403);
  }

  if (!fs.existsSync(filePath)) {
    // Already gone — treat as success
    return successResponse(res, { message: 'File not found (already deleted)' });
  }

  fs.unlinkSync(filePath);
  return successResponse(res, { message: 'File deleted successfully' });
});

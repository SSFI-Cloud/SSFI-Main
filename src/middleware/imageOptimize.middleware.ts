import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * Post-upload middleware that auto-converts uploaded images to WebP.
 * Must be placed AFTER multer middleware in the route chain.
 *
 * - Reads each uploaded file from disk
 * - Resizes large images (max 1920px width)
 * - Converts to WebP format (quality 80)
 * - Replaces the original file with the optimized version
 * - Updates req.file / req.files paths and filenames
 * - Skips PDFs and non-image files
 */

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface SizeConfig {
  maxWidth: number;
  maxHeight?: number;
  quality: number;
}

// Field-specific optimization settings
const FIELD_CONFIG: Record<string, SizeConfig> = {
  profilePhoto:    { maxWidth: 800,  maxHeight: 800,  quality: 82 },
  clubLogo:        { maxWidth: 500,  maxHeight: 500,  quality: 85 },
  logo:            { maxWidth: 500,  maxHeight: 500,  quality: 85 },
  bannerImage:     { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  identityProof:   { maxWidth: 2048, quality: 88 },
  birthCertificate:{ maxWidth: 2048, quality: 88 },
  aadhaarCard:     { maxWidth: 2048, quality: 88 },
  image:           { maxWidth: 1920, quality: 80 },
  images:          { maxWidth: 1920, quality: 80 },
  coverImage:      { maxWidth: 1920, quality: 82 },
};

const DEFAULT_CONFIG: SizeConfig = { maxWidth: 1920, quality: 80 };

async function optimizeFile(file: Express.Multer.File): Promise<void> {
  // Skip non-image files (PDFs, etc.)
  if (!IMAGE_MIMES.includes(file.mimetype)) return;

  const config = FIELD_CONFIG[file.fieldname] || DEFAULT_CONFIG;

  try {
    const inputBuffer = await fs.readFile(file.path);

    // Get metadata to check if resize is needed
    const metadata = await sharp(inputBuffer).metadata();

    // Skip if already a small WebP
    if (metadata.format === 'webp' && metadata.width && metadata.width <= config.maxWidth) return;

    // Build sharp pipeline
    let pipeline = sharp(inputBuffer);

    // Resize if too large
    if (metadata.width && metadata.width > config.maxWidth) {
      pipeline = pipeline.resize(config.maxWidth, config.maxHeight || undefined, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to WebP
    pipeline = pipeline.webp({ quality: config.quality });

    // Generate new filename with .webp extension
    const dir = path.dirname(file.path);
    const newFilename = `${path.basename(file.filename, path.extname(file.filename))}.webp`;
    const newPath = path.join(dir, newFilename);

    // Write optimized file
    await pipeline.toFile(newPath);

    // Remove original if different path
    if (newPath !== file.path) {
      await fs.unlink(file.path).catch(() => {});
    }

    // Update multer file object so downstream handlers get the correct path
    file.path = newPath;
    file.filename = newFilename;
    file.mimetype = 'image/webp';
    file.size = (await fs.stat(newPath)).size;
  } catch (err) {
    // If optimization fails, keep the original file — don't block the request
    console.warn(`Image optimization failed for ${file.fieldname}: ${(err as Error).message}`);
  }
}

/**
 * Express middleware: auto-optimize all uploaded image files to WebP.
 * Works with both single-file and multi-file uploads.
 */
export function optimizeUploadedImages(req: Request, _res: Response, next: NextFunction) {
  const tasks: Promise<void>[] = [];

  // Single file upload (req.file)
  if (req.file) {
    tasks.push(optimizeFile(req.file));
  }

  // Multi-field upload (req.files as Record<string, File[]>)
  if (req.files && !Array.isArray(req.files)) {
    for (const fieldFiles of Object.values(req.files)) {
      for (const file of fieldFiles) {
        tasks.push(optimizeFile(file));
      }
    }
  }

  // Array upload (req.files as File[])
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      tasks.push(optimizeFile(file));
    }
  }

  if (tasks.length === 0) return next();

  Promise.all(tasks).then(() => next()).catch(next);
}

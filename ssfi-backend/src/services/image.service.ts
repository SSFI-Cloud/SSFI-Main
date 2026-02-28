import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/errors';

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  outputDir: string;
  filename?: string;
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

class ImageService {
  /**
   * Process and optimize image
   * Converts to WebP format by default
   */
  async processImage(
    buffer: Buffer,
    options: ProcessImageOptions
  ): Promise<{ filename: string; path: string; thumbnail?: string }> {
    try {
      const {
        maxWidth = parseInt(process.env.IMAGE_MAX_WIDTH || '1920'),
        maxHeight,
        quality = parseInt(process.env.WEBP_QUALITY || '80'),
        format = 'webp',
        outputDir,
        filename = `${uuidv4()}.${format}`,
        createThumbnail = false,
        thumbnailSize = parseInt(process.env.THUMBNAIL_SIZE || '300')
      } = options;

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, filename);

      // Process main image
      let image = sharp(buffer);

      // Get metadata
      const metadata = await image.metadata();

      // Resize if needed
      if (metadata.width && metadata.width > maxWidth) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to specified format
      if (format === 'webp') {
        image = image.webp({ quality });
      } else if (format === 'jpeg') {
        image = image.jpeg({ quality });
      } else if (format === 'png') {
        image = image.png({ quality });
      }

      // Save main image
      await image.toFile(outputPath);

      const result: { filename: string; path: string; thumbnail?: string } = {
        filename,
        path: outputPath
      };

      // Create thumbnail if requested
      if (createThumbnail) {
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(outputDir, thumbnailFilename);

        await sharp(buffer)
          .resize(thumbnailSize, thumbnailSize, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 70 })
          .toFile(thumbnailPath);

        result.thumbnail = thumbnailFilename;
      }

      return result;
    } catch (error) {
      throw new AppError('Failed to process image', 500);
    }
  }

  /**
   * Process profile photo
   * Optimized for user avatars
   */
  async processProfilePhoto(buffer: Buffer): Promise<{ filename: string; path: string }> {
    return this.processImage(buffer, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 85,
      format: 'webp',
      outputDir: 'uploads/photos',
      createThumbnail: true,
      thumbnailSize: 150
    });
  }

  /**
   * Process document/Aadhaar scan
   * Maintains quality for readability
   */
  async processDocument(buffer: Buffer, isPDF: boolean = false): Promise<{ filename: string; path: string }> {
    if (isPDF) {
      // Save PDF as-is
      const filename = `${uuidv4()}.pdf`;
      const outputPath = path.join('uploads/documents', filename);

      await fs.mkdir('uploads/documents', { recursive: true });
      await fs.writeFile(outputPath, buffer);

      return { filename, path: outputPath };
    }

    return this.processImage(buffer, {
      maxWidth: 2048,
      quality: 90,
      format: 'webp',
      outputDir: 'uploads/documents'
    });
  }

  /**
   * Process event banner
   * Larger dimensions for hero sections
   */
  async processEventBanner(buffer: Buffer): Promise<{ filename: string; path: string }> {
    return this.processImage(buffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp',
      outputDir: 'uploads/banners'
    });
  }

  /**
   * Process signature image
   * Transparent background support
   */
  async processSignature(buffer: Buffer): Promise<{ filename: string; path: string }> {
    try {
      const filename = `${uuidv4()}.png`;
      const outputPath = path.join('uploads/signatures', filename);

      await fs.mkdir('uploads/signatures', { recursive: true });

      // Process signature with transparency
      await sharp(buffer)
        .resize(parseInt(process.env.SIGNATURE_SIZE || '400'), null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 100 })
        .toFile(outputPath);

      return { filename, path: outputPath };
    } catch (error) {
      throw new AppError('Failed to process signature', 500);
    }
  }

  /**
   * Process gallery images
   * Creates both full-size and thumbnails
   */
  async processGalleryImage(buffer: Buffer): Promise<{ filename: string; path: string; thumbnail: string }> {
    const result = await this.processImage(buffer, {
      maxWidth: 1920,
      quality: 80,
      format: 'webp',
      outputDir: 'uploads/gallery',
      createThumbnail: true,
      thumbnailSize: 400
    });

    return result as { filename: string; path: string; thumbnail: string };
  }

  /**
   * Process logo (Club/State/District/Sponsor)
   * Transparent background support
   */
  async processLogo(buffer: Buffer): Promise<{ filename: string; path: string }> {
    try {
      const filename = `${uuidv4()}.png`;
      const outputPath = path.join('uploads/logos', filename);

      await fs.mkdir('uploads/logos', { recursive: true });

      await sharp(buffer)
        .resize(500, 500, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 90 })
        .toFile(outputPath);

      return { filename, path: outputPath };
    } catch (error) {
      throw new AppError('Failed to process logo', 500);
    }
  }

  /**
   * Delete image file
   */
  async deleteImage(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);

      // Also try to delete thumbnail if exists
      const dir = path.dirname(filepath);
      const filename = path.basename(filepath);
      const thumbnailPath = path.join(dir, `thumb_${filename}`);

      try {
        await fs.unlink(thumbnailPath);
      } catch {
        // Thumbnail might not exist, ignore error
      }
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return await sharp(buffer).metadata();
  }

  /**
   * Validate image dimensions
   */
  async validateImageDimensions(
    buffer: Buffer,
    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<boolean> {
    const metadata = await this.getImageMetadata(buffer);

    if (minWidth && metadata.width && metadata.width < minWidth) {
      throw new AppError(`Image width must be at least ${minWidth}px`, 400);
    }

    if (minHeight && metadata.height && metadata.height < minHeight) {
      throw new AppError(`Image height must be at least ${minHeight}px`, 400);
    }

    if (maxWidth && metadata.width && metadata.width > maxWidth) {
      throw new AppError(`Image width must not exceed ${maxWidth}px`, 400);
    }

    if (maxHeight && metadata.height && metadata.height > maxHeight) {
      throw new AppError(`Image height must not exceed ${maxHeight}px`, 400);
    }

    return true;
  }
}

export default new ImageService();

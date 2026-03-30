import { z } from 'zod';

// ==========================================
// ENUMS
// ==========================================

export const ContentStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const BannerPositionEnum = z.enum(['HOME_HERO', 'HOME_SECONDARY', 'SIDEBAR', 'FOOTER', 'POPUP']);
export const MenuLocationEnum = z.enum(['HEADER', 'FOOTER', 'SIDEBAR', 'MOBILE']);
export const GalleryTypeEnum = z.enum(['IMAGE', 'VIDEO']);

// ==========================================
// PAGE SCHEMAS
// ==========================================

export const createPageSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(500).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(255).optional(),
  featuredImage: z.string().optional(),
  template: z.string().default('default'),
  status: ContentStatusEnum.default('DRAFT'),
  publishedAt: z.string().optional(),
  sortOrder: z.number().default(0),
});

export const updatePageSchema = createPageSchema.partial();

export const pageQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: ContentStatusEnum.optional(),
  template: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'sortOrder', 'publishedAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ==========================================
// BANNER SCHEMAS
// ==========================================

export const createBannerSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().min(1, 'Image URL is required'),
  mobileImageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  linkText: z.string().max(50).optional(),
  position: BannerPositionEnum,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: ContentStatusEnum.default('DRAFT'),
  sortOrder: z.number().default(0),
  metadata: z.object({
    badge: z.string().optional(),
    highlight: z.string().optional(),
    stroke: z.string().optional(),
    description: z.string().optional(),
    secondaryCtaText: z.string().optional(),
    secondaryCtaLink: z.string().optional(),
    ghostWord: z.string().optional(),
    gradient: z.string().optional(),
  }).optional(),
});

export const updateBannerSchema = createBannerSchema.partial();

export const bannerQuerySchema = z.object({
  position: BannerPositionEnum.optional(),
  status: ContentStatusEnum.optional(),
  active: z.coerce.boolean().optional(),
});

// ==========================================
// NEWS/ARTICLE SCHEMAS
// ==========================================

export const createNewsSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(300),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(150)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().max(500).optional(),
  featuredImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  status: ContentStatusEnum.default('DRAFT'),
  publishedAt: z.string().optional(),
  isFeatured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
});

export const updateNewsSchema = createNewsSchema.partial();

export const newsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  status: ContentStatusEnum.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'publishedAt', 'title', 'views']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// GALLERY SCHEMAS
// ==========================================

export const createGalleryAlbumSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  coverImage: z.string().optional(),
  eventId: z.coerce.number().optional(),
  status: ContentStatusEnum.default('DRAFT'),
  sortOrder: z.number().default(0),
});

export const updateGalleryAlbumSchema = createGalleryAlbumSchema.partial();

export const createGalleryItemSchema = z.object({
  albumId: z.string().min(1, 'Album ID is required'),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  type: GalleryTypeEnum.default('IMAGE'),
  url: z.string().min(1, 'URL is required'),
  thumbnailUrl: z.string().optional(),
  sortOrder: z.number().default(0),
});

export const updateGalleryItemSchema = createGalleryItemSchema.partial().omit({ albumId: true });

export const galleryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: ContentStatusEnum.optional(),
  category: z.string().optional(),
  eventId: z.coerce.number().optional(),
});

// ==========================================
// MENU SCHEMAS
// ==========================================

export const createMenuSchema = z.object({
  name: z.string().min(2).max(100),
  location: MenuLocationEnum,
  items: z.array(z.object({
    id: z.string().optional(),
    label: z.string().min(1).max(100),
    url: z.string().optional(),
    pageId: z.string().optional(),
    target: z.enum(['_self', '_blank']).default('_self'),
    parentId: z.string().optional(),
    sortOrder: z.number().default(0),
    children: z.array(z.any()).optional(),
  })).default([]),
  isActive: z.boolean().default(true),
});

export const updateMenuSchema = createMenuSchema.partial();

// ==========================================
// SITE SETTINGS SCHEMA
// ==========================================

/**
 * Coerce null | "" | undefined → undefined so Zod .optional() works correctly.
 * Prisma returns null for unset DB columns; React controlled inputs send "".
 * Both must become undefined before type-checking.
 */
const nullToUndef = (v: unknown) => (v === null || v === '' ? undefined : v);

// Shorthand: optional string that also accepts null and ""
const optStr = (inner: z.ZodString = z.string()) =>
  z.preprocess(nullToUndef, inner.optional());

export const siteSettingsSchema = z.object({
  siteName:    optStr(z.string().max(100)),
  siteTagline: optStr(z.string().max(200)),
  logo:        optStr(),
  favicon:     optStr(),

  // email() would reject ""; preprocess coerces null/"" → undefined first
  contactEmail: z.preprocess(
    nullToUndef,
    z.string().email('Invalid email address').optional()
  ),

  contactPhone: optStr(),
  address:      optStr(z.string().max(500)),

  socialLinks: z.preprocess(
    v => (v === null ? undefined : v),
    z.object({
      facebook:  optStr(),
      twitter:   optStr(),
      instagram: optStr(),
      youtube:   optStr(),
      linkedin:  optStr(),
    }).optional()
  ),

  footerText:         optStr(z.string().max(500)),
  googleAnalyticsId:  optStr(),
  maintenanceMode:    z.preprocess(v => (v === null ? undefined : v), z.boolean().optional()),
  maintenanceMessage: optStr(z.string().max(500)),

  // metadata is a JSON column — Prisma may return null, frontend may omit it
  metadata: z.preprocess(
    v => (v === null ? undefined : v),
    z.object({
      departments: z.preprocess(
        v => (v === null ? undefined : v),
        z.array(
          z.object({
            name:  z.string(),
            email: optStr(),
            phone: optStr(),
          })
        ).optional()
      ),
      officeHours: z.preprocess(
        v => (v === null ? undefined : v),
        z.object({
          weekdays: optStr(),
          saturday: optStr(),
          sunday:   optStr(),
        }).optional()
      ),
      mapEmbedUrl: optStr(),
      phone2:      optStr(),
    }).optional()
  ),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type ContentStatus = z.infer<typeof ContentStatusEnum>;
export type BannerPosition = z.infer<typeof BannerPositionEnum>;
export type MenuLocation = z.infer<typeof MenuLocationEnum>;
export type GalleryType = z.infer<typeof GalleryTypeEnum>;

export type CreatePage = z.infer<typeof createPageSchema>;
export type UpdatePage = z.infer<typeof updatePageSchema>;
export type PageQuery = z.infer<typeof pageQuerySchema>;

export type CreateBanner = z.infer<typeof createBannerSchema>;
export type UpdateBanner = z.infer<typeof updateBannerSchema>;
export type BannerQuery = z.infer<typeof bannerQuerySchema>;

export type CreateNews = z.infer<typeof createNewsSchema>;
export type UpdateNews = z.infer<typeof updateNewsSchema>;
export type NewsQuery = z.infer<typeof newsQuerySchema>;

export type CreateGalleryAlbum = z.infer<typeof createGalleryAlbumSchema>;
export type UpdateGalleryAlbum = z.infer<typeof updateGalleryAlbumSchema>;
export type CreateGalleryItem = z.infer<typeof createGalleryItemSchema>;
export type UpdateGalleryItem = z.infer<typeof updateGalleryItemSchema>;

export type CreateMenu = z.infer<typeof createMenuSchema>;
export type UpdateMenu = z.infer<typeof updateMenuSchema>;

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

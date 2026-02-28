// CMS Types

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BannerPosition = 'HOME_HERO' | 'HOME_SECONDARY' | 'SIDEBAR' | 'FOOTER' | 'POPUP';
export type MenuLocation = 'HEADER' | 'FOOTER' | 'SIDEBAR' | 'MOBILE';
export type GalleryType = 'IMAGE' | 'VIDEO';

// ==========================================
// PAGE TYPES
// ==========================================

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  featuredImage?: string;
  template: string;
  status: ContentStatus;
  publishedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  featuredImage?: string;
  template: string;
  status: ContentStatus;
  sortOrder: number;
}

// ==========================================
// BANNER TYPES
// ==========================================

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  position: BannerPosition;
  startDate?: string;
  endDate?: string;
  status: ContentStatus;
  sortOrder: number;
  createdAt: string;
}

export interface BannerFormData {
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  position: BannerPosition;
  startDate?: string;
  endDate?: string;
  status: ContentStatus;
  sortOrder: number;
}

// ==========================================
// NEWS TYPES
// ==========================================

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  status: ContentStatus;
  publishedAt?: string;
  isFeatured: boolean;
  allowComments: boolean;
  views: number;
  createdAt: string;
}

export interface NewsFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  status: ContentStatus;
  isFeatured: boolean;
  allowComments: boolean;
}

export interface NewsListResponse {
  data: NewsArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// GALLERY TYPES
// ==========================================

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  category?: string;
  eventId?: string;
  event?: { id: string | number; name: string; eventDate?: string; venue?: string };
  status: ContentStatus;
  sortOrder: number;
  items?: GalleryItem[];
  _count?: { items: number };
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  albumId: string;
  title?: string;
  description?: string;
  type: GalleryType;
  url: string;
  thumbnailUrl?: string;
  sortOrder: number;
  createdAt: string;
}

export interface GalleryAlbumFormData {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  eventId?: string;
  status: ContentStatus;
  sortOrder: number;
}

export interface GalleryItemFormData {
  albumId: string;
  title?: string;
  description?: string;
  type: GalleryType;
  url: string;
  thumbnailUrl?: string;
  sortOrder: number;
}

// ==========================================
// MENU TYPES
// ==========================================

export interface MenuItem {
  id?: string;
  label: string;
  url?: string;
  pageId?: string;
  target: '_self' | '_blank';
  parentId?: string;
  sortOrder: number;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  location: MenuLocation;
  items: MenuItem[];
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// SITE SETTINGS TYPES
// ==========================================

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
}

export interface SiteSettingsMetadata {
  departments?: { name: string; email: string; phone?: string }[];
  officeHours?: { weekdays?: string; saturday?: string; sunday?: string };
  mapEmbedUrl?: string;
  phone2?: string;
}

export interface SiteSettings {
  id?: string;
  siteName?: string;
  siteTagline?: string;
  logo?: string;
  favicon?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPhone2?: string;
  address?: string;
  socialLinks?: SocialLinks;
  footerText?: string;
  googleAnalyticsId?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  metadata?: SiteSettingsMetadata;
}

// ==========================================
// QUERY PARAMS
// ==========================================

export interface PageQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContentStatus;
  template?: string;
  sortBy?: 'createdAt' | 'title' | 'sortOrder' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContentStatus;
  category?: string;
  tag?: string;
  featured?: boolean;
  sortBy?: 'createdAt' | 'publishedAt' | 'title' | 'views';
  sortOrder?: 'asc' | 'desc';
}

// ==========================================
// CONSTANTS
// ==========================================

export const BANNER_POSITIONS: { value: BannerPosition; label: string }[] = [
  { value: 'HOME_HERO', label: 'Home Hero (Main Slider)' },
  { value: 'HOME_SECONDARY', label: 'Home Secondary' },
  { value: 'SIDEBAR', label: 'Sidebar' },
  { value: 'FOOTER', label: 'Footer' },
  { value: 'POPUP', label: 'Popup' },
];

export const MENU_LOCATIONS: { value: MenuLocation; label: string }[] = [
  { value: 'HEADER', label: 'Header Navigation' },
  { value: 'FOOTER', label: 'Footer Navigation' },
  { value: 'SIDEBAR', label: 'Sidebar Navigation' },
  { value: 'MOBILE', label: 'Mobile Navigation' },
];

export const CONTENT_STATUSES: { value: ContentStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'Draft', color: 'text-slate-400 bg-slate-500/20' },
  { value: 'PUBLISHED', label: 'Published', color: 'text-green-400 bg-green-500/20' },
  { value: 'ARCHIVED', label: 'Archived', color: 'text-amber-400 bg-amber-500/20' },
];

export const PAGE_TEMPLATES: { value: string; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'full-width', label: 'Full Width' },
  { value: 'sidebar', label: 'With Sidebar' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'contact', label: 'Contact Page' },
];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const getStatusConfig = (status: ContentStatus) => {
  return CONTENT_STATUSES.find(s => s.value === status) || CONTENT_STATUSES[0];
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

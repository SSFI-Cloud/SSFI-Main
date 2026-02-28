import { Router } from 'express';
import cmsController from '../controllers/cms.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Pages
router.get('/pages/slug/:slug', cmsController.getPageBySlug);

// Banners (public - get active banners)
router.get('/banners', cmsController.getBanners);

// News
router.get('/news', cmsController.listNews);
router.get('/news/categories', cmsController.getNewsCategories);
router.get('/news/slug/:slug', cmsController.getNewsBySlug);

// Gallery — specific routes BEFORE parameterised to avoid Express eating 'slug' as :id
router.get('/gallery', cmsController.listGalleryAlbums);
router.get('/gallery/slug/:slug', cmsController.getGalleryAlbumBySlug);
router.get('/gallery/:id', cmsController.getGalleryAlbumById);

// Menus
router.get('/menus/location/:location', cmsController.getMenuByLocation);

// Site Settings (public for frontend)
router.get('/settings', cmsController.getSiteSettings);

// ==========================================
// ADMIN ROUTES
// ==========================================

router.use(authenticate);

// File upload
const imageUpload = uploadSingle('image');

// ----------------------------------------
// PAGE MANAGEMENT
// ----------------------------------------

router.get(
  '/admin/pages',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.listPages
);

router.get(
  '/admin/pages/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.getPageById
);

router.post(
  '/admin/pages',
  requireRole('GLOBAL_ADMIN'),
  cmsController.createPage
);

router.put(
  '/admin/pages/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.updatePage
);

router.delete(
  '/admin/pages/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.deletePage
);

// ----------------------------------------
// BANNER MANAGEMENT
// ----------------------------------------

router.get(
  '/admin/banners',
  requireRole('GLOBAL_ADMIN'),
  cmsController.getBanners
);

router.get(
  '/admin/banners/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.getBannerById
);

router.post(
  '/admin/banners',
  requireRole('GLOBAL_ADMIN'),
  cmsController.createBanner
);

router.put(
  '/admin/banners/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.updateBanner
);

router.delete(
  '/admin/banners/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.deleteBanner
);

// ----------------------------------------
// NEWS MANAGEMENT
// ----------------------------------------

router.get(
  '/admin/news/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.getNewsById
);

router.post(
  '/admin/news',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.createNews
);

router.put(
  '/admin/news/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.updateNews
);

router.delete(
  '/admin/news/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.deleteNews
);

// ----------------------------------------
// GALLERY MANAGEMENT
// ----------------------------------------

router.get(
  '/admin/gallery/albums/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.getGalleryAlbumById
);

router.post(
  '/admin/gallery/albums',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.createGalleryAlbum
);

router.put(
  '/admin/gallery/albums/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.updateGalleryAlbum
);

router.delete(
  '/admin/gallery/albums/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.deleteGalleryAlbum
);

router.post(
  '/admin/gallery/items',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.addGalleryItem
);

router.put(
  '/admin/gallery/items/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.updateGalleryItem
);

router.delete(
  '/admin/gallery/items/:id',
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY'),
  cmsController.deleteGalleryItem
);

// ----------------------------------------
// MENU MANAGEMENT
// ----------------------------------------

router.get(
  '/admin/menus',
  requireRole('GLOBAL_ADMIN'),
  cmsController.getAllMenus
);

router.get(
  '/admin/menus/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.getMenuById
);

router.post(
  '/admin/menus',
  requireRole('GLOBAL_ADMIN'),
  cmsController.createMenu
);

router.put(
  '/admin/menus/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.updateMenu
);

router.delete(
  '/admin/menus/:id',
  requireRole('GLOBAL_ADMIN'),
  cmsController.deleteMenu
);

// ----------------------------------------
// SITE SETTINGS
// ----------------------------------------

router.put(
  '/admin/settings',
  requireRole('GLOBAL_ADMIN'),
  cmsController.updateSiteSettings
);

export default router;

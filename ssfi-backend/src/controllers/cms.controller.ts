import { Request, Response } from 'express';
import cmsService from '../services/cms.service';
import {
  createPageSchema, updatePageSchema, pageQuerySchema,
  createBannerSchema, updateBannerSchema, bannerQuerySchema,
  createNewsSchema, updateNewsSchema, newsQuerySchema,
  createGalleryAlbumSchema, updateGalleryAlbumSchema,
  createGalleryItemSchema, updateGalleryItemSchema, galleryQuerySchema,
  createMenuSchema, updateMenuSchema,
  siteSettingsSchema,
} from '../validators/cms.validator';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';
import { seedCmsPages } from '../services/cms-seed.service';
import { deleteCachePattern } from '../utils/cache.util';

// ==========================================
// PAGE CONTROLLERS
// ==========================================

export const createPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createPageSchema.parse(req.body);
  const page = await cmsService.createPage(data, req.user!.id.toString());
  deleteCachePattern('/cms/pages');

  return successResponse(res, {
    statusCode: 201,
    message: 'Page created successfully',
    data: page,
  });
});

export const updatePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updatePageSchema.parse(req.body);
  const page = await cmsService.updatePage(id, data, req.user!.id.toString());
  deleteCachePattern('/cms/pages');

  return successResponse(res, {
    message: 'Page updated successfully',
    data: page,
  });
});

export const getPageBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const page = await cmsService.getPageBySlug(slug);

  return successResponse(res, { data: page });
});

export const getPageById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const page = await cmsService.getPageById(id);

  return successResponse(res, { data: page });
});

export const listPages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = pageQuerySchema.parse(req.query);
  const result = await cmsService.listPages(query);

  return successResponse(res, {
    message: 'Pages retrieved successfully',
    data: result,
  });
});

export const deletePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await cmsService.deletePage(id, req.user!.id.toString());
  deleteCachePattern('/cms/pages');

  return successResponse(res, { message: 'Page deleted successfully' });
});

// ==========================================
// BANNER CONTROLLERS
// ==========================================

export const createBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createBannerSchema.parse(req.body);
  const banner = await cmsService.createBanner(data, req.user!.id.toString());
  deleteCachePattern('/cms/banners');

  return successResponse(res, {
    statusCode: 201,
    message: 'Banner created successfully',
    data: banner,
  });
});

export const updateBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateBannerSchema.parse(req.body);
  const banner = await cmsService.updateBanner(id, data, req.user!.id.toString());
  deleteCachePattern('/cms/banners');

  return successResponse(res, {
    message: 'Banner updated successfully',
    data: banner,
  });
});

export const getBanners = asyncHandler(async (req: Request, res: Response) => {
  const query = bannerQuerySchema.parse(req.query);
  const banners = await cmsService.getBanners(query);

  return successResponse(res, { data: banners });
});

export const deleteBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await cmsService.deleteBanner(id, req.user!.id.toString());
  deleteCachePattern('/cms/banners');

  return successResponse(res, { message: 'Banner deleted successfully' });
});

// ==========================================
// NEWS CONTROLLERS
// ==========================================

export const createNews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createNewsSchema.parse(req.body);
  const news = await cmsService.createNews(data, req.user!.id.toString());
  deleteCachePattern('/news');
  deleteCachePattern('/cms/news');

  return successResponse(res, {
    statusCode: 201,
    message: 'News article created successfully',
    data: news,
  });
});

export const updateNews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateNewsSchema.parse(req.body);
  const news = await cmsService.updateNews(id, data, req.user!.id.toString());
  deleteCachePattern('/news');
  deleteCachePattern('/cms/news');

  return successResponse(res, {
    message: 'News article updated successfully',
    data: news,
  });
});

export const getNewsBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const news = await cmsService.getNewsBySlug(slug);

  return successResponse(res, { data: news });
});

export const listNews = asyncHandler(async (req: Request, res: Response) => {
  const query = newsQuerySchema.parse(req.query);
  const result = await cmsService.listNews(query);

  return successResponse(res, { data: result });
});

export const getNewsById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const news = await cmsService.getNewsById(id);
  return successResponse(res, { data: news });
});

export const getNewsCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await cmsService.getNewsCategories();

  return successResponse(res, { data: categories });
});

export const deleteNews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await cmsService.deleteNews(id, req.user!.id.toString());
  deleteCachePattern('/news');
  deleteCachePattern('/cms/news');

  return successResponse(res, { message: 'News article deleted successfully' });
});

// ==========================================
// GALLERY CONTROLLERS
// ==========================================

export const createGalleryAlbum = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createGalleryAlbumSchema.parse(req.body);
  const album = await cmsService.createGalleryAlbum(data, req.user!.id.toString());
  deleteCachePattern('/cms/gallery');

  return successResponse(res, {
    statusCode: 201,
    message: 'Gallery album created successfully',
    data: album,
  });
});

export const updateGalleryAlbum = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateGalleryAlbumSchema.parse(req.body);
  const album = await cmsService.updateGalleryAlbum(id, data, req.user!.id.toString());
  deleteCachePattern('/cms/gallery');

  return successResponse(res, {
    message: 'Gallery album updated successfully',
    data: album,
  });
});

export const listGalleryAlbums = asyncHandler(async (req: Request, res: Response) => {
  const query = galleryQuerySchema.parse(req.query);
  const result = await cmsService.listGalleryAlbums(query);

  return successResponse(res, { data: result });
});

export const getGalleryAlbumBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const album = await cmsService.getGalleryAlbumBySlug(slug);

  return successResponse(res, { data: album });
});

export const getGalleryAlbumById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const album = await cmsService.getGalleryAlbumById(id);
  return successResponse(res, { data: album });
});

export const getBannerById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const banner = await cmsService.getBannerById(id);
  return successResponse(res, { data: banner });
});

export const addGalleryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createGalleryItemSchema.parse(req.body);
  const item = await cmsService.addGalleryItem(data, req.user!.id.toString());
  deleteCachePattern('/cms/gallery');

  return successResponse(res, {
    statusCode: 201,
    message: 'Gallery item added successfully',
    data: item,
  });
});

export const updateGalleryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateGalleryItemSchema.parse(req.body);
  const item = await cmsService.updateGalleryItem(id, data, req.user!.id.toString());
  deleteCachePattern('/cms/gallery');

  return successResponse(res, {
    message: 'Gallery item updated successfully',
    data: item,
  });
});

export const deleteGalleryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await cmsService.deleteGalleryItem(id);
  deleteCachePattern('/cms/gallery');

  return successResponse(res, { message: 'Gallery item deleted successfully' });
});

export const deleteGalleryAlbum = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await cmsService.deleteGalleryAlbum(id, req.user!.id.toString());
  deleteCachePattern('/cms/gallery');

  return successResponse(res, { message: 'Gallery album deleted successfully' });
});

// ==========================================
// MENU CONTROLLERS
// ==========================================

export const createMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createMenuSchema.parse(req.body);
  const menu = await cmsService.createMenu(data, req.user!.id.toString());
  deleteCachePattern('/cms/menus');

  return successResponse(res, {
    statusCode: 201,
    message: 'Menu created successfully',
    data: menu,
  });
});

export const updateMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateMenuSchema.parse(req.body);
  const menu = await cmsService.updateMenu(id, data, req.user!.id.toString());
  deleteCachePattern('/cms/menus');

  return successResponse(res, {
    message: 'Menu updated successfully',
    data: menu,
  });
});

export const getMenuByLocation = asyncHandler(async (req: Request, res: Response) => {
  const { location } = req.params;
  const menu = await cmsService.getMenuByLocation(location);

  return successResponse(res, { data: menu });
});

export const getAllMenus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const menus = await cmsService.getAllMenus();
  return successResponse(res, { data: menus });
});

export const getMenuById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const menu = await cmsService.getMenuById(id);
  return successResponse(res, { data: menu });
});

export const deleteMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await cmsService.deleteMenu(id, req.user!.id.toString());
  deleteCachePattern('/cms/menus');

  return successResponse(res, { message: 'Menu deleted successfully' });
});

// ==========================================
// SITE SETTINGS CONTROLLERS
// ==========================================

export const getSiteSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await cmsService.getSiteSettings();

  return successResponse(res, { data: settings });
});

export const updateSiteSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = siteSettingsSchema.parse(req.body);
  const settings = await cmsService.updateSiteSettings(data, req.user!.id.toString());
  deleteCachePattern('/cms/settings');

  return successResponse(res, {
    message: 'Site settings updated successfully',
    data: settings,
  });
});

// ==========================================
// SEED PAGES CONTROLLER
// ==========================================

export const seedPages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await seedCmsPages(req.user!.id.toString());

  return successResponse(res, {
    message: `CMS pages seeded: ${result.created} created, ${result.skipped} skipped`,
    data: result,
  });
});

export default {
  // Pages
  createPage, updatePage, getPageBySlug, getPageById, listPages, deletePage, seedPages,
  // Banners
  createBanner, updateBanner, getBanners, deleteBanner,
  // News
  createNews, updateNews, getNewsBySlug, getNewsById, listNews, getNewsCategories, deleteNews,
  // Gallery
  createGalleryAlbum, updateGalleryAlbum, listGalleryAlbums, getGalleryAlbumBySlug,
  getGalleryAlbumById, addGalleryItem, updateGalleryItem, deleteGalleryItem, deleteGalleryAlbum,
  // Banners (extended)
  getBannerById,
  // Menus
  createMenu, updateMenu, getMenuByLocation, getAllMenus, getMenuById, deleteMenu,
  // Settings
  getSiteSettings, updateSiteSettings,
};

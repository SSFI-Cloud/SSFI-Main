import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreatePage, UpdatePage, PageQuery,
  CreateBanner, UpdateBanner, BannerQuery,
  CreateNews, UpdateNews, NewsQuery,
  CreateGalleryAlbum, UpdateGalleryAlbum,
  CreateGalleryItem, UpdateGalleryItem,
  CreateMenu, UpdateMenu,
  SiteSettings,
} from '../validators/cms.validator';
import { AppError } from '../utils/errors';
import logger from '../utils/logger.util';

import prisma from '../config/prisma';
// ==========================================
// PAGE MANAGEMENT
// ==========================================

export const createPage = async (data: CreatePage, createdBy: string) => {
  // Check for duplicate slug
  const existingSlug = await prisma.page.findUnique({
    where: { slug: data.slug },
  });

  if (existingSlug) {
    throw new AppError('A page with this slug already exists', 409);
  }

  const page = await prisma.page.create({
    data: {
      ...data,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      createdBy,
    } as any,
  });

  logger.info(`Page created: ${page.slug}`, { createdBy });
  return page;
};

export const updatePage = async (pageId: string, data: UpdatePage, updatedBy: string) => {
  const existing = await prisma.page.findUnique({ where: { id: pageId } });
  if (!existing) throw new AppError('Page not found', 404);

  // Check slug uniqueness if changing
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.page.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new AppError('A page with this slug already exists', 409);
  }

  const updateData: any = { ...data, updatedBy, updatedAt: new Date() };

  // Set publishedAt when publishing
  if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  const page = await prisma.page.update({
    where: { id: pageId },
    data: updateData,
  });

  logger.info(`Page updated: ${page.slug}`, { updatedBy });
  return page;
};

export const getPageBySlug = async (slug: string) => {
  const page = await prisma.page.findUnique({
    where: { slug },
  });

  if (!page) throw new AppError('Page not found', 404);
  if (page.status !== 'PUBLISHED') throw new AppError('Page not found', 404);

  return page;
};

export const getPageById = async (pageId: string) => {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) throw new AppError('Page not found', 404);
  return page;
};

export const listPages = async (query: PageQuery) => {
  const { page, limit, search, status, template, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PageWhereInput = {};
  if (status) where.status = status;
  if (template) where.template = template;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { slug: { contains: search } },
    ];
  }

  const [pages, total] = await Promise.all([
    prisma.page.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.page.count({ where }),
  ]);

  return { data: pages, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const deletePage = async (pageId: string, deletedBy: string) => {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) throw new AppError('Page not found', 404);

  await prisma.page.delete({ where: { id: pageId } });
  logger.info(`Page deleted: ${page.slug}`, { deletedBy });
};

// ==========================================
// BANNER MANAGEMENT
// ==========================================

export const createBanner = async (data: CreateBanner, createdBy: string) => {
  const banner = await prisma.banner.create({
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdBy,
    } as any,
  });

  logger.info(`Banner created: ${banner.title}`, { createdBy });
  return banner;
};

export const updateBanner = async (bannerId: string, data: UpdateBanner, updatedBy: string) => {
  const existing = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!existing) throw new AppError('Banner not found', 404);

  const updateData: any = { ...data, updatedBy, updatedAt: new Date() };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const banner = await prisma.banner.update({
    where: { id: bannerId },
    data: updateData,
  });

  logger.info(`Banner updated: ${banner.title}`, { updatedBy });
  return banner;
};

export const getBanners = async (query: BannerQuery) => {
  const where: Prisma.BannerWhereInput = {};

  if (query.position) where.position = query.position;
  if (query.status) where.status = query.status;

  // Filter active banners (within date range)
  if (query.active) {
    const now = new Date();
    where.status = 'PUBLISHED';
    where.OR = [
      { startDate: null, endDate: null },
      { startDate: { lte: now }, endDate: null },
      { startDate: null, endDate: { gte: now } },
      { startDate: { lte: now }, endDate: { gte: now } },
    ];
  }

  return prisma.banner.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
};

export const deleteBanner = async (bannerId: string, deletedBy: string) => {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) throw new AppError('Banner not found', 404);

  await prisma.banner.delete({ where: { id: bannerId } });
  logger.info(`Banner deleted: ${banner.title}`, { deletedBy });
};

// ==========================================
// NEWS/ARTICLE MANAGEMENT
// ==========================================

export const createNews = async (data: CreateNews, createdBy: string) => {
  // Check for duplicate slug
  const existingSlug = await prisma.news.findUnique({ where: { slug: data.slug } });
  if (existingSlug) throw new AppError('A news article with this slug already exists', 409);

  const news = await prisma.news.create({
    data: {
      ...data,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      createdBy,
    } as any,
  });

  logger.info(`News created: ${news.slug}`, { createdBy });
  return news;
};

export const updateNews = async (newsId: string, data: UpdateNews, updatedBy: string) => {
  const existing = await prisma.news.findUnique({ where: { id: newsId } });
  if (!existing) throw new AppError('News article not found', 404);

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.news.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new AppError('A news article with this slug already exists', 409);
  }

  const updateData: any = { ...data, updatedBy, updatedAt: new Date() };

  if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  const news = await prisma.news.update({
    where: { id: newsId },
    data: updateData,
  });

  logger.info(`News updated: ${news.slug}`, { updatedBy });
  return news;
};

export const getNewsBySlug = async (slug: string) => {
  const news = await prisma.news.findUnique({ where: { slug } });
  if (!news || news.status !== 'PUBLISHED') throw new AppError('News article not found', 404);

  // Increment view count
  await prisma.news.update({
    where: { id: news.id },
    data: { views: { increment: 1 } },
  });

  return news;
};

export const listNews = async (query: NewsQuery) => {
  const { page, limit, search, status, category, tag, featured, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.NewsWhereInput = {};
  if (status) where.status = status;
  if (category) where.category = category;
  // if (tag) where.tags = { has: tag }; // Postgres only
  if (tag) {
    // MySQL JSON array contains approximation or use raw query.
    // tailored for MySQL Prisma JSON filter if available, else string contains
    where.tags = { string_contains: tag };
  }
  if (featured !== undefined) where.isFeatured = featured;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        tags: true,
        status: true,
        publishedAt: true,
        views: true,
        isFeatured: true,
        createdAt: true,
      },
    }),
    prisma.news.count({ where }),
  ]);

  return { data: news, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getNewsCategories = async () => {
  const categories = await prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    select: { category: true },
    distinct: ['category'],
  });

  return categories
    .map(c => c.category)
    .filter(Boolean) as string[];
};

export const getNewsById = async (newsId: string) => {
  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) throw new AppError('News article not found', 404);
  return news;
};

export const deleteNews = async (newsId: string, deletedBy: string) => {
  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) throw new AppError('News article not found', 404);

  await prisma.news.delete({ where: { id: newsId } });
  logger.info(`News deleted: ${news.slug}`, { deletedBy });
};

// ==========================================
// GALLERY MANAGEMENT
// ==========================================

export const createGalleryAlbum = async (data: CreateGalleryAlbum, createdBy: string) => {
  const existingSlug = await prisma.galleryAlbum.findUnique({ where: { slug: data.slug } });
  if (existingSlug) throw new AppError('An album with this slug already exists', 409);

  const album = await prisma.galleryAlbum.create({
    data: { ...data, createdBy } as any,
  });

  logger.info(`Gallery album created: ${album.slug}`, { createdBy });
  return album;
};

export const updateGalleryAlbum = async (albumId: string, data: UpdateGalleryAlbum, updatedBy: string) => {
  const existing = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if (!existing) throw new AppError('Album not found', 404);

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.galleryAlbum.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new AppError('An album with this slug already exists', 409);
  }

  const album = await prisma.galleryAlbum.update({
    where: { id: albumId },
    data: { ...data, updatedBy, updatedAt: new Date() },
  });

  logger.info(`Gallery album updated: ${album.slug}`, { updatedBy });
  return album;
};

export const listGalleryAlbums = async (query: any) => {
  const { page = 1, limit = 20, status, eventId, category } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.GalleryAlbumWhereInput = {};
  if (status) where.status = status;
  if (eventId) where.eventId = eventId;
  if (category) where.category = category;

  const [albums, total] = await Promise.all([
    prisma.galleryAlbum.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { items: true } },
        event: { select: { id: true, name: true, eventDate: true, venue: true } },
      },
    }),
    prisma.galleryAlbum.count({ where }),
  ]);

  return { data: albums, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getGalleryAlbumBySlug = async (slug: string) => {
  const album = await prisma.galleryAlbum.findUnique({
    where: { slug },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      event: { select: { id: true, name: true } },
    },
  });

  if (!album || album.status !== 'PUBLISHED') {
    throw new AppError('Album not found', 404);
  }

  return album;
};

export const addGalleryItem = async (data: CreateGalleryItem, createdBy: string) => {
  const album = await prisma.galleryAlbum.findUnique({ where: { id: data.albumId } });
  if (!album) throw new AppError('Album not found', 404);

  const item = await prisma.galleryItem.create({
    data: { ...data, createdBy } as any,
  });

  // Update album cover if not set
  if (!album.coverImage) {
    await prisma.galleryAlbum.update({
      where: { id: album.id },
      data: { coverImage: data.url },
    });
  }

  return item;
};

export const updateGalleryItem = async (itemId: string, data: UpdateGalleryItem, updatedBy: string) => {
  const item = await prisma.galleryItem.update({
    where: { id: itemId },
    data: { ...data, updatedAt: new Date() },
  });
  return item;
};

export const deleteGalleryItem = async (itemId: string) => {
  await prisma.galleryItem.delete({ where: { id: itemId } });
};

export const getGalleryAlbumById = async (albumId: string) => {
  const album = await prisma.galleryAlbum.findUnique({
    where: { id: albumId },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      event: { select: { id: true, name: true, eventDate: true, venue: true } },
      _count: { select: { items: true } },
    },
  });
  if (!album) throw new AppError('Album not found', 404);
  return album;
};

export const getBannerById = async (bannerId: string) => {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) throw new AppError('Banner not found', 404);
  return banner;
};

export const deleteGalleryAlbum = async (albumId: string, deletedBy: string) => {
  // Delete all items first
  await prisma.galleryItem.deleteMany({ where: { albumId } });
  await prisma.galleryAlbum.delete({ where: { id: albumId } });
  logger.info(`Gallery album deleted: ${albumId}`, { deletedBy });
};

// ==========================================
// MENU MANAGEMENT
// ==========================================

export const createMenu = async (data: CreateMenu, createdBy: string) => {
  // Check if menu for this location exists
  const existing = await prisma.menu.findFirst({ where: { location: data.location } });
  if (existing) {
    throw new AppError(`A menu for ${data.location} already exists. Update it instead.`, 409);
  }

  const menu = await prisma.menu.create({
    data: {
      name: data.name,
      location: data.location,
      items: data.items as any,
      isActive: data.isActive,
      createdBy,
    },
  });

  logger.info(`Menu created: ${menu.location}`, { createdBy });
  return menu;
};

export const updateMenu = async (menuId: string, data: UpdateMenu, updatedBy: string) => {
  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      ...data,
      items: data.items as any,
      updatedBy,
      updatedAt: new Date(),
    },
  });

  logger.info(`Menu updated: ${menu.location}`, { updatedBy });
  return menu;
};

export const getMenuByLocation = async (location: string) => {
  const menu = await prisma.menu.findFirst({
    where: { location, isActive: true },
  });
  return menu;
};

export const getAllMenus = async () => {
  return prisma.menu.findMany({
    orderBy: { location: 'asc' },
  });
};

export const getMenuById = async (menuId: string) => {
  const menu = await prisma.menu.findUnique({ where: { id: menuId } });
  if (!menu) throw new AppError('Menu not found', 404);
  return menu;
};

export const deleteMenu = async (menuId: string, deletedBy: string) => {
  await prisma.menu.delete({ where: { id: menuId } });
  logger.info(`Menu deleted: ${menuId}`, { deletedBy });
};

// ==========================================
// SITE SETTINGS
// ==========================================

export const getSiteSettings = async () => {
  let settings = await prisma.siteSettings.findFirst();

  if (!settings) {
    // Create default settings
    settings = await prisma.siteSettings.create({
      data: {
        siteName: 'SSFI',
        siteTagline: 'Speed Skating Federation of India',
      },
    });
  }

  return settings;
};

export const updateSiteSettings = async (data: SiteSettings, updatedBy: string) => {
  let settings = await prisma.siteSettings.findFirst();

  if (settings) {
    settings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        ...data,
        socialLinks: data.socialLinks as any,
        metadata: data.metadata as any,
        updatedBy,
        updatedAt: new Date(),
      },
    });
  } else {
    settings = await prisma.siteSettings.create({
      data: {
        ...data,
        socialLinks: data.socialLinks as any,
        metadata: data.metadata as any,
        createdBy: updatedBy,
      },
    });
  }

  logger.info('Site settings updated', { updatedBy });
  return settings;
};

export default {
  // Pages
  createPage, updatePage, getPageBySlug, getPageById, listPages, deletePage,
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

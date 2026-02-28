import { useState, useCallback } from 'react';
import apiClient from '../api/client';
import type {
  Page, PageFormData, PageQueryParams,
  Banner, BannerFormData, BannerPosition,
  NewsArticle, NewsFormData, NewsQueryParams, NewsListResponse,
  GalleryAlbum, GalleryAlbumFormData, GalleryItem, GalleryItemFormData,
  Menu, MenuItem, MenuLocation,
  SiteSettings,
} from '@/types/cms';

const CMS_API = '/cms';

// ==========================================
// PAGE HOOKS
// ==========================================

export const usePages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ data: Page[]; total: number; totalPages: number } | null>(null);

  const fetchPages = useCallback(async (params?: PageQueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${CMS_API}/admin/pages`, { params });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pages');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPage = useCallback(async (pageData: PageFormData): Promise<Page> => {
    const response = await apiClient.post(`${CMS_API}/admin/pages`, pageData);
    return response.data.data;
  }, []);

  const updatePage = useCallback(async (pageId: string, pageData: Partial<PageFormData>): Promise<Page> => {
    const response = await apiClient.put(`${CMS_API}/admin/pages/${pageId}`, pageData);
    return response.data.data;
  }, []);

  const deletePage = useCallback(async (pageId: string): Promise<void> => {
    await apiClient.delete(`${CMS_API}/admin/pages/${pageId}`);
  }, []);

  return { fetchPages, createPage, updatePage, deletePage, data, isLoading, error };
};

export const usePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Page | null>(null);

  const fetchPageBySlug = useCallback(async (slug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${CMS_API}/pages/slug/${slug}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Page not found');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchPageBySlug, data, isLoading, error };
};

// ==========================================
// BANNER HOOKS
// ==========================================

export const useBanners = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Banner[]>([]);

  const fetchBanners = useCallback(async (params?: { position?: BannerPosition; active?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${CMS_API}/banners`, { params });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch banners');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBanner = useCallback(async (bannerData: BannerFormData): Promise<Banner> => {
    const response = await apiClient.post(`${CMS_API}/admin/banners`, bannerData);
    return response.data.data;
  }, []);

  const updateBanner = useCallback(async (bannerId: string, bannerData: Partial<BannerFormData>): Promise<Banner> => {
    const response = await apiClient.put(`${CMS_API}/admin/banners/${bannerId}`, bannerData);
    return response.data.data;
  }, []);

  const deleteBanner = useCallback(async (bannerId: string): Promise<void> => {
    await apiClient.delete(`${CMS_API}/admin/banners/${bannerId}`);
  }, []);

  return { fetchBanners, createBanner, updateBanner, deleteBanner, data, isLoading, error };
};

// ==========================================
// NEWS HOOKS
// ==========================================

export const useNews = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NewsListResponse | null>(null);

  const fetchNews = useCallback(async (params?: NewsQueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${CMS_API}/news`, { params });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch news');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNews = useCallback(async (newsData: NewsFormData): Promise<NewsArticle> => {
    const response = await apiClient.post(`${CMS_API}/admin/news`, newsData);
    return response.data.data;
  }, []);

  const updateNews = useCallback(async (newsId: string, newsData: Partial<NewsFormData>): Promise<NewsArticle> => {
    const response = await apiClient.put(`${CMS_API}/admin/news/${newsId}`, newsData);
    return response.data.data;
  }, []);

  const deleteNews = useCallback(async (newsId: string): Promise<void> => {
    await apiClient.delete(`${CMS_API}/admin/news/${newsId}`);
  }, []);

  return { fetchNews, createNews, updateNews, deleteNews, data, isLoading, error };
};

export const useNewsArticle = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NewsArticle | null>(null);

  const fetchNewsBySlug = useCallback(async (slug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${CMS_API}/news/slug/${slug}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Article not found');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchNewsBySlug, data, isLoading, error };
};

export const useNewsCategories = () => {
  const [data, setData] = useState<string[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get(`${CMS_API}/news/categories`);
      setData(response.data.data);
      return response.data.data;
    } catch (err) {
      return [];
    }
  }, []);

  return { fetchCategories, data };
};

// ==========================================
// GALLERY HOOKS
// ==========================================

export const useGalleryAlbums = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ data: GalleryAlbum[]; total: number; totalPages: number } | null>(null);

  const fetchAlbums = useCallback(async (params?: { page?: number; limit?: number; status?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${CMS_API}/gallery`, { params });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch albums');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAlbum = useCallback(async (albumData: GalleryAlbumFormData): Promise<GalleryAlbum> => {
    const response = await apiClient.post(`${CMS_API}/admin/gallery/albums`, albumData);
    return response.data.data;
  }, []);

  const updateAlbum = useCallback(async (albumId: string, albumData: Partial<GalleryAlbumFormData>): Promise<GalleryAlbum> => {
    const response = await apiClient.put(`${CMS_API}/admin/gallery/albums/${albumId}`, albumData);
    return response.data.data;
  }, []);

  const deleteAlbum = useCallback(async (albumId: string): Promise<void> => {
    await apiClient.delete(`${CMS_API}/admin/gallery/albums/${albumId}`);
  }, []);

  return { fetchAlbums, createAlbum, updateAlbum, deleteAlbum, data, isLoading, error };
};

export const useGalleryAlbum = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GalleryAlbum | null>(null);

  const fetchAlbumBySlug = useCallback(async (slug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${CMS_API}/gallery/slug/${slug}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Album not found');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAlbumBySlug, data, isLoading, error };
};

export const useGalleryItems = () => {
  const addItem = useCallback(async (itemData: GalleryItemFormData): Promise<GalleryItem> => {
    const response = await apiClient.post(`${CMS_API}/admin/gallery/items`, itemData);
    return response.data.data;
  }, []);

  const updateItem = useCallback(async (itemId: string, itemData: Partial<GalleryItemFormData>): Promise<GalleryItem> => {
    const response = await apiClient.put(`${CMS_API}/admin/gallery/items/${itemId}`, itemData);
    return response.data.data;
  }, []);

  const deleteItem = useCallback(async (itemId: string): Promise<void> => {
    await apiClient.delete(`${CMS_API}/admin/gallery/items/${itemId}`);
  }, []);

  return { addItem, updateItem, deleteItem };
};

// Public-facing gallery hooks (no auth required)
export const usePublicGalleryAlbums = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GalleryAlbum[]>([]);

  const fetchPublicAlbums = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { status: 'PUBLISHED' };
      if (category) params.category = category;
      const response = await apiClient.get(`${CMS_API}/gallery`, { params });
      const result = response.data.data;
      const albums = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setData(albums);
      return albums;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch gallery');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchPublicAlbums, data, isLoading, error };
};

export const usePublicGalleryAlbum = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GalleryAlbum | null>(null);

  const fetchPublicAlbumById = useCallback(async (slugOrId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Always fetch by slug for public page (slug is in URL)
      const response = await apiClient.get(`${CMS_API}/gallery/slug/${slugOrId}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Album not found');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchPublicAlbumById, data, isLoading, error };
};

// ==========================================
// MENU HOOKS
// ==========================================

export const useMenus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Menu[]>([]);

  const fetchMenus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`${CMS_API}/admin/menus`);
      setData(response.data.data);
      return response.data.data;
    } catch (err) {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMenu = useCallback(async (menuData: { name: string; location: MenuLocation; items: MenuItem[] }): Promise<Menu> => {
    const response = await apiClient.post(`${CMS_API}/admin/menus`, menuData);
    return response.data.data;
  }, []);

  const updateMenu = useCallback(async (menuId: string, menuData: Partial<Menu>): Promise<Menu> => {
    const response = await apiClient.put(`${CMS_API}/admin/menus/${menuId}`, menuData);
    return response.data.data;
  }, []);

  const deleteMenu = useCallback(async (menuId: string): Promise<void> => {
    await apiClient.delete(`${CMS_API}/admin/menus/${menuId}`);
  }, []);

  return { fetchMenus, createMenu, updateMenu, deleteMenu, data, isLoading };
};

export const useMenu = () => {
  const [data, setData] = useState<Menu | null>(null);

  const fetchMenuByLocation = useCallback(async (location: MenuLocation) => {
    try {
      const response = await apiClient.get(`${CMS_API}/menus/location/${location}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err) {
      return null;
    }
  }, []);

  return { fetchMenuByLocation, data };
};

// ==========================================
// TEAM MEMBER HOOKS
// ==========================================

export const useTeamMembers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchTeamMembers = useCallback(async (adminMode = false) => {
    setIsLoading(true);
    try {
      const url = adminMode ? '/team-members' : '/team-members/public';
      const response = await apiClient.get(url);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch { return []; }
    finally { setIsLoading(false); }
  }, []);

  return { fetchTeamMembers, data, isLoading };
};

// ==========================================
// MILESTONE HOOKS
// ==========================================

export const useMilestones = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchMilestones = useCallback(async (adminMode = false) => {
    setIsLoading(true);
    try {
      const url = adminMode ? '/milestones' : '/milestones/public';
      const response = await apiClient.get(url);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch { return []; }
    finally { setIsLoading(false); }
  }, []);

  return { fetchMilestones, data, isLoading };
};

// ==========================================
// CONTACT MESSAGE HOOKS
// ==========================================

export const useContactMessages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchMessages = useCallback(async (params?: { page?: number; limit?: number; unread?: boolean }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/contact/messages', { params });
      setData(response.data.data);
      return response.data.data;
    } catch { return null; }
    finally { setIsLoading(false); }
  }, []);

  const submitContact = useCallback(async (formData: { name: string; email: string; phone?: string; subject?: string; message: string }) => {
    const response = await apiClient.post('/contact/submit', formData);
    return response.data;
  }, []);

  return { fetchMessages, submitContact, data, isLoading };
};

// ==========================================
// SITE SETTINGS HOOKS
// ==========================================

export const useSiteSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SiteSettings | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`${CMS_API}/settings`);
      setData(response.data.data);
      return response.data.data;
    } catch (err) {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (settings: SiteSettings): Promise<SiteSettings> => {
    const response = await apiClient.put(`${CMS_API}/admin/settings`, settings);
    setData(response.data.data);
    return response.data.data;
  }, []);

  return { fetchSettings, updateSettings, data, isLoading };
};

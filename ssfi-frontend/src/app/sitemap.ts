import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ssfiskate.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

async function fetchJSON(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/results`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/beginner-certification`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/coach-certification`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/affiliated-coaches`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/beginner-program`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/refund`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic: News articles
  const newsRoutes: MetadataRoute.Sitemap = [];
  const newsData = await fetchJSON(`${API_URL}/cms/news?status=PUBLISHED&limit=100`);
  if (newsData?.data?.data) {
    for (const article of newsData.data.data) {
      newsRoutes.push({
        url: `${BASE_URL}/news/${article.slug}`,
        lastModified: new Date(article.updatedAt || article.publishedAt || article.createdAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } else if (Array.isArray(newsData?.data)) {
    for (const article of newsData.data) {
      newsRoutes.push({
        url: `${BASE_URL}/news/${article.slug}`,
        lastModified: new Date(article.updatedAt || article.publishedAt || article.createdAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Dynamic: Gallery albums
  const galleryRoutes: MetadataRoute.Sitemap = [];
  const galleryData = await fetchJSON(`${API_URL}/cms/gallery?status=PUBLISHED`);
  if (galleryData?.data) {
    const albums = Array.isArray(galleryData.data) ? galleryData.data : galleryData.data.data || [];
    for (const album of albums) {
      galleryRoutes.push({
        url: `${BASE_URL}/gallery/${album.slug}`,
        lastModified: new Date(album.updatedAt || album.createdAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  // Dynamic: Events
  const eventRoutes: MetadataRoute.Sitemap = [];
  const eventData = await fetchJSON(`${API_URL}/events?limit=100`);
  if (eventData?.data?.events) {
    for (const event of eventData.data.events) {
      eventRoutes.push({
        url: `${BASE_URL}/events/${event.id}`,
        lastModified: new Date(event.updatedAt || event.createdAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return [...staticRoutes, ...newsRoutes, ...galleryRoutes, ...eventRoutes];
}

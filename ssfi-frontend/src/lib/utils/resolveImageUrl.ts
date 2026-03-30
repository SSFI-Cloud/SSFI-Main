/**
 * Resolves image URLs from various sources:
 * - Full HTTP URLs → returned as-is
 * - /images/... → local public folder (served by Vercel)
 * - /uploads/... → backend server (Railway/Hostinger)
 * - Empty/null → returns empty string
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1').replace('/api/v1', '');

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;  // Base64 data URIs
  if (url.startsWith('/images/')) return url; // Local public folder
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`; // Backend uploads
  return url;
}

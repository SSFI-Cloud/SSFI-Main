import type { Metadata } from 'next';
import AlbumDetailClient from './AlbumDetailClient';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getAlbum(slug: string) {
  try {
    const res = await fetch(`${API_URL}/cms/gallery/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbum(slug);

  if (!album) {
    return { title: 'Album Not Found' };
  }

  return {
    title: `${album.title} — Gallery`,
    description: album.description || `Photo album: ${album.title} — SSFI Event Gallery`,
    alternates: { canonical: `/gallery/${slug}` },
    openGraph: {
      title: `${album.title} | SSFI Gallery`,
      description: album.description || `Browse photos from ${album.title}`,
      url: `/gallery/${slug}`,
      images: album.coverImage ? [{ url: album.coverImage, alt: album.title }] : [],
    },
  };
}

export default async function AlbumDetailPage({ params }: Props) {
  const { slug } = await params;
  const album = await getAlbum(slug);

  return (
    <>
      {album && (
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Gallery', url: '/gallery' },
            { name: album.title, url: `/gallery/${slug}` },
          ]}
        />
      )}
      <AlbumDetailClient />
    </>
  );
}

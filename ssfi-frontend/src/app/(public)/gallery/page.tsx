import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import GalleryPageClient from './GalleryPageClient';

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description:
    'Browse photo albums from SSFI championships, workshops, training camps, and skating events across India.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Event Photo Gallery | SSFI',
    description: 'Memorable moments from speed skating championships and events across India.',
    url: '/gallery',
  },
};

export default function GalleryPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Gallery', url: '/gallery' },
        ]}
      />
      <GalleryPageClient />
    </>
  );
}

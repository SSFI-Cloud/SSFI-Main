import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import EventsPageClient from './EventsPageClient';

export const metadata: Metadata = {
  title: 'Skating Events',
  description:
    'Browse upcoming and past SSFI speed skating events — national championships, state competitions, district tournaments, and workshops across India.',
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Skating Events | SSFI',
    description: 'Find and register for speed skating events across India.',
    url: '/events',
  },
};

export default function EventsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Events', url: '/events' },
        ]}
      />
      <EventsPageClient />
    </>
  );
}

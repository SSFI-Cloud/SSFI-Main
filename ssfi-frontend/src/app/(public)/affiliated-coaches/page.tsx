import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import AffiliatedCoachesClient from './AffiliatedCoachesClient';

export const metadata: Metadata = {
  title: 'Affiliated Coaches',
  description:
    'Find SSFI-certified speed skating coaches across India. Browse coaches by certification level, state, and specialization.',
  alternates: { canonical: '/affiliated-coaches' },
  openGraph: {
    title: 'Affiliated Coaches | SSFI',
    description: 'Find certified speed skating coaches across India.',
    url: '/affiliated-coaches',
  },
};

export default function AffiliatedCoachesPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Affiliated Coaches', url: '/affiliated-coaches' },
        ]}
      />
      <AffiliatedCoachesClient />
    </>
  );
}

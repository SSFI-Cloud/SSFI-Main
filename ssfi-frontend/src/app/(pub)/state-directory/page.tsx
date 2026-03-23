import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import StateDirectoryClient from './StateDirectoryClient';

export const metadata: Metadata = {
  title: 'State Directory',
  description:
    'Explore SSFI state associations — view President, Secretary, districts, clubs, and registered skaters for each state.',
  alternates: { canonical: '/state-directory' },
  openGraph: {
    title: 'State Directory | SSFI',
    description: 'View the organizational hierarchy of SSFI state associations across India.',
    url: '/state-directory',
  },
};

export default function StateDirectoryPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'State Directory', url: '/state-directory' },
        ]}
      />
      <StateDirectoryClient />
    </>
  );
}

import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import CoachCertClient from './CoachCertClient';

export const metadata: Metadata = {
  title: 'Coach Certification',
  description:
    'SSFI Coach Certification program — Become a certified speed skating coach. Level 1, 2, and 3 certifications covering techniques, safety, and competition training.',
  alternates: { canonical: '/coach-certification' },
  openGraph: {
    title: 'Coach Certification | SSFI',
    description: 'Become a certified SSFI speed skating coach with structured training programs.',
    url: '/coach-certification',
  },
};

export default function CoachCertPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Coach Certification', url: '/coach-certification' },
        ]}
      />
      <CoachCertClient />
    </>
  );
}

import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import BeginnerCertClient from './BeginnerCertClient';

export const metadata: Metadata = {
  title: 'Beginner Certification Program',
  description:
    'SSFI Beginner Certification — Start your speed skating journey with structured programs covering inline skating, speed skating, and hockey fundamentals. All ages welcome.',
  alternates: { canonical: '/beginner-certification' },
  openGraph: {
    title: 'Beginner Certification | SSFI',
    description: 'Start your speed skating journey with SSFI beginner certification programs.',
    url: '/beginner-certification',
  },
};

export default function BeginnerCertPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Beginner Certification', url: '/beginner-certification' },
        ]}
      />
      <BeginnerCertClient />
    </>
  );
}

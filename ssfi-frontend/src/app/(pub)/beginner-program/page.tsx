import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import BeginnerProgramClient from './BeginnerProgramClient';

export const metadata: Metadata = {
  title: 'Beginner Program',
  description:
    'SSFI Beginner Skating Program — A structured pathway for new skaters to learn speed skating fundamentals, safety, and technique across India.',
  alternates: { canonical: '/beginner-program' },
  openGraph: {
    title: 'Beginner Skating Program | SSFI',
    description: 'Start your skating journey with SSFI\'s structured beginner program.',
    url: '/beginner-program',
  },
};

export default function BeginnerProgramPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Beginner Program', url: '/beginner-program' },
        ]}
      />
      <BeginnerProgramClient />
    </>
  );
}

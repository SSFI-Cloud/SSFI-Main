import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import ResultsPageClient from './ResultsPageClient';

export const metadata: Metadata = {
  title: 'Results & Rankings',
  description:
    'Official top-3 finishers for SSFI speed skating championships — view results by age group, discipline, and event across India.',
  alternates: { canonical: '/results' },
  openGraph: {
    title: 'Championship Results & Rankings | SSFI',
    description: 'Official race results from SSFI speed skating championships across India.',
    url: '/results',
  },
};

export default function ResultsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Results', url: '/results' },
        ]}
      />
      <ResultsPageClient />
    </>
  );
}

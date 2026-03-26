import type { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import NewsPageClient from './NewsPageClient';

export const metadata: Metadata = {
  title: 'News & Updates',
  description:
    'Latest news, updates, and announcements from the Speed Skating Federation of India. Stay informed about championships, events, and skating community happenings.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'News & Updates | SSFI',
    description: 'Latest news and updates from India\'s speed skating community.',
    url: '/news',
  },
};

export default function NewsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'News', url: '/news' },
        ]}
      />
      <NewsPageClient />
    </>
  );
}

import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import AboutPageClient from './AboutPageClient';
import { OrganizationSchema, BreadcrumbSchema } from '@/components/seo/StructuredData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

export const metadata: Metadata = {
  title: 'About SSFI',
  description:
    'Learn about the Speed Skating Federation of India (SSFI), founded in 2001. Our mission, leadership, milestones, and vision for speed skating in India.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About SSFI - Speed Skating Federation of India',
    description:
      'Founded in 2001 with 185 skaters, SSFI has grown to 5600+ registered skaters across 18 states. Meet our leadership and explore our journey.',
    url: '/about',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SSFI - Speed Skating Federation of India',
    description: 'Our mission, leadership, and journey building speed skating in India since 2001.',
  },
};

async function fetchData(url: string) {
  try {
    const res = await fetch(`${API_URL}${url}`, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for quick CMS updates
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const [milestones, stats, team] = await Promise.all([
    fetchData('/milestones/public'),
    fetchData('/stats/public'),
    fetchData('/team-members/public'),
  ]);

  return (
    <>
      <OrganizationSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'About', url: '/about' },
        ]}
      />
      <AboutPageClient
        initialMilestones={Array.isArray(milestones) && milestones.length > 0 ? milestones : null}
        initialStats={stats || null}
        initialTeam={Array.isArray(team) ? team : null}
      />
    </>
  );
}

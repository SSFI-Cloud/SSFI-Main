import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import ContactPageClient from './ContactPageClient';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with SSFI — Speed Skating Federation of India. Contact us for event registration, coaching, club affiliation, and general enquiries.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact SSFI - Speed Skating Federation of India',
    description:
      'Reach out to SSFI for event registrations, coaching certifications, partnerships, and general enquiries.',
    url: '/contact',
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

async function fetchSettings() {
  try {
    const res = await fetch(`${API_URL}/cms/settings`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function ContactPage() {
  const settings = await fetchSettings();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Contact', url: '/contact' },
        ]}
      />
      <ContactPageClient initialSettings={settings} />
    </>
  );
}

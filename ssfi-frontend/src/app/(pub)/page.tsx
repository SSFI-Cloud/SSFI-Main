import { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData';
import HomePageClient from './HomePageClient';

// Revalidate homepage every 60 seconds so shared caches (LiteSpeed, Cloudflare)
// don't serve stale HTML with old chunk hashes after deployments
export const revalidate = 60; // Revalidate every 1 minute for quick CMS updates

// Home page inherits default metadata from root layout (title.default)
// No need to re-export metadata here since root layout has comprehensive defaults

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

async function getHomepageData() {
  try {
    const res = await fetch(`${API_URL}/homepage`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? json.data : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <HomePageClient initialData={data} />
    </>
  );
}

import { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData';
import HomePageClient from './HomePageClient';

// Revalidate homepage every 60 seconds so shared caches (LiteSpeed, Cloudflare)
// don't serve stale HTML with old chunk hashes after deployments
export const revalidate = 300;

// Home page inherits default metadata from root layout (title.default)
// No need to re-export metadata here since root layout has comprehensive defaults

export default function HomePage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <HomePageClient />
    </>
  );
}

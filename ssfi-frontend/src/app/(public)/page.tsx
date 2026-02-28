import { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData';
import HomePageClient from './HomePageClient';

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

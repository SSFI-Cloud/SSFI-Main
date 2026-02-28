// JSON-LD Structured Data Components for SEO
// These render <script type="application/ld+json"> in the page head

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ssfiskate.com';

/** Organization schema — use on home/about pages */
export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'Speed Skating Federation of India',
    alternateName: 'SSFI',
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo/light.webp`,
    description:
      'The Speed Skating Federation of India (SSFI) is the official governing body for speed skating in India, founded in 2001.',
    foundingDate: '2001',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'P-12 Porkudil Nagar, Podumbhu',
      addressLocality: 'Madurai',
      addressRegion: 'Tamil Nadu',
      postalCode: '625018',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-96006-35806',
      contactType: 'customer service',
      email: 'info@ssfiskate.com',
      availableLanguage: ['English', 'Hindi', 'Tamil'],
    },
    sameAs: [
      'https://www.instagram.com/ssabornindia/',
      'https://www.youtube.com/@ssfiskate',
    ],
    sport: 'Speed Skating',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** WebSite schema with SearchAction — use on home page */
export function WebSiteSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SSFI - Speed Skating Federation of India',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/news?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** BreadcrumbList schema */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** NewsArticle schema — use on /news/[slug] */
export function ArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  slug,
  category,
}: {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  slug: string;
  category?: string;
}) {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    url: `${BASE_URL}/news/${slug}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: 'SSFI',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Speed Skating Federation of India',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/logo/light.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/news/${slug}`,
    },
  };

  if (image) {
    data.image = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  }
  if (category) {
    data.articleSection = category;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** SportsEvent schema — use on /events/[id] */
export function EventSchema({
  name,
  description,
  startDate,
  endDate,
  venue,
  city,
  state,
  eventId,
  entryFee,
  status,
  maxParticipants,
  image,
}: {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  venue: string;
  city: string;
  state?: string;
  eventId: number;
  entryFee?: number;
  status?: string;
  maxParticipants?: number;
  image?: string;
}) {
  const eventStatus =
    status === 'PUBLISHED' || status === 'ONGOING'
      ? 'https://schema.org/EventScheduled'
      : status === 'CANCELLED'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled';

  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    description: description || `${name} - Speed Skating event organized by SSFI`,
    startDate,
    endDate: endDate || startDate,
    eventStatus,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: state || '',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Speed Skating Federation of India',
      url: BASE_URL,
    },
    url: `${BASE_URL}/events/${eventId}`,
  };

  if (entryFee !== undefined) {
    data.offers = {
      '@type': 'Offer',
      price: entryFee,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/events/${eventId}`,
    };
  }
  if (maxParticipants) {
    data.maximumAttendeeCapacity = maxParticipants;
  }
  if (image) {
    data.image = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** FAQPage schema — use on about/contact */
export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

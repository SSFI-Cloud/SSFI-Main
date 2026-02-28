import type { Metadata } from 'next';
import NewsDetailClient from './NewsDetailClient';
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/StructuredData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ssfiskate.com';
const API_BASE = API_URL.replace('/api/v1', '');

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  try {
    const res = await fetch(`${API_URL}/cms/news/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The news article you are looking for could not be found.',
    };
  }

  const imageUrl = article.featuredImage
    ? article.featuredImage.startsWith('http')
      ? article.featuredImage
      : `${API_BASE}${article.featuredImage}`
    : `${BASE_URL}/images/og/og-default.jpg`;

  return {
    title: article.title,
    description: article.excerpt || `Read "${article.title}" on SSFI.`,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      url: `/news/${slug}`,
      type: 'article',
      publishedTime: article.publishedAt || article.createdAt,
      modifiedTime: article.updatedAt || article.publishedAt || article.createdAt,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: article.title }],
      section: article.category || 'News',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || article.title,
      images: [imageUrl],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  return (
    <>
      {article && (
        <>
          <ArticleSchema
            title={article.title}
            description={article.excerpt || article.title}
            image={article.featuredImage}
            datePublished={article.publishedAt || article.createdAt}
            dateModified={article.updatedAt || article.publishedAt}
            slug={slug}
            category={article.category}
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: '/' },
              { name: 'News', url: '/news' },
              { name: article.title, url: `/news/${slug}` },
            ]}
          />
        </>
      )}
      <NewsDetailClient />
    </>
  );
}

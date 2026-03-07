'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Calendar, Tag, Eye, Clock, Share2,
  Twitter, Facebook, Link as LinkIcon, Loader2, Newspaper,
  ArrowRight, Bookmark,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

interface NewsArticle {
  id: string; title: string; slug: string; content: string;
  excerpt?: string; featuredImage?: string; category?: string;
  tags?: string[]; publishedAt?: string; createdAt: string; views?: number;
  isFeatured?: boolean;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1').replace('/api/v1', '');
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const getImgSrc = (img?: string) => !img ? null : img.startsWith('http') ? img : `${API_BASE}${img}`;
const readTime = (content: string) => `${Math.max(1, Math.ceil(content.split(/\s+/).length / 200))} min read`;

// Minimal markdown-to-HTML renderer
function renderContent(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-10 mb-5">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 text-emerald-600 rounded text-sm font-mono">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="pl-4 border-l-4 border-emerald-300 text-gray-600 italic my-4">$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-600 my-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-600 my-1">$2</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-emerald-600 underline hover:text-emerald-700" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed my-4">')
    .replace(/^/, '<p class="text-gray-600 leading-relaxed my-4">')
    .replace(/$/, '</p>');
}

export default function NewsDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/cms/news/slug/${slug}`);
        const data = res.data?.data;
        if (!data) { setNotFoundFlag(true); return; }
        setArticle(data);
        // Load related articles from same category
        try {
          const params = new URLSearchParams({ limit: '3', status: 'PUBLISHED' });
          if (data.category) params.set('category', data.category);
          const relRes = await api.get(`/cms/news?${params}`);
          const relData = relRes.data?.data;
          const all: NewsArticle[] = Array.isArray(relData?.data) ? relData.data : Array.isArray(relData) ? relData : [];
          setRelated(all.filter(a => a.slug !== slug).slice(0, 3));
        } catch {}
      } catch {
        setNotFoundFlag(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  const share = (platform: 'twitter' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const title = article?.title || '';
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'facebook') window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    else { navigator.clipboard.writeText(url); toast.success('Link copied!'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  );

  if (notFoundFlag || !article) return (
    <div className="min-h-screen bg-[#f5f6f8] flex flex-col items-center justify-center gap-4">
      <Newspaper className="w-16 h-16 text-gray-300" />
      <h2 className="text-2xl font-bold text-gray-700">Article not found</h2>
      <Link href="/news" className="text-emerald-600 hover:underline flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Back to News</Link>
    </div>
  );

  const imgSrc = getImgSrc(article.featuredImage);
  const publishDate = formatDate(article.publishedAt || article.createdAt);

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* Hero image / dark header */}
      <section className="relative overflow-hidden">
        {imgSrc ? (
          <div className="relative h-[420px] md:h-[520px]">
            <Image src={imgSrc} alt={article.title} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-gray-900/30" />
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="max-w-4xl mx-auto w-full px-4 pb-10 md:pb-14">
                <div className="flex items-center gap-3 mb-4">
                  {article.category && (
                    <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold backdrop-blur-sm">{article.category}</span>
                  )}
                  {article.isFeatured && (
                    <span className="px-3 py-1 rounded-full bg-teal-500/90 text-white text-xs font-bold backdrop-blur-sm">Featured</span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">{article.title}</h1>
                {article.excerpt && <p className="text-white/70 text-lg max-w-2xl">{article.excerpt}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1d35] to-[#162d50] pt-32 pb-14 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-5">
                {article.category && <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">{article.category}</span>}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">{article.title}</h1>
              {article.excerpt && <p className="text-white/60 text-lg max-w-2xl">{article.excerpt}</p>}
            </div>
          </div>
        )}
      </section>

      {/* Meta bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/news" className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> All News
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{publishDate}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{readTime(article.content)}</span>
            {article.views !== undefined && <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{article.views} views</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => share('twitter')} className="p-1.5 text-gray-400 hover:text-sky-400 hover:bg-sky-50 rounded-lg transition-colors"><Twitter className="w-4 h-4" /></button>
            <button onClick={() => share('facebook')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Facebook className="w-4 h-4" /></button>
            <button onClick={() => share('copy')} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><LinkIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12">
          <div
            className="prose prose-gray max-w-none text-[16.5px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent(article.content), { ADD_ATTR: ['target', 'rel'] }) }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-8 border-t border-gray-100">
              <Tag className="w-4 h-4 text-gray-400" />
              {article.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{tag}</span>
              ))}
            </div>
          )}

          {/* Share footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Share this article</p>
            <div className="flex items-center gap-2">
              <button onClick={() => share('twitter')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 text-sm font-medium transition-colors">
                <Twitter className="w-4 h-4" /> Twitter
              </button>
              <button onClick={() => share('facebook')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors">
                <Facebook className="w-4 h-4" /> Facebook
              </button>
              <button onClick={() => share('copy')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-sm font-medium transition-colors">
                <LinkIcon className="w-4 h-4" /> Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Related Articles</h2>
              <Link href="/news" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">All News <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(rel => {
                const relImg = getImgSrc(rel.featuredImage);
                return (
                  <Link key={rel.id} href={`/news/${rel.slug}`}>
                    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
                      <div className="aspect-[16/9] relative bg-gray-50 flex items-center justify-center overflow-hidden">
                        {relImg ? <Image src={relImg} alt={rel.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" />
                          : <Newspaper className="w-8 h-8 text-gray-300" />}
                      </div>
                      <div className="p-4">
                        {rel.category && <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">{rel.category}</span>}
                        <h3 className="text-sm font-bold text-gray-900 mt-1 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">{rel.title}</h3>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(rel.publishedAt || rel.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </article>
    </div>
  );
}

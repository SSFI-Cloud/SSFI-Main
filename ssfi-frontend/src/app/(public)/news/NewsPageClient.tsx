'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    Search, Calendar, Clock, ArrowRight, Newspaper,
    X, Sparkles, TrendingUp, BookOpen, Tag, Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';

interface NewsArticle {
    id: string; title: string; slug: string; excerpt?: string;
    featuredImage?: string; category?: string; status: string;
    publishedAt?: string; createdAt: string; views?: number;
    isFeatured?: boolean;
}

const ACCENT_COLORS = ['amber', 'violet', 'rose', 'sky', 'emerald', 'orange'];
const ACCENT: Record<string, { badge: string; iconBg: string; hover: string; gradient: string }> = {
    amber:   { badge: 'bg-amber-50 text-amber-700 border-amber-200',   iconBg: 'bg-amber-100 text-amber-600',   hover: 'hover:border-amber-200',   gradient: 'from-amber-500 to-orange-500' },
    violet:  { badge: 'bg-violet-50 text-violet-700 border-violet-200', iconBg: 'bg-violet-100 text-violet-600', hover: 'hover:border-violet-200', gradient: 'from-violet-500 to-purple-500' },
    rose:    { badge: 'bg-rose-50 text-rose-700 border-rose-200',       iconBg: 'bg-rose-100 text-rose-600',     hover: 'hover:border-rose-200',   gradient: 'from-rose-500 to-pink-500' },
    sky:     { badge: 'bg-sky-50 text-sky-700 border-sky-200',          iconBg: 'bg-sky-100 text-sky-600',       hover: 'hover:border-sky-200',    gradient: 'from-sky-500 to-cyan-500' },
    emerald: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600', hover: 'hover:border-emerald-200', gradient: 'from-emerald-500 to-teal-500' },
    orange:  { badge: 'bg-orange-50 text-orange-700 border-orange-200', iconBg: 'bg-orange-100 text-orange-600', hover: 'hover:border-orange-200', gradient: 'from-orange-500 to-red-500' },
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

const getAccent = (_article: NewsArticle, idx: number) => ACCENT_COLORS[idx % ACCENT_COLORS.length];
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const getImgSrc = (img?: string) => !img ? null : img.startsWith('http') ? img : `${API_BASE}${img}`;

export default function NewsPageClient() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [email, setEmail] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const load = async (pg = 1, cat?: string, q?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pg), limit: '9', status: 'PUBLISHED' });
            if (cat && cat !== 'All') params.set('category', cat);
            if (q) params.set('search', q);
            const res = await apiClient.get(`/cms/news?${params}`);
            const result = res.data?.data;
            setArticles(Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []);
            setTotalPages(result?.totalPages || 1);
        } catch {
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const loadCats = async () => {
        try {
            const res = await apiClient.get('/cms/news/categories');
            const cats = res.data?.data || [];
            setCategories(['All', ...cats.filter(Boolean)]);
        } catch {}
    };

    useEffect(() => { loadCats(); load(1); }, []);

    const handleSearch = (q: string) => { setSearchQuery(q); setPage(1); load(1, selectedCategory, q); };
    const handleCat = (cat: string) => { setSelectedCategory(cat); setPage(1); load(1, cat, searchQuery); };
    const handlePage = (pg: number) => { setPage(pg); load(pg, selectedCategory, searchQuery); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const featured = articles.find(a => a.isFeatured) || articles[0];
    const rest = articles.filter(a => a.id !== featured?.id);

    return (
        <div className="min-h-screen bg-[#f5f6f8]">
            {/* HERO */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1d35] to-[#162d50]">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }} />
                <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
                <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
                    <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-bold mb-6">
                            <Sparkles className="w-4 h-4" /> Latest Updates
                        </span>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
                            News &{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Updates</span>
                        </h1>
                        <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto">
                            Stay informed about the latest happenings in speed skating across India
                        </p>
                    </motion.div>
                </div>
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }} />
            </section>

            {/* FILTERS */}
            <section className="py-10 md:py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="relative max-w-xl mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
                            placeholder="Search news articles..."
                            className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 shadow-sm" />
                        {searchQuery && <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-10">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => handleCat(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat ? 'bg-violet-600 text-white shadow-md shadow-violet-200/50' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-200 hover:text-violet-600'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                            <p className="text-gray-400">Loading articles...</p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                                <Newspaper className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No articles found</h3>
                            <p className="text-gray-400">Try adjusting your search or category filter.</p>
                        </div>
                    ) : (
                        <>
                            {/* Featured article */}
                            {featured && (() => {
                                const ac = ACCENT[getAccent(featured, 0)];
                                const imgSrc = getImgSrc(featured.featuredImage);
                                return (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                                        <Link href={`/news/${featured.slug}`}>
                                            <div className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden ${ac.hover} hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300`}>
                                                <div className={`h-1.5 bg-gradient-to-r ${ac.gradient}`} />
                                                <div className="grid md:grid-cols-2 gap-0">
                                                    <div className="relative h-56 md:h-auto min-h-[260px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                                                        {imgSrc ? (
                                                            <Image src={imgSrc} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
                                                        ) : (
                                                            <div className={`w-20 h-20 rounded-2xl ${ac.iconBg} flex items-center justify-center`}><Newspaper className="w-10 h-10" /></div>
                                                        )}
                                                        {featured.isFeatured && (
                                                            <div className="absolute top-4 left-4">
                                                                <span className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1.5">
                                                                    <TrendingUp className="w-3 h-3" /> Featured
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-7 md:p-9 flex flex-col justify-center">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            {featured.category && <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ac.badge}`}>{featured.category}</span>}
                                                        </div>
                                                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight group-hover:text-violet-600 transition-colors">{featured.title}</h2>
                                                        {featured.excerpt && <p className="text-gray-500 text-[15px] leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {formatDate(featured.publishedAt || featured.createdAt)}
                                                            </div>
                                                            <span className="text-violet-600 text-sm font-bold flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                                                                Read Full Story <ArrowRight className="w-4 h-4" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })()}

                            {/* Grid */}
                            {rest.length > 0 && (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {rest.map((article, i) => {
                                        const ac = ACCENT[getAccent(article, i + 1)];
                                        const imgSrc = getImgSrc(article.featuredImage);
                                        return (
                                            <motion.article key={article.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                                                <Link href={`/news/${article.slug}`}>
                                                    <div className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden ${ac.hover} hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 h-full flex flex-col`}>
                                                        <div className={`h-1 bg-gradient-to-r ${ac.gradient}`} />
                                                        <div className="aspect-[16/9] relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                                                            {imgSrc ? (
                                                                <Image src={imgSrc} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                                                            ) : (
                                                                <div className={`w-14 h-14 rounded-xl ${ac.iconBg} flex items-center justify-center`}><Newspaper className="w-7 h-7" /></div>
                                                            )}
                                                        </div>
                                                        <div className="p-5 flex flex-col flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                {article.category && <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${ac.badge}`}>{article.category}</span>}
                                                            </div>
                                                            <h3 className="text-[17px] font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors leading-snug">{article.title}</h3>
                                                            {article.excerpt && <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">{article.excerpt}</p>}
                                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                                                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />{formatDate(article.publishedAt || article.createdAt)}
                                                                </span>
                                                                <span className="text-violet-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Read <ArrowRight className="w-3.5 h-3.5" /></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.article>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-10">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                        <button key={pg} onClick={() => handlePage(pg)}
                                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${pg === page ? 'bg-violet-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'}`}>
                                            {pg}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="pb-20 pt-6">
                <div className="max-w-7xl mx-auto px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="relative rounded-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#162d50] to-[#0f1d35]" />
                        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
                        <div className="relative p-10 md:p-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Stay in the Loop</h2>
                            <p className="text-white/50 mb-8 max-w-xl mx-auto text-lg">
                                Subscribe for the latest news, event schedules, and announcements from SSFI.
                            </p>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!email) return;
                                try {
                                    await (await import('@/lib/api/client')).default.post('/contact/submit', {
                                        name: 'Newsletter Subscriber',
                                        email,
                                        subject: 'newsletter',
                                        message: `Newsletter subscription request from ${email}`,
                                    });
                                    toast.success('Subscribed! You\'ll receive our latest updates.');
                                } catch {
                                    toast.error('Subscription failed. Please try again.');
                                }
                                setEmail('');
                            }}
                                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required
                                    className="flex-1 px-5 py-3.5 bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/15 focus:outline-none focus:border-violet-400/50 backdrop-blur-sm" />
                                <button type="submit" className="px-7 py-3.5 bg-gradient-to-r from-violet-500 to-sky-500 text-white rounded-xl font-bold hover:scale-[1.03] transition-all shadow-lg shadow-violet-500/25">
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

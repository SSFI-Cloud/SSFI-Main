'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
    Camera,
    ChevronLeft,
    ChevronRight,
    Calendar,
    MapPin,
    ImageIcon,
    Loader2,
    Sparkles,
    Eye,
    Layers,
} from 'lucide-react';
import { usePublicGalleryAlbums } from '@/lib/hooks/useCMS';

interface GalleryAlbum {
    id: string; title: string; slug: string; description?: string; coverImage?: string; category?: string;
    eventId?: number; event?: { id: number; name: string; eventDate?: string; venue?: string };
    items?: { id: string; url: string; title?: string }[]; _count?: { items: number }; createdAt: string;
}

// No placeholder/demo data — gallery shows only real published albums from the API

const CARD_ACCENTS = [
    { gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100', border: 'hover:border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { gradient: 'from-teal-400 to-emerald-500', bg: 'bg-teal-50', text: 'text-teal-600', iconBg: 'bg-teal-100', border: 'hover:border-teal-200', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
    { gradient: 'from-teal-400 to-emerald-500', bg: 'bg-teal-50', text: 'text-teal-600', iconBg: 'bg-teal-100', border: 'hover:border-teal-200', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
    { gradient: 'from-emerald-500 to-cyan-500', bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100', border: 'hover:border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { gradient: 'from-sky-400 to-cyan-500', bg: 'bg-sky-50', text: 'text-sky-600', iconBg: 'bg-sky-100', border: 'hover:border-sky-200', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
    { gradient: 'from-cyan-400 to-teal-500', bg: 'bg-cyan-50', text: 'text-cyan-600', iconBg: 'bg-cyan-100', border: 'hover:border-cyan-200', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];

/* ── 3D carousel transforms ── */
function getCardTransform(offset: number) {
    const abs = Math.abs(offset);
    const sign = offset < 0 ? -1 : offset > 0 ? 1 : 0;
    if (abs === 0) return { x: 0, rotateY: 0, scale: 1, z: 50, opacity: 1, zIndex: 10 };
    if (abs === 1) return { x: sign * 380, rotateY: sign * -35, scale: 0.82, z: -80, opacity: 0.85, zIndex: 8 };
    if (abs === 2) return { x: sign * 600, rotateY: sign * -45, scale: 0.65, z: -200, opacity: 0.5, zIndex: 5 };
    return { x: sign * 750, rotateY: sign * -50, scale: 0.5, z: -300, opacity: 0.2, zIndex: 2 };
}

export default function GalleryPageClient() {
    const { fetchPublicAlbums, data: apiAlbums, isLoading } = usePublicGalleryAlbums();
    const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        fetchPublicAlbums().then((r: GalleryAlbum[]) => { setAlbums(r || []); }).catch(() => { setAlbums([]); });
    }, [fetchPublicAlbums]);

    const goTo = useCallback((i: number) => { if (i >= 0 && i < albums.length) setActiveIndex(i); }, [albums.length]);
    const goNext = useCallback(() => goTo((activeIndex + 1) % albums.length), [activeIndex, albums.length, goTo]);
    const goPrev = useCallback(() => goTo((activeIndex - 1 + albums.length) % albums.length), [activeIndex, albums.length, goTo]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') goPrev(); if (e.key === 'ArrowRight') goNext(); };
        window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
    }, [goNext, goPrev]);

    useEffect(() => { const t = setInterval(goNext, 5000); return () => clearInterval(t); }, [goNext]);

    return (
        <div className="min-h-screen bg-[#f5f6f8]">

            {/* ═══════ HERO ═══════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1d35] to-[#162d50]">
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }} />
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
                <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />

                <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
                    <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                            <Camera className="w-4 h-4" /> Photo Gallery
                        </span>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
                            Event{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Gallery</span>
                        </h1>
                        <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto">
                            Memorable moments from championships, workshops, and training programs across India
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-3 mt-10">
                        {[
                            { icon: Layers, label: 'Albums', value: `${albums.length || 0}` },
                            { icon: ImageIcon, label: 'Photos', value: `${albums.reduce((sum, a) => sum + (a._count?.items || 0), 0)}` },
                            { icon: Eye, label: 'Events', value: `${albums.filter(a => a.eventId).length}` },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
                                <s.icon className="w-4 h-4 text-emerald-400" />
                                <span className="text-white font-bold text-sm">{s.value}</span>
                                <span className="text-white/40 text-sm">{s.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
            </section>

            {/* ═══════ 3D CAROUSEL — light bg ═══════ */}
            <section className="py-16 md:py-24 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-100/30 rounded-full blur-[200px] -z-0" />

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Immersive Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Visuals</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">
                            A curated reel of championships, workshops, and memorable skating moments
                        </p>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative w-14 h-14 mb-4">
                                <div className="absolute inset-0 rounded-full border-[3px] border-gray-200" />
                                <div className="absolute inset-0 rounded-full border-[3px] border-t-emerald-500 animate-spin" />
                            </div>
                            <p className="text-gray-400 text-sm">Loading gallery…</p>
                        </div>
                    ) : albums.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                                <Camera className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Gallery Coming Soon</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                                Event photos and gallery albums will appear here once published. Check back after upcoming events!
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Carousel */}
                            <div className="gallery-carousel">
                                <div className="gallery-carousel-track">
                                    {albums.map((album, index) => {
                                        const offset = index - activeIndex;
                                        if (Math.abs(offset) > 3) return null;
                                        const t = getCardTransform(offset);
                                        const ac = CARD_ACCENTS[index % CARD_ACCENTS.length];
                                        return (
                                            <motion.div key={album.id} className="gallery-card"
                                                initial={false}
                                                animate={{ x: t.x, rotateY: t.rotateY, scale: t.scale, z: t.z, opacity: t.opacity, zIndex: t.zIndex }}
                                                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                                onClick={() => offset !== 0 && goTo(index)}
                                                style={{ transformStyle: 'preserve-3d' }}>
                                                {album.coverImage ? (
                                                    <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${ac.gradient} flex flex-col items-center justify-center gap-4`}>
                                                        <ImageIcon className="w-16 h-16 text-white/40" />
                                                        <span className="text-white/50 text-sm font-medium px-4 text-center">{album.title}</span>
                                                    </div>
                                                )}
                                                <div className="gallery-card-overlay">
                                                    <h3>{album.event?.name || album.title}</h3>
                                                    <p className="flex items-center gap-1.5 mt-1">
                                                        {album.event?.venue && <><MapPin className="w-3.5 h-3.5" />{album.event.venue}</>}
                                                        {album.event?.eventDate && (
                                                            <span className="ml-3 flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {new Date(album.event.eventDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </p>
                                                    {album._count?.items !== undefined && (
                                                        <p className="mt-1 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" />{album._count.items} photos</p>
                                                    )}
                                                </div>
                                                {offset === 0 && <Link href={`/gallery/${album.slug}`} className="absolute inset-0 z-10" aria-label={`View ${album.title}`} />}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <button onClick={goPrev} className="gallery-nav-btn prev" aria-label="Previous"><ChevronLeft className="w-6 h-6" /></button>
                                <button onClick={goNext} className="gallery-nav-btn next" aria-label="Next"><ChevronRight className="w-6 h-6" /></button>
                            </div>

                            {/* Dots */}
                            <div className="gallery-dots">
                                {albums.map((_, i) => (
                                    <button key={i} onClick={() => goTo(i)} className={`gallery-dot ${i === activeIndex ? 'active' : ''}`} aria-label={`Album ${i + 1}`} />
                                ))}
                            </div>

                            {/* Active Album Info */}
                            <motion.div key={activeIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="text-center mt-8">
                                <h3 className="text-2xl font-extrabold text-gray-900">{albums[activeIndex]?.title}</h3>
                                {albums[activeIndex]?.description && (
                                    <p className="text-gray-500 mt-2 max-w-lg mx-auto">{albums[activeIndex].description}</p>
                                )}
                                <Link href={`/gallery/${albums[activeIndex]?.slug}`}
                                    className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200/40 hover:shadow-emerald-300/50 hover:scale-[1.03] transition-all">
                                    <ImageIcon className="w-4 h-4" /> View All Photos <ChevronRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </>
                    )}
                </div>
            </section>

            {/* ═══════ ALL ALBUMS GRID — dark section ═══════ */}
            <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1d35] to-[#162d50]">
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }} />
                <div className="absolute -top-40 right-0 w-[400px] h-[400px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-emerald-400 text-sm font-bold mb-6">
                            <Sparkles className="w-4 h-4" /> Browse Collection
                        </span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">All Event Albums</h2>
                        <p className="text-white/40 mt-3 max-w-xl mx-auto">Click any album to explore the full photo collection</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {albums.map((album, index) => {
                            const ac = CARD_ACCENTS[index % CARD_ACCENTS.length];
                            return (
                                <motion.div key={album.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
                                    <Link href={`/gallery/${album.slug}`} className="group block">
                                        <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden hover:border-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                                            {/* Top accent bar */}
                                            <div className={`h-1 bg-gradient-to-r ${ac.gradient}`} />

                                            {/* Cover */}
                                            <div className="aspect-[4/3] relative overflow-hidden">
                                                {album.coverImage ? (
                                                    <Image src={album.coverImage} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${ac.gradient} flex items-center justify-center opacity-60`}>
                                                        <ImageIcon className="w-16 h-16 text-white/30" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
                                                {album._count?.items !== undefined && (
                                                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white text-xs font-bold flex items-center gap-1">
                                                        <ImageIcon className="w-3 h-3" /> {album._count.items}
                                                    </div>
                                                )}
                                                {album.category && (
                                                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-bold">
                                                        {album.category}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{album.title}</h3>
                                                {album.description && <p className="text-white/40 text-sm mb-3 line-clamp-2">{album.description}</p>}
                                                <div className="flex items-center gap-4 text-xs text-white/30">
                                                    {album.event?.eventDate && (
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(album.event.eventDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                                    )}
                                                    {album.event?.venue && (
                                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{album.event.venue}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    {albums.length === 0 && !isLoading && (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-5">
                                <Camera className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No albums found</h3>
                            <p className="text-white/40">Check back soon for new event photos!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

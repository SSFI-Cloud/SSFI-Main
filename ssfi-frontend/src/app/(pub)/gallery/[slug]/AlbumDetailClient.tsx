'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    X,
    ChevronLeft,
    ChevronRight,
    Calendar,
    MapPin,
    ImageIcon,
    Loader2,
    Camera,
    ZoomIn,
} from 'lucide-react';
import { usePublicGalleryAlbum } from '@/lib/hooks/useCMS';
import { resolveImageUrl } from '@/lib/utils/resolveImageUrl';

interface GalleryItem {
    id: string;
    url: string;
    thumbnailUrl?: string;
    title?: string;
    description?: string;
    type: string;
}

interface AlbumData {
    id: string;
    title: string;
    slug: string;
    description?: string;
    coverImage?: string;
    category?: string;
    event?: { id: number; name: string; eventDate?: string; venue?: string };
    items?: GalleryItem[];
    createdAt: string;
}

export default function AlbumDetailClient() {
    const params = useParams();
    const albumSlug = params?.slug as string;
    const { fetchPublicAlbumById, data: album, isLoading, error } = usePublicGalleryAlbum();

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
    const markImgError = (id: string) => setImgErrors(prev => new Set(prev).add(id));

    useEffect(() => {
        if (albumSlug) {
            fetchPublicAlbumById(albumSlug);
        }
    }, [albumSlug, fetchPublicAlbumById]);

    const images = (album as AlbumData)?.items?.filter((item: GalleryItem) => item.type === 'IMAGE') || [];

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
        document.body.style.overflow = '';
    }, []);

    const goToImage = useCallback((index: number) => {
        if (index < 0) index = images.length - 1;
        if (index >= images.length) index = 0;
        setLightboxIndex(index);
    }, [images.length]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!lightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') goToImage(lightboxIndex - 1);
            if (e.key === 'ArrowRight') goToImage(lightboxIndex + 1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, lightboxIndex, closeLightbox, goToImage]);

    const albumData = album as AlbumData | null;

    return (
        <div className="min-h-screen">
            {/* ===================== HERO — DARK ===================== */}
            <section className="relative py-24 md:py-32 overflow-hidden bg-dark-950">
                <div className="absolute top-10 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-10 -right-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />

                <div className="container mx-auto px-4 relative z-10">
                    {/* Back link */}
                    <Link
                        href="/gallery"
                        className="inline-flex items-center gap-2 text-dark-400 hover:text-emerald-400 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Gallery
                    </Link>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <Camera className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Album not found</h2>
                            <p className="text-dark-400 mb-6">The album you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                            <Link
                                href="/gallery"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Go Back to Gallery
                            </Link>
                        </div>
                    ) : albumData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl"
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-6 backdrop-blur-sm">
                                <Camera className="w-4 h-4" />
                                {albumData.category || 'Gallery Album'}
                            </span>

                            <h1 className="text-3xl md:text-5xl font-headline font-bold text-white mb-4 tracking-tight">
                                {albumData.title}
                            </h1>

                            {albumData.description && (
                                <p className="text-lg text-dark-300 mb-6 max-w-2xl">
                                    {albumData.description}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-6 text-dark-400 text-sm">
                                {albumData.event?.name && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                        {albumData.event.name}
                                    </span>
                                )}
                                {albumData.event?.eventDate && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-emerald-400" />
                                        {new Date(albumData.event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                )}
                                {albumData.event?.venue && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-teal-400" />
                                        {albumData.event.venue}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                                    {images.length} photos
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ===================== PHOTO GRID — LIGHT ===================== */}
            {!isLoading && !error && albumData && (
                <section className="py-12 md:py-16 bg-white">
                    <div className="container mx-auto px-4">
                        {images.length > 0 ? (
                            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                                {images.map((item: GalleryItem, index: number) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                        className="break-inside-avoid mb-4 group cursor-pointer"
                                        onClick={() => openLightbox(index)}
                                    >
                                        <div className={`relative rounded-xl overflow-hidden bg-gray-100${imgErrors.has(item.id) ? ' hidden' : ''}`}>
                                            <img
                                                src={resolveImageUrl(item.thumbnailUrl || item.url)}
                                                alt={item.title || `Photo ${index + 1}`}
                                                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                onError={() => markImgError(item.id)}
                                            />
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                                                    <ZoomIn className="w-8 h-8 text-white" />
                                                    {item.title && (
                                                        <span className="text-white text-sm font-medium px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm">
                                                            {item.title}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No photos yet</h3>
                                <p className="text-gray-400">Photos for this album haven&apos;t been uploaded yet. Check back soon!</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ===================== LIGHTBOX ===================== */}
            <AnimatePresence>
                {lightboxOpen && images[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-6 right-6 text-white/60 hover:text-white z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Image counter */}
                        <div className="absolute top-6 left-6 text-white/60 text-sm font-medium z-50">
                            {lightboxIndex + 1} / {images.length}
                        </div>

                        {/* Previous */}
                        <button
                            onClick={(e) => { e.stopPropagation(); goToImage(lightboxIndex - 1); }}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all backdrop-blur-sm"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {/* Next */}
                        <button
                            onClick={(e) => { e.stopPropagation(); goToImage(lightboxIndex + 1); }}
                            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all backdrop-blur-sm"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Image */}
                        <motion.div
                            key={lightboxIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={resolveImageUrl(images[lightboxIndex].url)}
                                alt={images[lightboxIndex].title || `Photo ${lightboxIndex + 1}`}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {images[lightboxIndex].title && (
                                <p className="text-white/80 text-sm mt-3 font-medium">
                                    {images[lightboxIndex].title}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

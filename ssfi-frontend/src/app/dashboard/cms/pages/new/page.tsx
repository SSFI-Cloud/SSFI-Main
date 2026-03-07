'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import ImageUpload from '@/components/admin/ImageUpload';

const pageSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    content: z.string().min(1, 'Content is required'),
    isPublished: z.boolean().default(false),
});

type PageForm = z.input<typeof pageSchema>;

export default function CreatePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<PageForm>({
        resolver: zodResolver(pageSchema),
        defaultValues: {
            isPublished: false,
        }
    });

    // Auto-generate slug from title
    const title = watch('title');
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue('title', value);
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setValue('slug', slug);
    };

    const onSubmit = async (data: PageForm) => {
        try {
            setIsSubmitting(true);
            await apiClient.post('/cms/admin/pages', {
                ...data,
                template: 'default',
                status: data.isPublished ? 'PUBLISHED' : 'DRAFT',
                sortOrder: 0,
                featuredImage: featuredImage || undefined,
            });
            toast.success('Page created successfully');
            router.push('/dashboard/cms/pages');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create page');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/cms/pages"
                    className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Page</h1>
                    <p className="text-gray-500">Add a new static page to the website</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Page Title</label>
                            <input
                                {...register('title')}
                                onChange={handleTitleChange}
                                className="w-full px-4 py-2 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500"
                                placeholder="e.g. About Us"
                            />
                            {errors.title && (
                                <p className="text-red-600 text-sm">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Slug (URL)</label>
                            <input
                                {...register('slug')}
                                className="w-full px-4 py-2 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500"
                                placeholder="e.g. about-us"
                            />
                            {errors.slug && (
                                <p className="text-red-600 text-sm">{errors.slug.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Content (Markdown)</label>
                        <textarea
                            {...register('content')}
                            rows={15}
                            className="w-full px-4 py-3 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500 font-mono"
                            placeholder="# Heading&#10;&#10;Write your content here..."
                        />
                        {errors.content && (
                            <p className="text-red-600 text-sm">{errors.content.message}</p>
                        )}
                    </div>

                    <ImageUpload
                        type="news"
                        label="Featured Image"
                        value={featuredImage}
                        onChange={url => setFeaturedImage(url)}
                        hint="Used as the page header or social share image"
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublished"
                            {...register('isPublished')}
                            className="w-4 h-4 rounded border-gray-200 bg-[#f5f6f8] text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="isPublished" className="text-gray-700 select-none">
                            Publish immediately
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Page
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

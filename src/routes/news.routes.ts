import { Router } from 'express';
const router = Router();
import prisma from '../config/prisma';
// Get all news articles with pagination
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '10', category, search } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = { isPublished: true };

        if (category && category !== 'all') {
            where.category = String(category);
        }

        if (search) {
            where.OR = [
                { title: { contains: String(search) } },
                { excerpt: { contains: String(search) } },
                { content: { contains: String(search) } },
            ];
        }

        const [articles, total] = await Promise.all([
            prisma.newsArticle.findMany({
                where,
                orderBy: { publishedAt: 'desc' },
                take: parseInt(limit as string),
                skip,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    category: true,
                    author: true,
                    publishedAt: true,
                    featuredImage: true,
                },
            }),
            prisma.newsArticle.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                articles,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    pages: Math.ceil(total / parseInt(limit as string)),
                },
            },
        });
    } catch (error) {
        console.error('News fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch news articles',
        });
    }
});

// Get news categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.newsArticle.findMany({
            where: { isPublished: true },
            select: { category: true },
            distinct: ['category'],
        });

        res.json({
            success: true,
            data: categories.map(c => c.category),
        });
    } catch (error) {
        console.error('Categories fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
        });
    }
});

// Get featured news
router.get('/featured', async (req, res) => {
    try {
        // Since we don't have isFeatured flag, we'll take top 3 latest published
        const articles = await prisma.newsArticle.findMany({
            where: { isPublished: true },
            orderBy: { publishedAt: 'desc' },
            take: 3,
        });

        res.json({
            success: true,
            data: articles,
        });
    } catch (error) {
        console.error('Featured news fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured news',
        });
    }
});

// Get single news article by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await prisma.newsArticle.findUnique({
            where: { slug, isPublished: true },
        });

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found',
            });
        }

        res.json({
            success: true,
            data: article,
        });
    } catch (error) {
        console.error('Article fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch article',
        });
    }
});

export default router;

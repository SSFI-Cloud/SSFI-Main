import { Router } from 'express';
const router = Router();
import prisma from '../config/prisma';
// Get all gallery albums
router.get('/albums', async (req, res) => {
    try {
        const { category } = req.query;

        // Note: 'category' field will be added to schema
        const albums = await prisma.galleryAlbum.findMany({
            where: category ? { category: String(category) } : undefined,
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                },
                event: {
                    select: {
                        id: true,
                        name: true,
                        eventDate: true,
                        venue: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: albums,
        });
    } catch (error) {
        console.error('Gallery fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gallery albums',
        });
    }
});

// Get all gallery items (images) directly
router.get('/items', async (req, res) => {
    try {
        const { limit = '20' } = req.query;

        // Fetch items via albums
        const albums = await prisma.galleryAlbum.findMany({
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
            take: 10, // Limit albums to scan
            orderBy: { createdAt: 'desc' },
        });

        // Flatten items
        const allItems = albums.flatMap(album => album.items).slice(0, parseInt(limit as string));

        res.json({
            success: true,
            data: allItems,
        });
    } catch (error) {
        console.error('Gallery items fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gallery items',
        });
    }
});

// Get single album by ID
router.get('/albums/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const album = await prisma.galleryAlbum.findUnique({
            where: { id: id }, // ID is String (cuid) in existing schema
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                },
                event: true,
            },
        });

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found',
            });
        }

        res.json({
            success: true,
            data: album,
        });
    } catch (error) {
        console.error('Album fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch album',
        });
    }
});

export default router;

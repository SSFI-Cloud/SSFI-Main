import NodeCache from 'node-cache';

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({
    stdTTL: 300, // 5 minutes default
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false // Don't clone data for better performance
});

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
    key: string;
}

/**
 * Get data from cache
 */
export const getCache = <T>(key: string): T | undefined => {
    return cache.get<T>(key);
};

/**
 * Set data in cache
 */
export const setCache = <T>(key: string, value: T, ttl?: number): boolean => {
    return cache.set(key, value, ttl || 300);
};

/**
 * Delete specific cache key
 */
export const deleteCache = (key: string): number => {
    return cache.del(key);
};

/**
 * Delete multiple cache keys matching a pattern
 */
export const deleteCachePattern = (pattern: string): number => {
    const keys = cache.keys().filter(key => key.includes(pattern));
    return cache.del(keys);
};

/**
 * Clear all cache
 */
export const clearCache = (): void => {
    cache.flushAll();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    return cache.getStats();
};

/**
 * Middleware to cache API responses
 */
export const cacheMiddleware = (ttl: number = 300) => {
    return (req: any, res: any, next: any) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key from URL and query params
        const cacheKey = `${req.originalUrl || req.url}`;

        // Check if data exists in cache
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            // Add cache hit header
            res.setHeader('X-Cache', 'HIT');
            return res.json(cachedData);
        }

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to cache the response
        res.json = (data: any) => {
            // Cache the response
            setCache(cacheKey, data, ttl);

            // Add cache miss header
            res.setHeader('X-Cache', 'MISS');

            // Call original json method
            return originalJson(data);
        };

        next();
    };
};

export default cache;

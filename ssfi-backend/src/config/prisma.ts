import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Append connection pool limits to DATABASE_URL if not already set
// connection_limit=1 keeps resource usage minimal on Hostinger shared hosting
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connection_limit')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${dbUrl}${separator}connection_limit=1&pool_timeout=30&connect_timeout=10`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Warm up the database connection at startup.
 * Tries to connect before serving requests so the query engine initializes
 * under low load rather than during the first HTTP request.
 */
export async function connectWithRetry(maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log(`[prisma] Database connected successfully (attempt ${attempt})`);
      return;
    } catch (error: any) {
      console.error(`[prisma] Connection attempt ${attempt}/${maxRetries} failed: ${error.message || error}`);
      // Disconnect to clean up any partial state
      try { await prisma.$disconnect(); } catch {}
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
  console.error('[prisma] All connection attempts failed. Server will start but queries may fail.');
}

// Graceful disconnect helper
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

export default prisma;

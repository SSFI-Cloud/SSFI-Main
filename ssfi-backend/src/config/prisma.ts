import { PrismaClient, Prisma } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
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

// ── PANIC Recovery Middleware ──
// Hostinger's constrained environment causes intermittent Prisma engine panics
// ("PANIC: timer has gone away"). The engine survives and recovers between panics,
// so retrying the query after a brief delay usually succeeds.
let panicCount = 0;
const PANIC_RESET_INTERVAL = 60_000; // reset counter every 60s
setInterval(() => { panicCount = 0; }, PANIC_RESET_INTERVAL);

prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error: any) {
    // Only retry on Prisma engine panics
    if (error?.name === 'PrismaClientRustPanicError' ||
        (error?.message && error.message.includes('PANIC'))) {
      panicCount++;
      console.error(`[prisma] Engine PANIC #${panicCount} on ${params.model}.${params.action} — retrying...`);

      // Brief delay to let engine recover
      await new Promise(r => setTimeout(r, 150));

      // Retry the query once
      try {
        return await next(params);
      } catch (retryError: any) {
        console.error(`[prisma] Retry also failed for ${params.model}.${params.action}`);

        // If too many panics in a row, force process exit for clean restart
        if (panicCount >= 10) {
          console.error('[prisma] Too many panics — forcing process restart');
          process.exit(1);
        }
        throw retryError;
      }
    }
    throw error;
  }
});

/**
 * Warm up the database connection at startup.
 */
export async function connectWithRetry(maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log(`[prisma] Database connected successfully (attempt ${attempt})`);
      return;
    } catch (error: any) {
      console.error(`[prisma] Connection attempt ${attempt}/${maxRetries} failed: ${error.message || error}`);
      try { await prisma.$disconnect(); } catch {}
      if (attempt < maxRetries) {
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

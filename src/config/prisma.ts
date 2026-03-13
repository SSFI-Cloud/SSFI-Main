import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Append connection pool limits to DATABASE_URL if not already set
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connection_limit')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${dbUrl}${separator}connection_limit=5&pool_timeout=30`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // Connection pool limited to 5 to stay within Hostinger's 200 process limit
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful disconnect helper
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

export default prisma;

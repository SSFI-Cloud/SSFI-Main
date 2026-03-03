import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL || 
  'mysql://u745371806_ssfi_users:ssFI2026@127.0.0.1:3306/u745371806_ssfi_prod?connection_limit=3&pool_timeout=10&connect_timeout=10';

// Set it in process.env so Prisma schema env("DATABASE_URL") also picks it up
process.env.DATABASE_URL = DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
    log: ['error'],
  });
}

// Always cache prisma instance globally - prevents new instance per request
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma = globalForPrisma.prisma;
export default prisma;

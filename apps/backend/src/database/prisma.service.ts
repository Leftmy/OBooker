import { PrismaClient } from '@prisma/client';

const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST || 'db';
const port = process.env.POSTGRES_PORT || '5432';
const db = process.env.POSTGRES_DB;

const dbUrl = process.env.DATABASE_URL || 
  `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
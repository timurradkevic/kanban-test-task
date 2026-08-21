import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
  connectionTimeoutMillis: 5000,
  max: 10,
});
export const prisma = new PrismaClient({ adapter });

import 'dotenv/config';

const requiredEnvVars = [
  'DATABASE_URL',
  'PORT',
  'CORS_ORIGIN',
  'NODE_ENV',
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL as string,
  corsOrigin: process.env.CORS_ORIGIN as string,
  nodeEnv: process.env.NODE_ENV as string,
};

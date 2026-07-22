import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'GreenChillyz',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT || '4000', 10),
  host: process.env.APP_HOST || '0.0.0.0',
  url: process.env.APP_URL || 'http://localhost:4000',
  apiPrefix: process.env.APP_API_PREFIX || 'api',
  apiVersion: parseInt(process.env.APP_API_VERSION || '1', 10),
  corsOrigins: (process.env.APP_CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim()),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
}));

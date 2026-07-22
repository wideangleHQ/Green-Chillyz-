import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('GreenChillyz'),
  APP_PORT: Joi.number().default(4000),
  APP_HOST: Joi.string().default('0.0.0.0'),
  APP_URL: Joi.string().uri().default('http://localhost:4000'),
  APP_API_PREFIX: Joi.string().default('api'),
  APP_API_VERSION: Joi.number().default(1),
  APP_CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().default('greenchillyz-api'),
  JWT_AUDIENCE: Joi.string().default('greenchillyz-client'),
  REFRESH_TOKEN_EXPIRY_DAYS: Joi.number().default(30),

  // Supabase
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_JWT_SECRET: Joi.string().required(),

  // Cookie
  COOKIE_DOMAIN: Joi.string().default('localhost'),

  // Cloudflare R2
  R2_ACCOUNT_ID: Joi.string().allow('').default(''),
  R2_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  R2_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  R2_BUCKET_NAME: Joi.string().allow('').default(''),
  R2_PUBLIC_URL: Joi.string().allow('').default(''),

  // Mail
  MAIL_HOST: Joi.string().allow('').default(''),
  MAIL_PORT: Joi.number().default(587),
  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().allow('').default('noreply@greenchillyz.com'),

  // SMS
  SMS_PROVIDER: Joi.string().allow('').default(''),
  SMS_API_KEY: Joi.string().allow('').default(''),
  SMS_SENDER_ID: Joi.string().allow('').default(''),

  // Push
  PUSH_FCM_SERVER_KEY: Joi.string().allow('').default(''),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(60),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('debug'),
});

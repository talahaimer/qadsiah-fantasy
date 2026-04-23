require('dotenv').config();

const required = (key, fallback) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined || v === null || v === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
  return v;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '30d',

  SPORT_API_PROVIDER: process.env.SPORT_API_PROVIDER || 'api_football',
  SPORTMONKS_API_KEY: process.env.SPORTMONKS_API_KEY || '',
  API_FOOTBALL_KEY: process.env.API_FOOTBALL_KEY || '',
  QADSIAH_TEAM_EXTERNAL_ID: process.env.QADSIAH_TEAM_EXTERNAL_ID || '',

  EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN || '',

  MAILJET_API_KEY: process.env.MAILJET_API_KEY || '',
  MAILJET_API_SECRET: process.env.MAILJET_API_SECRET || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@qadsiah-fantasy.com',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || '',

  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@qadsiah-fantasy.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
};

module.exports = env;

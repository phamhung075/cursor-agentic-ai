/**
 * Common configuration shared across packages
 */

export const config = {
  api: {
    baseUrl: process.env.API_URL || 'http://localhost:3000',
    timeout: 30000,
  },
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

export default config;

// Environment configuration
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
} as const

// API endpoints helper
export const API_ENDPOINTS = {
  base: ENV.API_BASE_URL,
  auth: {
    testLogin: `${ENV.API_BASE_URL}/auth/test-login`,
    me: `${ENV.API_BASE_URL}/auth/me`,
    login: `${ENV.API_BASE_URL}/auth/login`,
    register: `${ENV.API_BASE_URL}/auth/register`,
  },
  integrations: {
    list: `${ENV.API_BASE_URL}/integrations`,
    github: {
      connect: `${ENV.API_BASE_URL}/integrations/github/connect`,
      appInstall: `${ENV.API_BASE_URL}/integrations/github/app/install`,
    },
  },
  standups: {
    list: `${ENV.API_BASE_URL}/standups`,
    today: `${ENV.API_BASE_URL}/standups/today`,
    generate: `${ENV.API_BASE_URL}/standups/generate`,
    get: (id: string) => `${ENV.API_BASE_URL}/standups/${id}`,
    delete: (id: string) => `${ENV.API_BASE_URL}/standups/${id}`,
  },
} as const
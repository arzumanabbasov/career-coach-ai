// Environment configuration with validation
export const config = {
  // API Keys
  apify: {
    apiToken: process.env.APIFY_API_TOKEN,
    actorId: process.env.APIFY_ACTOR_ID,
    linkedinScraperActorId: process.env.LINKEDIN_SCRAPER_ACTOR_ID,
  },
  
  // Elasticsearch
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL,
    apiKey: process.env.ELASTICSEARCH_API_KEY,
    indexName: process.env.ELASTICSEARCH_INDEX_NAME || 'linkedin-jobs-webhook',
  },
  
  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    apiUrl: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET,
    apiKey: process.env.API_KEY,
    rateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
    rateLimitWindow: parseInt(process.env.API_RATE_WINDOW || '900000'), // 15 minutes
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Validation function
export function validateConfig() {
  const required = [
    'APIFY_API_TOKEN',
    'APIFY_ACTOR_ID',
    'LINKEDIN_SCRAPER_ACTOR_ID',
    'ELASTICSEARCH_URL',
    'ELASTICSEARCH_API_KEY',
    'GEMINI_API_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// Rate limiting configuration per endpoint
export const rateLimits = {
  'job-statistics': { limit: 10, window: 15 * 60 * 1000 }, // 10 per 15 minutes
  'scrape-jobs': { limit: 5, window: 15 * 60 * 1000 }, // 5 per 15 minutes
  'scrape-linkedin': { limit: 3, window: 15 * 60 * 1000 }, // 3 per 15 minutes
  'search-jobs': { limit: 30, window: 15 * 60 * 1000 }, // 30 per 15 minutes
  'default': { limit: 100, window: 15 * 60 * 1000 }, // 100 per 15 minutes
};

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined) => {
    if (!origin) return true; // Allow requests with no origin (like mobile apps)
    return config.security.allowedOrigins.includes(origin);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

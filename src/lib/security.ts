import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input validation schemas
export const jobSearchSchema = z.object({
  query: z.string().min(1).max(500).trim(),
  userProfile: z.object({
    position: z.string().max(200).optional(),
    experienceLevel: z.string().max(100).optional(),
    linkedinData: z.any().optional()
  }).optional(),
  useVectorSearch: z.boolean().optional()
});

export const jobScrapingSchema = z.object({
  keywords: z.string().min(1).max(200).trim(),
  location: z.string().max(100).optional(),
  count: z.number().min(1).max(1000).optional()
});

export const linkedinScrapingSchema = z.object({
  linkedinUrl: z.string().url().refine(
    (url) => url.includes('linkedin.com/in/'),
    'Must be a valid LinkedIn profile URL'
  )
});

export const jobStatisticsSchema = z.object({
  keywords: z.string().min(1).max(200).trim().optional(),
  count: z.number().min(1).max(1000).optional()
});

// Rate limiting function
export function rateLimit(identifier: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// CORS headers
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const isAllowed = !origin || allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || '*' : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

// Security headers
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate and sanitize request
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation error: ${errorMessage}` };
    }
    return { success: false, error: 'Invalid request data' };
  }
}

// Secure error response
export function createErrorResponse(message: string, status: number = 500, details?: any) {
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && details && { details })
  };

  return NextResponse.json(errorResponse, { 
    status,
    headers: {
      ...getSecurityHeaders(),
      'Content-Type': 'application/json'
    }
  });
}

// Secure success response
export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { 
    status,
    headers: {
      ...getSecurityHeaders(),
      'Content-Type': 'application/json'
    }
  });
}

// API key validation
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.API_KEY;
  
  if (!expectedKey) {
    console.warn('API_KEY not configured in environment variables');
    return false;
  }
  
  return apiKey === expectedKey;
}

// Request logging (sanitized)
export function logRequest(request: NextRequest, endpoint: string, userId?: string) {
  const sanitizedHeaders = {
    'user-agent': request.headers.get('user-agent')?.substring(0, 100),
    'content-type': request.headers.get('content-type'),
    'origin': request.headers.get('origin')?.substring(0, 100)
  };

  console.log(`[${new Date().toISOString()}] ${request.method} ${endpoint}`, {
    userId,
    headers: sanitizedHeaders,
    ip: request.ip || 'unknown'
  });
}

// Clean up rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

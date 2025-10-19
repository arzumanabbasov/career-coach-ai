import { NextRequest, NextResponse } from 'next/server';
import { 
  rateLimit, 
  getCorsHeaders, 
  getSecurityHeaders, 
  validateApiKey,
  logRequest,
  createErrorResponse
} from './security';

// Middleware for API security
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: number;
    rateLimitWindow?: number;
    allowedMethods?: string[];
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      requireAuth = false,
      rateLimit: limit = 100,
      rateLimitWindow = 15 * 60 * 1000, // 15 minutes
      allowedMethods = ['GET', 'POST', 'OPTIONS']
    } = options;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...getCorsHeaders(request.headers.get('origin') || undefined),
          ...getSecurityHeaders()
        }
      });
    }

    // Check allowed methods
    if (!allowedMethods.includes(request.method)) {
      return createErrorResponse('Method not allowed', 405);
    }

    // Rate limiting
    const clientId = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientId, limit, rateLimitWindow)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Authentication check
    if (requireAuth && !validateApiKey(request)) {
      return createErrorResponse('Unauthorized. Valid API key required.', 401);
    }

    // Log request
    logRequest(request, request.nextUrl.pathname);

    try {
      // Add security headers to response
      const response = await handler(request);
      
      // Add CORS and security headers to response
      const headers = new Headers(response.headers);
      Object.entries(getCorsHeaders(request.headers.get('origin') || undefined)).forEach(([key, value]) => {
        headers.set(key, value);
      });
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse('Internal server error', 500);
    }
  };
}

// Middleware for input validation
export function withValidation<T>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  schema: any
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      let data: unknown;
      
      if (request.method === 'GET') {
        const url = new URL(request.url);
        data = Object.fromEntries(url.searchParams.entries());
      } else {
        data = await request.json();
      }

      const validation = schema.safeParse(data);
      
      if (!validation.success) {
        const errorMessage = validation.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return createErrorResponse(`Validation error: ${errorMessage}`, 400);
      }

      return await handler(request, validation.data);
    } catch (error) {
      console.error('Validation error:', error);
      return createErrorResponse('Invalid request format', 400);
    }
  };
}

// Combined middleware
export function withSecurityAndValidation<T>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  schema: any,
  securityOptions: Parameters<typeof withSecurity>[1] = {}
) {
  const securedHandler = withSecurity(
    async (request: NextRequest) => {
      return await withValidation(handler, schema)(request);
    },
    securityOptions
  );

  return securedHandler;
}

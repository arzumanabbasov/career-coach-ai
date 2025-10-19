# Security Configuration Guide

This document outlines the security measures implemented in the Career Coach AI application and how to properly configure them.

## 🔐 Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# API Keys - NEVER commit these to version control
APIFY_API_TOKEN=your_apify_api_token_here
APIFY_ACTOR_ID=your_apify_actor_id_here
LINKEDIN_SCRAPER_ACTOR_ID=your_linkedin_scraper_actor_id_here

# Elasticsearch Configuration
ELASTICSEARCH_URL=your_elasticsearch_url_here
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key_here
ELASTICSEARCH_INDEX_NAME=your_index_name_here

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
API_KEY=your-api-key-for-authentication
API_RATE_LIMIT=100
API_RATE_WINDOW=900000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Environment
NODE_ENV=development
```

## 🛡️ Security Features Implemented

### 1. Input Validation & Sanitization
- **Zod Schema Validation**: All API endpoints use Zod schemas for input validation
- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **URL Validation**: LinkedIn URLs are validated using regex patterns
- **Type Safety**: TypeScript interfaces ensure type safety across the application

### 2. Rate Limiting
- **Per-Endpoint Limits**: Different rate limits for different operations:
  - Job Statistics: 10 requests per 15 minutes
  - Job Scraping: 5 requests per 15 minutes (expensive operation)
  - LinkedIn Scraping: 3 requests per 15 minutes (very expensive operation)
  - Job Search: 30 requests per 15 minutes
- **IP-Based Tracking**: Rate limiting is based on client IP addresses
- **Automatic Cleanup**: Rate limit store is cleaned up every 5 minutes

### 3. CORS Protection
- **Origin Validation**: Only allowed origins can make requests
- **Preflight Handling**: Proper OPTIONS request handling
- **Configurable Origins**: Easy to configure allowed origins via environment variables

### 4. Security Headers
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Strict-Transport-Security**: Enforces HTTPS (production)

### 5. Error Handling
- **Sanitized Error Messages**: No sensitive information in error responses
- **Structured Error Responses**: Consistent error response format
- **Logging**: Comprehensive logging without exposing sensitive data
- **Development vs Production**: Different error detail levels

### 6. API Key Management
- **Environment Variables**: All API keys stored in environment variables
- **Validation**: API key validation for protected endpoints
- **No Hardcoding**: No API keys in source code

## 🚀 Deployment Security

### Production Checklist

1. **Environment Variables**
   - [ ] All API keys are set in production environment
   - [ ] JWT_SECRET is a strong, random string
   - [ ] API_KEY is set for authentication
   - [ ] ALLOWED_ORIGINS includes your production domain

2. **HTTPS Configuration**
   - [ ] SSL certificate is properly configured
   - [ ] HTTP to HTTPS redirect is enabled
   - [ ] HSTS headers are enabled

3. **Database Security**
   - [ ] Elasticsearch is properly secured
   - [ ] API keys are rotated regularly
   - [ ] Access is restricted to necessary IPs

4. **Monitoring**
   - [ ] Error logging is configured
   - [ ] Rate limiting alerts are set up
   - [ ] Security monitoring is in place

## 🔧 API Usage

### Authentication
For protected endpoints, include the API key in the request header:
```bash
curl -H "X-API-Key: your-api-key" https://yourdomain.com/api/endpoint
```

### Rate Limiting
If you exceed rate limits, you'll receive a 429 status code:
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses
All errors follow a consistent format:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🛠️ Development

### Running Locally
1. Copy `.env.example` to `.env.local`
2. Fill in your API keys and configuration
3. Run `npm run dev`

### Testing Security
- Test rate limiting by making multiple requests
- Verify CORS by making requests from different origins
- Check input validation with malformed data
- Ensure error messages don't leak sensitive information

## 📝 Security Best Practices

1. **Never commit API keys** to version control
2. **Rotate API keys** regularly
3. **Monitor API usage** for unusual patterns
4. **Keep dependencies updated** for security patches
5. **Use HTTPS** in production
6. **Implement proper logging** for security events
7. **Regular security audits** of the codebase

## 🚨 Incident Response

If you suspect a security breach:

1. **Immediately rotate** all API keys
2. **Check logs** for unusual activity
3. **Review rate limiting** data for abuse patterns
4. **Update security measures** as needed
5. **Notify users** if personal data is affected

## 📞 Support

For security-related questions or to report vulnerabilities, please contact the development team securely.

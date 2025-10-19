# Environment Setup Instructions

## Create .env.local file

Create a file named `.env.local` in your project root with the following content:

```bash
# API Keys - Replace with your actual keys
APIFY_API_TOKEN=your_apify_api_token_here
APIFY_ACTOR_ID=your_apify_actor_id_here
LINKEDIN_SCRAPER_ACTOR_ID=your_linkedin_scraper_actor_id_here

# Elasticsearch Configuration
ELASTICSEARCH_URL=your_elasticsearch_url_here
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key_here
ELASTICSEARCH_INDEX_NAME=linkedin-jobs-webhook

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

## For Testing Without API Keys

If you want to test the app without setting up all the API keys, you can use these placeholder values:

```bash
# Placeholder values for testing
APIFY_API_TOKEN=test_token
APIFY_ACTOR_ID=test_actor
LINKEDIN_SCRAPER_ACTOR_ID=test_scraper
ELASTICSEARCH_URL=https://test.elasticsearch.com
ELASTICSEARCH_API_KEY=test_key
ELASTICSEARCH_INDEX_NAME=test_index
GEMINI_API_KEY=test_gemini_key
GEMINI_API_URL=https://test.gemini.com
JWT_SECRET=test_jwt_secret
API_KEY=test_api_key
API_RATE_LIMIT=100
API_RATE_WINDOW=900000
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

## Important Notes

1. **Never commit .env.local to version control** - it contains sensitive information
2. **Replace placeholder values** with your actual API keys for full functionality
3. **The app will work with placeholder values** but API calls will fail gracefully
4. **Restart the development server** after creating the .env.local file

import { NextRequest, NextResponse } from 'next/server';
import { 
  getJobStatistics,
  initializeElasticsearchIndex,
  bulkSaveJobsToElasticsearch,
  ElasticsearchJobData
} from '@/lib/elasticsearch';
import { 
  withSecurityAndValidation
} from '@/lib/middleware';
import { 
  jobStatisticsSchema,
  createSuccessResponse,
  createErrorResponse,
  sanitizeInput
} from '@/lib/security';

interface JobStatisticsResponse {
  success: boolean;
  statistics?: any;
  error?: string;
  message?: string;
}

async function handleJobStatistics(request: NextRequest, validatedData: any): Promise<NextResponse<JobStatisticsResponse>> {
  try {
    const { keywords = 'software engineer', count = 50 } = validatedData;
    const sanitizedKeywords = sanitizeInput(keywords);
    
    console.log('Starting job scraping and statistics collection...');

    // Initialize Elasticsearch index
    try {
      await initializeElasticsearchIndex();
      console.log('Elasticsearch index initialized');
    } catch (elasticError) {
      console.error('Elasticsearch initialization failed:', elasticError);
      return createErrorResponse('Elasticsearch connection failed', 500);
    }

    // Scrape jobs using the scrape-jobs API logic
    console.log('Scraping jobs from LinkedIn...');
    
    // Use environment variables for API keys
    const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
    const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID;
    
    if (!APIFY_API_TOKEN || !APIFY_ACTOR_ID) {
      console.error('Missing API credentials');
      return createErrorResponse('Service configuration error', 500);
    }
    
    const encodedKeywords = encodeURIComponent(sanitizedKeywords.trim());
    const jobSearchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedKeywords}&location=United%20States`;
    
    const actorInput = {
      urls: [jobSearchUrl],
      scrapeCompany: true,
      count: Math.max(count, 100)
    };

    // Try to scrape jobs
    try {
      const syncUrl = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
      
      const syncResponse = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actorInput),
      });

      if (syncResponse.ok) {
        const results = await syncResponse.json();
        if (results && results.length > 0) {
          console.log(`Scraped ${results.length} jobs, saving to Elasticsearch...`);
          
          // Process and save jobs to Elasticsearch
          const elasticsearchJobs: ElasticsearchJobData[] = results.map((job: any) => ({
            id: job.id || '',
            title: job.title || '',
            company: job.companyName || '',
            location: job.location || 'United States',
            description: job.descriptionText || job.descriptionHtml || '',
            salary: job.salary || '',
            jobType: job.employmentType || '',
            experienceLevel: job.seniorityLevel || '',
            postedDate: job.postedAt || '',
            url: job.link || '',
            companySize: job.companyEmployeesCount?.toString() || '',
            industry: job.industries || '',
            requirements: [],
            benefits: job.benefits || [],
            scrapedAt: new Date().toISOString(),
            keywords: [keywords.toLowerCase()]
          }));

          await bulkSaveJobsToElasticsearch(elasticsearchJobs);
          console.log(`Successfully saved ${elasticsearchJobs.length} jobs to Elasticsearch`);
          
          // Get updated statistics
          const statistics = await getJobStatistics();
          
          return createSuccessResponse({
            statistics: statistics,
            message: `Successfully collected and stored ${elasticsearchJobs.length} job postings in the database.`
          });
        }
      }
    } catch (scrapingError) {
      console.error('Job scraping failed:', scrapingError);
    }

    // If scraping fails, return current statistics
    const statistics = await getJobStatistics();
    
    return createSuccessResponse({
      statistics: statistics,
      message: 'Data collection is in progress. Current statistics retrieved.'
    });

  } catch (error) {
    console.error('Job statistics error:', error);
    return createErrorResponse('Internal server error during job statistics collection', 500);
  }
}

export const POST = withSecurityAndValidation(
  handleJobStatistics,
  jobStatisticsSchema,
  { rateLimit: 10, rateLimitWindow: 15 * 60 * 1000 } // 10 requests per 15 minutes
);

async function handleGetJobStatistics(request: NextRequest): Promise<NextResponse<JobStatisticsResponse>> {
  try {
    console.log('Getting job statistics...');

    // Initialize Elasticsearch index if needed
    try {
      await initializeElasticsearchIndex();
    } catch (elasticError) {
      console.error('Elasticsearch initialization failed:', elasticError);
      return createErrorResponse('Elasticsearch connection failed', 500);
    }

    // Get job statistics
    const statistics = await getJobStatistics();

    console.log('Job statistics retrieved successfully');

    return createSuccessResponse({ statistics });

  } catch (error) {
    console.error('Job statistics error:', error);
    return createErrorResponse('Internal server error during job statistics retrieval', 500);
  }
}

export const GET = withSecurityAndValidation(
  handleGetJobStatistics,
  jobStatisticsSchema,
  { rateLimit: 50, rateLimitWindow: 15 * 60 * 1000 } // 50 requests per 15 minutes for GET
);

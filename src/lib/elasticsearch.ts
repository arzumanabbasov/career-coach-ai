// Elasticsearch configuration
const ELASTICSEARCH_URL = 'https://my-elasticsearch-project-fd08a5.es.us-central1.gcp.elastic.cloud:443';
const ELASTICSEARCH_API_KEY = 'Ny1YTC1Ka0JHbVEyRmFnbVhiYjE6X3NNOExvNFUtZjhGWm9LQjQ0eVRIdw==';
const INDEX_NAME = 'linkedin-jobs-webhook';

// Helper function to make authenticated requests to Elasticsearch
async function elasticsearchRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${ELASTICSEARCH_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `ApiKey ${ELASTICSEARCH_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Elasticsearch request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Job data interface for Elasticsearch
export interface ElasticsearchJobData {
  id?: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  postedDate?: string;
  url?: string;
  companySize?: string;
  industry?: string;
  requirements?: string[];
  benefits?: string[];
  scrapedAt?: string;
  keywords?: string[];
  // Add vector field for future AI search integration
  vector?: number[];
}

// Initialize Elasticsearch index with proper mapping
export async function initializeElasticsearchIndex(): Promise<void> {
  try {
    console.log('Initializing Elasticsearch index...');
    
    // First, define the field mappings as shown in your example
    console.log('Setting up field mappings...');
    await elasticsearchRequest(`/${INDEX_NAME}/_mapping`, {
      method: 'PUT',
      body: JSON.stringify({
        properties: {
          vector: {
            type: 'dense_vector',
            dims: 3
          },
          text: {
            type: 'text'
          },
          // Job-specific fields
          id: { type: 'keyword' },
          title: { 
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          company: { 
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          location: { 
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          description: { type: 'text', analyzer: 'standard' },
          salary: { type: 'keyword' },
          jobType: { type: 'keyword' },
          experienceLevel: { type: 'keyword' },
          postedDate: { type: 'date' },
          url: { type: 'keyword' },
          companySize: { type: 'keyword' },
          industry: { 
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          requirements: { type: 'keyword' },
          benefits: { type: 'keyword' },
          scrapedAt: { type: 'date' },
          keywords: { type: 'keyword' }
        }
      })
    });
    
    console.log('Elasticsearch index mapping set up successfully');
  } catch (error) {
    console.error('Error initializing Elasticsearch index:', error);
    throw error;
  }
}

// Save job data to Elasticsearch
export async function saveJobToElasticsearch(jobData: ElasticsearchJobData): Promise<void> {
  try {
    await elasticsearchRequest(`/${INDEX_NAME}/_doc`, {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
    console.log('Job saved to Elasticsearch:', jobData.title);
  } catch (error) {
    console.error('Error saving job to Elasticsearch:', error);
    throw error;
  }
}

// Bulk save multiple jobs to Elasticsearch using the bulk API
export async function bulkSaveJobsToElasticsearch(jobs: ElasticsearchJobData[]): Promise<void> {
  try {
    if (jobs.length === 0) return;
    
    // Create bulk request body in the format shown in your example
    const bulkBody = jobs.map(job => {
      // Create a vector for each job (placeholder values for now)
      const vector = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
      
      return [
        { index: { _index: INDEX_NAME } },
        {
          ...job,
          vector: vector,
          text: `${job.title || ''} ${job.company || ''} ${job.description || ''}`.trim()
        }
      ];
    }).flat();

    await elasticsearchRequest('/_bulk', {
      method: 'POST',
      body: bulkBody.map(item => JSON.stringify(item)).join('\n') + '\n'
    });
    
    console.log(`Bulk saved ${jobs.length} jobs to Elasticsearch`);
  } catch (error) {
    console.error('Error bulk saving jobs to Elasticsearch:', error);
    throw error;
  }
}

// Search jobs from Elasticsearch
export async function searchJobsFromElasticsearch(query: string, filters?: any): Promise<ElasticsearchJobData[]> {
  try {
    const searchBody: any = {
      query: {
        multi_match: {
          query: query,
          fields: ['title^2', 'company^1.5', 'description', 'industry', 'location'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      size: 50,
      sort: [
        { scrapedAt: { order: 'desc' } }
      ]
    };

    // Add filters if provided
    if (filters) {
      searchBody.query = {
        bool: {
          must: searchBody.query,
          filter: filters
        }
      };
    }

    const response = await elasticsearchRequest(`/${INDEX_NAME}/_search`, {
      method: 'POST',
      body: JSON.stringify(searchBody)
    });

    const jobs = response.hits.hits.map((hit: any) => ({
      ...hit._source,
      _id: hit._id,
      _score: hit._score
    }));

    return jobs;
  } catch (error) {
    console.error('Error searching jobs from Elasticsearch:', error);
    throw error;
  }
}

// Get job statistics from Elasticsearch
export async function getJobStatistics(): Promise<any> {
  try {
    const response = await elasticsearchRequest(`/${INDEX_NAME}/_search`, {
      method: 'POST',
      body: JSON.stringify({
        size: 0,
        aggs: {
          total_jobs: { value_count: { field: 'id' } },
          by_company: {
            terms: { field: 'company.keyword', size: 10 }
          },
          by_location: {
            terms: { field: 'location.keyword', size: 10 }
          },
          by_industry: {
            terms: { field: 'industry.keyword', size: 10 }
          },
          by_experience_level: {
            terms: { field: 'experienceLevel', size: 10 }
          }
        }
      })
    });

    return response.aggregations;
  } catch (error) {
    console.error('Error getting job statistics:', error);
    throw error;
  }
}

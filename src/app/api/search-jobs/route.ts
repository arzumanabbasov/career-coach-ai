import { NextRequest, NextResponse } from 'next/server';
import { 
  withSecurityAndValidation
} from '@/lib/middleware';
import { 
  jobSearchSchema,
  createSuccessResponse,
  createErrorResponse,
  sanitizeInput
} from '@/lib/security';

interface JobSearchRequest {
  query: string;
  userProfile?: {
    position: string;
    experienceLevel: string;
    linkedinData?: any;
  };
  useVectorSearch?: boolean;
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

interface JobSearchResponse {
  success: boolean;
  jobs?: any[];
  aiResponse?: string;
  error?: string;
  totalHits?: number;
}

// Helper function to make authenticated requests to Elasticsearch
async function elasticsearchRequest(endpoint: string, options: RequestInit = {}) {
  const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;
  const ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY;
  
  if (!ELASTICSEARCH_URL || !ELASTICSEARCH_API_KEY) {
    throw new Error('Elasticsearch configuration missing');
  }

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

// Vector search function using the provided format
async function vectorSearchJobs(query: string, numCandidates: number = 100) {
  try {
    const INDEX_NAME = process.env.ELASTICSEARCH_INDEX_NAME || 'linkedin-jobs-webhook';
    const searchBody = {
      retriever: {
        standard: {
          query: {
            knn: {
              field: "vector",
              num_candidates: numCandidates,
              query_vector_builder: {
                text_embedding: {
                  model_id: "",
                  model_text: query
                }
              }
            }
          }
        }
      }
    };

    const response = await elasticsearchRequest(`/${INDEX_NAME}/_search`, {
      method: 'POST',
      body: JSON.stringify(searchBody)
    });

    return response.hits?.hits?.map((hit: any) => ({
      ...hit._source,
      _id: hit._id,
      _score: hit._score
    })) || [];
  } catch (error) {
    console.error('Vector search error:', error);
    throw error;
  }
}

// Traditional text search fallback
async function textSearchJobs(query: string) {
  try {
    const INDEX_NAME = process.env.ELASTICSEARCH_INDEX_NAME || 'linkedin-jobs-webhook';
    const searchBody = {
      query: {
        multi_match: {
          query: query,
          fields: ['title^2', 'company^1.5', 'description', 'industry', 'location', 'text'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      size: 50,
      sort: [
        { scrapedAt: { order: 'desc' } }
      ]
    };

    const response = await elasticsearchRequest(`/${INDEX_NAME}/_search`, {
      method: 'POST',
      body: JSON.stringify(searchBody)
    });

    return response.hits?.hits?.map((hit: any) => ({
      ...hit._source,
      _id: hit._id,
      _score: hit._score
    })) || [];
  } catch (error) {
    console.error('Text search error:', error);
    throw error;
  }
}

// Call Gemini AI API with a specific prompt
async function callGeminiAPI(prompt: string) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = process.env.GEMINI_API_URL;
    
    if (!GEMINI_API_KEY || !GEMINI_API_URL) {
      throw new Error('Gemini API configuration missing');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Gemini API raw response:', JSON.stringify(result, null, 2));
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I was unable to generate a response at this time.';
    console.log('Extracted text from Gemini response:', text);
    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Step 1: Ask Gemini if we need to search Elasticsearch
async function shouldSearchElasticsearch(userQuestion: string, userProfile: any) {
  const sanitizedQuestion = sanitizeInput(userQuestion);
  const profileContext = userProfile ? `
User Profile:
- Position: ${sanitizeInput(userProfile.position || '')}
- Experience Level: ${sanitizeInput(userProfile.experienceLevel || '')}
${userProfile.linkedinData ? `
- LinkedIn Profile: ${userProfile.linkedinData.fullName || 'Available'}
- Current Role: ${userProfile.linkedinData.jobTitle || 'N/A'}
- Company: ${userProfile.linkedinData.companyName || 'N/A'}
- Industry: ${userProfile.linkedinData.companyIndustry || 'N/A'}
` : ''}
` : '';

  const prompt = `You are ShekarchAI, an expert career coach. I need you to decide if the user's question requires current job market data from our database.

${profileContext}

User Question: ${sanitizedQuestion}

Questions that typically NEED job market data:
- "What are the top skills for [position]?"
- "What companies are hiring for [role]?"
- "What's the salary range for [position]?"
- "What are the job requirements for [role]?"
- "What are the trending technologies in [field]?"
- "What locations have the most [position] jobs?"
- "What are the current job opportunities for [role]?"

Questions that typically DON'T need job market data:
- "How do I prepare for interviews?"
- "What should I include in my resume?"
- "How do I network effectively?"
- "What are general career advice questions?"
- "How do I negotiate salary?"
- "What are soft skills for career success?"

Respond with ONLY "YES" if you need job market data, or "NO" if you don't need it.`;

  const response = await callGeminiAPI(prompt);
  return response.trim().toUpperCase() === 'YES';
}

// Step 2: Ask Gemini to create a search query for Elasticsearch
async function generateSearchQuery(userQuestion: string, userProfile: any) {
  const sanitizedQuestion = sanitizeInput(userQuestion);
  const profileContext = userProfile ? `
User Profile:
- Position: ${sanitizeInput(userProfile.position || '')}
- Experience Level: ${sanitizeInput(userProfile.experienceLevel || '')}
` : '';

  const prompt = `You are ShekarchAI. Based on the user's question, create an effective search query for our job database.

${profileContext}

User Question: ${sanitizedQuestion}

Create a search query that will find relevant job postings. The query should:
1. Include key terms from the user's question
2. Be optimized for job titles, companies, skills, and descriptions
3. Be 2-5 words maximum
4. Focus on the most important keywords

Examples:
- "What are the top skills for data scientists?" → "data scientist skills"
- "What companies hire software engineers?" → "software engineer companies"
- "What's the salary for product managers?" → "product manager salary"
- "What are AI engineer requirements?" → "AI engineer requirements"

Respond with ONLY the search query, nothing else.`;

  const response = await callGeminiAPI(prompt);
  return response.trim();
}

// Step 3: Generate final response combining all data
async function generateFinalResponse(userQuestion: string, userProfile: any, searchResults: any[], chatHistory: any[] = []) {
  const sanitizedQuestion = sanitizeInput(userQuestion);
  const sanitizedProfile = userProfile ? {
    position: sanitizeInput(userProfile.position || ''),
    experienceLevel: sanitizeInput(userProfile.experienceLevel || ''),
    linkedinData: userProfile.linkedinData
  } : null;

  const profileContext = sanitizedProfile ? `
User Profile:
- Position: ${sanitizedProfile.position}
- Experience Level: ${sanitizedProfile.experienceLevel}
${sanitizedProfile.linkedinData ? `
- LinkedIn Profile: ${sanitizedProfile.linkedinData.fullName || 'Available'}
- Current Role: ${sanitizedProfile.linkedinData.jobTitle || 'N/A'}
- Company: ${sanitizedProfile.linkedinData.companyName || 'N/A'}
- Industry: ${sanitizedProfile.linkedinData.companyIndustry || 'N/A'}
- About: ${(sanitizedProfile.linkedinData.about || '').substring(0, 300)}...
` : ''}
` : '';

  const searchContext = searchResults.length > 0 ? `
Current Job Market Data (${searchResults.length} recent jobs found):
${searchResults.slice(0, 8).map((job, index) => `
${index + 1}. ${job.title || 'N/A'} at ${job.company || 'N/A'}
   Location: ${job.location || 'N/A'}
   Type: ${job.jobType || 'N/A'}
   Experience: ${job.experienceLevel || 'N/A'}
   Salary: ${job.salary || 'Not specified'}
   Description: ${(job.description || '').substring(0, 150)}...
`).join('\n')}
` : '';

  // Build conversation history context
  const conversationContext = chatHistory.length > 0 ? `
Recent Conversation History:
${chatHistory.slice(-6).map((msg, index) => 
  `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`
).join('\n')}
` : '';

  const prompt = `You are ShekarchAI, an expert career coach and AI assistant. Provide a comprehensive, personalized response based on the user's question and available data.

${profileContext}

${searchContext}

${conversationContext}

User Question: ${sanitizedQuestion}

Instructions:
1. Directly address the user's question
2. Use specific data from the job market when relevant
3. Provide actionable, personalized career advice
4. Consider the user's profile and experience level
5. Be encouraging, professional, and conversational
6. Include specific examples from the job data when applicable
7. If no relevant job data is available, provide general career guidance
8. Keep the response informative but not overwhelming
9. Reference previous conversation context when relevant to provide continuity
10. Build upon previous discussions naturally

Format your response as a natural conversation with the user.`;

  try {
    console.log('Calling Gemini API with prompt length:', prompt.length);
    const response = await callGeminiAPI(prompt);
    console.log('Gemini API response received, length:', response.length);
    return response;
  } catch (error) {
    console.error('Error in generateFinalResponse:', error);
    throw error;
  }
}

async function handleJobSearch(request: NextRequest, validatedData: any): Promise<NextResponse<JobSearchResponse>> {
  try {
    const { query, userProfile, chatHistory = [] }: JobSearchRequest = validatedData;
    const sanitizedQuery = sanitizeInput(query);

    if (!sanitizedQuery || sanitizedQuery.trim().length === 0) {
      return createErrorResponse('Search query is required', 400);
    }

    console.log('Processing user question:', sanitizedQuery);
    console.log('User profile:', userProfile);
    console.log('Chat history length:', chatHistory.length);

    let searchResults = [];
    let aiResponse = '';

    try {
      // Step 1: Ask Gemini if we need to search Elasticsearch
      console.log('Step 1: Deciding if Elasticsearch search is needed...');
      const needsSearch = await shouldSearchElasticsearch(sanitizedQuery, userProfile);
      console.log('Needs Elasticsearch search:', needsSearch);

      if (needsSearch) {
        // Step 2: Generate search query using Gemini
        console.log('Step 2: Generating search query...');
        const searchQuery = await generateSearchQuery(sanitizedQuery, userProfile);
        console.log('Generated search query:', searchQuery);

        // Step 3: Search Elasticsearch
        console.log('Step 3: Searching Elasticsearch...');
        try {
          searchResults = await textSearchJobs(searchQuery);
          console.log(`Found ${searchResults.length} jobs matching query: ${searchQuery}`);
        } catch (searchError) {
          console.error('Elasticsearch search failed:', searchError);
          // Continue without search results
        }

        // Step 4: Generate final response with job data and chat history
        console.log('Step 4: Generating final response with job data and chat history...');
        aiResponse = await generateFinalResponse(sanitizedQuery, userProfile, searchResults, chatHistory);
      } else {
        // Step 4: Generate response without job data but with chat history
        console.log('Step 4: Generating response without job data but with chat history...');
        aiResponse = await generateFinalResponse(sanitizedQuery, userProfile, [], chatHistory);
      }

    } catch (error) {
      console.error('AI processing failed:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      aiResponse = `I apologize, but I'm having trouble processing your request right now. Please try again later.`;
    }

    return createSuccessResponse({
      jobs: searchResults,
      aiResponse: aiResponse,
      totalHits: searchResults.length
    });

  } catch (error) {
    console.error('Job search error:', error);
    return createErrorResponse('Internal server error during job search', 500);
  }
}

export const POST = withSecurityAndValidation(
  handleJobSearch,
  jobSearchSchema,
  { rateLimit: 30, rateLimitWindow: 15 * 60 * 1000 } // 30 requests per 15 minutes
);

// GET endpoint for simple search (keeping for backward compatibility)
async function handleGetJobSearch(request: NextRequest): Promise<NextResponse<JobSearchResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const sanitizedQuery = sanitizeInput(query);

    console.log('Simple job search:', { query: sanitizedQuery, limit });

    let searchResults = [];
    try {
      searchResults = await textSearchJobs(sanitizedQuery);
    } catch (searchError) {
      console.error('Search failed:', searchError);
      return createErrorResponse('Search service temporarily unavailable', 500);
    }
    
    // Limit results
    const limitedResults = searchResults.slice(0, limit);

    console.log(`Found ${searchResults.length} jobs, returning ${limitedResults.length}`);

    return createSuccessResponse({
      jobs: limitedResults,
      totalHits: searchResults.length
    });

  } catch (error) {
    console.error('Job search error:', error);
    return createErrorResponse('Internal server error during job search', 500);
  }
}

export const GET = withSecurityAndValidation(
  handleGetJobSearch,
  jobSearchSchema,
  { rateLimit: 50, rateLimitWindow: 15 * 60 * 1000 } // 50 requests per 15 minutes for GET
);
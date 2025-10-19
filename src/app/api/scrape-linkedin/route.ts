import { NextRequest, NextResponse } from 'next/server';
import { LinkedInProfileData, LinkedInScrapingRequest, LinkedInScrapingResponse } from '@/lib/types';
import { 
  withSecurityAndValidation
} from '@/lib/middleware';
import { 
  linkedinScrapingSchema,
  createSuccessResponse,
  createErrorResponse,
  sanitizeInput
} from '@/lib/security';

async function handleLinkedInScraping(request: NextRequest, validatedData: any): Promise<NextResponse<LinkedInScrapingResponse>> {
  try {
    const { linkedinUrl }: LinkedInScrapingRequest = validatedData;
    const sanitizedUrl = sanitizeInput(linkedinUrl);

    if (!sanitizedUrl) {
      return createErrorResponse('LinkedIn URL is required', 400);
    }

    // Use environment variables for API keys
    const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
    const APIFY_ACTOR_ID = process.env.LINKEDIN_SCRAPER_ACTOR_ID;
    
    if (!APIFY_API_TOKEN || !APIFY_ACTOR_ID) {
      console.error('Missing API credentials');
      return createErrorResponse('Service configuration error', 500);
    }

    console.log('Scraping LinkedIn profile:', sanitizedUrl);

    // Prepare the input for Apify Actor
    const actorInput = {
      profileUrls: [sanitizedUrl],
      maxConcurrency: 1,
      maxRetries: 2,
      timeout: 60000 // Increased timeout to 60 seconds
    };

    // Try the sync API first (faster)
    try {
      console.log('Attempting sync API call...');
      const syncResponse = await fetch(
        `https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(actorInput),
        }
      );

      if (syncResponse.ok) {
        const results = await syncResponse.json();
        if (results && results.length > 0) {
          console.log('Sync API successful, profile scraped:', results[0].fullName);
          const profileData = results[0];
          
          // Process and clean the profile data
          const processedData: LinkedInProfileData = {
            // Basic Info
            linkedinUrl: sanitizedUrl,
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            fullName: profileData.fullName || '',
            headline: profileData.headline || '',
            connections: profileData.connections || 0,
            followers: profileData.followers || 0,
            email: profileData.email || '',
            mobileNumber: profileData.mobileNumber || null,
            
            // Current Job Info
            jobTitle: profileData.jobTitle || '',
            companyName: profileData.companyName || '',
            companyIndustry: profileData.companyIndustry || '',
            companyWebsite: profileData.companyWebsite || '',
            companyLinkedin: profileData.companyLinkedin || '',
            companyFoundedIn: profileData.companyFoundedIn || 0,
            companySize: profileData.companySize || '',
            currentJobDuration: profileData.currentJobDuration || '',
            currentJobDurationInYrs: profileData.currentJobDurationInYrs || 0,
            
            // Profile Details
            topSkillsByEndorsements: profileData.topSkillsByEndorsements || '',
            addressCountryOnly: profileData.addressCountryOnly || '',
            addressWithCountry: profileData.addressWithCountry || '',
            addressWithoutCountry: profileData.addressWithoutCountry || '',
            profilePic: profileData.profilePic || '',
            profilePicHighQuality: profileData.profilePicHighQuality || '',
            about: profileData.about || '',
            publicIdentifier: profileData.publicIdentifier || '',
            
            // Detailed Sections (limit to prevent overwhelming data)
            experiences: profileData.experiences?.slice(0, 5) || [],
            educations: profileData.educations?.slice(0, 3) || [],
            skills: profileData.skills?.slice(0, 15) || [],
            licenseAndCertificates: profileData.licenseAndCertificates?.slice(0, 5) || [],
            volunteerAndAwards: profileData.volunteerAndAwards?.slice(0, 3) || [],
            interests: profileData.interests || [],
            
            // Metadata
            scrapedAt: new Date().toISOString(),
          };

          console.log('Successfully scraped LinkedIn profile for:', processedData.fullName);

          return createSuccessResponse({ data: processedData });
        }
      }
    } catch (syncError) {
      console.log('Sync API failed, falling back to async:', syncError);
    }

    // Fallback to async API if sync fails
    console.log('Using async API fallback...');
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actorInput),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run failed:', errorText);
      return createErrorResponse('Failed to start LinkedIn scraping', 500);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    console.log('Apify run started with ID:', runId);

    // Poll for results with shorter intervals
    let attempts = 0;
    const maxAttempts = 20; // Reduced from 30
    let profileData: LinkedInProfileData | null = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Reduced from 10 seconds to 5 seconds

      try {
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (resultsResponse.ok) {
          const results = await resultsResponse.json();
          if (results && results.length > 0) {
            profileData = results[0];
            break;
          }
        }

        // Check run status
        const statusResponse = await fetch(
          `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.data.status === 'FAILED') {
            console.error('Apify run failed:', statusData);
            return createErrorResponse('LinkedIn scraping failed', 500);
          }
        }

        attempts++;
      } catch (error) {
        console.error('Error polling for results:', error);
        attempts++;
      }
    }

    if (!profileData) {
      return createErrorResponse('LinkedIn scraping timed out or failed', 500);
    }

    // Process and clean the profile data
    const processedData: LinkedInProfileData = {
      // Basic Info
      linkedinUrl: sanitizedUrl,
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      fullName: profileData.fullName || '',
      headline: profileData.headline || '',
      connections: profileData.connections || 0,
      followers: profileData.followers || 0,
      email: profileData.email || '',
      mobileNumber: profileData.mobileNumber || null,
      
      // Current Job Info
      jobTitle: profileData.jobTitle || '',
      companyName: profileData.companyName || '',
      companyIndustry: profileData.companyIndustry || '',
      companyWebsite: profileData.companyWebsite || '',
      companyLinkedin: profileData.companyLinkedin || '',
      companyFoundedIn: profileData.companyFoundedIn || 0,
      companySize: profileData.companySize || '',
      currentJobDuration: profileData.currentJobDuration || '',
      currentJobDurationInYrs: profileData.currentJobDurationInYrs || 0,
      
      // Profile Details
      topSkillsByEndorsements: profileData.topSkillsByEndorsements || '',
      addressCountryOnly: profileData.addressCountryOnly || '',
      addressWithCountry: profileData.addressWithCountry || '',
      addressWithoutCountry: profileData.addressWithoutCountry || '',
      profilePic: profileData.profilePic || '',
      profilePicHighQuality: profileData.profilePicHighQuality || '',
      about: profileData.about || '',
      publicIdentifier: profileData.publicIdentifier || '',
      
      // Detailed Sections (limit to prevent overwhelming data)
      experiences: profileData.experiences?.slice(0, 5) || [],
      educations: profileData.educations?.slice(0, 3) || [],
      skills: profileData.skills?.slice(0, 15) || [],
      licenseAndCertificates: profileData.licenseAndCertificates?.slice(0, 5) || [],
      volunteerAndAwards: profileData.volunteerAndAwards?.slice(0, 3) || [],
      interests: profileData.interests || [],
      
      // Metadata
      scrapedAt: new Date().toISOString(),
    };

    console.log('Successfully scraped LinkedIn profile for:', processedData.fullName);

    return createSuccessResponse({ data: processedData });

  } catch (error) {
    console.error('LinkedIn scraping error:', error);
    return createErrorResponse('Internal server error during LinkedIn scraping', 500);
  }
}

export const POST = withSecurityAndValidation(
  handleLinkedInScraping,
  linkedinScrapingSchema,
  { rateLimit: 3, rateLimitWindow: 15 * 60 * 1000 } // 3 requests per 15 minutes (very expensive operation)
);

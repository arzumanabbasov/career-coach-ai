// LinkedIn Profile Types (based on actual Apify response)
export interface LinkedInExperience {
  companyId?: string;
  companyUrn?: string;
  companyLink1?: string;
  logo?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  breakdown?: boolean;
  subComponents?: Array<{
    title?: string;
    subtitle?: string;
    caption?: string;
    metadata?: string;
    description?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

export interface LinkedInEducation {
  companyId?: string;
  companyUrn?: string;
  companyLink1?: string;
  logo?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  breakdown?: boolean;
  subComponents?: Array<{
    description?: any[];
  }>;
}

export interface LinkedInSkill {
  title?: string;
  subComponents?: Array<{
    description?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

export interface LinkedInCertificate {
  companyId?: string;
  companyUrn?: string;
  companyLink1?: string;
  logo?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  metadata?: string;
  breakdown?: boolean;
  subComponents?: Array<{
    description?: any[];
  }>;
}

export interface LinkedInProfileData {
  // Basic Info
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string;
  connections?: number;
  followers?: number;
  email?: string;
  mobileNumber?: string | null;
  
  // Current Job Info
  jobTitle?: string;
  companyName?: string;
  companyIndustry?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  companyFoundedIn?: number;
  companySize?: string;
  currentJobDuration?: string;
  currentJobDurationInYrs?: number;
  
  // Profile Details
  topSkillsByEndorsements?: string;
  addressCountryOnly?: string;
  addressWithCountry?: string;
  addressWithoutCountry?: string;
  profilePic?: string;
  profilePicHighQuality?: string;
  about?: string;
  publicIdentifier?: string;
  
  // Detailed Sections
  experiences?: LinkedInExperience[];
  educations?: LinkedInEducation[];
  skills?: LinkedInSkill[];
  licenseAndCertificates?: LinkedInCertificate[];
  volunteerAndAwards?: LinkedInExperience[];
  interests?: Array<{
    section_name?: string;
    section_components?: Array<{
      titleV2?: string;
      caption?: string;
      subtitle?: string;
      size?: string;
      textActionTarget?: string;
      subComponents?: any[];
    }>;
  }>;
  
  // Metadata
  scrapedAt?: string;
}

// User Profile Types
export interface UserProfile {
  position: string;
  experienceLevel: 'junior' | 'middle' | 'senior';
  linkedinUrl: string;
  linkedinData?: LinkedInProfileData;
  createdAt?: string;
  updatedAt?: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    linkedinInsights?: boolean;
    careerAdvice?: boolean;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// LinkedIn Scraping Request/Response Types
export interface LinkedInScrapingRequest {
  linkedinUrl: string;
}

export interface LinkedInScrapingResponse {
  success: boolean;
  data?: LinkedInProfileData;
  error?: string;
}

// Job Scraping Types (based on actual Apify response)
export interface JobData {
  // Basic Job Info
  id?: string;
  trackingId?: string;
  refId?: string;
  link?: string;
  title?: string;
  companyName?: string;
  companyLinkedinUrl?: string;
  companyLogo?: string;
  location?: string;
  salaryInfo?: string[];
  postedAt?: string;
  benefits?: string[];
  descriptionHtml?: string;
  descriptionText?: string;
  applicantsCount?: string;
  applyUrl?: string;
  salary?: string;
  
  // Job Details
  seniorityLevel?: string;
  employmentType?: string;
  jobFunction?: string;
  industries?: string;
  inputUrl?: string;
  
  // Company Details
  companyAddress?: {
    type?: string;
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  companyWebsite?: string;
  companySlogan?: string;
  companyDescription?: string;
  companyEmployeesCount?: number;
  
  // Job Poster Info
  jobPosterName?: string;
  jobPosterTitle?: string;
  jobPosterPhoto?: string;
  jobPosterProfileUrl?: string;
  
  // Metadata
  scrapedAt?: string;
}

export interface JobScrapingRequest {
  keywords: string;
  location?: string;
  count?: number;
}

export interface JobScrapingResponse {
  success: boolean;
  data?: JobData[];
  error?: string;
  totalJobs?: number;
}

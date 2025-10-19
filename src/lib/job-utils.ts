import { JobData } from './types';

/**
 * Analyzes job data to extract market insights and trends
 */
export function analyzeJobMarket(jobs: JobData[]) {
  const analysis = {
    totalJobs: jobs.length,
    topCompanies: [] as Array<{ company: string; count: number }>,
    topLocations: [] as Array<{ location: string; count: number }>,
    salaryRanges: [] as Array<{ range: string; count: number }>,
    jobTypes: [] as Array<{ type: string; count: number }>,
    experienceLevels: [] as Array<{ level: string; count: number }>,
    topSkills: [] as string[],
    marketInsights: [] as string[],
  };

  if (jobs.length === 0) return analysis;

  // Analyze companies
  const companyCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const jobTypeCounts: Record<string, number> = {};
  const experienceCounts: Record<string, number> = {};
  const allSkills: string[] = [];

  jobs.forEach(job => {
    // Count companies
    if (job.companyName) {
      companyCounts[job.companyName] = (companyCounts[job.companyName] || 0) + 1;
    }

    // Count locations
    if (job.location) {
      locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
    }

    // Count job types
    if (job.employmentType) {
      jobTypeCounts[job.employmentType] = (jobTypeCounts[job.employmentType] || 0) + 1;
    }

    // Count experience levels
    if (job.seniorityLevel) {
      experienceCounts[job.seniorityLevel] = (experienceCounts[job.seniorityLevel] || 0) + 1;
    }

    // Extract skills from job descriptions
    if (job.descriptionText) {
      const skills = extractSkillsFromDescription(job.descriptionText);
      allSkills.push(...skills);
    }
  });

  // Sort and get top results
  analysis.topCompanies = Object.entries(companyCounts)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  analysis.topLocations = Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  analysis.jobTypes = Object.entries(jobTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  analysis.experienceLevels = Object.entries(experienceCounts)
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.count - a.count);

  // Extract top skills
  const skillCounts: Record<string, number> = {};
  allSkills.forEach(skill => {
    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  });

  analysis.topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([skill]) => skill);

  // Generate market insights
  analysis.marketInsights = generateMarketInsights(analysis);

  return analysis;
}

/**
 * Extracts technical skills from job descriptions
 */
function extractSkillsFromDescription(description: string): string[] {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes',
    'SQL', 'MongoDB', 'PostgreSQL', 'Git', 'REST API', 'GraphQL', 'Machine Learning', 'AI', 'TensorFlow',
    'PyTorch', 'Data Science', 'Analytics', 'Agile', 'Scrum', 'DevOps', 'CI/CD', 'Linux', 'Redis',
    'Elasticsearch', 'Kafka', 'Microservices', 'Spring Boot', 'Angular', 'Vue.js', 'Express.js',
    'Django', 'Flask', 'FastAPI', 'React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin',
    'Go', 'Rust', 'C++', 'C#', '.NET', 'PHP', 'Ruby', 'Ruby on Rails', 'Laravel', 'Symfony',
    'WordPress', 'Shopify', 'Salesforce', 'HubSpot', 'Tableau', 'Power BI', 'Jira', 'Confluence',
    'Figma', 'Sketch', 'Adobe Creative Suite', 'Photoshop', 'Illustrator', 'InDesign'
  ];

  const foundSkills: string[] = [];
  const lowerDescription = description.toLowerCase();

  commonSkills.forEach(skill => {
    if (lowerDescription.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
}

/**
 * Generates market insights based on job analysis
 */
function generateMarketInsights(analysis: any): string[] {
  const insights: string[] = [];

  if (analysis.totalJobs > 50) {
    insights.push(`Strong market demand with ${analysis.totalJobs} active job postings`);
  } else if (analysis.totalJobs > 20) {
    insights.push(`Moderate market demand with ${analysis.totalJobs} active job postings`);
  } else {
    insights.push(`Limited market visibility with ${analysis.totalJobs} job postings`);
  }

  if (analysis.topCompanies.length > 0) {
    const topCompany = analysis.topCompanies[0];
    insights.push(`${topCompany.company} is actively hiring with ${topCompany.count} open positions`);
  }

  if (analysis.topLocations.length > 0) {
    const topLocation = analysis.topLocations[0];
    insights.push(`${topLocation.location} has the highest concentration of opportunities (${topLocation.count} jobs)`);
  }

  if (analysis.jobTypes.length > 0) {
    const topJobType = analysis.jobTypes[0];
    insights.push(`${topJobType.type} positions are most common (${topJobType.count} listings)`);
  }

  if (analysis.experienceLevels.length > 0) {
    const topLevel = analysis.experienceLevels[0];
    insights.push(`Most positions require ${topLevel.level} experience (${topLevel.count} jobs)`);
  }

  if (analysis.topSkills.length > 0) {
    const topSkills = analysis.topSkills.slice(0, 5).join(', ');
    insights.push(`Top in-demand skills: ${topSkills}`);
  }

  return insights;
}

/**
 * Formats job data for display in chat
 */
export function formatJobMarketForChat(jobs: JobData[], analysis: any): string {
  let formattedText = `📊 **Job Market Analysis**\n\n`;
  
  formattedText += `**Total Jobs Found:** ${analysis.totalJobs}\n\n`;
  
  if (analysis.topCompanies.length > 0) {
    formattedText += `**Top Hiring Companies:**\n`;
    analysis.topCompanies.slice(0, 5).forEach((company: any, index: number) => {
      formattedText += `${index + 1}. ${company.company} (${company.count} positions)\n`;
    });
    formattedText += `\n`;
  }
  
  if (analysis.topLocations.length > 0) {
    formattedText += `**Top Locations:**\n`;
    analysis.topLocations.slice(0, 5).forEach((location: any, index: number) => {
      formattedText += `${index + 1}. ${location.location} (${location.count} jobs)\n`;
    });
    formattedText += `\n`;
  }
  
  if (analysis.topSkills.length > 0) {
    formattedText += `**In-Demand Skills:**\n`;
    analysis.topSkills.slice(0, 8).forEach((skill: string, index: number) => {
      formattedText += `${index + 1}. ${skill}\n`;
    });
    formattedText += `\n`;
  }
  
  if (analysis.jobTypes.length > 0) {
    formattedText += `**Employment Types:**\n`;
    analysis.jobTypes.forEach((jobType: any) => {
      formattedText += `• ${jobType.type}: ${jobType.count} positions\n`;
    });
    formattedText += `\n`;
  }
  
  if (analysis.experienceLevels.length > 0) {
    formattedText += `**Experience Levels:**\n`;
    analysis.experienceLevels.forEach((level: any) => {
      formattedText += `• ${level.level}: ${level.count} positions\n`;
    });
    formattedText += `\n`;
  }
  
  return formattedText;
}

/**
 * Generates career recommendations based on job market analysis
 */
export function generateCareerRecommendations(jobs: JobData[], analysis: any, userProfile: any): string {
  let recommendations = `🎯 **Career Recommendations Based on Market Analysis**\n\n`;
  
  // Market demand analysis
  if (analysis.totalJobs > 50) {
    recommendations += `✅ **High Market Demand:** Your target role has strong market demand with ${analysis.totalJobs} active positions.\n\n`;
  } else if (analysis.totalJobs > 20) {
    recommendations += `⚠️ **Moderate Market Demand:** Your target role has moderate demand with ${analysis.totalJobs} positions. Consider broadening your search criteria.\n\n`;
  } else {
    recommendations += `❌ **Limited Market Demand:** Your target role has limited visibility. Consider:\n`;
    recommendations += `• Expanding your search to related roles\n`;
    recommendations += `• Targeting different locations\n`;
    recommendations += `• Developing additional skills\n\n`;
  }
  
  // Skill recommendations
  if (analysis.topSkills.length > 0) {
    recommendations += `**Skills to Develop:**\n`;
    analysis.topSkills.slice(0, 5).forEach((skill: string, index: number) => {
      recommendations += `${index + 1}. ${skill}\n`;
    });
    recommendations += `\n`;
  }
  
  // Location recommendations
  if (analysis.topLocations.length > 0) {
    recommendations += `**Best Locations for Opportunities:**\n`;
    analysis.topLocations.slice(0, 3).forEach((location: any, index: number) => {
      recommendations += `${index + 1}. ${location.location} (${location.count} jobs)\n`;
    });
    recommendations += `\n`;
  }
  
  // Company recommendations
  if (analysis.topCompanies.length > 0) {
    recommendations += `**Companies Actively Hiring:**\n`;
    analysis.topCompanies.slice(0, 3).forEach((company: any, index: number) => {
      recommendations += `${index + 1}. ${company.company}\n`;
    });
    recommendations += `\n`;
  }
  
  // Experience level recommendations
  if (analysis.experienceLevels.length > 0) {
    const topLevel = analysis.experienceLevels[0];
    recommendations += `**Experience Level Insights:**\n`;
    recommendations += `Most positions require ${topLevel.level} experience. `;
    
    if (userProfile.experienceLevel !== topLevel.level.toLowerCase()) {
      recommendations += `Consider gaining more experience or targeting ${topLevel.level.toLowerCase()} level positions.\n\n`;
    } else {
      recommendations += `This aligns well with your current experience level!\n\n`;
    }
  }
  
  return recommendations;
}

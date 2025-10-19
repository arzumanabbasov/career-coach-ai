import { LinkedInProfileData } from './types';

/**
 * Analyzes LinkedIn profile data to extract key insights for career coaching
 */
export function analyzeLinkedInProfile(profileData: LinkedInProfileData) {
  const insights = {
    experienceLevel: '',
    keySkills: [] as string[],
    careerProgression: [] as string[],
    strengths: [] as string[],
    recommendations: [] as string[],
    industryExpertise: '',
    leadershipExperience: false,
    certifications: [] as string[],
  };

  // Analyze experience level based on years of experience
  if (profileData.currentJobDurationInYrs) {
    const totalExperience = profileData.currentJobDurationInYrs;
    
    if (totalExperience <= 2) {
      insights.experienceLevel = 'junior';
    } else if (totalExperience <= 5) {
      insights.experienceLevel = 'middle';
    } else {
      insights.experienceLevel = 'senior';
    }
  } else if (profileData.experiences && profileData.experiences.length > 0) {
    const totalExperience = estimateYearsOfExperience(profileData.experiences);
    
    if (totalExperience <= 2) {
      insights.experienceLevel = 'junior';
    } else if (totalExperience <= 5) {
      insights.experienceLevel = 'middle';
    } else {
      insights.experienceLevel = 'senior';
    }
  }

  // Extract key skills (top 10)
  if (profileData.skills && profileData.skills.length > 0) {
    insights.keySkills = profileData.skills
      .slice(0, 10)
      .map(skill => skill.title || '')
      .filter(Boolean);
  }

  // Analyze career progression
  if (profileData.experiences && profileData.experiences.length > 0) {
    insights.careerProgression = profileData.experiences
      .slice(0, 3)
      .map(exp => {
        if (exp.breakdown && exp.subComponents && exp.subComponents.length > 0) {
          return `${exp.subComponents[0].title} at ${exp.title}`;
        }
        return `${exp.title}`;
      })
      .filter(Boolean);
  }

  // Check for leadership experience
  if (profileData.experiences) {
    const hasLeadership = profileData.experiences.some(exp => {
      const title = exp.breakdown && exp.subComponents ? 
        exp.subComponents[0]?.title?.toLowerCase() || '' : 
        exp.title?.toLowerCase() || '';
      return title.includes('lead') || title.includes('manager') || title.includes('director') || title.includes('head');
    });
    insights.leadershipExperience = hasLeadership;
  }

  // Extract certifications
  if (profileData.licenseAndCertificates && profileData.licenseAndCertificates.length > 0) {
    insights.certifications = profileData.licenseAndCertificates
      .map(cert => cert.title || '')
      .filter(Boolean);
  }

  // Set industry expertise
  insights.industryExpertise = profileData.companyIndustry || '';

  // Generate strengths based on profile
  if (profileData.about && profileData.about.length > 100) {
    insights.strengths.push('Strong professional summary with detailed experience');
  }

  if (profileData.connections && profileData.connections > 500) {
    insights.strengths.push('Strong professional network');
  }

  if (profileData.skills && profileData.skills.length > 15) {
    insights.strengths.push('Diverse and comprehensive skill set');
  }

  if (insights.leadershipExperience) {
    insights.strengths.push('Demonstrated leadership experience');
  }

  if (insights.certifications.length > 0) {
    insights.strengths.push('Professional certifications and continuous learning');
  }

  // Generate recommendations
  if (profileData.skills && profileData.skills.length < 10) {
    insights.recommendations.push('Consider adding more skills to showcase your expertise');
  }

  if (!profileData.about || profileData.about.length < 200) {
    insights.recommendations.push('Enhance your profile summary with more detailed professional background');
  }

  if (profileData.experiences && profileData.experiences.length < 3) {
    insights.recommendations.push('Consider adding more detailed work experience descriptions');
  }

  if (!insights.leadershipExperience && insights.experienceLevel === 'senior') {
    insights.recommendations.push('Highlight any leadership or mentoring experience you have');
  }

  return insights;
}

/**
 * Estimates years of experience from LinkedIn experience data
 */
function estimateYearsOfExperience(experience: any[]): number {
  // This is a simplified estimation - in a real app, you'd parse dates more carefully
  return Math.min(experience.length * 2, 15); // Rough estimate: 2 years per role, max 15
}

/**
 * Formats LinkedIn profile data for display in chat
 */
export function formatLinkedInProfileForChat(profileData: LinkedInProfileData): string {
  let formattedText = `📋 **LinkedIn Profile Analysis**\n\n`;
  
  if (profileData.fullName) {
    formattedText += `**Name:** ${profileData.fullName}\n`;
  }
  
  if (profileData.headline) {
    formattedText += `**Headline:** ${profileData.headline}\n`;
  }
  
  if (profileData.jobTitle && profileData.companyName) {
    formattedText += `**Current Role:** ${profileData.jobTitle} at ${profileData.companyName}\n`;
  }
  
  if (profileData.companyIndustry) {
    formattedText += `**Industry:** ${profileData.companyIndustry}\n`;
  }
  
  if (profileData.experiences && profileData.experiences.length > 0) {
    formattedText += `\n**Recent Experience:**\n`;
    profileData.experiences.slice(0, 3).forEach((exp, index) => {
      if (exp.breakdown && exp.subComponents && exp.subComponents.length > 0) {
        formattedText += `${index + 1}. ${exp.subComponents[0].title} at ${exp.title}\n`;
      } else {
        formattedText += `${index + 1}. ${exp.title}\n`;
      }
    });
  }
  
  if (profileData.skills && profileData.skills.length > 0) {
    const skillNames = profileData.skills
      .slice(0, 8)
      .map(skill => skill.title || '')
      .filter(Boolean);
    formattedText += `\n**Key Skills:** ${skillNames.join(', ')}\n`;
  }
  
  if (profileData.educations && profileData.educations.length > 0) {
    const education = profileData.educations[0];
    formattedText += `\n**Education:** ${education.subtitle} from ${education.title}\n`;
  }
  
  if (profileData.connections) {
    formattedText += `\n**Network:** ${profileData.connections} connections\n`;
  }
  
  return formattedText;
}

/**
 * Generates career coaching insights based on LinkedIn profile
 */
export function generateCareerInsights(profileData: LinkedInProfileData): string {
  const analysis = analyzeLinkedInProfile(profileData);
  
  let insights = `🎯 **Career Insights Based on Your Profile**\n\n`;
  
  if (analysis.experienceLevel) {
    insights += `**Experience Level:** ${analysis.experienceLevel.charAt(0).toUpperCase() + analysis.experienceLevel.slice(1)}\n`;
  }
  
  if (analysis.industryExpertise) {
    insights += `**Industry Focus:** ${analysis.industryExpertise}\n`;
  }
  
  if (analysis.leadershipExperience) {
    insights += `**Leadership Experience:** ✅ Demonstrated\n`;
  }
  
  if (analysis.keySkills.length > 0) {
    insights += `\n**Your Top Skills:**\n`;
    analysis.keySkills.slice(0, 8).forEach((skill, index) => {
      insights += `${index + 1}. ${skill}\n`;
    });
  }
  
  if (analysis.certifications.length > 0) {
    insights += `\n**Certifications:**\n`;
    analysis.certifications.slice(0, 5).forEach((cert, index) => {
      insights += `${index + 1}. ${cert}\n`;
    });
  }
  
  if (analysis.careerProgression.length > 0) {
    insights += `\n**Career Progression:**\n`;
    analysis.careerProgression.forEach((role, index) => {
      insights += `${index + 1}. ${role}\n`;
    });
  }
  
  if (analysis.strengths.length > 0) {
    insights += `\n**Profile Strengths:**\n`;
    analysis.strengths.forEach((strength, index) => {
      insights += `✅ ${strength}\n`;
    });
  }
  
  if (analysis.recommendations.length > 0) {
    insights += `\n**Recommendations for Improvement:**\n`;
    analysis.recommendations.forEach((rec, index) => {
      insights += `💡 ${rec}\n`;
    });
  }
  
  return insights;
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, User, Briefcase, Link, Check } from 'lucide-react';

interface OnboardingData {
  position: string;
  experienceLevel: 'junior' | 'middle' | 'senior';
  linkedinUrl: string;
  linkedinData?: any;
}

const experienceLevels = [
  {
    id: 'junior' as const,
    label: 'Junior',
    description: '0-2 years of experience',
    icon: '🌱'
  },
  {
    id: 'middle' as const,
    label: 'Middle',
    description: '2-5 years of experience',
    icon: '🚀'
  },
  {
    id: 'senior' as const,
    label: 'Senior',
    description: '5+ years of experience',
    icon: '🎯'
  }
];

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    position: '',
    experienceLevel: 'junior',
    linkedinUrl: ''
  });
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  const steps = [
    {
      title: 'What position are you targeting?',
      subtitle: 'Tell us about your career goals',
      icon: Briefcase
    },
    {
      title: 'What\'s your experience level?',
      subtitle: 'Help us understand your background',
      icon: User
    },
    {
      title: 'Share your LinkedIn profile',
      subtitle: 'Connect your professional profile',
      icon: Link
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - scrape LinkedIn profile
      await scrapeLinkedInProfile();
    }
  };

  const scrapeLinkedInProfile = async () => {
    if (!data.linkedinUrl) {
      onComplete(data);
      return;
    }

    setIsScraping(true);
    setScrapingError(null);

    try {
      console.log('Scraping LinkedIn profile:', data.linkedinUrl);
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

      const response = await fetch('/api/scrape-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl: data.linkedinUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success && result.data) {
        console.log('LinkedIn profile scraped successfully:', result.data);
        onComplete({ ...data, linkedinData: result.data });
      } else {
        console.error('LinkedIn scraping failed:', result.error);
        setScrapingError(result.error || 'Failed to scrape LinkedIn profile');
        // Still complete onboarding even if scraping fails
        onComplete(data);
      }
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        setScrapingError('LinkedIn scraping timed out. Please try again.');
      } else {
        setScrapingError('Network error while scraping LinkedIn profile');
      }
      
      // Still complete onboarding even if scraping fails
      onComplete(data);
    } finally {
      setIsScraping(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return data.position.trim().length > 0;
      case 1:
        return data.experienceLevel !== '';
      case 2:
        return data.linkedinUrl.trim().length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-semibold mb-2">{steps[0].title}</h2>
              <p className="text-gray-600">{steps[0].subtitle}</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={data.position}
                onChange={(e) => setData({ ...data, position: e.target.value })}
                placeholder="e.g., Data Scientist, Backend Developer, Product Manager"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-semibold mb-2">{steps[1].title}</h2>
              <p className="text-gray-600">{steps[1].subtitle}</p>
            </div>
            
            <div className="grid gap-4 max-w-2xl mx-auto grid-cols-1 lg:grid-cols-3">
              {experienceLevels.map((level) => (
                <motion.button
                  key={level.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setData({ ...data, experienceLevel: level.id })}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    data.experienceLevel === level.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{level.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{level.label}</h3>
                      <p className="text-gray-600">{level.description}</p>
                    </div>
                    {data.experienceLevel === level.id && (
                      <Check className="w-6 h-6 text-purple-600 ml-auto" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Link className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-semibold mb-2">{steps[2].title}</h2>
              <p className="text-gray-600">{steps[2].subtitle}</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <input
                type="url"
                value={data.linkedinUrl}
                onChange={(e) => setData({ ...data, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/your-profile"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                disabled={isScraping}
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                This helps us provide more personalized career guidance
              </p>
              
              {isScraping && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-purple-700 font-medium">Scraping your LinkedIn profile...</span>
                  </div>
                  <p className="text-sm text-purple-600 mt-2 text-center">
                    This usually takes 30-60 seconds
                  </p>
                </div>
              )}
              
              {scrapingError && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700 text-sm text-center">
                    ⚠️ {scrapingError}
                  </p>
                  <p className="text-red-600 text-xs mt-1 text-center">
                    Continuing without LinkedIn data...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index <= currentStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-4 lg:p-8 min-h-[400px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!isStepValid() || isScraping}
            className={`px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
              isStepValid() && !isScraping
                ? 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>
              {isScraping 
                ? 'Scraping...' 
                : currentStep === steps.length - 1 
                  ? 'Get Started' 
                  : 'Continue'
              }
            </span>
            {!isScraping && <ChevronRight className="w-5 h-5" />}
            {isScraping && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

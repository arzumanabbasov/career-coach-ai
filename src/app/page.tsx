'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/OnboardingWizard';

interface UserData {
  position: string;
  experienceLevel: string;
  linkedinUrl: string;
  linkedinData?: any;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user data exists in localStorage
    const savedUserData = localStorage.getItem('shekarchai-user-data');
    if (savedUserData) {
      // Redirect to chat if user data exists
      router.push('/chat');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleOnboardingComplete = (data: UserData) => {
    // Save user data to localStorage
    localStorage.setItem('shekarchai-user-data', JSON.stringify(data));
    // Redirect to chat page
    router.push('/chat');
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading ShekarchAI...</p>
        </div>
      </div>
    );
  }

  return <OnboardingWizard onComplete={handleOnboardingComplete} />;
}

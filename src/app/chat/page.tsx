'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

interface UserData {
  position: string;
  experienceLevel: string;
  linkedinUrl: string;
}

export default function ChatPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user data exists in localStorage
    const savedUserData = localStorage.getItem('shekarchai-user-data');
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    } else {
      // Redirect to onboarding if no user data
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null; // Will redirect to onboarding
  }

  return <ChatInterface userData={userData} />;
}

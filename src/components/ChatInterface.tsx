'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, MessageSquare, Bot, User, Menu, X } from 'lucide-react';
import { formatLinkedInProfileForChat, generateCareerInsights } from '@/lib/linkedin-utils';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    linkedinInsights?: boolean;
    careerAdvice?: boolean;
    searchResults?: any[];
  };
}

interface ChatInterfaceProps {
  userData: {
    position: string;
    experienceLevel: string;
    linkedinUrl: string;
    linkedinData?: any;
  };
}

export default function ChatInterface({ userData }: ChatInterfaceProps) {
  const getInitialMessage = () => {
    let content = `Hello! I'm your AI Career Coach. I see you're interested in ${userData.position} at the ${userData.experienceLevel} level.`;
    
    if (userData.linkedinData) {
      const linkedin = userData.linkedinData;
      content += `\n\nI've analyzed your LinkedIn profile and I can see you're ${linkedin.fullName || 'a professional'} working as ${linkedin.jobTitle || 'in your field'} at ${linkedin.companyName || 'your company'}.`;
      
      if (linkedin.about) {
        content += ` Based on your profile summary, I understand your background in ${linkedin.companyIndustry || 'your industry'}.`;
      }
      
      content += ` I'm here to provide personalized career guidance based on your unique profile and goals. What would you like to know?`;
    } else {
      content += ` I'm here to help you navigate your career journey and provide personalized guidance. What would you like to know?`;
    }
    
    return content;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: getInitialMessage(),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasRunJobAnalysis, setHasRunJobAnalysis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user has already run job analysis
  useEffect(() => {
    const analysisKey = `job-analysis-${userData.position}-${userData.experienceLevel}`;
    const hasRun = localStorage.getItem(analysisKey) === 'true';
    setHasRunJobAnalysis(hasRun);
  }, [userData.position, userData.experienceLevel]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare chat history for context
      const chatHistory = messages
        .filter(msg => msg.id !== '1') // Exclude initial greeting
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }));

      // Call the new search API with Gemini AI integration
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentInput,
          userProfile: userData,
          useVectorSearch: true,
          chatHistory: chatHistory
        }),
      });

      const result = await response.json();

      if (result.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.data?.aiResponse || 'I found some relevant information for you, but I\'m having trouble generating a response right now.',
          isUser: false,
          timestamp: new Date(),
          metadata: {
            careerAdvice: true,
            searchResults: result.data?.jobs?.slice(0, 5) // Store top 5 results for reference
          }
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I apologize, but I encountered an issue while processing your question: ${result.error || 'Unknown error'}. Please try again.`,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error calling search API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I\'m having trouble connecting to the search service right now. Please try again in a moment.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: '1',
        content: getInitialMessage(),
        isUser: false,
        timestamp: new Date()
      }
    ]);
  };

  const resetOnboarding = () => {
    // Clear all job analysis flags
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('job-analysis-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear user data and redirect
    localStorage.removeItem('shekarchai-user-data');
    window.location.href = '/';
  };

  const generateLinkedInInsights = (linkedinData: any) => {
    const profileSummary = formatLinkedInProfileForChat(linkedinData);
    const careerInsights = generateCareerInsights(linkedinData);
    return `${profileSummary}\n\n${careerInsights}`;
  };

  // Function to format markdown text into JSX
  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (line.trim() === '') {
        elements.push(<br key={key++} />);
        continue;
      }

      // Bold text **text**
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return <strong key={index} className="font-semibold">{boldText}</strong>;
          }
          return part;
        });
        elements.push(
          <div key={key++} className="mb-2">
            {formattedLine}
          </div>
        );
      }
      // Bullet points
      else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        elements.push(
          <div key={key++} className="ml-4 mb-1 flex items-start">
            <span className="mr-2">•</span>
            <span>{line.trim().substring(1).trim()}</span>
          </div>
        );
      }
      // Numbered lists
      else if (/^\d+\./.test(line.trim())) {
        elements.push(
          <div key={key++} className="ml-4 mb-1 flex items-start">
            <span className="mr-2 font-medium">{line.trim().split('.')[0]}.</span>
            <span>{line.trim().substring(line.indexOf('.') + 1).trim()}</span>
          </div>
        );
      }
      // Regular text
      else {
        elements.push(
          <div key={key++} className="mb-2">
            {line}
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex-col transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:flex`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">ShekarchAI</h1>
                <p className="text-sm text-gray-500">Career Coach</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={startNewChat}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700 font-medium">New Chat</span>
          </button>
          
          {userData.linkedinData && (
            <button
              onClick={() => {
                const linkedinInsights = generateLinkedInInsights(userData.linkedinData);
                const insightMessage: Message = {
                  id: Date.now().toString(),
                  content: linkedinInsights,
                  isUser: false,
                  timestamp: new Date(),
                  metadata: { linkedinInsights: true }
                };
                setMessages(prev => [...prev, insightMessage]);
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 text-blue-600">📊</div>
              <span className="text-gray-700 font-medium">Profile Insights</span>
            </button>
          )}
          
          <button
            onClick={async () => {
              if (hasRunJobAnalysis) {
                const alreadyRunMessage: Message = {
                  id: Date.now().toString(),
                  content: '⚠️ **Job Market Analysis Already Completed**\n\nYou have already run the job market analysis for this profile. To run it again, please reset your profile first using the "Reset Profile" button below.',
                  isUser: false,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, alreadyRunMessage]);
                return;
              }

              // Show loading message
              const loadingMessage: Message = {
                id: Date.now().toString(),
                content: '🔍 Collecting and analyzing job market data... This may take a moment.',
                isUser: false,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, loadingMessage]);

              try {
                // Call the job statistics API to scrape jobs and store in Elasticsearch
                const response = await fetch('/api/job-statistics', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    keywords: userData.position,
                    count: 100
                  }),
                });

                const result = await response.json();

                // Remove loading message
                setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

                if (result.success) {
                  // Mark analysis as completed
                  const analysisKey = `job-analysis-${userData.position}-${userData.experienceLevel}`;
                  localStorage.setItem(analysisKey, 'true');
                  setHasRunJobAnalysis(true);

                  // Show data collection success message
                  const successMessage: Message = {
                    id: Date.now().toString(),
                    content: `✅ **Scraping Successfully Ended!**\n\nJob market data has been collected and is now available in the database. You can now ask questions about job opportunities, market trends, or career advice for your ${userData.position} role.\n\nWhat would you like to know?`,
                    isUser: false,
                    timestamp: new Date(),
                    metadata: { careerAdvice: true }
                  };
                  setMessages(prev => [...prev, successMessage]);
                } else {
                  // Show error message
                  const errorMessage: Message = {
                    id: Date.now().toString(),
                    content: `❌ **Data Collection Error**\n\n${result.error || 'Failed to collect job market data. Please try again later.'}`,
                    isUser: false,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, errorMessage]);
                }
              } catch (error) {
                // Remove loading message
                setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
                
                // Show error message
                const errorMessage: Message = {
                  id: Date.now().toString(),
                  content: '❌ **Network Error**\n\nFailed to connect to job market data service. Please check your connection and try again.',
                  isUser: false,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
              }
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              hasRunJobAnalysis 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'hover:bg-gray-100'
            }`}
            disabled={hasRunJobAnalysis}
          >
            <div className={`w-5 h-5 ${hasRunJobAnalysis ? 'text-gray-400' : 'text-green-600'}`}>
              {hasRunJobAnalysis ? '✅' : '💼'}
            </div>
            <span className={`font-medium ${hasRunJobAnalysis ? 'text-gray-400' : 'text-gray-700'}`}>
              {hasRunJobAnalysis ? 'Job Analysis Completed' : 'Job Market Analysis'}
            </span>
          </button>
        </div>

        <div className="flex-1 p-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Your Profile</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Position:</span>
                <span className="ml-2 font-medium">{userData.position}</span>
              </div>
              <div>
                <span className="text-gray-500">Level:</span>
                <span className="ml-2 font-medium capitalize">{userData.experienceLevel}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={resetOnboarding}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
          >
            <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">⚙️</span>
            </div>
            <span className="font-medium">Reset Profile</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gradient">ShekarchAI</h1>
              </div>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 hidden lg:block">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">AI Career Coach</h2>
              <p className="text-sm text-gray-500">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-full lg:max-w-3xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser ? 'bg-purple-600' : 'bg-gray-200'
                  }`}>
                    {message.isUser ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-gradient-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <div className={`${message.isUser ? 'text-white' : 'text-gray-800'}`}>
                      {message.isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div>{formatMarkdown(message.content)}</div>
                      )}
                    </div>
                    <p className={`text-xs mt-2 ${
                      message.isUser ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-4 max-w-full lg:max-w-4xl mx-auto">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your career..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-3 rounded-lg transition-all ${
                inputMessage.trim() && !isLoading
                  ? 'bg-gradient-primary text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

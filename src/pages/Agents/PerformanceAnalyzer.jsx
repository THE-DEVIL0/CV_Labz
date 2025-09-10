import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 

const PerformanceAnalyzer = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const API_BASE = "https://delightful-passion-production.up.railway.app/performance";

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const pollForPerformanceData = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkPerformanceData = async () => {
      if (!isPollingActive) return;

      try {
        const response = await fetch(`${API_BASE}/performance-data`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('API returned non-JSON response');
        }

        const data = await response.json();
        console.log('Performance data response:', data);

        if (data.data && data.data.text) {
          setPerformanceData(data.data.text);
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Performance analysis retrieved successfully!');
          return true;
        } else if (data.data && data.data.message === 'No valid data provided') {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for performance data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkPerformanceData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (error) {
        console.error('Error polling for performance data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkPerformanceData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve performance data.');
        }
      }
    };

    checkPerformanceData();
  };

  const generatePerformanceAnalysis = async () => {
    setIsLoading(true);
    setShowSkeleton(true);
    setPerformanceData(null);

    try {
      const response = await fetch(`${API_BASE}/performance-req`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showWebhookMessage('success', 'Performance analysis request sent successfully! Generating insights...');
        setIsLoading(false);
        setIsPolling(true);
        pollForPerformanceData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating performance analysis:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showWebhookMessage('error', 'Failed to generate performance analysis. Please try again.');
    }
  };

  // Function to render Markdown-like text with proper formatting
const renderPerformanceData = (text) => {
  if (!text) return null;

  return (
    <div className="prose prose-blue max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({ ...props}) => (
            <h3 className="text-xl font-semibold text-gray-800 mb-4" {...props} />
          ),
          p: ({...props}) => (
            <p className="text-gray-600 mb-3 leading-relaxed" {...props} />
          ),
          li: ({ ...props}) => (
            <li className="mb-2 text-gray-600" {...props} />
          ),
          ul: ({...props}) => (
            <ul className="list-disc pl-6 mb-4" {...props} />
          ),
          ol: ({ ...props}) => (
            <ol className="list-decimal pl-6 mb-4" {...props} />
          ),
          strong: ({ ...props}) => (
            <strong className="font-semibold text-gray-800" {...props} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 md:px-8 lg:px-12 py-8">
        {/* Webhook Message */}
        <AnimatePresence>
          {webhookMessage.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                webhookMessage.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {webhookMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 glass-card text-blue-700 shadow px-3 py-2 rounded-full text-xs font-semibold mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-trending-up h-4 w-4"
            >
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
              <polyline points="16,7 22,7 22,13" />
            </svg>
            Performance Analyzer
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Performance Optimizer
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Unlock actionable insights with our AI-powered Performance Analyzer. Instantly retrieve and analyze your
            YouTube channel or Google Ads campaign performance metrics to identify key trends, opportunities, and
            recommendations for growth. Click below to generate a comprehensive report tailored to your data.
          </p>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
              backgroundColor: '#2563eb'
            }}
            whileTap={{ scale: 0.95 }}
            animate={{
              y: [0, -5, 0],
              transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
            }}
            onClick={generatePerformanceAnalysis}
            disabled={isLoading || isPolling}
            className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-base px-8 py-4 rounded-xl shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Performance...
              </span>
            ) : isPolling ? (
              'Generating Insights...'
            ) : (
              'Generate Performance Report'
            )}
          </motion.button>
        </motion.div>

         {/* Performance Data Display */}
        <AnimatePresence>
          {performanceData && !showSkeleton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Performance Analysis Report</h2>
              <div className="bg-blue-50 p-6 rounded-2xl prose prose-blue max-w-none">
                {renderPerformanceData(performanceData)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton stays same */}
         {/* Loading Skeleton */}
        {showSkeleton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Analyzing Your Performance</h2>
            <p className="text-gray-600 mb-6 text-center">Evaluating metrics and generating comprehensive optimization strategies...</p>

            <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 min-h-[400px]">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
       
     
};

export default PerformanceAnalyzer;
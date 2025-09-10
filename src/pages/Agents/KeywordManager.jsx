import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KeywordManager = () => {
  const [keywordAnalysis, setKeywordAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [isPolling, setIsPolling] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const API_BASE = "https://delightful-passion-production.up.railway.app/keywords";

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      showWebhookMessage('error', 'Please select a valid CSV file.');
      setSelectedFile(null);
    }
  };

  const pollForKeywordData = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkKeywordData = async () => {
      if (!isPollingActive) return;
      try {
        const response = await fetch(`${API_BASE}/keywords-data`, {
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
        console.log('Keyword data response:', data);
        if (data.data && Array.isArray(data.data)) {
          setKeywordAnalysis(data.data);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Keyword analysis retrieved successfully!');
          return true;
        } else if (data.data && data.data.message === 'No valid data provided') {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for keyword data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkKeywordData, 20000);
          } else if (isPollingActive) {
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (error) {
        console.error('Error polling for keyword data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkKeywordData, 20000);
        } else if (isPollingActive) {
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve keyword data.');
        }
      }
    };
    checkKeywordData();
  };

  const generateKeywordAnalysis = async () => {
    if (!selectedFile) {
      showWebhookMessage('error', 'Please upload a CSV file.');
      return;
    }
    setIsLoading(true);
    setKeywordAnalysis(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch(`${API_BASE}/keywords-req`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        showWebhookMessage('success', 'CSV uploaded successfully! Generating keyword analysis...');
        setIsLoading(false);
        setIsPolling(true);
        pollForKeywordData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating keyword analysis:', error);
      setIsLoading(false);
      showWebhookMessage('error', 'Failed to process CSV file. Please try again.');
    }
  };

  const renderKeywordAnalysis = (keywords) => {
    if (!keywords || !Array.isArray(keywords)) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keywords.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-4 rounded-lg shadow-md border ${
                item.status === 'Priority' ? 'bg-green-50 border-green-200' :
                item.status === 'Active' ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              }`}
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{item.keyword}</h4>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Status: <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  item.status === 'Priority' ? 'bg-green-200 text-green-800' :
                  item.status === 'Active' ? 'bg-blue-200 text-blue-800' :
                  'bg-red-200 text-red-800'
                }`}>{item.status}</span>
              </p>
              <p className="text-sm text-gray-600">{item.explanation}</p>
            </motion.div>
          ))}
        </div>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              className="lucide lucide-search h-4 w-4"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Keyword Manager
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              SEO Optimizer
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Upload a CSV file containing your keyword data to receive AI-powered insights.
            Our Keyword Manager analyzes your data to provide detailed keyword analysis, SEO strategies, and recommendations to boost your search rankings.
          </p>
        </div>
        {/* CSV File Upload */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Your Keyword Data</h2>
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
              <button
                onClick={generateKeywordAnalysis}
                disabled={isLoading || isPolling}
                className="w-full font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-base px-6 py-3 rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing CSV...
                  </span>
                ) : isPolling ? (
                  'Generating Insights...'
                ) : (
                  'Analyze Keyword Data'
                )}
              </button>
            </div>
          </div>
        </motion.div>
        {/* Keyword Analysis Display */}
        <AnimatePresence>
          {keywordAnalysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 max-w-4xl mx-auto"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Keyword Analysis Report</h2>
              <div className="bg-blue-50 p-6 rounded-2xl">
                {renderKeywordAnalysis(keywordAnalysis)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KeywordManager;
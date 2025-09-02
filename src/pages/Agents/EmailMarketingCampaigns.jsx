import React, { useState } from 'react';

const Agent1 = () => {
  const [campaignDetails, setCampaignDetails] = useState({
    campaignName: '',
    email: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  // Dashboard state
  const [campaigns, setCampaigns] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);


  const [currentCampaignName, setCurrentCampaignName] = useState('');
  const [emailBodyA, setEmailBodyA] = useState('Loading...');
  const [emailBodyB, setEmailBodyB] = useState('Loading...');
  const [dynamicResult, setDynamicResult] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [currentMode, setCurrentMode] = useState('');

  const API_BASE = "https://delightful-passion-production.up.railway.app";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBulkInputChange = (e) => {
    setCurrentCampaignName(e.target.value);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const fetchCampaigns = async () => {
    setIsDashboardLoading(true);
    setShowDashboard(true);

    try {
      const res = await fetch(`${API_BASE}/emails/dashboard-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       credentials: 'include', // Add any payload if needed, e.g., userId
      });

      if (!res.ok) throw new Error('Failed to fetch campaigns');

      const data = await res.json();
      console.log('Fetched campaigns:', data);
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setIsDashboardLoading(false);
    }
  };



  const pollForEmailData = async () => {
    let attempts = 0;
    const maxAttempts = 15; // 5 minutes max (15 * 20 seconds)
    let isPollingActive = true; // Flag to control polling

    const checkEmailData = async () => {
      if (!isPollingActive) return; // Stop if polling was cancelled

      try {
        const aEndpoint = currentMode === 'single' ? '/emails/email-a' : '/emails/bulk-email-a';
        const bEndpoint = currentMode === 'single' ? '/emails/email-b' : '/emails/bulk-email-b';
        const resultsEndpoint = currentMode === 'single' ? '/emails/email-results' : '/emails/bulk-email-results';

        const emailARes = await fetch(`${API_BASE}${aEndpoint}`);
        const emailBRes = await fetch(`${API_BASE}${bEndpoint}`);
        const resultsRes = await fetch(`${API_BASE}${resultsEndpoint}`);

        // Check response status and content type
        if (!emailARes.ok || !emailBRes.ok || !resultsRes.ok) {
          console.error('API Error - EmailA status:', emailARes.status, 'EmailB status:', emailBRes.status, 'Results status:', resultsRes.status);
          throw new Error(`API returned error status`);
        }

        // Check content type
        const emailAContentType = emailARes.headers.get('content-type');
        const emailBContentType = emailBRes.headers.get('content-type');
        const resultsContentType = resultsRes.headers.get('content-type');

        if (!emailAContentType?.includes('application/json') || !emailBContentType?.includes('application/json') || !resultsContentType?.includes('application/json')) {
          console.error('Invalid content type - EmailA:', emailAContentType, 'EmailB:', emailBContentType, 'Results:', resultsContentType);
          throw new Error('API returned non-JSON response');
        }

        const emailAData = await emailARes.json();
        const emailBData = await emailBRes.json();
        const resultsData = await resultsRes.json();

        // Check if all endpoints have data with Body field (not empty arrays)
        const emailAText = emailAData && emailAData.length > 0 && emailAData[0].Body ? emailAData[0].Body : '';
        const emailBText = emailBData && emailBData.length > 0 && emailBData[0].Body ? emailBData[0].Body : '';
        const resultText = resultsData && resultsData.length > 0 && resultsData[0].Body ? resultsData[0].Body : '';

        console.log('EmailA response:', emailAData);
        console.log('EmailB response:', emailBData);
        console.log('Results response:', resultsData);

        if (emailAText && emailBText && resultText) {
          // Data is ready, fetch all data
          setEmailBodyA(emailAText);
          setEmailBodyB(emailBText);
          setDynamicResult(resultText);

          // Clear the input fields based on mode
          if (currentMode === 'single') {
            setCampaignDetails({ campaignName: '', email: '' });
          } else {
            setCurrentCampaignName('');
            setSelectedFile(null);
          }

          setShowSkeleton(false);
          setDataLoaded(true);
          setIsPolling(false);
          isPollingActive = false; // Stop polling
          showWebhookMessage('success', 'Data retrieved successfully! Email content is ready.');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for data... EmailA: ${emailAText ? 'has data' : 'empty'}, EmailB: ${emailBText ? 'has data' : 'empty'}, Results: ${resultText ? 'has data' : 'empty'}`);
          if (attempts < maxAttempts && isPollingActive) {
            // Wait 20 seconds and try again
            setTimeout(checkEmailData, 20000);
          } else if (isPollingActive) {
            // Timeout after 5 minutes
            setShowSkeleton(false);
            setEmailBodyA(emailAText || 'No data available after timeout.');
            setEmailBodyB(emailBText || 'No data available after timeout.');
            setDynamicResult(resultText || 'Result will be sent via email in 14 days');
            setDataLoaded(true);
            setIsPolling(false);
            isPollingActive = false; // Stop polling
            showWebhookMessage('error', 'Timeout: Not all data received after 5 minutes.');
          }
        }
      } catch (err) {
        console.error('Error polling for email data:', err);
        console.error('API Base URL:', API_BASE);
        console.error('Full error details:', err.message);

        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkEmailData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setEmailBodyA('Error loading data.');
          setEmailBodyB('Error loading data.');
          setDynamicResult('Result will be sent via email in 14 days');
          setDataLoaded(true);
          setIsPolling(false);
          isPollingActive = false; // Stop polling
          showWebhookMessage('error', 'Failed to load email data after multiple attempts.');
        }
      }
    };

    // Start polling
    setIsPolling(true);
    checkEmailData();
  };

  const sendToBackend = async () => {
    if ((activeTab === 'single' && (!campaignDetails.campaignName || !campaignDetails.email)) ||
      (activeTab === 'bulk' && (!currentCampaignName || !selectedFile))) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    // Store the current campaign name and mode before clearing
    setCurrentMode(activeTab);

    try {
      // First, hit the empty endpoint to reset
      let emptyResponse = await fetch(`${API_BASE}/emails/empty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(emptyResponse)
      let response;
      if (activeTab === 'single') {
        const payload = {
          campaignName: campaignDetails.campaignName,
          email: campaignDetails.email
        };
        response = await fetch(`${API_BASE}/emails/send-single-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const formData = new FormData();
        formData.append('campaignName', currentCampaignName);
        console.log('Selected file:', selectedFile);
        formData.append('csvFile', selectedFile);
        for (let pair of formData.entries()) {
          console.log(pair[0] + ':', pair[1]);
        }
        response = await fetch(`${API_BASE}/emails/send-bulk-emails`, {
          method: 'POST',
          body: formData
        });
      }

      if (response.ok) {
        showWebhookMessage('success', 'Request sent successfully! Processing email content...');

        // Show skeleton loading
        setShowSkeleton(true);

        // Start polling for email data
        //pollForEmailData();
      } else {
        throw new Error('Request failed');
      }
    } catch (error) {
      console.error(error);
      showWebhookMessage('error', 'Failed to send request. Please try again.');
      setShowSkeleton(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-14 lg:px-24 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Webhook Message */}
        {webhookMessage.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${webhookMessage.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
            }`}>
            <div className="flex items-center gap-2">
              {webhookMessage.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{webhookMessage.text}</span>
            </div>
          </div>
        )}
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
              className="lucide lucide-mail h-4 w-4"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Email Marketing Campaigns
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Email Expert
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Transform your email marketing with AI-powered campaign optimization.
            Create compelling A/B test content that drives engagement and conversions.
          </p>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your campaign details and generates optimized email content for A/B testing.
            Simply enter your campaign information, and our system will create two distinct versions
            to maximize your email performance and conversion rates.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">What You Get</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• AI-generated email content</li>
                <li>• A/B testing versions</li>
                <li>• Performance analytics</li>
                <li>• Optimization insights</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Perfect For</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Marketing campaigns</li>
                <li>• Product launches</li>
                <li>• Newsletter content</li>
                <li>• Promotional emails</li>
              </ul>
            </div>
          </div>
        </div>

        
        {showDashboard && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {campaigns.length === 0 ? (
              <div className="text-center text-gray-500 col-span-full">
                No campaigns found.
              </div>
            ) : (
              campaigns.map((camp, index) => (
                <div
                  key={index}
                  className="bg-white shadow-md rounded-2xl p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    {camp.campaignName || 'Unnamed Campaign'}
                  </h3>
                  <p className="text-gray-600 mb-1">Email A: {camp.emailA}</p>
                  <p className="text-gray-600 mb-1">Email B: {camp.emailB}</p>
                </div>
              ))
            )}
          </div>
        )}


        {/* Tabs */}
        <div className="text-center mb-6">
          <button
            onClick={fetchCampaigns}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg font-medium transition-colors"
          >
            {isDashboardLoading ? 'Loading Campaigns...' : 'Show Existing Campaigns'}
          </button>
        </div>
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'single' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Single Email
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'bulk' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Bulk Emails
            </button>
          </div>
        </div>

        {/* Campaign Details Form */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Start Your Campaign</h2>
          <p className="text-gray-600 mb-6 text-center">Describe your email campaign and provide your {activeTab === 'single' ? 'email address' : 'CSV file'} to receive optimized content.</p>

          <div className="max-w-md mx-auto">




            {activeTab === 'single' ? (

              <div className="space-y-4">
                <textarea
                  name="campaignName"
                  value={campaignDetails.campaignName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px]"
                  placeholder="Describe your campaign: target audience, goals, product/service..."
                  style={{ height: 'auto', minHeight: '48px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />


                <input
                  type="email"
                  name="email"
                  value={campaignDetails.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  name="campaignName"
                  value={currentCampaignName}
                  onChange={handleBulkInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px]"
                  placeholder="Describe your campaign: target audience, goals, product/service..."
                  style={{ height: 'auto', minHeight: '48px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />


                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>


            )}

            <div className="text-center mt-6">
              <button
                onClick={sendToBackend}
                disabled={isLoading || isPolling ||
                  (activeTab === 'single' ? (!campaignDetails.campaignName || !campaignDetails.email) : (!currentCampaignName || !selectedFile))}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-lg px-12 py-6 rounded-2xl shadow-colored"
              >
                {isLoading ? 'Generating Content...' : isPolling ? 'Waiting for Data...' : 'Generate Email Content'}
              </button>
            </div>
          </div>
        </div>

        {/* A/B Email Body Columns - Only show after data is loaded */}
        {dataLoaded && !showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated Email Content</h2>
            <p className="text-gray-600 mb-6 text-center">Your AI-generated email versions for A/B testing</p>
            <div className="text-center mb-6">
              <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium max-w-4xl">
                <div className="font-semibold mb-1">Results for:</div>
                <div className="text-blue-700 break-words">
                  {(activeTab === 'single' ? campaignDetails.campaignName : currentCampaignName) || 'Campaign'}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Version A</h3>
                <div className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {emailBodyA}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-4">Version B</h3>
                <div className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {emailBodyB}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated Email Content</h2>
            <p className="text-gray-600 mb-6 text-center">Your AI-generated email versions for A/B testing</p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Version A</h3>
                <div className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-4">Version B</h3>
                <div className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Result Display - Only show after data is loaded */}
        {dataLoaded && !showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Performance Results</h2>
            <p className="text-gray-600 mb-6 text-center">Track your campaign performance and optimization insights</p>

            <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 min-h-[60px]">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {dynamicResult === 'Loading...' ? 'Result will be sent via email in 14 days' : dynamicResult}
              </div>
            </div>
          </div>
        )}

        {/* Performance Results Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Performance Results</h2>
            <p className="text-gray-600 mb-6 text-center">Track your campaign performance and optimization insights</p>

            <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 min-h-[60px]">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent1;
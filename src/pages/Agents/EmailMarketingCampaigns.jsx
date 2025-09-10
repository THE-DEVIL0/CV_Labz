import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const Agent1 = () => {
  // State for campaign input (single and bulk modes)
  const [campaignDetails, setCampaignDetails] = useState({
    campaignName: '',
    email: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Dashboard state
  const [campaigns, setCampaigns] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Email content and polling state
  const [emailBodyA, setEmailBodyA] = useState({ subject: 'Loading...', body: 'Loading...' });
  const [emailBodyB, setEmailBodyB] = useState({ subject: 'Loading...', body: 'Loading...' });
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [activeTab, setActiveTab] = useState('single');

  // Ref to track polling cancellation
  const pollingRef = useRef({ email: false, dashboard: false });

  const API_BASE = "https://delightful-passion-production.up.railway.app/emails";

  // Handle input changes for campaign details
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
    console.debug(`[Input Change] Updated ${name}: ${value}`);
  };

  // Handle file selection for bulk emails
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv') {
      showWebhookMessage('error', 'Please upload a valid CSV file.');
      return;
    }
    setSelectedFile(file);
    console.debug('[File Change] Selected file:', file?.name);
  };

  // Show temporary webhook message
  const showWebhookMessage = (type, text) => {
    console.log(`[Webhook Message] ${type}: ${text}`);
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  // Reset the interface
  const resetInterface = () => {
    setCampaignDetails({ campaignName: '', email: '' });
    setSelectedFile(null);
    setEmailBodyA({ subject: 'Loading...', body: 'Loading...' });
    setEmailBodyB({ subject: 'Loading...', body: 'Loading...' });
    setDataLoaded(false);
    setShowSkeleton(false);
    setIsPolling(false);
    pollingRef.current.email = false;
    console.log('[Reset Interface] Interface reset');
  };

  // Poll for email data (single or bulk)
  const pollForEmailData = async () => {
    const maxAttempts = 15; // 5 minutes (15 * 20 seconds)
    let attempts = 0;

    const checkEmailData = async () => {
      if (!pollingRef.current.email) {
        console.log('[Email Polling] Stopped due to cancellation');
        return;
      }

      try {
        if (activeTab === 'single') {
          console.debug('[Email Polling] Fetching from /emailA');
          const emailARes = await fetch(`${API_BASE}/emailA`);

          if (!emailARes.ok) {
            throw new Error(`API error - EmailA: ${emailARes.status}`);
          }

          const emailAContentType = emailARes.headers.get('content-type');
          if (!emailAContentType?.includes('application/json')) {
            throw new Error('API returned non-JSON response');
          }

          const emailAData = await emailARes.json();
          console.debug('[Email Polling] EmailA response:', emailAData);

          const emailASubject = emailAData?.length > 0 && emailAData[0]?.subject ? emailAData[0].subject : 'Email Subject';
          // Strip markdown code fences (```html ... ```) from body
          const emailABodyRaw = emailAData?.length > 0 && emailAData[0]?.body ? emailAData[0].body : '';
          const emailABody = emailABodyRaw.replace(/```html\n([\s\S]*?)\n```/, '$1');

          if (emailABody) {
            setEmailBodyA({ subject: emailASubject, body: emailABody });
            setShowSkeleton(false);
            setDataLoaded(true);
            setIsPolling(false);
            pollingRef.current.email = false;
            showWebhookMessage('success', 'Email content retrieved successfully!');
            console.log('[Email Polling] Success: Data retrieved');
            return;
          }

          attempts++;
          console.log(`[Email Polling] Attempt ${attempts}: EmailA ${emailABody ? 'has data' : 'empty'}`);
          if (attempts < maxAttempts && pollingRef.current.email) {
            setTimeout(checkEmailData, 20000);
          } else {
            setShowSkeleton(false);
            setEmailBodyA({ subject: emailASubject, body: emailABody || 'No data available after timeout.' });
            setDataLoaded(true);
            setIsPolling(false);
            pollingRef.current.email = false;
            showWebhookMessage('error', 'Timeout: No email data received after 5 minutes.');
            console.warn('[Email Polling] Timeout after 5 minutes');
          }
        } else {
          const aEndpoint = '/bulk-email-a';
          const bEndpoint = '/bulk-email-b';
          console.debug(`[Email Polling] Fetching from ${aEndpoint} and ${bEndpoint}`);

          const [emailARes, emailBRes] = await Promise.all([
            fetch(`${API_BASE}${aEndpoint}`),
            fetch(`${API_BASE}${bEndpoint}`),
          ]);

          if (!emailARes.ok || !emailBRes.ok) {
            throw new Error(`API error - EmailA: ${emailARes.status}, EmailB: ${emailBRes.status}`);
          }

          const emailAContentType = emailARes.headers.get('content-type');
          const emailBContentType = emailBRes.headers.get('content-type');
          if (!emailAContentType?.includes('application/json') || !emailBContentType?.includes('application/json')) {
            throw new Error('API returned non-JSON response');
          }

          const emailAData = await emailARes.json();
          const emailBData = await emailBRes.json();
          console.debug('[Email Polling] EmailA response:', emailAData);
          console.debug('[Email Polling] EmailB response:', emailBData);

          const emailASubject = emailAData?.length > 0 && emailAData[0]?.subject ? emailAData[0].subject : 'Email A Subject';
          const emailBSubject = emailBData?.length > 0 && emailBData[0]?.subject ? emailBData[0].subject : 'Email B Subject';
          const emailABody = emailAData?.length > 0 && emailAData[0]?.body ? emailAData[0].body.replace(/```html\n([\s\S]*?)\n```/, '$1') : '';
          const emailBBody = emailBData?.length > 0 && emailBData[0]?.body ? emailBData[0].body.replace(/```html\n([\s\S]*?)\n```/, '$1') : '';

          if (emailABody && emailBBody) {
            setEmailBodyA({ subject: emailASubject, body: emailABody });
            setEmailBodyB({ subject: emailBSubject, body: emailBBody });
            setShowSkeleton(false);
            setDataLoaded(true);
            setIsPolling(false);
            pollingRef.current.email = false;
            showWebhookMessage('success', 'Email content retrieved successfully!');
            console.log('[Email Polling] Success: Data retrieved');
            return;
          }

          attempts++;
          console.log(`[Email Polling] Attempt ${attempts}: EmailA ${emailABody ? 'has data' : 'empty'}, EmailB ${emailBBody ? 'has data' : 'empty'}`);
          if (attempts < maxAttempts && pollingRef.current.email) {
            setTimeout(checkEmailData, 20000);
          } else {
            setShowSkeleton(false);
            setEmailBodyA({ subject: emailASubject, body: emailABody || 'No data available after timeout.' });
            setEmailBodyB({ subject: emailBSubject, body: emailBBody || 'No data available after timeout.' });
            setDataLoaded(true);
            setIsPolling(false);
            pollingRef.current.email = false;
            showWebhookMessage('error', 'Timeout: Not all email data received after 5 minutes.');
            console.warn('[Email Polling] Timeout after 5 minutes');
          }
        }
      } catch (error) {
        console.error('[Email Polling] Error:', error.message);
        attempts++;
        if (attempts < maxAttempts && pollingRef.current.email) {
          setTimeout(checkEmailData, 20000);
        } else {
          setShowSkeleton(false);
          setEmailBodyA({ subject: 'Email A Subject', body: 'Error loading data.' });
          if (activeTab === 'bulk') {
            setEmailBodyB({ subject: 'Email B Subject', body: 'Error loading data.' });
          }
          setDataLoaded(true);
          setIsPolling(false);
          pollingRef.current.email = false;
          showWebhookMessage('error', 'Failed to load email data after multiple attempts.');
          console.error('[Email Polling] Failed after max attempts');
        }
      }
    };

    setIsPolling(true);
    pollingRef.current.email = true;
    checkEmailData();
  };

  // Poll for dashboard data
  const pollForDashboardData = async () => {
    const maxAttempts = 15; // 5 minutes (15 * 20 seconds)
    let attempts = 0;

    const checkDashboardData = async () => {
      if (!pollingRef.current.dashboard) {
        console.log('[Dashboard Polling] Stopped due to cancellation');
        return;
      }

      try {
        console.debug('[Dashboard Polling] Fetching from /dashboard-data');
        const response = await fetch(`${API_BASE}/dashboard-data`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`API error - Status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('API returned non-JSON response');
        }

        const data = await response.json();
        console.debug('[Dashboard Polling] Response:', data);

        if (data?.length > 0 && data[0]?.user_id) {
          setCampaigns(data);
          setShowDashboard(true);
          setIsDashboardLoading(false);
          pollingRef.current.dashboard = false;
          showWebhookMessage('success', 'Dashboard data retrieved successfully!');
          console.log('[Dashboard Polling] Success: Data retrieved');
          return;
        }

        attempts++;
        console.log(`[Dashboard Polling] Attempt ${attempts}: Data ${data?.length > 0 ? 'has data' : 'empty'}`);
        if (attempts < maxAttempts && pollingRef.current.dashboard) {
          setTimeout(checkDashboardData, 20000);
        } else {
          setCampaigns([]);
          setShowDashboard(true);
          setIsDashboardLoading(false);
          pollingRef.current.dashboard = false;
          showWebhookMessage('error', 'Timeout: No dashboard data received after 5 minutes.');
          console.warn('[Dashboard Polling] Timeout after 5 minutes');
        }
      } catch (error) {
        console.error('[Dashboard Polling] Error:', error.message);
        attempts++;
        if (attempts < maxAttempts && pollingRef.current.dashboard) {
          setTimeout(checkDashboardData, 20000);
        } else {
          setCampaigns([]);
          setShowDashboard(true);
          setIsDashboardLoading(false);
          pollingRef.current.dashboard = false;
          showWebhookMessage('error', 'Failed to load dashboard data after multiple attempts.');
          console.error('[Dashboard Polling] Failed after max attempts');
        }
      }
    };

    setIsDashboardLoading(true);
    pollingRef.current.dashboard = true;
    checkDashboardData();
  };

  // Send email campaign request to backend
  const sendToBackend = async () => {
    if (
      (activeTab === 'single' && (!campaignDetails.campaignName || !campaignDetails.email)) ||
      (activeTab === 'bulk' && (!campaignDetails.campaignName || !selectedFile))
    ) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      console.warn('[Send Request] Validation failed: Missing required fields');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setDataLoaded(false);

    try {
      let response;
      if (activeTab === 'single') {
        const payload = {
          campaignName: campaignDetails.campaignName,
          email: campaignDetails.email,
        };
        console.debug('[Send Single Email] Sending payload:', payload);
        response = await fetch(`${API_BASE}/send-single-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      } else {
        const formData = new FormData();
        formData.append('campaignName', campaignDetails.campaignName);
        formData.append('csvFile', selectedFile);
        console.debug('[Send Bulk Emails] FormData:', [...formData.entries()]);
        response = await fetch(`${API_BASE}/send-bulk-emails`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }

      if (response.ok) {
        showWebhookMessage('success', 'Request sent successfully! Waiting for email content...');
        console.log('[Send Request] Success: Starting email polling');
        pollForEmailData();
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('[Send Request] Error:', error.message);
      showWebhookMessage('error', 'Failed to send request. Please try again.');
      setShowSkeleton(false);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch existing campaigns
  const fetchCampaigns = async () => {
    setIsDashboardLoading(true);
    setShowDashboard(true);
    console.log('[Fetch Campaigns] Sending request to /dashboard-data-req');

    try {
      const response = await fetch(`${API_BASE}/dashboard-data-req`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`);
      }

      console.log('[Fetch Campaigns] Success: Starting dashboard polling');
      pollForDashboardData();
    } catch (error) {
      console.error('[Fetch Campaigns] Error:', error.message);
      showWebhookMessage('error', 'Failed to fetch campaigns. Please try again.');
      setCampaigns([]);
      setIsDashboardLoading(false);
      setShowDashboard(true);
    }
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      pollingRef.current.email = false;
      pollingRef.current.dashboard = false;
      console.log('[Cleanup] Stopped all polling');
    };
  }, []);

  return (
    <div className="px-4 md:px-14 lg:px-24 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Webhook Message */}
        {webhookMessage.show && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
              webhookMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
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

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white text-blue-700 shadow px-3 py-2 rounded-full text-xs font-semibold mb-4">
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
            Create compelling email content for single emails or A/B test versions for bulk campaigns.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your campaign details to generate optimized email content. For single emails, receive one tailored email. For bulk campaigns, get two versions for A/B testing to maximize performance and conversion rates.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">What You Get</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• AI-generated email content</li>
                <li>• A/B testing for bulk campaigns</li>
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

        {/* Dashboard Display */}
        {showDashboard && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Existing Campaigns</h2>
            {isDashboardLoading ? (
              <div className="text-center text-gray-500">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-gray-500">No campaigns found.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp, index) => (
                  <div
                    key={index}
                    className="bg-white shadow-md rounded-2xl p-6 border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">
                      {camp.campaignName || 'Unnamed Campaign'}
                    </h3>
                    <p className="text-gray-600 mb-1">Email A: {camp.emailA || 'N/A'}</p>
                    <p className="text-gray-600 mb-1">Email B: {camp.emailB || 'N/A'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs for Single/Bulk Email */}
        <div className="text-center mb-6">
          <button
            onClick={fetchCampaigns}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg font-medium transition-colors"
            disabled={isDashboardLoading}
          >
            {isDashboardLoading ? 'Loading Campaigns...' : 'Show Existing Campaigns'}
          </button>
        </div>
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'single' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Single Email
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'bulk' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Bulk Emails
            </button>
          </div>
        </div>

        {/* Campaign Details Form */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Start Your Campaign</h2>
          <p className="text-gray-600 mb-6 text-center">
            Describe your email campaign and provide your {activeTab === 'single' ? 'email address' : 'CSV file'} to receive optimized content.
          </p>
          <div className="max-w-md mx-auto">
            <div className="space-y-4">
              <textarea
                name="campaignName"
                value={campaignDetails.campaignName}
                onChange={handleInputChange}
                disabled={dataLoaded && !showSkeleton}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] disabled:bg-gray-100"
                placeholder="Describe your campaign: target audience, goals, product/service..."
                style={{ height: 'auto', minHeight: '48px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
              {activeTab === 'single' ? (
                <input
                  type="email"
                  name="email"
                  value={campaignDetails.email}
                  onChange={handleInputChange}
                  disabled={dataLoaded && !showSkeleton}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter your email address"
                />
              ) : (
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={dataLoaded && !showSkeleton}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              )}
            </div>
            <div className="text-center mt-6">
              <button
                onClick={dataLoaded && !showSkeleton ? resetInterface : sendToBackend}
                disabled={isLoading || isPolling}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-lg px-12 py-6 rounded-2xl shadow-lg"
              >
                {isLoading ? 'Generating Content...' : isPolling ? 'Waiting for Data...' : dataLoaded && !showSkeleton ? 'Start a New Campaign' : 'Generate Email Content'}
              </button>
            </div>
          </div>
        </div>

        {/* Email Content Display */}
        {dataLoaded && !showSkeleton && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated Email Content</h2>
            <p className="text-gray-600 mb-6 text-center">
              {activeTab === 'single' ? 'Your AI-generated email content' : 'Your AI-generated email versions for A/B testing'}
            </p>
            <div className="text-center mb-6">
              <div className="inline-block bg-blue-50 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium max-w-4xl">
                <div className="font-semibold mb-1">Results for:</div>
                <div className="text-blue-700 break-words">{campaignDetails.campaignName || 'Campaign'}</div>
              </div>
            </div>
            <div className={activeTab === 'single' ? 'max-w-2xl mx-auto' : 'grid md:grid-cols-2 gap-8'}>
              <div className={activeTab === 'single' ? 'border border-gray-200 rounded-xl shadow-sm overflow-hidden' : ''}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2 px-6 pt-6">{activeTab === 'single' ? 'Email Content' : 'Version A'}</h3>
                <h4 className="text-md font-medium text-gray-700 mb-4 px-6">{emailBodyA.subject}</h4>
                <div className="w-full bg-gray-50 p-6">
                  <div className="text-gray-800 leading-relaxed text-base" style={{ fontFamily: 'Arial, sans-serif' }}>
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{emailBodyA.body}</ReactMarkdown>
                    {activeTab === 'single' && (
                      <div className="mt-6 text-center">
                        <a
                          href="#"
                          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          Visit Our Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {activeTab === 'bulk' && (
                <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <h3 className="text-lg font-semibold text-green-800 mb-2 px-6 pt-6">Version B</h3>
                  <h4 className="text-md font-medium text-gray-700 mb-4 px-6">{emailBodyB.subject}</h4>
                  <div className="w-full bg-gray-50 p-6">
                    <div className="text-gray-800 leading-relaxed text-base" style={{ fontFamily: 'Arial, sans-serif' }}>
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{emailBodyB.body}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated Email Content</h2>
            <p className="text-gray-600 mb-6 text-center">
              {activeTab === 'single' ? 'Your AI-generated email content' : 'Your AI-generated email versions for A/B testing'}
            </p>
            <div className={activeTab === 'single' ? 'max-w-2xl mx-auto' : 'grid md:grid-cols-2 gap-8'}>
              <div className={activeTab === 'single' ? 'border border-gray-200 rounded-xl shadow-sm overflow-hidden' : ''}>
                <h3 className="text-lg font-semibold text-blue-800 mb-4 px-6 pt-6">{activeTab === 'single' ? 'Email Content' : 'Version A'}</h3>
                <div className="w-full bg-gray-50 p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    {activeTab === 'single' && (
                      <div className="h-10 bg-gray-200 rounded-lg mt-6 w-40 mx-auto"></div>
                    )}
                  </div>
                </div>
              </div>
              {activeTab === 'bulk' && (
                <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 px-6 pt-6">Version B</h3>
                  <div className="w-full bg-gray-50 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent1;
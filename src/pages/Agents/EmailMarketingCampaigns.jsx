import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const Agent1 = () => {
  // State for campaign input
  const [campaignDetails, setCampaignDetails] = useState({
    campaignName: '',
    email: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('single');

  // Dashboard and details state
  const [campaigns, setCampaigns] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Email content state
  const [emailBodyA, setEmailBodyA] = useState({ subject: 'Loading...', body: 'Loading...', clicks: 0 });
  const [emailBodyB, setEmailBodyB] = useState({ subject: 'Loading...', body: 'Loading...', clicks: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Ref for polling control
  const pollingRef = useRef({ email: false, dashboard: false });

  const API_BASE = "https://delightful-passion-production.up.railway.app/emails";

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
    console.debug(`[Input Change] Updated ${name}: ${value}`);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv') {
      showWebhookMessage('error', 'Please upload a valid CSV file.');
      return;
    }
    setSelectedFile(file);
    console.debug('[File Change] Selected file:', file?.name);
  };

  // Show webhook message
  const showWebhookMessage = (type, text) => {
    console.log(`[Webhook Message] ${type}: ${text}`);
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  // Reset interface
  const resetInterface = () => {
    setCampaignDetails({ campaignName: '', email: '' });
    setSelectedFile(null);
    setEmailBodyA({ subject: 'Loading...', body: 'Loading...', clicks: 0 });
    setEmailBodyB({ subject: 'Loading...', body: 'Loading...', clicks: 0 });
    setDataLoaded(false);
    setShowSkeleton(false);
    setIsPolling(false);
    setSelectedCampaign(null);
    setShowDashboard(false);
    pollingRef.current.email = false;
    console.log('[Reset Interface] Interface reset');
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showWebhookMessage('success', 'Content copied to clipboard!'))
      .catch(() => showWebhookMessage('error', 'Failed to copy content.'));
  };

  // Poll for email data
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
          const response = await fetch(`${API_BASE}/emailA`, { credentials: 'include' });
          if (!response.ok) throw new Error(`API error - EmailA: ${response.status}`);
          const data = await response.json();
          console.debug('[Email Polling] EmailA response:', data);

          if (data?.message === 'No data available') {
            attempts++;
            if (attempts < maxAttempts && pollingRef.current.email) {
              setTimeout(checkEmailData, 20000);
            } else {
              setShowSkeleton(false);
              setDataLoaded(true);
              setIsPolling(false);
              pollingRef.current.email = false;
              showWebhookMessage('error', 'Timeout: No email data received.');
            }
            return;
          }

          const email = data[0] || {};
          setEmailBodyA({
            subject: email.subject || 'Email Subject',
            body: email.body || 'No content available.',
            clicks: email.clicks || 0,
          });
          setShowSkeleton(false);
          setDataLoaded(true);
          setIsPolling(false);
          pollingRef.current.email = false;
          showWebhookMessage('success', 'Email content retrieved successfully!');
        } else {
          console.debug('[Email Polling] Fetching from /bulk-email-a and /bulk-email-b');
          const [responseA, responseB] = await Promise.all([
            fetch(`${API_BASE}/bulk-email-a`, { credentials: 'include' }),
            fetch(`${API_BASE}/bulk-email-b`, { credentials: 'include' }),
          ]);

          if (!responseA.ok || !responseB.ok) {
            throw new Error(`API error - EmailA: ${responseA.status}, EmailB: ${responseB.status}`);
          }

          const [dataA, dataB] = await Promise.all([responseA.json(), responseB.json()]);
          console.debug('[Email Polling] EmailA response:', dataA);
          console.debug('[Email Polling] EmailB response:', dataB);

          if (dataA?.message === 'No data available' || dataB?.message === 'No data available') {
            attempts++;
            if (attempts < maxAttempts && pollingRef.current.email) {
              setTimeout(checkEmailData, 20000);
            } else {
              setShowSkeleton(false);
              setDataLoaded(true);
              setIsPolling(false);
              pollingRef.current.email = false;
              showWebhookMessage('error', 'Timeout: Not all email data received.');
            }
            return;
          }

          setEmailBodyA({
            subject: dataA[0]?.Subject || 'Email A Subject',
            body: dataA[0]?.Body || 'No content available.',
            clicks: dataA[0]?.clicks || 0,
          });
          setEmailBodyB({
            subject: dataB[0]?.Subject || 'Email B Subject',
            body: dataB[0]?.Body || 'No content available.',
            clicks: dataB[0]?.clicks || 0,
          });
          setShowSkeleton(false);
          setDataLoaded(true);
          setIsPolling(false);
          pollingRef.current.email = false;
          showWebhookMessage('success', 'Email content retrieved successfully!');
        }
      } catch (error) {
        console.error('[Email Polling] Error:', error.message);
        attempts++;
        if (attempts < maxAttempts && pollingRef.current.email) {
          setTimeout(checkEmailData, 20000);
        } else {
          setShowSkeleton(false);
          setEmailBodyA({ subject: 'Email A Subject', body: 'Error loading data.', clicks: 0 });
          if (activeTab === 'bulk') {
            setEmailBodyB({ subject: 'Email B Subject', body: 'Error loading data.', clicks: 0 });
          }
          setDataLoaded(true);
          setIsPolling(false);
          pollingRef.current.email = false;
          showWebhookMessage('error', 'Failed to load email data.');
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
        const response = await fetch(`${API_BASE}/dashboard-data`, { credentials: 'include' });
        if (!response.ok) throw new Error(`API error - Status: ${response.status}`);
        const data = await response.json();
        console.debug('[Dashboard Polling] Response:', data);

        if (data?.message === 'Waiting for all dashboard data to be collected') {
          attempts++;
          if (attempts < maxAttempts && pollingRef.current.dashboard) {
            setTimeout(checkDashboardData, 20000);
          } else {
            setCampaigns([]);
            setShowDashboard(true);
            setIsDashboardLoading(false);
            pollingRef.current.dashboard = false;
            showWebhookMessage('error', 'Timeout: No dashboard data received.');
          }
          return;
        }

        // Validate campaign data
        const validCampaigns = data.filter(camp =>
          camp &&
          typeof camp === 'object' &&
          camp.version &&
          camp.campaignkey &&
          camp.campaign &&
          camp.subject
        );

        if (validCampaigns.length > 0) {
          setCampaigns(validCampaigns);
          setShowDashboard(true);
          setIsDashboardLoading(false);
          pollingRef.current.dashboard = false;
          showWebhookMessage('success', 'Dashboard data retrieved successfully!');
        } else {
          attempts++;
          if (attempts < maxAttempts && pollingRef.current.dashboard) {
            setTimeout(checkDashboardData, 20000);
          } else {
            setCampaigns([]);
            setShowDashboard(true);
            setIsDashboardLoading(false);
            pollingRef.current.dashboard = false;
            showWebhookMessage('error', 'Timeout: No valid dashboard data received.');
          }
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
          showWebhookMessage('error', 'Failed to load dashboard data.');
        }
      }
    };

    setIsDashboardLoading(true);
    pollingRef.current.dashboard = true;
    checkDashboardData();
  };

  // Send email campaign request
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
        response = await fetch(`${API_BASE}/send-bulk-emails`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }

      if (response.ok) {
        showWebhookMessage('success', 'Request sent successfully! Waiting for email content...');
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

  // Fetch campaigns
  const fetchCampaigns = async () => {
    setIsDashboardLoading(true);
    setShowDashboard(true);
    try {
      const response = await fetch(`${API_BASE}/dashboard-data-req`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to fetch campaigns: ${response.status}`);
      pollForDashboardData();
    } catch (error) {
      console.error('[Fetch Campaigns] Error:', error.message);
      showWebhookMessage('error', 'Failed to fetch campaigns. Please try again.');
      setCampaigns([]);
      setIsDashboardLoading(false);
      setShowDashboard(true);
    }
  };

  // Group campaigns by campaignkey
  const groupCampaigns = (campaigns) => {
    const grouped = {};
    campaigns.forEach((camp) => {
      // Skip invalid campaign objects
      if (!camp || !camp.campaignkey || !camp.campaign || !camp.version || !camp.subject) {
        console.warn('[Group Campaigns] Skipping invalid campaign:', camp);
        return;
      }
      const key = camp.campaignkey;
      if (!grouped[key]) {
        grouped[key] = {
          campaignName: camp.campaign,
          versions: [],
          isSingle: camp.version === 'single',
        };
      }
      grouped[key].versions.push(camp);
    });
    return Object.values(grouped).filter(group => group.versions.length > 0).map((group) => ({
      ...group,
      winner: group.isSingle ? null : group.versions.reduce((prev, curr) => (prev.clicks || 0) > (curr.clicks || 0) ? prev : curr, {}),
    }));
  };

  // Get subject preview (truncate to 50 chars)
  const getSubjectPreview = (subject) => {
    if (!subject) return 'No Subject';
    return subject.length > 50 ? `${subject.slice(0, 47)}...` : subject;
  };

  // Get body preview (strip HTML and truncate to 100 chars)
  const getBodyPreview = (body) => {
    if (!body) return 'No Content';
    const text = body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > 100 ? `${text.slice(0, 97)}...` : text;
  };

  // Cleanup polling
  useEffect(() => {
    return () => {
      pollingRef.current.email = false;
      pollingRef.current.dashboard = false;
      console.log('[Cleanup] Stopped all polling');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Webhook Message */}
        {webhookMessage.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
            webhookMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white text-blue-700 shadow px-3 py-2 rounded-full text-xs font-semibold mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Email Marketing Campaigns
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Email Expert
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your email marketing with AI-powered campaign optimization.
          </p>
        </div>

        {/* Campaign Dashboard */}
        {showDashboard && !selectedCampaign && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Campaigns Dashboard</h2>
              <button
                onClick={resetInterface}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Campaign
              </button>
            </div>
            {isDashboardLoading ? (
              <div className="text-center text-gray-500">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-gray-500">No campaigns found.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupCampaigns(campaigns).map((group, index) => (
                  <div key={index} className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{group.campaignName || 'Unnamed Campaign'}</h3>
                    {group.isSingle ? (
                      group.versions[0] ? (
                        <>
                          <p className="text-gray-600 mb-1">Subject: {getSubjectPreview(group.versions[0].subject)}</p>
                          <p className="text-gray-600 mb-4">Clicks: {group.versions[0].clicks || 0}</p>
                        </>
                      ) : (
                        <p className="text-gray-600 mb-4">No data available</p>
                      )
                    ) : (
                      <>
                        <p className="text-gray-600 mb-1">Winner: Version {group.winner?.version || 'N/A'}</p>
                        <p className="text-gray-600 mb-4">
                          Clicks: A ({group.versions.find(v => v.version === 'A')?.clicks || 0}) vs B ({group.versions.find(v => v.version === 'B')?.clicks || 0})
                        </p>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedCampaign(group)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Show Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campaign Details View */}
        {showDashboard && selectedCampaign && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">{selectedCampaign.campaignName || 'Unnamed Campaign'}</h2>
              <div className="space-x-4">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={resetInterface}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Campaign
                </button>
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-lg font-semibold text-green-600">
                {selectedCampaign.isSingle
                  ? 'Single Campaign (No A/B Comparison)'
                  : `Winner: Version ${selectedCampaign.winner?.version || 'N/A'}`}
              </p>
            </div>
            {selectedCampaign.versions.length > 0 ? (
              <div className={selectedCampaign.isSingle ? 'max-w-2xl mx-auto' : 'grid md:grid-cols-2 gap-8'}>
                {selectedCampaign.isSingle ? (
                  <div className="border border-gray-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Single Campaign</h3>
                    <p className="text-gray-600 mb-2"><strong>Subject:</strong> {selectedCampaign.versions[0]?.subject || 'No Subject'}</p>
                    <div className="bg-gray-50 p-6 rounded-lg mb-4 prose prose-sm max-w-none">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{selectedCampaign.versions[0]?.body || 'No Content'}</ReactMarkdown>
                    </div>
                    <p className="text-gray-600 mb-4">Clicks: {selectedCampaign.versions[0]?.clicks || 0}</p>
                    <button
                      onClick={() => copyToClipboard(selectedCampaign.versions[0]?.body || '')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy Content
                    </button>
                  </div>
                ) : (
                  ['A', 'B'].map((version) => {
                    const data = selectedCampaign.versions.find(v => v.version === version);
                    if (!data) return null;
                    return (
                      <div key={version} className="border border-gray-200 rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Version {version}</h3>
                        <p className="text-gray-600 mb-2"><strong>Subject:</strong> {data.subject || 'No Subject'}</p>
                        <div className="bg-gray-50 p-6 rounded-lg mb-4 prose prose-sm max-w-none">
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{data.body || 'No Content'}</ReactMarkdown>
                        </div>
                        <p className="text-gray-600 mb-4">Clicks: {data.clicks || 0}</p>
                        <button
                          onClick={() => copyToClipboard(data.body || '')}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Copy Content
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">No data available for this campaign.</div>
            )}
          </div>
        )}

        {/* Campaign Input Form */}
        {!showDashboard && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Start Your Campaign</h2>
            <div className="flex justify-center mb-6">
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
              <div className="text-center mt-6 space-x-4">
                <button
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  disabled={isDashboardLoading}
                >
                  {isDashboardLoading ? 'Loading Campaigns...' : 'Show Campaigns'}
                </button>
                <button
                  onClick={dataLoaded && !showSkeleton ? resetInterface : sendToBackend}
                  disabled={isLoading || isPolling}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Generating...' : isPolling ? 'Waiting for Data...' : dataLoaded && !showSkeleton ? 'Start New Campaign' : 'Generate Email Content'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Email Content */}
        {dataLoaded && !showSkeleton && !showDashboard && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated Email Content</h2>
            <div className="text-center mb-6">
              <div className="inline-block bg-blue-50 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium">
                <div className="font-semibold mb-1">Results for:</div>
                <div className="text-blue-700">{campaignDetails.campaignName || 'Campaign'}</div>
              </div>
            </div>
            <div className={activeTab === 'single' ? 'max-w-2xl mx-auto' : 'grid md:grid-cols-2 gap-8'}>
              <div className="border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">{activeTab === 'single' ? 'Email Content' : 'Version A'}</h3>
                <p className="text-gray-600 mb-2"><strong>Subject:</strong> {getSubjectPreview(emailBodyA.subject)}</p>
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{getBodyPreview(emailBodyA.body)}</ReactMarkdown>
                </div>
                <p className="text-gray-600 mb-4">Clicks: {emailBodyA.clicks || 0}</p>
                <button
                  onClick={() => copyToClipboard(emailBodyA.body)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Content
                </button>
              </div>
              {activeTab === 'bulk' && (
                <div className="border border-gray-200 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Version B</h3>
                  <p className="text-gray-600 mb-2"><strong>Subject:</strong> {getSubjectPreview(emailBodyB.subject)}</p>
                  <div className="bg-gray-50 p-6 rounded-lg mb-4">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{getBodyPreview(emailBodyB.body)}</ReactMarkdown>
                  </div>
                  <p className="text-gray-600 mb-4">Clicks: {emailBodyB.clicks || 0}</p>
                  <button
                    onClick={() => copyToClipboard(emailBodyB.body)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy Content
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated Email Content</h2>
            <div className={activeTab === 'single' ? 'max-w-2xl mx-auto' : 'grid md:grid-cols-2 gap-8'}>
              <div className="border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">{activeTab === 'single' ? 'Email Content' : 'Version A'}</h3>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
                </div>
              </div>
              {activeTab === 'bulk' && (
                <div className="border border-gray-200 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Version B</h3>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-4/5"></div>
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
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactHtmlParser from 'html-react-parser';

const Agent1 = () => {
  const [emailType, setEmailType] = useState(null); // null, 'text', or 'template'
  const navigate = useNavigate();

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
  // Email content state (editable)
  const [emailA, setEmailA] = useState({ subject: '', body: '', htmlBody: '', clicks: 0 });
  const [emailB, setEmailB] = useState({ subject: '', body: '', htmlBody: '', clicks: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  // State for success screen
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  // Ref for polling control
  const pollingRef = useRef({ email: false, dashboard: false });
  const API_BASE = "https://delightful-passion-production.up.railway.app/emails";

  // Handle email type selection
  const handleEmailTypeChange = (type) => {
    setEmailType(type);
    if (type === 'template') {
      navigate('/template-email');
    }
    console.debug(`[Email Type Change] Selected ${type}`);
  };

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
    setEmailA({ subject: '', body: '', htmlBody: '', clicks: 0 });
    setEmailB({ subject: '', body: '', htmlBody: '', clicks: 0 });
    setDataLoaded(false);
    setShowSkeleton(false);
    setIsPolling(false);
    setSelectedCampaign(null);
    setShowDashboard(false);
    setShowSuccessScreen(false);
    setEmailType(null);
    pollingRef.current.email = false;
    console.log('[Reset Interface] Interface reset to email type selection');
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showWebhookMessage('success', 'Content copied to clipboard!'))
      .catch(() => showWebhookMessage('error', 'Failed to copy content.'));
  };

  // Handle tab change with reset
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setCampaignDetails({ campaignName: '', email: '' });
      setSelectedFile(null);
      setEmailA({ subject: '', body: '', htmlBody: '', clicks: 0 });
      setEmailB({ subject: '', body: '', htmlBody: '', clicks: 0 });
      setDataLoaded(false);
      setShowSkeleton(false);
      setIsPolling(false);
      console.debug(`[Tab Change] Switched to ${tab} tab with UI reset`);
    }
  };

  // Replace placeholders in HTML content
  const replacePlaceholders = (html) => {
    if (!html || typeof html !== 'string') return 'No content available.';
    return html.replace(/\[Recipient's Name\]/g, 'Customer');
  };

  // Convert HTML to plain text for editing, preserving paragraph breaks
  const htmlToPlainText = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p, div')).map(p => p.textContent.trim()).filter(text => text);
    return paragraphs.join('\n\n');
  };

  // Update HTML content with new plain text
  const updateHtmlWithPlainText = (html, newPlainText) => {
    if (!html || !newPlainText) return html || '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const paragraphs = newPlainText.split('\n\n').filter(p => p.trim());
    body.innerHTML = '';
    paragraphs.forEach((para, index) => {
      const p = doc.createElement('p');
      p.textContent = para.trim();
      if (html.includes('<a') && para.includes('yourinterviewguide.com')) {
        p.innerHTML = para.replace(
          'yourinterviewguide.com',
          '<a href="https://www.yourinterviewguide.com">yourinterviewguide.com</a>'
        );
      }
      body.appendChild(p);
      if (index < paragraphs.length - 1) {
        body.appendChild(doc.createElement('br'));
      }
    });
    return body.innerHTML;
  };

  // Handle email content changes
  const handleEmailChange = (version, field, value) => {
    if (version === 'A') {
      setEmailA((prev) => {
        if (field === 'body') {
          return {
            ...prev,
            body: value,
            htmlBody: updateHtmlWithPlainText(prev.htmlBody, value),
          };
        }
        return { ...prev, [field]: value };
      });
    } else {
      setEmailB((prev) => {
        if (field === 'body') {
          return {
            ...prev,
            body: value,
            htmlBody: updateHtmlWithPlainText(prev.htmlBody, value),
          };
        }
        return { ...prev, [field]: value };
      });
    }
  };

  // Poll for email data
  const pollForEmailData = async () => {
    const maxAttempts = 15;
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
              setTimeout(checkEmailData, 10000);
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
          const cleanBody = email.body?.replace(/```html\n|\n```/g, '') || 'No content available.';
          setEmailA({
            subject: email.subject || 'No Subject',
            body: htmlToPlainText(cleanBody),
            htmlBody: cleanBody,
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
              setTimeout(checkEmailData, 10000);
            } else {
              setShowSkeleton(false);
              setDataLoaded(true);
              setIsPolling(false);
              pollingRef.current.email = false;
              showWebhookMessage('error', 'Timeout: Not all email data received.');
            }
            return;
          }
          const emailAData = dataA[0]?.['email-a'] || {};
          const emailBData = dataB[0]?.['email-b'] || {};
          const cleanBodyA = emailAData.body?.replace(/```html\n|\n```/g, '') || 'No content available.';
          const cleanBodyB = emailBData.body?.replace(/```html\n|\n```/g, '') || 'No content available.';
          setEmailA({
            subject: emailAData.subject || 'No Subject',
            body: htmlToPlainText(cleanBodyA),
            htmlBody: cleanBodyA,
            clicks: emailAData.clicks || 0,
          });
          setEmailB({
            subject: emailBData.subject || 'No Subject',
            body: htmlToPlainText(cleanBodyB),
            htmlBody: cleanBodyB,
            clicks: emailBData.clicks || 0,
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
          setTimeout(checkEmailData, 10000);
        } else {
          setShowSkeleton(false);
          setEmailA({ subject: 'No Subject', body: 'Error loading data.', htmlBody: 'Error loading data.', clicks: 0 });
          if (activeTab === 'bulk') {
            setEmailB({ subject: 'No Subject', body: 'Error loading data.', htmlBody: 'Error loading data.', clicks: 0 });
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
    const maxAttempts = 15;
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
        if (data?.message === 'No data available') {
          attempts++;
          if (attempts < maxAttempts && pollingRef.current.dashboard) {
            setTimeout(checkDashboardData, 10000);
          } else {
            setCampaigns([]);
            setShowDashboard(true);
            setIsDashboardLoading(false);
            pollingRef.current.dashboard = false;
            showWebhookMessage('error', 'Timeout: No dashboard data received.');
          }
          return;
        }
        // Process single_emails and bulk_campaigns
        const validCampaigns = [];
        data.forEach(item => {
          if (item.single_emails) {
            item.single_emails.forEach(email => {
              validCampaigns.push({
                type: 'single_email',
                campaignkey: email.campaignkey,
                campaign: email.campaign,
                subject: email.subject,
                body: email.body,
                clicks: email.clicks || 0,
                userId: email.userId,
              });
            });
          }
          if (item.bulk_campaigns) {
            item.bulk_campaigns.forEach(campaign => {
              campaign.versions.forEach(version => {
                validCampaigns.push({
                  type: 'bulk_campaign',
                  campaignkey: campaign.campaignkey,
                  campaign: campaign.campaign,
                  version: version.version,
                  subject: version.subject,
                  body: version.body,
                  clicks: version.clicks || 0,
                  userId: campaign.userId,
                });
              });
            });
          }
        });
        if (validCampaigns.length > 0) {
          setCampaigns(validCampaigns);
          setShowDashboard(true);
          setIsDashboardLoading(false);
          pollingRef.current.dashboard = false;
          showWebhookMessage('success', 'Dashboard data retrieved successfully!');
        } else {
          attempts++;
          if (attempts < maxAttempts && pollingRef.current.dashboard) {
            setTimeout(checkDashboardData, 10000);
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
          setTimeout(checkDashboardData, 10000);
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

  // Send generate email request
  const generateEmails = async () => {
    if (!campaignDetails.campaignName || (activeTab === 'single' && !campaignDetails.email) || (activeTab === 'bulk' && !selectedFile)) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      console.warn('[Generate Request] Validation failed: Missing required fields');
      return;
    }
    setIsLoading(true);
    setShowSkeleton(true);
    setDataLoaded(false);
    try {
      let response;
      const payload = {
        campaignName: campaignDetails.campaignName,
      };
      if (activeTab === 'single') {
        response = await fetch(`${API_BASE}/generate-single-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      } else {
        response = await fetch(`${API_BASE}/generate-bulk-emails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
      console.error('[Generate Request] Error:', error.message);
      showWebhookMessage('error', 'Failed to send request. Please try again.');
      setShowSkeleton(false);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Send final emails after editing
  const sendFinalEmails = async () => {
    if (activeTab === 'single' && (!emailA.subject || !emailA.htmlBody)) {
      showWebhookMessage('error', 'Please finalize the email content.');
      return;
    }
    if (activeTab === 'bulk' && (!emailA.subject || !emailA.htmlBody || !emailB.subject || !emailB.htmlBody)) {
      showWebhookMessage('error', 'Please finalize both email versions.');
      return;
    }
    setIsLoading(true);
    try {
      let response;
      if (activeTab === 'single') {
        const payload = {
          campaignName: campaignDetails.campaignName,
          email: campaignDetails.email,
          subject: emailA.subject,
          body: emailA.htmlBody,
        };
        response = await fetch(`${API_BASE}/send-single-final`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      } else {
        const formData = new FormData();
        formData.append('campaignName', campaignDetails.campaignName);
        formData.append('csvFile', selectedFile);
        formData.append('subjectA', emailA.subject);
        formData.append('bodyA', emailA.htmlBody);
        formData.append('subjectB', emailB.subject);
        formData.append('bodyB', emailB.htmlBody);
        response = await fetch(`${API_BASE}/send-bulk-final`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }
      if (response.ok) {
        showWebhookMessage('success', activeTab === 'single' ? 'Email has been sent!' : 'Emails have been sent to the recipients in the CSV!');
        setShowSuccessScreen(true);
      } else {
        throw new Error(`Send failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('[Send Final] Error:', error.message);
      showWebhookMessage('error', 'Failed to send emails. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch campaigns
  const fetchCampaigns = async () => {
    setIsDashboardLoading(true);
    setShowDashboard(true);
    setShowSuccessScreen(false);
    try {
      const response = await fetch(`${API_BASE}/dashboard-data-req`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Fetch campaigns failed: ${response.status}`);
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
      if (!camp || !camp.campaignkey || !camp.campaign) {
        console.warn('[Group Campaigns] Skipping invalid campaign:', camp);
        return;
      }
      const key = camp.campaignkey;
      if (!grouped[key]) {
        grouped[key] = {
          campaignName: camp.campaign,
          versions: [],
          isSingle: camp.type === 'single_email',
        };
      }
      grouped[key].versions.push(camp);
    });
    return Object.values(grouped).filter(group => group.versions.length > 0).map((group) => ({
      ...group,
      winner: group.isSingle ? null : group.versions.reduce((prev, curr) => (prev.clicks || 0) > (curr.clicks || 0) ? prev : curr, group.versions[0]),
    }));
  };

  // Get subject preview
  const getSubjectPreview = (subject) => {
    if (!subject) return 'No Subject';
    return subject.length > 50 ? `${subject.slice(0, 47)}...` : subject;
  };

  // Get body preview
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

        {/* Email Type Selection */}
        {!emailType && !showDashboard && !showSuccessScreen && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Choose Your Email Campaign Type</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Text Email Card */}
              <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Text Email</h3>
                <p className="text-gray-600 mb-6">
                  Create and customize your own email content with full control over the message.
                </p>
                <ul className="text-gray-600 mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Write custom email subject and body
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    A/B testing for bulk campaigns
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Track clicks and performance
                  </li>
                </ul>
                <button
                  onClick={() => handleEmailTypeChange('text')}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Text Email Campaign
                </button>
              </div>

              {/* Template Email Card */}
              <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Template Email</h3>
                <p className="text-gray-600 mb-6">
                  Use AI-generated HTML email templates for professional, ready-to-send campaigns.
                </p>
                <ul className="text-gray-600 mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Crafted professional templates
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Send to single or bulk recipients
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Monitor campaign performance
                  </li>
                </ul>
                <button
                  onClick={() => handleEmailTypeChange('template')}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start Template Email Campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Screen */}
        {showSuccessScreen && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {activeTab === 'single' ? 'Email Sent Successfully!' : 'Emails Sent Successfully!'}
              </h2>
              <p className="text-gray-600 mb-6">
                {activeTab === 'single' ? 'Your email has been sent.' : 'Your emails have been sent to the recipients in the CSV.'}
              </p>
              <div className="space-x-4">
                <button
                  onClick={resetInterface}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Campaign
                </button>
                <button
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Existing Campaigns
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Dashboard */}
        {showDashboard && !selectedCampaign && !showSuccessScreen && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Campaigns Dashboard</h2>
              <div className="space-x-4">
                <button
                  onClick={resetInterface}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Campaign
                </button>
                <button
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Refresh Campaigns
                </button>
              </div>
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
        {showDashboard && selectedCampaign && !showSuccessScreen && (
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
                  <div className="border border-gray-200 rounded-xl shadow-sm p-6 bg-gradient-to-br from-blue-50 to-white">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Single Campaign</h3>
                    <p className="text-gray-700 mb-2 font-medium break-words"><strong>Subject:</strong> {selectedCampaign.versions[0]?.subject || 'No Subject'}</p>
                    <div className="bg-white p-6 rounded-lg mb-4 prose prose-sm max-w-none max-h-96 overflow-y-auto shadow-inner border border-gray-100">
                      {ReactHtmlParser(replacePlaceholders(selectedCampaign.versions[0]?.body || 'No Content'))}
                    </div>
                    <p className="text-gray-600 mb-4">Clicks: {selectedCampaign.versions[0]?.clicks || 0}</p>
                    <button
                      onClick={() => copyToClipboard(htmlToPlainText(selectedCampaign.versions[0]?.body || ''))}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Copy Content
                    </button>
                  </div>
                ) : (
                  ['A', 'B'].map((version) => {
                    const data = selectedCampaign.versions.find(v => v.version === version);
                    if (!data) return null;
                    return (
                      <div key={version} className="border border-gray-200 rounded-xl shadow-sm p-6 bg-gradient-to-br from-blue-50 to-white">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Version {version}</h3>
                        <p className="text-gray-700 mb-2 font-medium break-words"><strong>Subject:</strong> {data.subject || 'No Subject'}</p>
                        <div className="bg-white p-6 rounded-lg mb-4 prose prose-sm max-w-none max-h-96 overflow-y-auto shadow-inner border border-gray-100">
                          {ReactHtmlParser(replacePlaceholders(data.body || 'No Content'))}
                        </div>
                        <p className="text-gray-600 mb-4">Clicks: {data.clicks || 0}</p>
                        <button
                          onClick={() => copyToClipboard(htmlToPlainText(data.body || ''))}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        {emailType === 'text' && !showDashboard && !showSuccessScreen && !dataLoaded && !showSkeleton && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Start Your Text Email Campaign</h2>
              <div className="space-x-4">
                <button
                  onClick={resetInterface}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Campaign
                </button>
                <button
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Existing Campaigns
                </button>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
                <button
                  onClick={() => handleTabChange('single')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'single' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Single Email
                </button>
                <button
                  onClick={() => handleTabChange('bulk')}
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
                <div>
                  <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700">
                    Campaign Description
                  </label>
                  <textarea
                    name="campaignName"
                    id="campaignName"
                    value={campaignDetails.campaignName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px]"
                    placeholder="Describe your campaign: target audience, goals, product/service..."
                    style={{ height: 'auto', minHeight: '48px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                </div>
                {activeTab === 'single' ? (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={campaignDetails.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter recipient's email"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      name="csvFile"
                      id="csvFile"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {selectedFile && <p className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name}</p>}
                  </div>
                )}
              </div>
              <div className="text-center mt-6">
                <button
                  onClick={generateEmails}
                  disabled={isLoading || isPolling}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Generating...' : isPolling ? 'Waiting for Data...' : 'Generate Email Content'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Email Content (Editable) */}
        {emailType === 'text' && dataLoaded && !showSkeleton && !showDashboard && !showSuccessScreen && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Finalize Text Email Content</h2>
              <div className="space-x-4">
                <button
                  onClick={resetInterface}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Campaign
                </button>
                <button
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Existing Campaigns
                </button>
              </div>
            </div>
            <div className="text-center mb-6">
              <div className="inline-block bg-blue-50 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium">
                <div className="font-semibold mb-1">Results for:</div>
                <div className="text-blue-700">{campaignDetails.campaignName || 'Campaign'}</div>
              </div>
            </div>
            <div className={activeTab === 'single' ? 'max-w-2xl mx-auto' : 'grid md:grid-cols-2 gap-8'}>
              <div className="border border-gray-200 rounded-xl shadow-sm p-6 bg-gradient-to-br from-blue-50 to-white">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">{activeTab === 'single' ? 'Email Content' : 'Version A'}</h3>
                <div className="mb-2">
                  <label className="text-gray-700 font-medium">Subject:</label>
                  <input
                    type="text"
                    value={emailA.subject}
                    onChange={(e) => handleEmailChange('A', 'subject', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-gray-700 font-medium">Body:</label>
                  <textarea
                    value={emailA.body}
                    onChange={(e) => handleEmailChange('A', 'body', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-64"
                    placeholder="Enter email content"
                  />
                </div>
                <button
                  onClick={() => copyToClipboard(emailA.body)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-2"
                >
                  Copy Content
                </button>
              </div>
              {activeTab === 'bulk' && (
                <div className="border border-gray-200 rounded-xl shadow-sm p-6 bg-gradient-to-br from-green-50 to-white">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Version B</h3>
                  <div className="mb-2">
                    <label className="text-gray-700 font-medium">Subject:</label>
                    <input
                      type="text"
                      value={emailB.subject}
                      onChange={(e) => handleEmailChange('B', 'subject', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-gray-700 font-medium">Body:</label>
                    <textarea
                      value={emailB.body}
                      onChange={(e) => handleEmailChange('B', 'body', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-64"
                      placeholder="Enter email content"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(emailB.body)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-2"
                  >
                    Copy Content
                  </button>
                </div>
              )}
            </div>
            <div className="text-center mt-6">
              <button
                onClick={sendFinalEmails}
                disabled={isLoading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Sending...' : activeTab === 'single' ? 'Send Email' : 'Send Emails'}
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {emailType === 'text' && showSkeleton && !showSuccessScreen && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Generated Text Email Content</h2>
              <div className="space-x-4">
                <button
                  onClick={resetInterface}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Campaign
                </button>
                <button
                  onClick={fetchCampaigns}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Existing Campaigns
                </button>
              </div>
            </div>
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
import React, { useState } from 'react';

const EngagementBot = () => {
  const [platformSettings, setPlatformSettings] = useState({
    linkedin: {
      enabled: false,
      companyPage: '',
      targetAudience: '',
      engagementType: 'comments'
    },
    tiktok: {
      enabled: false,
      username: '',
      targetHashtags: '',
      engagementType: 'likes'
    },
    instagram: {
      enabled: false,
      username: '',
      targetHashtags: '',
      engagementType: 'comments'
    },
    youtube: {
      enabled: false,
      channelName: '',
      targetKeywords: '',
      engagementType: 'likes'
    }
  });
  
  const [botState, setBotState] = useState('idle'); // idle, configuring, running, completed
  const [engagementStats, setEngagementStats] = useState({
    totalEngagements: 0,
    linkedinEngagements: 0,
    tiktokEngagements: 0,
    instagramEngagements: 0,
    youtubeEngagements: 0,
    lastActivity: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [engagementHistory, setEngagementHistory] = useState([]);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const handlePlatformToggle = (platform) => {
    setPlatformSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        enabled: !prev[platform].enabled
      }
    }));
  };

  const handlePlatformInputChange = (platform, field, value) => {
    setPlatformSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const pollForEngagementData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkEngagementData = async () => {
      if (!isPollingActive) return;
      
      try {
        const engagementRes = await fetch(`${API_BASE}/engagement-bot`);
        
        if (!engagementRes.ok) {
          console.error('API Error - Engagement status:', engagementRes.status);
          throw new Error(`API returned status ${engagementRes.status}`);
        }
        
        const engagementContentType = engagementRes.headers.get('content-type');
        
        if (!engagementContentType?.includes('application/json')) {
          console.error('Invalid content type - Engagement:', engagementContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const engagementData = await engagementRes.json();
        
        console.log('Engagement response:', engagementData);
        
        if (engagementData && engagementData.stats) {
          setEngagementStats(engagementData.stats);
          setBotState('running');
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Engagement bot started successfully!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for engagement data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkEngagementData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for engagement data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkEngagementData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve engagement data.');
        }
      }
    };
    
    checkEngagementData();
  };

  const startEngagementBot = async () => {
    const enabledPlatforms = Object.keys(platformSettings).filter(
      platform => platformSettings[platform].enabled
    );

    if (enabledPlatforms.length === 0) {
      showWebhookMessage('error', 'Please enable at least one platform.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setBotState('configuring');
    setEngagementStats({
      totalEngagements: 0,
      linkedinEngagements: 0,
      tiktokEngagements: 0,
      instagramEngagements: 0,
      youtubeEngagements: 0,
      lastActivity: null
    });
    setEngagementHistory([]);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/engagement-bot-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: platformSettings,
          enabledPlatforms: enabledPlatforms
        }),
      });

      if (response.ok) {
        showWebhookMessage('success', 'Engagement bot setup successfully! Starting bot...');
        setIsLoading(false);
        setIsPolling(true);
        pollForEngagementData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error starting engagement bot:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      setBotState('idle');
      showWebhookMessage('error', 'Failed to start engagement bot. Please try again.');
    }
  };

  const stopEngagementBot = () => {
    setBotState('completed');
    showWebhookMessage('success', 'Engagement bot stopped successfully!');
  };

  const addEngagementActivity = (platform, action, target) => {
    const newActivity = {
      platform,
      action,
      target,
      timestamp: new Date().toLocaleTimeString()
    };
    setEngagementHistory(prev => [...prev, newActivity]);
    
    setEngagementStats(prev => ({
      ...prev,
      totalEngagements: prev.totalEngagements + 1,
      [`${platform}Engagements`]: prev[`${platform}Engagements`] + 1,
      lastActivity: new Date().toLocaleTimeString()
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 md:px-8 lg:px-12 py-8">
        {/* Webhook Message */}
        {webhookMessage.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            webhookMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {webhookMessage.text}
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
              className="lucide lucide-share-2 h-4 w-4"
            >
              <polyline points="8 17 12 21 16 17"/>
              <line x1="12" x2="12" y1="3" y2="21"/>
              <path d="M20 21v-7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v7"/>
            </svg>
            Engagement Bot
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Social Media Engagement Bot
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Automate your social media engagement across LinkedIn, TikTok, Instagram, and YouTube. 
            Boost your online presence with intelligent, targeted interactions.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI-powered engagement bot intelligently interacts with your target audience across multiple platforms. 
            It analyzes content, identifies relevant posts, and engages authentically to boost your social media presence.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">What It Does</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Intelligent content analysis</li>
                <li>• Targeted engagement</li>
                <li>• Multi-platform support</li>
                <li>• Authentic interactions</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Platforms Supported</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• LinkedIn - Professional networking</li>
                <li>• TikTok - Viral content engagement</li>
                <li>• Instagram - Visual content interaction</li>
                <li>• YouTube - Video content engagement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Platform Configuration - Only show when idle */}
        {botState === 'idle' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Configure Your Platforms</h2>
            <p className="text-gray-600 mb-6 text-center">Select and configure the platforms you want to engage with</p>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {/* LinkedIn Configuration */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">LinkedIn</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.linkedin.enabled}
                      onChange={() => handlePlatformToggle('linkedin')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {platformSettings.linkedin.enabled && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Company Page</label>
                      <input
                        type="text"
                        value={platformSettings.linkedin.companyPage}
                        onChange={(e) => handlePlatformInputChange('linkedin', 'companyPage', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your LinkedIn company page"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Target Audience</label>
                      <input
                        type="text"
                        value={platformSettings.linkedin.targetAudience}
                        onChange={(e) => handlePlatformInputChange('linkedin', 'targetAudience', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Software Engineers, Marketing Managers"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Engagement Type</label>
                      <select
                        value={platformSettings.linkedin.engagementType}
                        onChange={(e) => handlePlatformInputChange('linkedin', 'engagementType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="comments">Comments</option>
                        <option value="likes">Likes</option>
                        <option value="shares">Shares</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* TikTok Configuration */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.7-1.35 3.83-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">TikTok</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.tiktok.enabled}
                      onChange={() => handlePlatformToggle('tiktok')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {platformSettings.tiktok.enabled && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={platformSettings.tiktok.username}
                        onChange={(e) => handlePlatformInputChange('tiktok', 'username', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your TikTok username"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Target Hashtags</label>
                      <input
                        type="text"
                        value={platformSettings.tiktok.targetHashtags}
                        onChange={(e) => handlePlatformInputChange('tiktok', 'targetHashtags', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., #tech, #business, #innovation"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Engagement Type</label>
                      <select
                        value={platformSettings.tiktok.engagementType}
                        onChange={(e) => handlePlatformInputChange('tiktok', 'engagementType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="likes">Likes</option>
                        <option value="comments">Comments</option>
                        <option value="follows">Follows</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Instagram Configuration */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.059 1.645-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Instagram</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.instagram.enabled}
                      onChange={() => handlePlatformToggle('instagram')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {platformSettings.instagram.enabled && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={platformSettings.instagram.username}
                        onChange={(e) => handlePlatformInputChange('instagram', 'username', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your Instagram username"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Target Hashtags</label>
                      <input
                        type="text"
                        value={platformSettings.instagram.targetHashtags}
                        onChange={(e) => handlePlatformInputChange('instagram', 'targetHashtags', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., #tech, #business, #innovation"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Engagement Type</label>
                      <select
                        value={platformSettings.instagram.engagementType}
                        onChange={(e) => handlePlatformInputChange('instagram', 'engagementType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="comments">Comments</option>
                        <option value="likes">Likes</option>
                        <option value="follows">Follows</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* YouTube Configuration */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">YouTube</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.youtube.enabled}
                      onChange={() => handlePlatformToggle('youtube')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {platformSettings.youtube.enabled && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Channel Name</label>
                      <input
                        type="text"
                        value={platformSettings.youtube.channelName}
                        onChange={(e) => handlePlatformInputChange('youtube', 'channelName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your YouTube channel name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Target Keywords</label>
                      <input
                        type="text"
                        value={platformSettings.youtube.targetKeywords}
                        onChange={(e) => handlePlatformInputChange('youtube', 'targetKeywords', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., tech reviews, tutorials, business"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Engagement Type</label>
                      <select
                        value={platformSettings.youtube.engagementType}
                        onChange={(e) => handlePlatformInputChange('youtube', 'engagementType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="likes">Likes</option>
                        <option value="comments">Comments</option>
                        <option value="subscribes">Subscribes</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <button 
                  onClick={startEngagementBot}
                  disabled={isLoading || isPolling}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? 'Setting Up Bot...' : isPolling ? 'Starting Bot...' : 'Start Engagement Bot'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Bot Running Interface */}
        {botState === 'running' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Engagement Bot Active</h2>
              <button 
                onClick={stopEngagementBot}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                Stop Bot
              </button>
            </div>
            
            {/* Engagement Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-blue-800">Total Engagements</h3>
                <p className="text-2xl font-bold text-blue-600">{engagementStats.totalEngagements}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-blue-800">LinkedIn</h3>
                <p className="text-2xl font-bold text-blue-600">{engagementStats.linkedinEngagements}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-blue-800">TikTok</h3>
                <p className="text-2xl font-bold text-blue-600">{engagementStats.tiktokEngagements}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-blue-800">Instagram</h3>
                <p className="text-2xl font-bold text-blue-600">{engagementStats.instagramEngagements}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-blue-800">YouTube</h3>
                <p className="text-2xl font-bold text-blue-600">{engagementStats.youtubeEngagements}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-green-800">Last Activity</h3>
                <p className="text-sm font-medium text-green-600">{engagementStats.lastActivity || 'None'}</p>
              </div>
            </div>
            
            {/* Manual Engagement Buttons */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <button 
                onClick={() => addEngagementActivity('linkedin', 'Comment', 'Tech post')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                LinkedIn Comment
              </button>
              <button 
                onClick={() => addEngagementActivity('tiktok', 'Like', 'Viral video')}
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm"
              >
                TikTok Like
              </button>
              <button 
                onClick={() => addEngagementActivity('instagram', 'Follow', 'Business account')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm"
              >
                Instagram Follow
              </button>
              <button 
                onClick={() => addEngagementActivity('youtube', 'Subscribe', 'Tech channel')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                YouTube Subscribe
              </button>
            </div>
          </div>
        )}

        {/* Engagement History */}
        {engagementHistory.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Engagement History</h2>
            <div className="space-y-4">
              {engagementHistory.map((entry, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">{entry.timestamp}</span>
                    <span className="text-sm font-medium text-blue-600">{entry.platform}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Action: </span>
                      <span className="text-gray-600">{entry.action}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Target: </span>
                      <span className="text-gray-600">{entry.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Setting Up Your Engagement Bot</h2>
            <p className="text-gray-600 mb-6 text-center">Configuring your social media engagement bot...</p>
            
            <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 min-h-[200px]">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        )}

        {/* Bot Complete */}
        {botState === 'completed' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Engagement Bot Stopped</h2>
            <p className="text-gray-600 mb-6 text-center">Your engagement bot has been stopped. Review your engagement statistics and start a new session when ready.</p>
            
            <div className="text-center">
              <button 
                onClick={() => {
                  setBotState('idle');
                  setEngagementHistory([]);
                  setPlatformSettings({
                    linkedin: { enabled: false, companyPage: '', targetAudience: '', engagementType: 'comments' },
                    tiktok: { enabled: false, username: '', targetHashtags: '', engagementType: 'likes' },
                    instagram: { enabled: false, username: '', targetHashtags: '', engagementType: 'comments' },
                    youtube: { enabled: false, channelName: '', targetKeywords: '', engagementType: 'likes' }
                  });
                }}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
              >
                Start New Bot Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementBot;

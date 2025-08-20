import React, { useState } from 'react';

const GoogleAdsGenerator = () => {
  const [campaignData, setCampaignData] = useState({
    businessInfo: {
      businessName: '',
      industry: '',
      website: '',
      targetLocation: '',
      budget: '',
      campaignGoal: ''
    },
    keywords: {
      primaryKeywords: '',
      negativeKeywords: '',
      keywordMatchType: 'broad',
      searchVolume: '',
      competition: ''
    },
    adCopy: {
      headlines: ['', '', ''],
      descriptions: ['', ''],
      displayUrl: '',
      finalUrl: '',
      callToAction: ''
    },
    targeting: {
      audience: '',
      demographics: '',
      interests: '',
      remarketing: false,
      customIntent: ''
    }
  });
  
  const [optimizationSettings, setOptimizationSettings] = useState({
    bidStrategy: 'manual',
    qualityScore: 'optimize',
    adRotation: 'optimize',
    budgetOptimization: 'maximize',
    keywordOptimization: 'broaden',
    performanceMetrics: []
  });
  
  const [generatorState, setGeneratorState] = useState('idle'); // idle, generating, optimizing, completed
  const [generatedAds, setGeneratedAds] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const handleCampaignInputChange = (section, field, value) => {
    setCampaignData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleAdCopyChange = (type, index, value) => {
    setCampaignData(prev => ({
      ...prev,
      adCopy: {
        ...prev.adCopy,
        [type]: type === 'headlines' || type === 'descriptions' 
          ? prev.adCopy[type].map((item, i) => i === index ? value : item)
          : value
      }
    }));
  };

  const handleOptimizationChange = (field, value) => {
    setOptimizationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetricToggle = (metric) => {
    setOptimizationSettings(prev => ({
      ...prev,
      performanceMetrics: prev.performanceMetrics.includes(metric)
        ? prev.performanceMetrics.filter(m => m !== metric)
        : [...prev.performanceMetrics, metric]
    }));
  };

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const pollForAdsData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkAdsData = async () => {
      if (!isPollingActive) return;
      
      try {
        const adsRes = await fetch(`${API_BASE}/google-ads-generator`);
        
        if (!adsRes.ok) {
          console.error('API Error - Ads status:', adsRes.status);
          throw new Error(`API returned status ${adsRes.status}`);
        }
        
        const adsContentType = adsRes.headers.get('content-type');
        
        if (!adsContentType?.includes('application/json')) {
          console.error('Invalid content type - Ads:', adsContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const adsData = await adsRes.json();
        
        console.log('Ads response:', adsData);
        
        if (adsData && adsData.ads) {
          setGeneratedAds(adsData.ads);
          setKeywordSuggestions(adsData.keywords || []);
          setOptimizationResults(adsData.optimization || null);
          setGeneratorState('completed');
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Google Ads generated successfully!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for ads data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkAdsData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for ads data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkAdsData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve ads data.');
        }
      }
    };
    
    checkAdsData();
  };

  const startAdsGenerator = async () => {
    // Validate required fields
    const requiredFields = ['businessName', 'industry', 'website'];
    const missingFields = requiredFields.filter(field => !campaignData.businessInfo[field]);
    
    if (missingFields.length > 0) {
      showWebhookMessage('error', `Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!campaignData.keywords.primaryKeywords.trim()) {
      showWebhookMessage('error', 'Please provide primary keywords for your campaign.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setGeneratorState('generating');
    setGeneratedAds([]);
    setKeywordSuggestions([]);
    setOptimizationResults(null);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/google-ads-generator-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignData: campaignData,
          optimizationSettings: optimizationSettings
        }),
      });

      if (response.ok) {
        showWebhookMessage('success', 'Google Ads generator setup successfully! Creating campaigns...');
        setIsLoading(false);
        setIsPolling(true);
        pollForAdsData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error starting ads generator:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      setGeneratorState('idle');
      showWebhookMessage('error', 'Failed to start ads generator. Please try again.');
    }
  };

  const saveCampaign = () => {
    const newCampaign = {
      id: Date.now(),
      name: campaignData.businessInfo.businessName,
      data: campaignData,
      optimization: optimizationSettings,
      ads: generatedAds,
      keywords: keywordSuggestions,
      results: optimizationResults,
      timestamp: new Date().toLocaleString()
    };
    
    setCampaignHistory(prev => [...prev, newCampaign]);
    showWebhookMessage('success', 'Campaign saved successfully!');
  };

  const resetGenerator = () => {
    setCampaignData({
      businessInfo: { businessName: '', industry: '', website: '', targetLocation: '', budget: '', campaignGoal: '' },
      keywords: { primaryKeywords: '', negativeKeywords: '', keywordMatchType: 'broad', searchVolume: '', competition: '' },
      adCopy: { headlines: ['', '', ''], descriptions: ['', ''], displayUrl: '', finalUrl: '', callToAction: '' },
      targeting: { audience: '', demographics: '', interests: '', remarketing: false, customIntent: '' }
    });
    setOptimizationSettings({
      bidStrategy: 'manual',
      qualityScore: 'optimize',
      adRotation: 'optimize',
      budgetOptimization: 'maximize',
      keywordOptimization: 'broaden',
      performanceMetrics: []
    });
    setGeneratorState('idle');
    setGeneratedAds([]);
    setKeywordSuggestions([]);
    setOptimizationResults(null);
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
              className="lucide lucide-search h-4 w-4"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Google Ads Generator
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Google Ads Generator & Optimizer
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Create high-performing Google Ads campaigns with AI-powered keyword research, ad copy generation, and optimization strategies.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI-powered Google Ads generator creates comprehensive campaigns with optimized keywords, compelling ad copy, 
            and targeting strategies. It then provides optimization recommendations to maximize your ROI.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Campaign Generation</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Keyword research & analysis</li>
                <li>• Ad copy generation</li>
                <li>• Targeting optimization</li>
                <li>• Budget allocation</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Performance Optimization</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Quality score improvement</li>
                <li>• Bid strategy optimization</li>
                <li>• A/B testing recommendations</li>
                <li>• ROI maximization</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Campaign Generator Form - Only show when idle */}
        {generatorState === 'idle' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Your Google Ads Campaign</h2>
            <p className="text-gray-600 mb-6 text-center">Fill in your business details to generate optimized Google Ads campaigns</p>
            
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Business Information */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Business Name *</label>
                    <input
                      type="text"
                      value={campaignData.businessInfo.businessName}
                      onChange={(e) => handleCampaignInputChange('businessInfo', 'businessName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., TechCorp Solutions"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Industry *</label>
                    <input
                      type="text"
                      value={campaignData.businessInfo.industry}
                      onChange={(e) => handleCampaignInputChange('businessInfo', 'industry', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Technology, Healthcare, Finance"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Website *</label>
                    <input
                      type="url"
                      value={campaignData.businessInfo.website}
                      onChange={(e) => handleCampaignInputChange('businessInfo', 'website', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://www.yourwebsite.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Target Location</label>
                    <input
                      type="text"
                      value={campaignData.businessInfo.targetLocation}
                      onChange={(e) => handleCampaignInputChange('businessInfo', 'targetLocation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Budget</label>
                    <input
                      type="text"
                      value={campaignData.businessInfo.budget}
                      onChange={(e) => handleCampaignInputChange('businessInfo', 'budget', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., $1000/month"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Campaign Goal</label>
                    <select
                      value={campaignData.businessInfo.campaignGoal}
                      onChange={(e) => handleCampaignInputChange('businessInfo', 'campaignGoal', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select goal</option>
                      <option value="awareness">Brand Awareness</option>
                      <option value="traffic">Website Traffic</option>
                      <option value="leads">Lead Generation</option>
                      <option value="sales">Sales/Conversions</option>
                      <option value="app-installs">App Installs</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Keywords & Targeting</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Primary Keywords *</label>
                    <textarea
                      value={campaignData.keywords.primaryKeywords}
                      onChange={(e) => handleCampaignInputChange('keywords', 'primaryKeywords', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., software development, web design, digital marketing"
                      rows="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Negative Keywords</label>
                    <textarea
                      value={campaignData.keywords.negativeKeywords}
                      onChange={(e) => handleCampaignInputChange('keywords', 'negativeKeywords', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., free, cheap, tutorial"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Keyword Match Type</label>
                    <select
                      value={campaignData.keywords.keywordMatchType}
                      onChange={(e) => handleCampaignInputChange('keywords', 'keywordMatchType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="broad">Broad Match</option>
                      <option value="phrase">Phrase Match</option>
                      <option value="exact">Exact Match</option>
                      <option value="modified">Modified Broad Match</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Target Audience</label>
                    <input
                      type="text"
                      value={campaignData.targeting.audience}
                      onChange={(e) => handleCampaignInputChange('targeting', 'audience', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Small business owners, 25-45 years old"
                    />
                  </div>
                </div>
              </div>

              {/* Ad Copy */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ad Copy</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Headlines (3 required)</label>
                    <div className="grid md:grid-cols-3 gap-3">
                      {campaignData.adCopy.headlines.map((headline, index) => (
                        <input
                          key={index}
                          type="text"
                          value={headline}
                          onChange={(e) => handleAdCopyChange('headlines', index, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Headline ${index + 1}`}
                          maxLength="30"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Descriptions (2 required)</label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {campaignData.adCopy.descriptions.map((description, index) => (
                        <textarea
                          key={index}
                          value={description}
                          onChange={(e) => handleAdCopyChange('descriptions', index, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder={`Description ${index + 1}`}
                          rows="2"
                          maxLength="90"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Display URL</label>
                      <input
                        type="text"
                        value={campaignData.adCopy.displayUrl}
                        onChange={(e) => handleAdCopyChange('displayUrl', 0, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="yourwebsite.com"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Call to Action</label>
                      <select
                        value={campaignData.adCopy.callToAction}
                        onChange={(e) => handleAdCopyChange('callToAction', 0, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select CTA</option>
                        <option value="learn-more">Learn More</option>
                        <option value="get-quote">Get Quote</option>
                        <option value="shop-now">Shop Now</option>
                        <option value="sign-up">Sign Up</option>
                        <option value="download">Download</option>
                        <option value="contact-us">Contact Us</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimization Settings */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Optimization Settings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Bid Strategy</label>
                    <select
                      value={optimizationSettings.bidStrategy}
                      onChange={(e) => handleOptimizationChange('bidStrategy', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="manual">Manual CPC</option>
                      <option value="auto">Automated Bidding</option>
                      <option value="target-cpa">Target CPA</option>
                      <option value="target-roas">Target ROAS</option>
                      <option value="maximize-clicks">Maximize Clicks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Quality Score Focus</label>
                    <select
                      value={optimizationSettings.qualityScore}
                      onChange={(e) => handleOptimizationChange('qualityScore', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="optimize">Optimize for Quality Score</option>
                      <option value="maintain">Maintain Current Score</option>
                      <option value="improve">Improve Landing Pages</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Ad Rotation</label>
                    <select
                      value={optimizationSettings.adRotation}
                      onChange={(e) => handleOptimizationChange('adRotation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="optimize">Optimize for Performance</option>
                      <option value="rotate">Rotate Evenly</option>
                      <option value="prefer">Prefer Better Performing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Budget Optimization</label>
                    <select
                      value={optimizationSettings.budgetOptimization}
                      onChange={(e) => handleOptimizationChange('budgetOptimization', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="maximize">Maximize Conversions</option>
                      <option value="efficient">Efficient Spending</option>
                      <option value="balanced">Balanced Approach</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-gray-700 font-medium mb-2">Performance Metrics to Track</label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {['CTR', 'Conversion Rate', 'Quality Score', 'Cost per Click', 'ROAS', 'Impression Share'].map((metric) => (
                      <label key={metric} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={optimizationSettings.performanceMetrics.includes(metric)}
                          onChange={() => handleMetricToggle(metric)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{metric}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <button 
                  onClick={startAdsGenerator}
                  disabled={isLoading || isPolling}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? 'Generating Ads...' : isPolling ? 'Optimizing Campaign...' : 'Generate Google Ads Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Ads Results */}
        {generatedAds.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Generated Google Ads</h2>
              <div className="flex gap-2">
                <button 
                  onClick={saveCampaign}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  Save Campaign
                </button>
                <button 
                  onClick={resetGenerator}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  Create New Campaign
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {generatedAds.map((ad, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Ad Group {index + 1}</h3>
                    <span className="text-sm text-blue-600 font-medium">{ad.status}</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Ad Copy</h4>
                      <div className="space-y-2">
                        <p className="text-blue-600 font-medium">{ad.headlines.join(' | ')}</p>
                        <p className="text-gray-600">{ad.descriptions.join(' ')}</p>
                        <p className="text-green-600 text-sm">{ad.displayUrl}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {ad.keywords.map((keyword, kIndex) => (
                          <span key={kIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {ad.metrics && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Estimated CTR</p>
                        <p className="text-lg font-semibold text-blue-600">{ad.metrics.ctr}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Quality Score</p>
                        <p className="text-lg font-semibold text-green-600">{ad.metrics.qualityScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Avg. CPC</p>
                        <p className="text-lg font-semibold text-orange-600">${ad.metrics.avgCpc}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Competition</p>
                        <p className="text-lg font-semibold text-purple-600">{ad.metrics.competition}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Optimization Recommendations */}
            {optimizationResults && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Optimization Recommendations</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {optimizationResults.recommendations.map((rec, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
                      <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyword Suggestions */}
        {keywordSuggestions.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Keyword Suggestions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keywordSuggestions.map((keyword, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">{keyword.term}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      keyword.difficulty === 'low' ? 'bg-green-100 text-green-800' :
                      keyword.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {keyword.difficulty}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Search Volume: {keyword.searchVolume}</p>
                    <p>Competition: {keyword.competition}</p>
                    <p>Suggested Bid: ${keyword.suggestedBid}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaign History */}
        {campaignHistory.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Saved Campaigns</h2>
            <div className="space-y-4">
              {campaignHistory.map((campaign, index) => (
                <div key={campaign.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">{campaign.timestamp}</span>
                    <span className="text-sm font-medium text-blue-600">{campaign.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Industry: </span>
                      <span className="text-gray-600">{campaign.data.businessInfo.industry}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Goal: </span>
                      <span className="text-gray-600">{campaign.data.businessInfo.campaignGoal}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Ads Generated: </span>
                      <span className="text-gray-600">{campaign.ads.length}</span>
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generating Your Google Ads</h2>
            <p className="text-gray-600 mb-6 text-center">Creating optimized campaigns and analyzing performance metrics...</p>
            
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
      </div>
    </div>
  );
};

export default GoogleAdsGenerator;

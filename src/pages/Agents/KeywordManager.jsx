import React, { useState } from 'react';

const KeywordManager = () => {
  const [userData, setUserData] = useState({
    website: '',
    industry: '',
    targetAudience: '',
    primaryKeywords: '',
    competitorKeywords: '',
    contentGoals: ''
  });
  
  const [keywordAnalysis, setKeywordAnalysis] = useState(null);
  const [seoStrategy, setSeoStrategy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const pollForKeywordData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkKeywordData = async () => {
      if (!isPollingActive) return;
      
      try {
        const keywordRes = await fetch(`${API_BASE}/keyword-manager`);
        
        if (!keywordRes.ok) {
          console.error('API Error - Keyword status:', keywordRes.status);
          throw new Error(`API returned status ${keywordRes.status}`);
        }
        
        const keywordContentType = keywordRes.headers.get('content-type');
        
        if (!keywordContentType?.includes('application/json')) {
          console.error('Invalid content type - Keyword:', keywordContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const keywordData = await keywordRes.json();
        
        console.log('Keyword response:', keywordData);
        
        if (keywordData && keywordData.length > 0) {
          setKeywordAnalysis(keywordData[0]);
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Keyword analysis generated successfully!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for keyword data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkKeywordData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for keyword data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkKeywordData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve keyword data.');
        }
      }
    };
    
    checkKeywordData();
  };

  const generateKeywordAnalysis = async () => {
    if (!userData.website.trim() || !userData.industry.trim() || !userData.primaryKeywords.trim()) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setKeywordAnalysis(null);
    setSeoStrategy(null);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/keyword-manager-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website: userData.website,
          industry: userData.industry,
          targetAudience: userData.targetAudience,
          primaryKeywords: userData.primaryKeywords,
          competitorKeywords: userData.competitorKeywords,
          contentGoals: userData.contentGoals
        }),
      });

      if (response.ok) {
        showWebhookMessage('success', 'Keyword analysis request sent successfully! Generating insights...');
        setIsLoading(false);
        setIsPolling(true);
        pollForKeywordData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating keyword analysis:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showWebhookMessage('error', 'Failed to generate keyword analysis. Please try again.');
    }
  };

  // Mock data for demonstration
  const mockKeywordAnalysis = {
    seoScore: 78,
    keywordDifficulty: "Medium",
    searchVolume: "High",
    competitionLevel: "Moderate",
    primaryKeywords: [
      { keyword: "digital marketing", volume: 12000, difficulty: 45, cpc: 2.50 },
      { keyword: "SEO optimization", volume: 8900, difficulty: 52, cpc: 3.20 },
      { keyword: "content marketing", volume: 6700, difficulty: 38, cpc: 2.80 },
      { keyword: "social media strategy", volume: 5400, difficulty: 41, cpc: 2.10 }
    ],
    longTailKeywords: [
      "best digital marketing strategies 2024",
      "SEO tips for small businesses",
      "content marketing for B2B companies",
      "social media marketing trends"
    ],
    competitorKeywords: [
      "marketing automation tools",
      "lead generation strategies",
      "email marketing campaigns",
      "brand awareness tactics"
    ],
    keywordOpportunities: [
      "local SEO optimization",
      "voice search optimization",
      "video marketing strategies",
      "influencer marketing campaigns"
    ]
  };

  const mockSeoStrategy = {
    onPageSeo: {
      title: "On-Page SEO Strategy",
      recommendations: [
        "Optimize title tags with primary keywords",
        "Improve meta descriptions for better CTR",
        "Enhance header structure (H1, H2, H3)",
        "Optimize image alt tags and file names"
      ]
    },
    contentStrategy: {
      title: "Content Strategy",
      recommendations: [
        "Create pillar content around primary keywords",
        "Develop long-form articles (2000+ words)",
        "Include internal linking strategy",
        "Regular content updates and optimization"
      ]
    },
    technicalSeo: {
      title: "Technical SEO",
      recommendations: [
        "Improve page loading speed",
        "Implement schema markup",
        "Optimize for mobile devices",
        "Fix broken links and redirects"
      ]
    }
  };

  const mockKeywordPerformance = {
    currentRankings: [
      { keyword: "digital marketing", position: 15, change: "+3" },
      { keyword: "SEO optimization", position: 8, change: "+2" },
      { keyword: "content marketing", position: 22, change: "-1" },
      { keyword: "social media strategy", position: 12, change: "+5" }
    ],
    trafficProjections: {
      monthly: "45,000 visits",
      quarterly: "135,000 visits",
      yearly: "540,000 visits"
    },
    conversionRates: {
      organic: "3.2%",
      paid: "4.8%",
      social: "2.1%"
    }
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
            Keyword Manager
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              SEO Optimizer
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Master your SEO strategy with intelligent keyword analysis and optimization. 
            Our AI analyzes your keywords and provides comprehensive SEO strategies to boost your search rankings.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your website, industry, and target keywords to create comprehensive 
            SEO strategies. Get detailed keyword insights, competitor analysis, and actionable 
            recommendations to improve your search engine rankings.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Keyword Analysis</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Search volume analysis</li>
                <li>• Keyword difficulty assessment</li>
                <li>• Competition analysis</li>
                <li>• Long-tail keyword discovery</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">SEO Strategy</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• On-page optimization</li>
                <li>• Content strategy planning</li>
                <li>• Technical SEO recommendations</li>
                <li>• Performance tracking</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Competitor Insights</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Competitor keyword analysis</li>
                <li>• Gap identification</li>
                <li>• Opportunity discovery</li>
                <li>• Market positioning</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Data Form */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Your Keyword Analysis</h2>
          <p className="text-gray-600 mb-6 text-center">Enter your website information to generate a comprehensive keyword and SEO analysis</p>
          
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Website URL *</label>
                <input
                  type="url"
                  name="website"
                  value={userData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Industry *</label>
                <input
                  type="text"
                  name="industry"
                  value={userData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Digital Marketing, E-commerce"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Target Audience</label>
              <input
                type="text"
                name="targetAudience"
                value={userData.targetAudience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Small business owners, Marketing professionals"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Primary Keywords *</label>
              <textarea
                name="primaryKeywords"
                value={userData.primaryKeywords}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter your main keywords (e.g., digital marketing, SEO, content marketing)"
                rows="3"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Competitor Keywords</label>
              <textarea
                name="competitorKeywords"
                value={userData.competitorKeywords}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Keywords your competitors are ranking for"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Content Goals</label>
              <textarea
                name="contentGoals"
                value={userData.contentGoals}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your content marketing goals and target topics"
                rows="3"
              />
            </div>
            
            <div className="text-center">
              <button 
                onClick={generateKeywordAnalysis}
                disabled={isLoading || isPolling}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
              >
                {isLoading ? 'Generating Analysis...' : isPolling ? 'Analyzing Keywords...' : 'Generate Keyword Analysis'}
              </button>
            </div>
          </div>
        </div>

        {/* Keyword Analysis - Show mock data for demonstration */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Keyword Analysis Report</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* SEO Overview */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">SEO Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">SEO Score:</span>
                    <span className="font-semibold text-blue-600">{mockKeywordAnalysis.seoScore}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Keyword Difficulty:</span>
                    <span className="font-semibold text-orange-600">{mockKeywordAnalysis.keywordDifficulty}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Search Volume:</span>
                    <span className="font-semibold text-green-600">{mockKeywordAnalysis.searchVolume}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Competition:</span>
                    <span className="font-semibold text-purple-600">{mockKeywordAnalysis.competitionLevel}</span>
                  </div>
                </div>
                
                {/* SEO Score Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${mockKeywordAnalysis.seoScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Primary Keywords */}
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Primary Keywords</h3>
                <div className="space-y-3">
                  {mockKeywordAnalysis.primaryKeywords.map((keyword, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{keyword.keyword}</span>
                        <span className="text-sm text-green-600 font-semibold">${keyword.cpc}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Volume: {keyword.volume.toLocaleString()}</span>
                        <span>Difficulty: {keyword.difficulty}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Long-tail Keywords */}
            <div className="bg-yellow-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Long-tail Keywords</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockKeywordAnalysis.longTailKeywords.map((keyword, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {keyword}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Keyword Opportunities */}
            <div className="bg-purple-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Keyword Opportunities</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockKeywordAnalysis.keywordOpportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    {opportunity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SEO Strategy */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">SEO Strategy</h2>
            
            <div className="space-y-6">
              {Object.entries(mockSeoStrategy).map(([key, data]) => (
                <div key={key} className="border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{data.title}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {data.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tracking */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Performance Tracking</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Current Rankings */}
              <div className="bg-indigo-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Current Rankings</h3>
                <div className="space-y-3">
                  {mockKeywordPerformance.currentRankings.map((ranking, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{ranking.keyword}</span>
                        <div className="flex items-center">
                          <span className="text-lg font-semibold text-indigo-600 mr-2">#{ranking.position}</span>
                          <span className={`text-sm font-medium ${ranking.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {ranking.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Traffic Projections */}
              <div className="bg-teal-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-teal-800 mb-4">Traffic Projections</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Monthly:</span>
                    <span className="font-semibold text-teal-600">{mockKeywordPerformance.trafficProjections.monthly}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Quarterly:</span>
                    <span className="font-semibold text-teal-600">{mockKeywordPerformance.trafficProjections.quarterly}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Yearly:</span>
                    <span className="font-semibold text-teal-600">{mockKeywordPerformance.trafficProjections.yearly}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Conversion Rates */}
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Rates</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{mockKeywordPerformance.conversionRates.organic}</div>
                  <div className="text-sm text-gray-600">Organic Traffic</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockKeywordPerformance.conversionRates.paid}</div>
                  <div className="text-sm text-gray-600">Paid Traffic</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{mockKeywordPerformance.conversionRates.social}</div>
                  <div className="text-sm text-gray-600">Social Traffic</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generating Your Keyword Analysis</h2>
            <p className="text-gray-600 mb-6 text-center">Analyzing your keywords and creating comprehensive SEO strategies...</p>
            
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
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordManager;

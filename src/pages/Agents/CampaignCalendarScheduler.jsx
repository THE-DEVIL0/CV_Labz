import React, { useState } from 'react';

const CampaignCalendarScheduler = () => {
  const [userData, setUserData] = useState({
    campaignName: '',
    campaignType: '',
    targetAudience: '',
    startDate: '',
    endDate: '',
    budget: '',
    goals: '',
    channels: ''
  });
  
  const [campaignPlan, setCampaignPlan] = useState(null);
  const [schedule, setSchedule] = useState(null);
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

  const pollForCampaignData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkCampaignData = async () => {
      if (!isPollingActive) return;
      
      try {
        const campaignRes = await fetch(`${API_BASE}/campaign-calendar-scheduler`);
        
        if (!campaignRes.ok) {
          console.error('API Error - Campaign status:', campaignRes.status);
          throw new Error(`API returned status ${campaignRes.status}`);
        }
        
        const campaignContentType = campaignRes.headers.get('content-type');
        
        if (!campaignContentType?.includes('application/json')) {
          console.error('Invalid content type - Campaign:', campaignContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const campaignData = await campaignRes.json();
        
        console.log('Campaign response:', campaignData);
        
        if (campaignData && campaignData.length > 0) {
          setCampaignPlan(campaignData[0]);
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Campaign plan generated successfully!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for campaign data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkCampaignData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for campaign data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkCampaignData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve campaign data.');
        }
      }
    };
    
    checkCampaignData();
  };

  const generateCampaignPlan = async () => {
    if (!userData.campaignName.trim() || !userData.campaignType.trim() || !userData.startDate.trim()) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setCampaignPlan(null);
    setSchedule(null);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/campaign-calendar-scheduler-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignName: userData.campaignName,
          campaignType: userData.campaignType,
          targetAudience: userData.targetAudience,
          startDate: userData.startDate,
          endDate: userData.endDate,
          budget: userData.budget,
          goals: userData.goals,
          channels: userData.channels
        }),
      });

      if (response.ok) {
        showWebhookMessage('success', 'Campaign plan request sent successfully! Generating schedule...');
        setIsLoading(false);
        setIsPolling(true);
        pollForCampaignData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating campaign plan:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showWebhookMessage('error', 'Failed to generate campaign plan. Please try again.');
    }
  };

  // Mock data for demonstration
  const mockCampaignPlan = {
    campaignScore: 85,
    estimatedReach: "50,000+",
    expectedEngagement: "12.5%",
    budgetAllocation: "Optimized",
    phases: [
      {
        phase: "Phase 1: Awareness",
        duration: "Week 1-2",
        activities: [
          "Social media teaser campaign",
          "Email newsletter announcement",
          "Influencer outreach",
          "Press release distribution"
        ],
        budget: "$2,500"
      },
      {
        phase: "Phase 2: Engagement",
        duration: "Week 3-4",
        activities: [
          "Interactive social media content",
          "User-generated content campaign",
          "Live Q&A sessions",
          "Community building activities"
        ],
        budget: "$3,000"
      },
      {
        phase: "Phase 3: Conversion",
        duration: "Week 5-6",
        activities: [
          "Targeted advertising campaigns",
          "Email marketing sequences",
          "Retargeting campaigns",
          "Conversion optimization"
        ],
        budget: "$4,500"
      }
    ],
    keyMilestones: [
      { milestone: "Campaign Launch", date: "Day 1", status: "Scheduled" },
      { milestone: "First Content Release", date: "Day 3", status: "Scheduled" },
      { milestone: "Mid-campaign Review", date: "Day 21", status: "Scheduled" },
      { milestone: "Campaign Wrap-up", date: "Day 42", status: "Scheduled" }
    ],
    riskFactors: [
      "Seasonal market fluctuations",
      "Competitor campaign overlap",
      "Platform algorithm changes",
      "Budget constraints"
    ]
  };

  const mockSchedule = {
    dailySchedule: {
      monday: [
        { time: "9:00 AM", activity: "Content creation and scheduling", channel: "All platforms" },
        { time: "2:00 PM", activity: "Community engagement", channel: "Social media" },
        { time: "4:00 PM", activity: "Performance review", channel: "Analytics" }
      ],
      tuesday: [
        { time: "10:00 AM", activity: "Email campaign preparation", channel: "Email marketing" },
        { time: "3:00 PM", activity: "Influencer collaboration", channel: "Partnerships" },
        { time: "5:00 PM", activity: "Content optimization", channel: "All platforms" }
      ],
      wednesday: [
        { time: "9:00 AM", activity: "Social media management", channel: "Social platforms" },
        { time: "2:00 PM", activity: "Customer feedback analysis", channel: "Support" },
        { time: "4:00 PM", activity: "Campaign adjustments", channel: "Strategy" }
      ]
    },
    weeklyTasks: [
      "Content calendar review and planning",
      "Performance metrics analysis",
      "Budget tracking and optimization",
      "Team coordination meetings",
      "Competitor analysis updates"
    ],
    monthlyReviews: [
      "Campaign performance deep-dive",
      "ROI calculation and reporting",
      "Strategy refinement",
      "Budget reallocation",
      "Future campaign planning"
    ]
  };

  const mockPerformanceMetrics = {
    kpis: [
      { metric: "Reach", target: "50,000", current: "45,200", progress: 90 },
      { metric: "Engagement Rate", target: "12%", current: "11.8%", progress: 98 },
      { metric: "Conversion Rate", target: "3.5%", current: "3.2%", progress: 91 },
      { metric: "ROI", target: "250%", current: "235%", progress: 94 }
    ],
    channelPerformance: [
      { channel: "Social Media", reach: "25,000", engagement: "15%", conversion: "2.8%" },
      { channel: "Email Marketing", reach: "15,000", engagement: "8%", conversion: "4.2%" },
      { channel: "Paid Advertising", reach: "10,000", engagement: "5%", conversion: "3.5%" }
    ]
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
              className="lucide lucide-calendar h-4 w-4"
            >
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <rect width="18" height="18" x="3" y="4" rx="2"/>
              <path d="M3 10h18"/>
            </svg>
            Campaign Calendar & Scheduler
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Campaign Planner
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Plan and schedule your marketing campaigns with precision. 
            Our AI creates comprehensive campaign calendars and optimized schedules to maximize your marketing impact.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your campaign goals, target audience, and resources to create comprehensive 
            campaign plans with detailed schedules. Get optimized timelines, budget allocation, and 
            performance tracking to ensure campaign success.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Campaign Planning</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Strategic campaign design</li>
                <li>• Phase-based execution</li>
                <li>• Budget optimization</li>
                <li>• Risk assessment</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Schedule Management</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Detailed timeline creation</li>
                <li>• Task automation</li>
                <li>• Resource allocation</li>
                <li>• Milestone tracking</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Performance Tracking</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Real-time monitoring</li>
                <li>• KPI tracking</li>
                <li>• ROI analysis</li>
                <li>• Optimization insights</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Data Form */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Your Campaign Plan</h2>
          <p className="text-gray-600 mb-6 text-center">Enter your campaign details to generate a comprehensive plan and schedule</p>
          
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Campaign Name *</label>
                <input
                  type="text"
                  name="campaignName"
                  value={userData.campaignName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Summer Product Launch"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Campaign Type *</label>
                <input
                  type="text"
                  name="campaignType"
                  value={userData.campaignType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Product Launch, Brand Awareness"
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
                placeholder="e.g., Young professionals, 25-35 years old"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={userData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={userData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Budget</label>
              <input
                type="text"
                name="budget"
                value={userData.budget}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., $10,000"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Campaign Goals</label>
              <textarea
                name="goals"
                value={userData.goals}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your campaign goals (e.g., increase brand awareness, drive sales, generate leads)"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Marketing Channels</label>
              <textarea
                name="channels"
                value={userData.channels}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="List your marketing channels (e.g., social media, email, paid ads, influencer marketing)"
                rows="3"
              />
            </div>
            
            <div className="text-center">
              <button 
                onClick={generateCampaignPlan}
                disabled={isLoading || isPolling}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
              >
                {isLoading ? 'Generating Plan...' : isPolling ? 'Creating Schedule...' : 'Generate Campaign Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Plan - Show mock data for demonstration */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Campaign Plan Overview</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Campaign Metrics */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Campaign Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Campaign Score:</span>
                    <span className="font-semibold text-blue-600">{mockCampaignPlan.campaignScore}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Estimated Reach:</span>
                    <span className="font-semibold text-green-600">{mockCampaignPlan.estimatedReach}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Expected Engagement:</span>
                    <span className="font-semibold text-orange-600">{mockCampaignPlan.expectedEngagement}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Budget Allocation:</span>
                    <span className="font-semibold text-purple-600">{mockCampaignPlan.budgetAllocation}</span>
                  </div>
                </div>
                
                {/* Campaign Score Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${mockCampaignPlan.campaignScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Key Milestones */}
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Key Milestones</h3>
                <div className="space-y-3">
                  {mockCampaignPlan.keyMilestones.map((milestone, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{milestone.milestone}</span>
                        <span className="text-sm text-green-600 font-semibold">{milestone.status}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {milestone.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Campaign Phases */}
            <div className="bg-yellow-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Campaign Phases</h3>
              <div className="space-y-4">
                {mockCampaignPlan.phases.map((phase, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-800">{phase.phase}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{phase.duration}</span>
                        <span className="text-sm font-semibold text-green-600">{phase.budget}</span>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {phase.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-center text-gray-700 text-sm">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Risk Factors */}
            <div className="bg-red-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Risk Factors</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockCampaignPlan.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Management */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Schedule Management</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Daily Schedule */}
              <div className="bg-indigo-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Daily Schedule</h3>
                <div className="space-y-3">
                  {Object.entries(mockSchedule.dailySchedule).slice(0, 3).map(([day, activities]) => (
                    <div key={day} className="bg-white p-3 rounded-lg">
                      <h4 className="font-medium text-gray-800 capitalize mb-2">{day}</h4>
                      <div className="space-y-2">
                        {activities.map((activity, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-indigo-600">{activity.time}</div>
                            <div className="text-gray-700">{activity.activity}</div>
                            <div className="text-xs text-gray-500">{activity.channel}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Weekly Tasks */}
              <div className="bg-teal-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-teal-800 mb-4">Weekly Tasks</h3>
                <ul className="space-y-2">
                  {mockSchedule.weeklyTasks.map((task, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-teal-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Monthly Reviews */}
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Monthly Reviews</h3>
                <ul className="space-y-2">
                  {mockSchedule.monthlyReviews.map((review, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      {review}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tracking */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Performance Tracking</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* KPIs */}
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Performance Indicators</h3>
                <div className="space-y-4">
                  {mockPerformanceMetrics.kpis.map((kpi, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{kpi.metric}</span>
                        <span className="text-sm font-semibold text-blue-600">{kpi.progress}%</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Target: {kpi.target}</span>
                        <span>Current: {kpi.current}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${kpi.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Channel Performance */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Channel Performance</h3>
                <div className="space-y-3">
                  {mockPerformanceMetrics.channelPerformance.map((channel, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{channel.channel}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-600">Reach</div>
                          <div className="font-semibold text-blue-600">{channel.reach}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Engagement</div>
                          <div className="font-semibold text-green-600">{channel.engagement}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Conversion</div>
                          <div className="font-semibold text-purple-600">{channel.conversion}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generating Your Campaign Plan</h2>
            <p className="text-gray-600 mb-6 text-center">Creating comprehensive campaign strategy and optimized schedule...</p>
            
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

export default CampaignCalendarScheduler;

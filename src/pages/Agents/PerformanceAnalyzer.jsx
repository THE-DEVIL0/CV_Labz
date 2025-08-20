import React, { useState } from 'react';

const PerformanceAnalyzer = () => {
  const [userData, setUserData] = useState({
    businessName: '',
    industry: '',
    performanceMetrics: '',
    timePeriod: '',
    goals: '',
    challenges: '',
    competitors: ''
  });
  
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [optimizationPlan, setOptimizationPlan] = useState(null);
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

  const pollForPerformanceData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkPerformanceData = async () => {
      if (!isPollingActive) return;
      
      try {
        const performanceRes = await fetch(`${API_BASE}/performance-analyzer`);
        
        if (!performanceRes.ok) {
          console.error('API Error - Performance status:', performanceRes.status);
          throw new Error(`API returned status ${performanceRes.status}`);
        }
        
        const performanceContentType = performanceRes.headers.get('content-type');
        
        if (!performanceContentType?.includes('application/json')) {
          console.error('Invalid content type - Performance:', performanceContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const performanceData = await performanceRes.json();
        
        console.log('Performance response:', performanceData);
        
        if (performanceData && performanceData.length > 0) {
          setPerformanceAnalysis(performanceData[0]);
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Performance analysis generated successfully!');
          return true;
        } else {
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
    if (!userData.businessName.trim() || !userData.industry.trim() || !userData.performanceMetrics.trim()) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setPerformanceAnalysis(null);
    setOptimizationPlan(null);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/performance-analyzer-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: userData.businessName,
          industry: userData.industry,
          performanceMetrics: userData.performanceMetrics,
          timePeriod: userData.timePeriod,
          goals: userData.goals,
          challenges: userData.challenges,
          competitors: userData.competitors
        }),
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

  // Mock data for demonstration
  const mockPerformanceAnalysis = {
    overallScore: 78,
    performanceLevel: "Above Average",
    growthRate: "12.5%",
    efficiencyRating: "Good",
    keyMetrics: [
      { metric: "Revenue Growth", value: "15.2%", target: "12%", status: "exceeding" },
      { metric: "Customer Satisfaction", value: "4.3/5", target: "4.5/5", status: "below" },
      { metric: "Operational Efficiency", value: "87%", target: "85%", status: "exceeding" },
      { metric: "Market Share", value: "8.5%", target: "10%", status: "below" }
    ],
    strengths: [
      "Strong revenue growth trajectory",
      "High operational efficiency",
      "Innovative product development",
      "Skilled workforce"
    ],
    weaknesses: [
      "Customer satisfaction below target",
      "Market share growth slow",
      "Limited digital presence",
      "High customer acquisition costs"
    ],
    opportunities: [
      "Digital transformation potential",
      "Market expansion opportunities",
      "Product diversification",
      "Strategic partnerships"
    ],
    threats: [
      "Increasing competition",
      "Economic uncertainty",
      "Technology disruption",
      "Regulatory changes"
    ]
  };

  const mockOptimizationPlan = {
    priorityAreas: [
      {
        area: "Customer Experience",
        priority: "High",
        impact: "High",
        effort: "Medium",
        actions: [
          "Implement customer feedback system",
          "Enhance support processes",
          "Improve product quality",
          "Develop loyalty programs"
        ],
        timeline: "3-6 months",
        expectedImprovement: "15-20%"
      },
      {
        area: "Digital Transformation",
        priority: "High",
        impact: "High",
        effort: "High",
        actions: [
          "Upgrade technology infrastructure",
          "Implement automation tools",
          "Enhance online presence",
          "Develop mobile applications"
        ],
        timeline: "6-12 months",
        expectedImprovement: "25-30%"
      },
      {
        area: "Market Expansion",
        priority: "Medium",
        impact: "High",
        effort: "High",
        actions: [
          "Conduct market research",
          "Develop expansion strategy",
          "Build partnerships",
          "Launch pilot programs"
        ],
        timeline: "12-18 months",
        expectedImprovement: "20-25%"
      }
    ],
    quickWins: [
      "Optimize pricing strategy",
      "Improve internal communication",
      "Enhance employee training",
      "Streamline processes"
    ],
    longTermStrategies: [
      "Develop competitive advantage",
      "Build sustainable growth model",
      "Foster innovation culture",
      "Establish market leadership"
    ]
  };

  const mockBenchmarkingData = {
    industryComparison: [
      { metric: "Revenue Growth", yourCompany: "15.2%", industryAvg: "8.5%", topPerformers: "22.3%" },
      { metric: "Customer Satisfaction", yourCompany: "4.3/5", industryAvg: "4.1/5", topPerformers: "4.7/5" },
      { metric: "Operational Efficiency", yourCompany: "87%", industryAvg: "82%", topPerformers: "91%" },
      { metric: "Market Share", yourCompany: "8.5%", industryAvg: "6.2%", topPerformers: "15.8%" }
    ],
    competitorAnalysis: [
      { competitor: "Competitor A", strength: "Market leader", weakness: "Slow innovation", opportunity: "Digital gap" },
      { competitor: "Competitor B", strength: "Strong digital presence", weakness: "High costs", opportunity: "Cost optimization" },
      { competitor: "Competitor C", strength: "Innovation focus", weakness: "Limited scale", opportunity: "Market expansion" }
    ]
  };

  const mockTrendAnalysis = {
    performanceTrends: [
      { period: "Q1 2024", revenue: "12.5%", efficiency: "85%", satisfaction: "4.2/5" },
      { period: "Q2 2024", revenue: "13.8%", efficiency: "86%", satisfaction: "4.3/5" },
      { period: "Q3 2024", revenue: "14.2%", efficiency: "87%", satisfaction: "4.3/5" },
      { period: "Q4 2024", revenue: "15.2%", efficiency: "87%", satisfaction: "4.3/5" }
    ],
    predictions: [
      { metric: "Revenue Growth", prediction: "18-22%", confidence: "85%" },
      { metric: "Market Share", prediction: "9.5-10.5%", confidence: "75%" },
      { metric: "Customer Satisfaction", prediction: "4.5-4.7/5", confidence: "80%" }
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
              className="lucide lucide-trending-up h-4 w-4"
            >
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
              <polyline points="16,7 22,7 22,13"/>
            </svg>
            Performance Analyzer
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Performance Optimizer
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Analyze and optimize your business performance with AI-driven insights. 
            Our AI evaluates your metrics, identifies opportunities, and provides actionable strategies for improvement.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your performance metrics, compares them with industry benchmarks, and identifies 
            optimization opportunities. Get comprehensive insights, trend analysis, and actionable recommendations 
            to drive business growth and efficiency.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Performance Analysis</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Comprehensive metric evaluation</li>
                <li>• Industry benchmarking</li>
                <li>• Trend analysis</li>
                <li>• Gap identification</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Optimization Planning</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Priority-based recommendations</li>
                <li>• Action plan development</li>
                <li>• Resource allocation</li>
                <li>• Timeline planning</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Predictive Insights</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Performance forecasting</li>
                <li>• Risk assessment</li>
                <li>• Opportunity identification</li>
                <li>• Strategic planning</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Data Form */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Your Performance Analysis</h2>
          <p className="text-gray-600 mb-6 text-center">Enter your business information to generate comprehensive performance insights and optimization strategies</p>
          
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={userData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TechCorp Solutions"
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
                  placeholder="e.g., Technology, Healthcare, Finance"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Performance Metrics *</label>
              <textarea
                name="performanceMetrics"
                value={userData.performanceMetrics}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your key performance metrics (e.g., revenue growth, customer satisfaction, operational efficiency)"
                rows="3"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Time Period</label>
              <input
                type="text"
                name="timePeriod"
                value={userData.timePeriod}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Last 12 months, Q1-Q4 2024"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Business Goals</label>
              <textarea
                name="goals"
                value={userData.goals}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your business goals and objectives"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Current Challenges</label>
              <textarea
                name="challenges"
                value={userData.challenges}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the main challenges you're facing"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Key Competitors</label>
              <textarea
                name="competitors"
                value={userData.competitors}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="List your main competitors and their strengths/weaknesses"
                rows="3"
              />
            </div>
            
            <div className="text-center">
              <button 
                onClick={generatePerformanceAnalysis}
                disabled={isLoading || isPolling}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
              >
                {isLoading ? 'Analyzing Performance...' : isPolling ? 'Generating Insights...' : 'Generate Performance Analysis'}
              </button>
            </div>
          </div>
        </div>

        {/* Performance Analysis - Show mock data for demonstration */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Performance Analysis Overview</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Overall Performance */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Overall Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Performance Score:</span>
                    <span className="font-semibold text-blue-600">{mockPerformanceAnalysis.overallScore}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Performance Level:</span>
                    <span className="font-semibold text-green-600">{mockPerformanceAnalysis.performanceLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Growth Rate:</span>
                    <span className="font-semibold text-orange-600">{mockPerformanceAnalysis.growthRate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Efficiency Rating:</span>
                    <span className="font-semibold text-purple-600">{mockPerformanceAnalysis.efficiencyRating}</span>
                  </div>
                </div>
                
                {/* Performance Score Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${mockPerformanceAnalysis.overallScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  {mockPerformanceAnalysis.keyMetrics.map((metric, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{metric.metric}</span>
                        <span className={`text-sm font-semibold ${
                          metric.status === 'exceeding' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.value}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Target: {metric.target}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* SWOT Analysis */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-yellow-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">Strengths</h3>
                <ul className="space-y-2">
                  {mockPerformanceAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-red-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Weaknesses</h3>
                <ul className="space-y-2">
                  {mockPerformanceAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Opportunities</h3>
                <ul className="space-y-2">
                  {mockPerformanceAnalysis.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-orange-800 mb-4">Threats</h3>
                <ul className="space-y-2">
                  {mockPerformanceAnalysis.threats.map((threat, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Plan */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Optimization Plan</h2>
            
            <div className="space-y-6 mb-8">
              {mockOptimizationPlan.priorityAreas.map((area, index) => (
                <div key={index} className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{area.area}</h3>
                      <div className="flex gap-4 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          area.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Priority: {area.priority}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          Impact: {area.impact}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Effort: {area.effort}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Timeline</div>
                      <div className="font-semibold text-gray-800">{area.timeline}</div>
                      <div className="text-sm text-green-600">Expected: {area.expectedImprovement}</div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {area.actions.map((action, actIndex) => (
                      <div key={actIndex} className="flex items-center text-gray-700">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Wins</h3>
                <ul className="space-y-2">
                  {mockOptimizationPlan.quickWins.map((win, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Long-term Strategies</h3>
                <ul className="space-y-2">
                  {mockOptimizationPlan.longTermStrategies.map((strategy, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Benchmarking & Trends */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Benchmarking & Trends</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Industry Comparison */}
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Industry Comparison</h3>
                <div className="space-y-3">
                  {mockBenchmarkingData.industryComparison.map((comparison, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="font-medium text-gray-800 mb-2">{comparison.metric}</div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-600">Your Company</div>
                          <div className="font-semibold text-blue-600">{comparison.yourCompany}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Industry Avg</div>
                          <div className="font-semibold text-gray-600">{comparison.industryAvg}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Top Performers</div>
                          <div className="font-semibold text-green-600">{comparison.topPerformers}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Competitor Analysis */}
              <div className="bg-indigo-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Competitor Analysis</h3>
                <div className="space-y-3">
                  {mockBenchmarkingData.competitorAnalysis.map((competitor, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg">
                      <div className="font-medium text-gray-800 mb-2">{competitor.competitor}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">Strength:</span>
                          <span className="ml-1 text-gray-800">{competitor.strength}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">Weakness:</span>
                          <span className="ml-1 text-gray-800">{competitor.weakness}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">Opportunity:</span>
                          <span className="ml-1 text-gray-800">{competitor.opportunity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Performance Trends */}
            <div className="bg-teal-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-teal-800 mb-4">Performance Trends</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Historical Performance</h4>
                  <div className="space-y-2">
                    {mockTrendAnalysis.performanceTrends.map((trend, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg">
                        <div className="font-medium text-gray-800 mb-1">{trend.period}</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-gray-600">Revenue</div>
                            <div className="font-semibold text-blue-600">{trend.revenue}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Efficiency</div>
                            <div className="font-semibold text-green-600">{trend.efficiency}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Satisfaction</div>
                            <div className="font-semibold text-purple-600">{trend.satisfaction}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Predictions</h4>
                  <div className="space-y-3">
                    {mockTrendAnalysis.predictions.map((prediction, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-800">{prediction.metric}</span>
                          <span className="text-sm text-green-600">Confidence: {prediction.confidence}</span>
                        </div>
                        <div className="text-lg font-semibold text-blue-600">{prediction.prediction}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAnalyzer;

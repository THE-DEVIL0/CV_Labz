import React, { useState } from 'react';

const PrivacyControlExplainability = () => {
  const [userData, setUserData] = useState({
    name: '',
    organization: '',
    dataType: '',
    privacyConcerns: '',
    controlRequirements: '',
    explainabilityNeeds: ''
  });
  
  const [privacyReport, setPrivacyReport] = useState(null);
  const [controlFramework, setControlFramework] = useState(null);
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

  const pollForPrivacyData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkPrivacyData = async () => {
      if (!isPollingActive) return;
      
      try {
        const privacyRes = await fetch(`${API_BASE}/privacy-control-explainability`);
        
        if (!privacyRes.ok) {
          console.error('API Error - Privacy status:', privacyRes.status);
          throw new Error(`API returned status ${privacyRes.status}`);
        }
        
        const privacyContentType = privacyRes.headers.get('content-type');
        
        if (!privacyContentType?.includes('application/json')) {
          console.error('Invalid content type - Privacy:', privacyContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const privacyData = await privacyRes.json();
        
        console.log('Privacy response:', privacyData);
        
        if (privacyData && privacyData.length > 0) {
          setPrivacyReport(privacyData[0]);
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Privacy analysis generated successfully!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for privacy data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkPrivacyData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for privacy data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkPrivacyData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve privacy data.');
        }
      }
    };
    
    checkPrivacyData();
  };

  const generatePrivacyAnalysis = async () => {
    if (!userData.name.trim() || !userData.organization.trim() || !userData.dataType.trim()) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setPrivacyReport(null);
    setControlFramework(null);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/privacy-control-explainability-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          organization: userData.organization,
          dataType: userData.dataType,
          privacyConcerns: userData.privacyConcerns,
          controlRequirements: userData.controlRequirements,
          explainabilityNeeds: userData.explainabilityNeeds
        }),
      });

      if (response.ok) {
        showWebhookMessage('success', 'Privacy analysis request sent successfully! Generating insights...');
        setIsLoading(false);
        setIsPolling(true);
        pollForPrivacyData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating privacy analysis:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showWebhookMessage('error', 'Failed to generate privacy analysis. Please try again.');
    }
  };

  // Mock data for demonstration
  const mockPrivacyReport = {
    privacyScore: 85,
    riskLevel: "Medium",
    complianceStatus: "Compliant",
    dataRetention: "7 years",
    encryptionStatus: "Enabled",
    accessControls: [
      "Role-based access control",
      "Multi-factor authentication",
      "Audit logging",
      "Data anonymization"
    ],
    privacyRisks: [
      "Data breach potential",
      "Third-party data sharing",
      "User consent management",
      "Cross-border data transfer"
    ],
    recommendations: [
      "Implement data minimization",
      "Enhance encryption protocols",
      "Regular privacy audits",
      "User consent tracking"
    ]
  };

  const mockControlFramework = {
    dataGovernance: {
      title: "Data Governance Framework",
      controls: [
        "Data classification policy",
        "Data lifecycle management",
        "Data quality standards",
        "Data lineage tracking"
      ]
    },
    accessControl: {
      title: "Access Control Framework",
      controls: [
        "Identity verification",
        "Permission management",
        "Session monitoring",
        "Privilege escalation controls"
      ]
    },
    monitoring: {
      title: "Monitoring & Auditing",
      controls: [
        "Real-time activity monitoring",
        "Automated alerting",
        "Compliance reporting",
        "Incident response procedures"
      ]
    }
  };

  const mockExplainabilityReport = {
    modelTransparency: "High",
    decisionFactors: [
      "User behavior patterns",
      "Historical data analysis",
      "Risk assessment algorithms",
      "Compliance requirements"
    ],
    interpretabilityMethods: [
      "Feature importance analysis",
      "Decision tree visualization",
      "Local interpretable explanations",
      "Global model explanations"
    ],
    auditTrail: [
      "Data input validation",
      "Processing steps logged",
      "Decision rationale captured",
      "Output verification"
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
              className="lucide lucide-shield-check h-4 w-4"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            Privacy, Control & Explainability
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Privacy Guardian
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Ensure your AI systems are transparent, controllable, and privacy-compliant. 
            Our AI analyzes your data practices and provides comprehensive privacy, control, and explainability frameworks.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your data practices, privacy requirements, and control needs to create comprehensive 
            frameworks for privacy protection, data control, and AI explainability. Get actionable insights to 
            ensure compliance and transparency.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Privacy Analysis</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Data protection assessment</li>
                <li>• Compliance evaluation</li>
                <li>• Risk identification</li>
                <li>• Privacy recommendations</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Control Framework</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Access control design</li>
                <li>• Data governance</li>
                <li>• Monitoring systems</li>
                <li>• Audit procedures</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Explainability</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Model transparency</li>
                <li>• Decision explanations</li>
                <li>• Audit trails</li>
                <li>• Interpretability methods</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Data Form */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Your Privacy Analysis</h2>
          <p className="text-gray-600 mb-6 text-center">Enter your organization's information to generate a comprehensive privacy, control, and explainability analysis</p>
          
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Contact Name *</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Organization *</label>
                <input
                  type="text"
                  name="organization"
                  value={userData.organization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Tech Corp Inc."
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Data Type *</label>
              <input
                type="text"
                name="dataType"
                value={userData.dataType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Personal data, Financial data, Health data"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Privacy Concerns</label>
              <textarea
                name="privacyConcerns"
                value={userData.privacyConcerns}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your main privacy concerns (e.g., data breaches, compliance, user consent)"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Control Requirements</label>
              <textarea
                name="controlRequirements"
                value={userData.controlRequirements}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your control requirements (e.g., access control, data governance, monitoring)"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Explainability Needs</label>
              <textarea
                name="explainabilityNeeds"
                value={userData.explainabilityNeeds}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your explainability needs (e.g., model transparency, decision explanations, audit trails)"
                rows="3"
              />
            </div>
            
            <div className="text-center">
              <button 
                onClick={generatePrivacyAnalysis}
                disabled={isLoading || isPolling}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
              >
                {isLoading ? 'Generating Analysis...' : isPolling ? 'Analyzing Privacy...' : 'Generate Privacy Analysis'}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Analysis - Show mock data for demonstration */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Privacy Analysis Report</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Privacy Overview */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Privacy Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Privacy Score:</span>
                    <span className="font-semibold text-blue-600">{mockPrivacyReport.privacyScore}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Risk Level:</span>
                    <span className="font-semibold text-orange-600">{mockPrivacyReport.riskLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Compliance:</span>
                    <span className="font-semibold text-green-600">{mockPrivacyReport.complianceStatus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Data Retention:</span>
                    <span className="font-semibold text-purple-600">{mockPrivacyReport.dataRetention}</span>
                  </div>
                </div>
                
                {/* Privacy Score Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${mockPrivacyReport.privacyScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Access Controls */}
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Access Controls</h3>
                <ul className="space-y-2">
                  {mockPrivacyReport.accessControls.map((control, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {control}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Privacy Risks */}
            <div className="bg-red-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Privacy Risks</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockPrivacyReport.privacyRisks.map((risk, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    {risk}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-yellow-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Recommendations</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockPrivacyReport.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Control Framework */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Control Framework</h2>
            
            <div className="space-y-6">
              {Object.entries(mockControlFramework).map(([key, data]) => (
                <div key={key} className="border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{data.title}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {data.controls.map((control, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {control}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explainability Report */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Explainability Report</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Model Transparency */}
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Model Transparency</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Transparency Level:</span>
                    <span className="font-semibold text-purple-600">{mockExplainabilityReport.modelTransparency}</span>
                  </div>
                </div>
              </div>
              
              {/* Decision Factors */}
              <div className="bg-indigo-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Decision Factors</h3>
                <ul className="space-y-2">
                  {mockExplainabilityReport.decisionFactors.map((factor, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Interpretability Methods */}
            <div className="bg-teal-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-teal-800 mb-4">Interpretability Methods</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockExplainabilityReport.interpretabilityMethods.map((method, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-teal-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {method}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Audit Trail */}
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Audit Trail</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockExplainabilityReport.auditTrail.map((step, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generating Your Privacy Analysis</h2>
            <p className="text-gray-600 mb-6 text-center">Analyzing your privacy requirements and creating comprehensive frameworks...</p>
            
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

export default PrivacyControlExplainability;

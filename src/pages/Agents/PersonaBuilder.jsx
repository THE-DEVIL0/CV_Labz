import React, { useState } from 'react';

const PersonaBuilder = () => {
  const [personaData, setPersonaData] = useState({
    basicInfo: {
      name: '',
      age: '',
      gender: '',
      location: '',
      occupation: '',
      income: '',
      education: ''
    },
    psychographics: {
      interests: '',
      hobbies: '',
      values: '',
      lifestyle: '',
      personality: '',
      goals: '',
      challenges: ''
    },
    behavior: {
      onlineBehavior: '',
      purchasingHabits: '',
      brandPreferences: '',
      socialMediaUsage: '',
      decisionMaking: '',
      painPoints: ''
    },
    demographics: {
      familyStatus: '',
      homeOwnership: '',
      technologyUsage: '',
      travelFrequency: '',
      shoppingBehavior: '',
      mediaConsumption: ''
    }
  });
  
  const [targetingSettings, setTargetingSettings] = useState({
    industry: '',
    productType: '',
    campaignGoal: '',
    budget: '',
    timeline: '',
    targetAudience: '',
    channels: []
  });
  
  const [builderState, setBuilderState] = useState('idle'); // idle, building, analyzing, completed
  const [personaResults, setPersonaResults] = useState(null);
  const [targetingRecommendations, setTargetingRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [personaHistory, setPersonaHistory] = useState([]);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const handlePersonaInputChange = (section, field, value) => {
    setPersonaData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleTargetingInputChange = (field, value) => {
    setTargetingSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChannelToggle = (channel) => {
    setTargetingSettings(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const pollForPersonaData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkPersonaData = async () => {
      if (!isPollingActive) return;
      
      try {
        const personaRes = await fetch(`${API_BASE}/persona-builder`);
        
        if (!personaRes.ok) {
          console.error('API Error - Persona status:', personaRes.status);
          throw new Error(`API returned status ${personaRes.status}`);
        }
        
        const personaContentType = personaRes.headers.get('content-type');
        
        if (!personaContentType?.includes('application/json')) {
          console.error('Invalid content type - Persona:', personaContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const personaData = await personaRes.json();
        
        console.log('Persona response:', personaData);
        
        if (personaData && personaData.persona) {
          setPersonaResults(personaData.persona);
          setTargetingRecommendations(personaData.recommendations || []);
          setBuilderState('completed');
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Persona analysis completed successfully!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for persona data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkPersonaData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for persona data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkPersonaData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve persona data.');
        }
      }
    };
    
    checkPersonaData();
  };

  const startPersonaBuilder = async () => {
    // Validate required fields
    const requiredFields = ['name', 'age', 'occupation'];
    const missingFields = requiredFields.filter(field => !personaData.basicInfo[field]);
    
    if (missingFields.length > 0) {
      showWebhookMessage('error', `Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!targetingSettings.industry || !targetingSettings.productType) {
      showWebhookMessage('error', 'Please fill in industry and product type for targeting.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setBuilderState('building');
    setPersonaResults(null);
    setTargetingRecommendations([]);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/persona-builder-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaData: personaData,
          targetingSettings: targetingSettings
        }),
      });

      if (response.ok) {
        showWebhookMessage('success', 'Persona builder setup successfully! Analyzing data...');
        setIsLoading(false);
        setIsPolling(true);
        pollForPersonaData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error starting persona builder:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      setBuilderState('idle');
      showWebhookMessage('error', 'Failed to start persona builder. Please try again.');
    }
  };

  const savePersona = () => {
    const newPersona = {
      id: Date.now(),
      name: personaData.basicInfo.name,
      data: personaData,
      targeting: targetingSettings,
      results: personaResults,
      recommendations: targetingRecommendations,
      timestamp: new Date().toLocaleString()
    };
    
    setPersonaHistory(prev => [...prev, newPersona]);
    showWebhookMessage('success', 'Persona saved successfully!');
  };

  const resetBuilder = () => {
    setPersonaData({
      basicInfo: { name: '', age: '', gender: '', location: '', occupation: '', income: '', education: '' },
      psychographics: { interests: '', hobbies: '', values: '', lifestyle: '', personality: '', goals: '', challenges: '' },
      behavior: { onlineBehavior: '', purchasingHabits: '', brandPreferences: '', socialMediaUsage: '', decisionMaking: '', painPoints: '' },
      demographics: { familyStatus: '', homeOwnership: '', technologyUsage: '', travelFrequency: '', shoppingBehavior: '', mediaConsumption: '' }
    });
    setTargetingSettings({
      industry: '', productType: '', campaignGoal: '', budget: '', timeline: '', targetAudience: '', channels: []
    });
    setBuilderState('idle');
    setPersonaResults(null);
    setTargetingRecommendations([]);
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
              className="lucide lucide-users h-4 w-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="m22 21-2-2"/>
              <path d="M16 16l2 2"/>
            </svg>
            Persona Builder
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Persona Builder & Targeting Optimizer
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Build detailed customer personas and optimize your targeting strategies for maximum marketing effectiveness.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI-powered persona builder analyzes demographic, psychographic, and behavioral data to create comprehensive 
            customer profiles. It then optimizes targeting strategies across multiple channels for maximum ROI.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Persona Building</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Demographic analysis</li>
                <li>• Psychographic profiling</li>
                <li>• Behavioral insights</li>
                <li>• Pain point identification</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Targeting Optimization</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Channel recommendations</li>
                <li>• Budget allocation</li>
                <li>• Campaign optimization</li>
                <li>• ROI prediction</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Persona Builder Form - Only show when idle */}
        {builderState === 'idle' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Build Your Customer Persona</h2>
            <p className="text-gray-600 mb-6 text-center">Fill in the details to create a comprehensive customer profile</p>
            
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Basic Information */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      value={personaData.basicInfo.name}
                      onChange={(e) => handlePersonaInputChange('basicInfo', 'name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Sarah Johnson"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Age *</label>
                    <input
                      type="text"
                      value={personaData.basicInfo.age}
                      onChange={(e) => handlePersonaInputChange('basicInfo', 'age', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 28-35"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Gender</label>
                    <select
                      value={personaData.basicInfo.gender}
                      onChange={(e) => handlePersonaInputChange('basicInfo', 'gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={personaData.basicInfo.location}
                      onChange={(e) => handlePersonaInputChange('basicInfo', 'location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Occupation *</label>
                    <input
                      type="text"
                      value={personaData.basicInfo.occupation}
                      onChange={(e) => handlePersonaInputChange('basicInfo', 'occupation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Marketing Manager"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Income Level</label>
                    <select
                      value={personaData.basicInfo.income}
                      onChange={(e) => handlePersonaInputChange('basicInfo', 'income', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select income level</option>
                      <option value="under-30k">Under $30,000</option>
                      <option value="30k-50k">$30,000 - $50,000</option>
                      <option value="50k-75k">$50,000 - $75,000</option>
                      <option value="75k-100k">$75,000 - $100,000</option>
                      <option value="over-100k">Over $100,000</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Psychographics */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Psychographics</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Interests</label>
                    <textarea
                      value={personaData.psychographics.interests}
                      onChange={(e) => handlePersonaInputChange('psychographics', 'interests', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Technology, fitness, travel, cooking"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Values</label>
                    <textarea
                      value={personaData.psychographics.values}
                      onChange={(e) => handlePersonaInputChange('psychographics', 'values', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Sustainability, innovation, work-life balance"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Goals</label>
                    <textarea
                      value={personaData.psychographics.goals}
                      onChange={(e) => handlePersonaInputChange('psychographics', 'goals', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Career advancement, financial security, personal growth"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Challenges</label>
                    <textarea
                      value={personaData.psychographics.challenges}
                      onChange={(e) => handlePersonaInputChange('psychographics', 'challenges', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Time management, budget constraints, work stress"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Behavior */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Behavior & Preferences</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Online Behavior</label>
                    <textarea
                      value={personaData.behavior.onlineBehavior}
                      onChange={(e) => handlePersonaInputChange('behavior', 'onlineBehavior', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Heavy social media user, online shopping, research before purchase"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Purchasing Habits</label>
                    <textarea
                      value={personaData.behavior.purchasingHabits}
                      onChange={(e) => handlePersonaInputChange('behavior', 'purchasingHabits', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Comparison shopping, brand loyalty, impulse buying"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Pain Points</label>
                    <textarea
                      value={personaData.behavior.painPoints}
                      onChange={(e) => handlePersonaInputChange('behavior', 'painPoints', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Limited time, budget constraints, decision paralysis"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Decision Making</label>
                    <textarea
                      value={personaData.behavior.decisionMaking}
                      onChange={(e) => handlePersonaInputChange('behavior', 'decisionMaking', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Research-driven, peer recommendations, brand trust"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Targeting Settings */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Targeting Settings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Industry *</label>
                    <input
                      type="text"
                      value={targetingSettings.industry}
                      onChange={(e) => handleTargetingInputChange('industry', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Technology, Healthcare, Finance"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Product Type *</label>
                    <input
                      type="text"
                      value={targetingSettings.productType}
                      onChange={(e) => handleTargetingInputChange('productType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., SaaS, Physical Product, Service"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Campaign Goal</label>
                    <select
                      value={targetingSettings.campaignGoal}
                      onChange={(e) => handleTargetingInputChange('campaignGoal', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select goal</option>
                      <option value="awareness">Brand Awareness</option>
                      <option value="consideration">Consideration</option>
                      <option value="conversion">Conversion</option>
                      <option value="retention">Customer Retention</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Budget</label>
                    <input
                      type="text"
                      value={targetingSettings.budget}
                      onChange={(e) => handleTargetingInputChange('budget', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., $10,000 - $50,000"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-gray-700 font-medium mb-2">Target Channels</label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {['Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Email', 'Content Marketing', 'Influencer Marketing', 'Retargeting', 'SEO'].map((channel) => (
                      <label key={channel} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={targetingSettings.channels.includes(channel)}
                          onChange={() => handleChannelToggle(channel)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <button 
                  onClick={startPersonaBuilder}
                  disabled={isLoading || isPolling}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? 'Building Persona...' : isPolling ? 'Analyzing Data...' : 'Build Persona & Optimize Targeting'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Persona Results */}
        {personaResults && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Persona Analysis Results</h2>
              <div className="flex gap-2">
                <button 
                  onClick={savePersona}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  Save Persona
                </button>
                <button 
                  onClick={resetBuilder}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  Build New Persona
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Persona Summary */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Persona Summary</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Name: </span>
                    <span className="text-gray-600">{personaData.basicInfo.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Age: </span>
                    <span className="text-gray-600">{personaData.basicInfo.age}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Occupation: </span>
                    <span className="text-gray-600">{personaData.basicInfo.occupation}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location: </span>
                    <span className="text-gray-600">{personaData.basicInfo.location}</span>
                  </div>
                </div>
              </div>
              
              {/* Key Insights */}
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Key Insights</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">• Primary motivation: {personaData.psychographics.goals}</p>
                  <p className="text-gray-700">• Main challenge: {personaData.behavior.painPoints}</p>
                  <p className="text-gray-700">• Decision style: {personaData.behavior.decisionMaking}</p>
                  <p className="text-gray-700">• Online behavior: {personaData.behavior.onlineBehavior}</p>
                </div>
              </div>
            </div>
            
            {/* Targeting Recommendations */}
            {targetingRecommendations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Targeting Recommendations</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {targetingRecommendations.map((rec, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
                      <p className="text-gray-600 text-sm">{rec.description}</p>
                      {rec.priority && (
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority} priority
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Persona History */}
        {personaHistory.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Saved Personas</h2>
            <div className="space-y-4">
              {personaHistory.map((persona, index) => (
                <div key={persona.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">{persona.timestamp}</span>
                    <span className="text-sm font-medium text-blue-600">{persona.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Occupation: </span>
                      <span className="text-gray-600">{persona.data.basicInfo.occupation}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Industry: </span>
                      <span className="text-gray-600">{persona.targeting.industry}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Product: </span>
                      <span className="text-gray-600">{persona.targeting.productType}</span>
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Building Your Persona</h2>
            <p className="text-gray-600 mb-6 text-center">Analyzing data and optimizing targeting strategies...</p>
            
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

export default PersonaBuilder;

import React, { useState } from 'react';

const ProgressDashboardLearningLoop = () => {
  const [userData, setUserData] = useState({
    name: '',
    currentRole: '',
    targetRole: '',
    experience: '',
    skills: ''
  });
  
  const [progressData, setProgressData] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
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

  const pollForProgressData = async () => {
    const API_BASE = "https://delightful-passion-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;
    
    const checkProgressData = async () => {
      if (!isPollingActive) return;
      
      try {
        const progressRes = await fetch(`${API_BASE}/progress-dashboard`);
        
        if (!progressRes.ok) {
          console.error('API Error - Progress status:', progressRes.status);
          throw new Error(`API returned status ${progressRes.status}`);
        }
        
        const progressContentType = progressRes.headers.get('content-type');
        
        if (!progressContentType?.includes('application/json')) {
          console.error('Invalid content type - Progress:', progressContentType);
          throw new Error('API returned non-JSON response');
        }
        
        const progressData = await progressRes.json();
        
        console.log('Progress response:', progressData);
        
        if (progressData && progressData.length > 0) {
          setProgressData(progressData[0]);
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Progress dashboard generated successfully!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for progress data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkProgressData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No data received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for progress data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkProgressData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to retrieve progress data.');
        }
      }
    };
    
    checkProgressData();
  };

  const generateProgressDashboard = async () => {
    if (!userData.name.trim() || !userData.currentRole.trim() || !userData.targetRole.trim()) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setProgressData(null);
    setLearningPath(null);

    try {
      const response = await fetch('https://delightful-passion-production.up.railway.app/progress-dashboard-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          currentRole: userData.currentRole,
          targetRole: userData.targetRole,
          experience: userData.experience,
          skills: userData.skills
        }),
      });

      if (response.ok) {
        showWebhookMessage('success', 'Progress dashboard request sent successfully! Generating insights...');
        setIsLoading(false);
        setIsPolling(true);
        pollForProgressData();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating progress dashboard:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showWebhookMessage('error', 'Failed to generate progress dashboard. Please try again.');
    }
  };

  // Mock data for demonstration
  const mockProgressData = {
    currentLevel: "Intermediate",
    targetLevel: "Advanced",
    progressPercentage: 65,
    skillsGap: [
      "Advanced React Patterns",
      "System Design",
      "Leadership Skills",
      "Cloud Architecture"
    ],
    completedMilestones: [
      "Basic React Development",
      "State Management",
      "API Integration",
      "Testing Fundamentals"
    ],
    nextSteps: [
      "Complete Advanced React Course",
      "Practice System Design Problems",
      "Take Leadership Workshop",
      "Learn AWS/Azure Fundamentals"
    ],
    estimatedTimeToTarget: "6-8 months",
    recommendedResources: [
      "React Advanced Patterns Course",
      "System Design Interview Book",
      "Leadership in Tech Workshop",
      "Cloud Architecture Certification"
    ]
  };

  const mockLearningPath = {
    phase1: {
      title: "Foundation Strengthening",
      duration: "2-3 months",
      tasks: [
        "Complete advanced React patterns",
        "Master state management",
        "Improve testing skills"
      ]
    },
    phase2: {
      title: "Skill Expansion",
      duration: "2-3 months", 
      tasks: [
        "Learn system design principles",
        "Practice architecture patterns",
        "Develop leadership skills"
      ]
    },
    phase3: {
      title: "Advanced Implementation",
      duration: "2 months",
      tasks: [
        "Cloud architecture certification",
        "Lead technical projects",
        "Mentor junior developers"
      ]
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
              className="lucide lucide-trending-up h-4 w-4"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
            Progress Dashboard & Learning Loop
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Progress Tracker
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Track your career progress and get personalized learning paths. 
            Our AI analyzes your current skills and creates a roadmap to your target role.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How It Works</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your current skills, experience, and career goals to create a comprehensive 
            progress dashboard and personalized learning loop. Get actionable insights and a clear path 
            to advance your career.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">What You Get</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Progress tracking dashboard</li>
                <li>• Skills gap analysis</li>
                <li>• Personalized learning path</li>
                <li>• Milestone tracking</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Perfect For</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Career advancement</li>
                <li>• Skill development</li>
                <li>• Learning planning</li>
                <li>• Progress monitoring</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Data Form */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Your Progress Dashboard</h2>
          <p className="text-gray-600 mb-6 text-center">Enter your career information to generate a personalized progress dashboard</p>
          
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Your Name *</label>
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
                <label className="block text-gray-700 font-medium mb-2">Current Role *</label>
                <input
                  type="text"
                  name="currentRole"
                  value={userData.currentRole}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Junior Developer"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Target Role *</label>
              <input
                type="text"
                name="targetRole"
                value={userData.targetRole}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior Developer"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Years of Experience</label>
              <input
                type="text"
                name="experience"
                value={userData.experience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 3 years"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Current Skills</label>
              <textarea
                name="skills"
                value={userData.skills}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="List your current skills (e.g., React, JavaScript, Node.js, etc.)"
                rows="3"
              />
            </div>
            
            <div className="text-center">
              <button 
                onClick={generateProgressDashboard}
                disabled={isLoading || isPolling}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
              >
                {isLoading ? 'Generating Dashboard...' : isPolling ? 'Analyzing Progress...' : 'Generate Progress Dashboard'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Dashboard - Show mock data for demonstration */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Progress Dashboard</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Progress Overview */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Progress Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Current Level:</span>
                    <span className="font-semibold text-blue-600">{mockProgressData.currentLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Target Level:</span>
                    <span className="font-semibold text-green-600">{mockProgressData.targetLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Progress:</span>
                    <span className="font-semibold text-blue-600">{mockProgressData.progressPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Time to Target:</span>
                    <span className="font-semibold text-orange-600">{mockProgressData.estimatedTimeToTarget}</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${mockProgressData.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Skills Gap */}
              <div className="bg-red-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Skills Gap</h3>
                <ul className="space-y-2">
                  {mockProgressData.skillsGap.map((skill, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Completed Milestones */}
            <div className="bg-green-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Completed Milestones</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockProgressData.completedMilestones.map((milestone, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {milestone}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Next Steps */}
            <div className="bg-yellow-50 p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Next Steps</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockProgressData.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recommended Resources */}
            <div className="bg-purple-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Recommended Resources</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockProgressData.recommendedResources.map((resource, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {resource}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Learning Path */}
        {!showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Personalized Learning Path</h2>
            
            <div className="space-y-6">
              {Object.entries(mockLearningPath).map(([phase, data]) => (
                <div key={phase} className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{data.title}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {data.duration}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {data.tasks.map((task, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generating Your Progress Dashboard</h2>
            <p className="text-gray-600 mb-6 text-center">Analyzing your skills and creating personalized insights...</p>
            
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

export default ProgressDashboardLearningLoop;

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api'; // Adjust path as needed

const AIInterviewSimulator = () => {
  const [interviewSettings, setInterviewSettings] = useState({
    job_role: '',
    job_description: ''
  });
  
  const [simulationState, setSimulationState] = useState('idle'); // idle, interviewing, completed
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [rating, setRating] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInterviewSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const pollForQuestion = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkQuestionData = async () => {
      if (!isPollingActive) return;

      try {
        const response = await apiService.apiCall('/interview-simulator-question-output');
        const data = response.data;

        console.log('Question response:', data);

        if (data.question) {
          setCurrentQuestion(data.question);
          setSimulationState('interviewing');
          setShowSkeleton(false);
          setIsLoading(false);
          isPollingActive = false;
          showWebhookMessage('success', `Question ${questionCount + 1} received!`);
          return true;
        } else if (data.message === 'All questions completed') {
          // Start polling for rating
          setShowSkeleton(true);
          setIsLoading(true);
          isPollingActive = false;
          pollForRating();
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for question data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkQuestionData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setCurrentQuestion('No question data available after timeout.');
            setIsLoading(false);
            isPollingActive = false;
            setSimulationState('completed');
            showWebhookMessage('error', 'Timeout: No question received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for question data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkQuestionData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setCurrentQuestion('Error retrieving question data.');
          setIsLoading(false);
          isPollingActive = false;
          setSimulationState('completed');
          showWebhookMessage('error', 'Failed to retrieve question data.');
        }
      }
    };

    checkQuestionData();
  };

  const pollForRating = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkRatingData = async () => {
      if (!isPollingActive) return;

      try {
        const response = await apiService.apiCall('/interview-simulator-rating-output');
        const data = response.data;

        console.log('Rating response:', data);

        if (data.rating) {
          setRating(data.rating);
          setSimulationState('completed');
          setShowSkeleton(false);
          setIsLoading(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Rating received!');
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for rating data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkRatingData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setRating('No rating data available after timeout.');
            setIsLoading(false);
            isPollingActive = false;
            setSimulationState('completed');
            showWebhookMessage('error', 'Timeout: No rating received after 5 minutes.');
          }
        }
      } catch (error) {
        console.error('Error polling for rating data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkRatingData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setRating('Error retrieving rating data.');
          setIsLoading(false);
          isPollingActive = false;
          setSimulationState('completed');
          showWebhookMessage('error', 'Failed to retrieve rating data.');
        }
      }
    };

    checkRatingData();
  };

  const startSimulation = async () => {
    if (!interviewSettings.job_role.trim() || !interviewSettings.job_description.trim()) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setSimulationState('interviewing');
    setCurrentQuestion('');
    setUserAnswer('');
    setRating('');
    setInterviewHistory([]);
    setQuestionCount(0);

    try {
      await apiService.apiCall('/interview-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewSettings)
      });
      showWebhookMessage('success', 'Interview simulation started! Polling for first question...');
      pollForQuestion();
    } catch (error) {
      console.error('Error starting simulation:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      setSimulationState('idle');
      showWebhookMessage('error', 'Failed to start interview simulation.');
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      showWebhookMessage('error', 'Please provide an answer before submitting.');
      return;
    }

    // Add current Q&A to history
    const newHistoryEntry = {
      question: currentQuestion,
      answer: userAnswer,
      timestamp: new Date().toLocaleTimeString()
    };
    setInterviewHistory(prev => [...prev, newHistoryEntry]);

    try {
      await apiService.apiCall('/interview-simulator-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: userAnswer })
      });

      setQuestionCount(prev => {
        const newCount = prev + 1;
        if (newCount < 5) {
          setShowSkeleton(true);
          setIsLoading(true);
          setCurrentQuestion('');
          setUserAnswer('');
          pollForQuestion();
        } else {
          setShowSkeleton(true);
          setIsLoading(true);
          setCurrentQuestion('');
          setUserAnswer('');
          pollForRating();
        }
        return newCount;
      });
      showWebhookMessage('success', 'Answer submitted! Waiting for next question...');
    } catch (error) {
      console.error('Error submitting answer:', error);
      showWebhookMessage('error', 'Failed to submit answer.');
      setIsLoading(false);
      setShowSkeleton(false);
    }
  };

  const endSimulation = async () => {
    try {
      await apiService.apiCall('/interview-simulator-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setSimulationState('completed');
      setCurrentQuestion('');
      setUserAnswer('');
      setRating('');
      setShowSkeleton(false);
      setIsLoading(false);
      showWebhookMessage('success', 'Interview simulation ended.');
    } catch (error) {
      console.error('Error ending simulation:', error);
      showWebhookMessage('error', 'Failed to end simulation.');
    }
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    let isPollingActive = true;
    return () => {
      isPollingActive = false; // Signal to stop polling
    };
  }, []);

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
              className="lucide lucide-mic h-4 w-4"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="23"/>
              <line x1="8" x2="16" y1="23" y2="23"/>
            </svg>
            AI Interview Simulator
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Interview Simulator
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Practice your interview skills with our AI-powered interview simulator. 
            Get real-time questions and performance ratings to improve your confidence.
          </p>
        </div>

        {/* Interview Settings Form - Only show when idle */}
        {simulationState === 'idle' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Configure Your Interview</h2>
            <p className="text-gray-600 mb-6 text-center">Set up your interview simulation parameters</p>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Job Role *</label>
                  <input
                    type="text"
                    name="job_role"
                    value={interviewSettings.job_role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter job role (e.g., Software Engineer)"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Job Description *</label>
                  <textarea
                    name="job_description"
                    value={interviewSettings.job_description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter job description"
                    rows="4"
                    required
                  />
                </div>
              </div>
              
              <div className="text-center">
                <button 
                  onClick={startSimulation}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? 'Setting Up Simulation...' : 'Start Interview Simulation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Simulation Interface */}
        {simulationState === 'interviewing' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Interview in Progress (Question {questionCount + 1}/5)</h2>
              <button 
                onClick={endSimulation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                End Simulation
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Current Question */}
              {currentQuestion && (
                <div className="bg-blue-50 p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Question {questionCount + 1}:</h3>
                  <p className="text-gray-700 text-lg">{currentQuestion}</p>
                </div>
              )}
              
              {/* Answer Input */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Your Answer:</label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Type your answer here..."
                  rows="4"
                />
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={submitAnswer}
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
                  >
                    Submit Answer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview History */}
        {interviewHistory.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Interview History</h2>
            <div className="space-y-4">
              {interviewHistory.map((entry, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">{entry.timestamp}</span>
                    <span className="text-sm font-medium text-blue-600">Q&A #{index + 1}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Q: </span>
                      <span className="text-gray-600">{entry.question}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">A: </span>
                      <span className="text-gray-600">{entry.answer}</span>
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {questionCount < 5 ? 'Fetching Next Question' : 'Fetching Your Rating'}
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              {questionCount < 5 ? 'Preparing your next interview question...' : 'Calculating your performance rating...'}
            </p>
            
            <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 min-h-[200px]">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Complete */}
        {simulationState === 'completed' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Simulation Complete!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Great job completing the interview simulation. Review your performance below.
            </p>
            
            {rating && (
              <div className="bg-green-50 p-6 rounded-2xl mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Your Performance Rating:</h3>
                <p className="text-gray-700 text-lg">{rating}</p>
              </div>
            )}
            
            <div className="text-center">
              <button 
                onClick={() => {
                  setSimulationState('idle');
                  setInterviewHistory([]);
                  setInterviewSettings({
                    job_role: '',
                    job_description: ''
                  });
                  setRating('');
                  setQuestionCount(0);
                }}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
              >
                Start New Simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInterviewSimulator;
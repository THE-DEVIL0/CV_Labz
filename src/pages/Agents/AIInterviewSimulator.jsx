import React, { useState, useEffect } from 'react';
import apiService from '../../services/api'; // Adjust path as needed

const AIInterviewSimulator = () => {
  const [interviewSettings, setInterviewSettings] = useState({
    job_role: '',
    job_description: '',
    userId:"12345"
  });
  const [backendJobRole, setBackendJobRole] = useState('');
  const [backendJobDescription, setBackendJobDescription] = useState('');
  const [simulationState, setSimulationState] = useState('idle'); // idle, interviewing, completed
  const [questions, setQuestions] = useState([]); // Array to store all questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track current question
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState([]); // Store answers as [{question_id, question, candidate_answer}, ...]
  const [rating, setRating] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [showSkeleton, setShowSkeleton] = useState(false);

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInterviewSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetInterface = () => {
    setSimulationState('idle');
    setInterviewSettings({ job_role: '', job_description: '',userId:"12345"});
    setBackendJobRole('');
    setBackendJobDescription('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setAnswers([]);
    setRating('');
    setIsLoading(false);
    setShowSkeleton(false);
  };

  const pollForQuestion = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkQuestionData = async () => {
      if (!isPollingActive) return;

      try {
        const response = await apiService.apiCall('/interviews/interview-simulator-question', {
          method: 'GET',
        });
        const data = response.data;

        console.log('Questions response:', data);

        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setBackendJobRole(data.job_role || '');
          setBackendJobDescription(data.job_description || '');
          setSimulationState('interviewing');
          setShowSkeleton(false);
          setIsLoading(false);
          isPollingActive = false;
          showWebhookMessage('success', `Received ${data.questions.length} questions! Starting interview...`);
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for question data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkQuestionData, 10000); // Poll every 10 seconds
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setIsLoading(false);
            isPollingActive = false;
            setSimulationState('interviewing');
            showWebhookMessage('error', 'Timeout: No questions received after 150 seconds.');
          }
        }
      } catch (error) {
        console.error('Error polling for question data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkQuestionData, 10000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setIsLoading(false);
          isPollingActive = false;
          setSimulationState('interviewing');
          showWebhookMessage('error', 'Failed to retrieve questions.');
        }
      }
    };

    checkQuestionData();
    return () => {
      isPollingActive = false;
    };
  };

  const pollForRating = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkRatingData = async () => {
      if (!isPollingActive) return;

      try {
        const response = await apiService.apiCall('/interviews/interview-simulator-rating', {
          method: 'GET',
        });
        console.log('Raw rating response:', response);
        const ratings = response.data.data;

        console.log('Rating response:', ratings);
        console.log(Array.isArray(ratings), ratings.length);

        if (Array.isArray(ratings) && ratings.length > 0) {
          setRating(ratings);
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
            setTimeout(checkRatingData, 10000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setRating([]);
            setIsLoading(false);
            isPollingActive = false;
            setSimulationState('completed');
            showWebhookMessage('error', 'Timeout: No rating received after 150 seconds.');
          }
        }
      } catch (error) {
        console.error('Error polling for rating data:', error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkRatingData, 10000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setRating([]);
          setIsLoading(false);
          isPollingActive = false;
          setSimulationState('completed');
          showWebhookMessage('error', 'Failed to retrieve rating data.');
        }
      }
    };

    checkRatingData();
    return () => {
      isPollingActive = false;
    };
  };

  const startSimulation = async () => {
    if (!interviewSettings.job_role.trim() || !interviewSettings.job_description.trim()) {
      showWebhookMessage('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setSimulationState('interviewing');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setAnswers([]);
    setRating('');
    setBackendJobRole('');
    setBackendJobDescription('');

    try {
      await apiService.apiCall('/interviews/interview-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewSettings),
      });
      showWebhookMessage('success', 'Interview simulation started! Polling for questions...');
      pollForQuestion();
    } catch (error) {
      console.error('Error starting simulation:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      setSimulationState('idle');
      showWebhookMessage('error', 'Failed to start interview simulation.');
    }
  };

  const submitAnswer = () => {
    if (!userAnswer.trim()) {
      showWebhookMessage('error', 'Please provide an answer before submitting.');
      return;
    }

    // Store the answer locally in the required format
    setAnswers((prev) => [
      ...prev,
      {
        question_id: questions[currentQuestionIndex].id,
        question: questions[currentQuestionIndex].question,
        candidate_answer: userAnswer,
        type: questions[currentQuestionIndex].type,
      },
    ]);

    setUserAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      // Move to the next question
      setCurrentQuestionIndex((prev) => prev + 1);
      showWebhookMessage('success', `Answer saved! Moving to question ${currentQuestionIndex + 2}...`);
    } else {
      // All questions answered
      showWebhookMessage('success', 'All questions answered! You can now request your rating.');
    }
  };

  const handleShowRating = async () => {
    if (answers.length < questions.length) {
      showWebhookMessage('error', 'Please answer all questions before requesting a rating.');
      return;
    }

    setShowSkeleton(true);
    setIsLoading(true);
    showWebhookMessage('info', 'Fetching your performance rating...');

    try {
      // Send answers to the backend in the required structure
      const payload = {
        output: {
          job_role: backendJobRole,
          job_description: backendJobDescription,
          answers: answers,
        },
      };
      console.log('Sending answers to backend:', payload);
      await apiService.apiCall('/interviews/interview-simulator-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      showWebhookMessage('success', 'Answers submitted! Polling for rating...');
      pollForRating();
    } catch (error) {
      console.error('Error submitting answers:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showWebhookMessage('error', 'Failed to submit answers.');
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
      <style >{`
        @keyframes tickAnimation {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .tick-animate {
          animation: tickAnimation 0.5s ease-out;
        }
      `}</style>
      <div className="px-4 md:px-8 lg:px-12 py-8">
        

        {/* Webhook Message */}
        {webhookMessage.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              webhookMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : webhookMessage.type === 'info'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
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
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="23" />
              <line x1="8" x2="16" y1="23" y2="23" />
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
        {simulationState === 'interviewing' && questions.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Interview in Progress (Question {currentQuestionIndex + 1}/{questions.length})
              </h2>
            </div>

            <div className="space-y-6">
              {/* Show question and answer input only if not all questions are answered */}
              {answers.length < questions.length && (
                <>
                  {/* Current Question */}
                  <div className="bg-blue-50 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">Question {currentQuestionIndex + 1}:</h3>
                    {questions[currentQuestionIndex] && (
                      <div>
                        <p className="text-gray-700 text-lg mb-2">{questions[currentQuestionIndex].question}</p>
                        <div className="text-sm text-gray-500 mb-1">
                          <span className="mr-4"><b>Type:</b> {questions[currentQuestionIndex].type}</span>
                        </div>
                      </div>
                    )}
                  </div>

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
                    <div className="mt-3 flex justify-end gap-3">
                      <button
                        onClick={submitAnswer}
                        disabled={isLoading || !userAnswer.trim()}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
                      >
                        Submit Answer
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* All Questions Answered UI */}
              {answers.length === questions.length && (
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600 tick-animate"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    All questions answered, you can now ask for a rating
                  </h3>
                  <button
                    onClick={handleShowRating}
                    disabled={isLoading}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
                  >
                    Show Rating
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {currentQuestionIndex < questions.length ? 'Fetching Your Rating' : 'Fetching Questions'}
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              {currentQuestionIndex < questions.length
                ? 'Calculating your performance rating...'
                : 'Preparing your interview questions...'}
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

            {Array.isArray(rating) && rating.length > 0 && (
              <div className="space-y-6 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Your Question-wise Ratings:</h3>
                {rating.map((item, idx) => (
                  <div key={item.question_id || idx} className="bg-green-50 p-6 rounded-2xl shadow">
                    <div className="mb-2">
                      <span className="font-semibold text-blue-700">Q{idx + 1}:</span>
                      <span className="ml-2 text-gray-800">{item.question}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-gray-700">Your Answer:</span>
                      <span className="ml-2 text-gray-700">{item.candidate_answer}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-purple-700">Feedback:</span>
                      <span className="ml-2 text-purple-700">{item.feedback}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-purple-700">Rating:</span>
                      <span className="ml-2 text-purple-700">{item.score}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-green-700">Strengths:</span>
                      <span className="ml-2 text-green-700">{item.strengths}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-red-700">Weaknesses:</span>
                      <span className="ml-2 text-red-700">{item.weaknesses}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-yellow-700">Improvement Suggestion:</span>
                      <span className="ml-2 text-yellow-700">{item.improvement_suggestions}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={resetInterface}
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
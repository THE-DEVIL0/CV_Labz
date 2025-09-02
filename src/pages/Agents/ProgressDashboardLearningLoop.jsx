import React, { useState, useEffect } from 'react';

const InterviewFeedbackDashboard = () => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const API_BASE = "https://delightful-passion-production.up.railway.app/progress";

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    setTimeout(() => {
      setMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  // Send POST request when component loads
  useEffect(() => {
    const triggerDataGeneration = async () => {
      try {
        const response = await fetch(`${API_BASE}/progress-data-req`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          console.log('Data generation triggered successfully');
        } else {
          console.error('Failed to trigger data generation');
        }
      } catch (error) {
        console.error('Error triggering data generation:', error);
      }
    };

    triggerDataGeneration();
  }, []);

  const startPolling = async () => {
    setIsPolling(true);
    setPollingAttempts(0);
    showMessage('info', 'Fetching your interview feedback...');
    pollForData();
  };

  const pollForData = async () => {
    const maxAttempts = 15;
    
    if (pollingAttempts >= maxAttempts) {
      showMessage('error', 'Timeout: No feedback data received after multiple attempts.');
      setIsPolling(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/progress-data`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.output && data.output.review) {
          setFeedbackData(data.output);
          setIsPolling(false);
          showMessage('success', 'Feedback data loaded successfully!');
          return;
        } else if (data.message === "No data available") {
          // Data not ready yet, continue polling
          setPollingAttempts(prev => prev + 1);
          setTimeout(pollForData, 10000);
        } else {
          // Unexpected response, stop polling
          showMessage('error', 'Unexpected response from server.');
          setIsPolling(false);
        }
      } else {
        // HTTP error, stop polling
        showMessage('error', 'Server error while fetching data.');
        setIsPolling(false);
      }
    } catch (error) {
      console.error('Error polling for data:', error);
      setPollingAttempts(prev => prev + 1);
      
      // Only continue polling for network errors, not for other errors
      if (pollingAttempts < maxAttempts - 1) {
        setTimeout(pollForData, 10000);
      } else {
        showMessage('error', 'Failed to retrieve feedback data after multiple attempts.');
        setIsPolling(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Message Notification */}
        {message.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Interview Feedback Dashboard
          </h1>
          <p className="text-gray-600">
            Review your interview performance and get personalized suggestions for improvement
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Interview Feedback</h2>
              <p className="text-gray-600">
                {feedbackData 
                  ? "Review your performance and areas for improvement" 
                  : "Click below to retrieve your personalized interview feedback"}
              </p>
            </div>
            <button 
              onClick={startPolling}
              disabled={isPolling || feedbackData}
              className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {isPolling ? 'Fetching Feedback...' : feedbackData ? 'Feedback Ready' : 'Show Progress'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isPolling && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <span className="text-gray-600">
                Retrieving your feedback... Attempt {pollingAttempts + 1}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments while we process your interview data
              </p>
            </div>
          </div>
        )}

        {/* Feedback Data */}
        {feedbackData && (
          <div className="space-y-6">
            {/* Overall Review */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Overall Review
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">{feedbackData.review}</p>
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Areas for Improvement
              </h2>
              <div className="space-y-3">
                {feedbackData.weaknesses && feedbackData.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-start bg-red-50 p-3 rounded-lg">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mt-1">
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">{weakness}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Recommendations
              </h2>
              <div className="space-y-3">
                {feedbackData.suggestions && feedbackData.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start bg-green-50 p-3 rounded-lg">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Plan */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Action Plan
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Based on your feedback, here's a recommended action plan:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li className="text-gray-700">Focus on one improvement area at a time</li>
                  <li className="text-gray-700">Schedule regular practice sessions</li>
                  <li className="text-gray-700">Seek feedback after implementing changes</li>
                  <li className="text-gray-700">Track your progress over time</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!feedbackData && !isPolling && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No feedback yet</h3>
            <p className="mt-2 text-gray-500">
              Click "Show Progress" to retrieve your personalized interview feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewFeedbackDashboard;
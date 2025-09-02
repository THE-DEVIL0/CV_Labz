import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const Agent4 = () => {
  const [file, setFile] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [textOutput, setTextOutput] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);

  const API_BASE = "https://delightful-passion-production.up.railway.app";

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadMessage('PDF file selected. Click "Upload PDF to Server" to upload.');
    } else {
      setFile(null);
      setUploadMessage('Please upload a valid PDF file.');
    }
  };

  const uploadPDF = async () => {
    if (!file) {
      showWebhookMessage('error', 'Please select a PDF file to upload.');
      return;
    }

    setIsUploading(true);

    try {
      console.log("📤 Starting PDF upload...");
      console.log("   👉 File object:", file);
      console.log("   📄 File name:", file.name);
      console.log("   📑 File type:", file.type);
      console.log("   📏 File size:", file.size, "bytes");

      const formData = new FormData();
      formData.append('pdf', file);

      console.log("📦 Checking FormData before sending...");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`   🔹 Key: ${key}, File name: ${value.name}, type: ${value.type}, size: ${value.size}`);
        } else {
          console.log(`   🔹 Key: ${key}, Value: ${value}`);
        }
      }

      console.log("🚀 Sending request to backend:", `${API_BASE}/memory/upload`);

      const response = await fetch(`${API_BASE}/memory/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      console.log("📥 Backend responded, status:", response.status);

      let uploadResponse;
      try {
        uploadResponse = await response.json();
      } catch (parseErr) {
        console.error("❌ Failed to parse JSON from backend:", parseErr);
        throw new Error("Backend did not return JSON");
      }

      console.log("✅ Backend JSON:", uploadResponse);

      if (response.ok) {
        showWebhookMessage('success', 'PDF uploaded successfully to server!');
        setPdfUploaded(true);
        setUploadMessage('PDF successfully uploaded to server! Processing...');

        setTimeout(() => {
          setUploadMessage('PDF processing completed! Enabling input field in 5 seconds...');
          setTimeout(() => {
            setUploadMessage('Input field is now enabled!');
            setInputEnabled(true);
            showWebhookMessage('success', 'Input field is now enabled!');
          }, 5000);
        }, 10000);
      } else {
        console.error('❌ PDF Upload Error Response:', uploadResponse);
        if (uploadResponse.error === "Login or register first") {
          showWebhookMessage('error', 'Please login or register first.');
        } else {
          throw new Error(uploadResponse.error || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('❌ Upload Error:', error);
      showWebhookMessage('error', `Failed to upload PDF. ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const sendToMemorySystem = async () => {
    if (!inputValue.trim()) {
      showWebhookMessage('error', 'Please enter input text.');
      return;
    }

    setIsSending(true);
    setShowSkeleton(true);
    setDataLoaded(false);

    try {
      const response = await fetch(`${API_BASE}/memory/input`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue })
      });

      const inputResponse = await response.json();
      if (response.ok) {
        console.log('📤 Input Message Response:', inputResponse);
        showWebhookMessage('success', 'Message sent successfully! Polling for output...');
        pollForOutputData();
      } else {
        console.error('❌ Input Message Error Response:', inputResponse);
        if (inputResponse.error === "Login or register first") {
          showWebhookMessage('error', 'Please login or register first.');
        } else {
          throw new Error(inputResponse.error || 'Input request failed');
        }
      }
    } catch (error) {
      console.error('❌ Send Input Error:', error);
      showWebhookMessage('error', 'Failed to send input. Please try again.');
      setShowSkeleton(false);
    } finally {
      setIsSending(false);
    }
  };

  const pollForOutputData = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkOutputData = async () => {
      if (!isPollingActive) return;

      try {
        const textRes = await fetch(`${API_BASE}/memory/text-output`, { credentials: 'include' });

        if (!textRes.ok) {
          console.error('API Error - Status:', { text: textRes.status });
          throw new Error('API request failed');
        }

        const textContentType = textRes.headers.get('content-type');
        if (!textContentType?.includes('application/json')) {
          console.error('Invalid content type:', { text: textContentType });
          throw new Error('API returned non-JSON response');
        }

        const textData = await textRes.json();
        console.log('📥 Polling Response:', { textData });

        const hasTextOutput = textData.output?.length > 0;

        if (hasTextOutput) {
          setTextOutput(textData.output.map(item => item.message).join('\n'));
          setShowSkeleton(false);
          setDataLoaded(true);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('success', 'Output data retrieved successfully!');
          return true;
        } else {
          attempts++;
          console.log(`⏳ Attempt ${attempts}/${maxAttempts}: Waiting for output data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkOutputData, 20000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setTextOutput('No output data available after timeout.');
            setDataLoaded(true);
            setIsPolling(false);
            isPollingActive = false;
            showWebhookMessage('error', 'Timeout: No output data received after 5 minutes.');
          }
        }
      } catch (err) {
        console.error('❌ Error polling for output data:', err);
        attempts++;
        console.log(`❌ Error on attempt ${attempts}/${maxAttempts}:`, err.message);
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkOutputData, 20000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setTextOutput('Error loading output data.');
          setDataLoaded(true);
          setIsPolling(false);
          isPollingActive = false;
          showWebhookMessage('error', 'Failed to load output data after multiple attempts.');
        }
      }
    };

    setIsPolling(true);
    checkOutputData();
  };

  // Improved Markdown detection to handle the specific response structure
  const isMarkdown = (text) => {
    return text.match(/^(#+\s|\*\*|\n\s*[-*]\s|\n\s*\d+\.\s|\n\n|\[.*\]\(.*\))/m) !== null;
  };

  return (
    <div className="px-4 md:px-14 lg:px-24 py-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {webhookMessage.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
            webhookMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {webhookMessage.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{webhookMessage.text}</span>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-sm text-blue-700 shadow px-3 py-3 rounded-full text-sm font-semibold mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.88A2.5 2.5 0 0 1 4.5 9.5a2.5 2.5 0 0 1 5-2.5 2.5 2.5 0 0 1 5 2.5 2.5 2.5 0 0 1 5 2.5 2.5 2.5 0 0 1-2.96 3.88A2.5 2.5 0 0 1 12 19.94V4.5A2.5 2.5 0 0 1 9.5 2Z"/>
            </svg>
            Persistent Candidate Memory Layer
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Memory Expert
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Advanced memory system that maintains persistent candidate data and preferences.
          </p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">About This Agent</h2>
          <p className="text-gray-700 mb-8 text-base">
            Agent 4 provides a persistent memory layer that maintains candidate data, preferences, 
            and interaction history. This enables personalized experiences and continuous learning 
            across all interactions.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-base font-semibold text-blue-800 mb-3">Key Features</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Persistent data storage</li>
                <li>• Candidate preference tracking</li>
                <li>• Interaction history</li>
                <li>• Personalized experiences</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-base font-semibold text-green-800 mb-3">Use Cases</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• User profile management</li>
                <li>• Preference learning</li>
                <li>• Session continuity</li>
                <li>• Data persistence</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Memory Layer Interaction</h2>
          <p className="text-gray-600 mb-6 text-center">Upload a PDF and interact with the memory system</p>
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-700">Upload File (PDF only)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={pdfUploaded}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  pdfUploaded ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 text-gray-700'
                }`}
              />
              {uploadMessage && (
                <div className={`mt-2 text-sm ${uploadMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{uploadMessage}</div>
              )}
              
              <div className="mt-4">
                <button 
                  onClick={uploadPDF}
                  disabled={isUploading || isSending || !file || pdfUploaded}
                  className="w-full inline-flex items-center justify-center gap-2 font-medium transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl shadow"
                >
                  {isUploading ? 'Uploading...' : pdfUploaded ? 'PDF Uploaded ✓' : 'Upload PDF to Server'}
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-700">Input Query</label>
              <textarea
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                disabled={!inputEnabled}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] ${
                  inputEnabled ? 'bg-gray-50 text-gray-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                placeholder={inputEnabled ? "Enter your query or question about the uploaded document..." : "Upload a PDF first, then wait 5 seconds to enable input..."}
                style={{ height: 'auto', minHeight: '48px', overflow: 'hidden' }}
              />
              {!inputEnabled && pdfUploaded && (
                <div className="mt-2 text-sm text-blue-600">
                  ⏱️ Processing PDF... Input field will be enabled in 15 seconds...
                </div>
              )}
            </div>
            
            <div className="text-center mb-6">
              <button 
                onClick={sendToMemorySystem}
                disabled={isUploading || isSending || isPolling || !inputValue.trim() || !inputEnabled}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-lg px-12 py-6 rounded-2xl shadow"
              >
                {isSending ? 'Sending...' : isPolling ? 'Waiting for Output...' : !inputEnabled ? 'Input Disabled' : 'Send Input Message'}
              </button>
            </div>
            
            
          </div>
          {(dataLoaded || showSkeleton) && (
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700 text-lg">Response</label>
                {showSkeleton ? (
                  <div className="w-full p-8 bg-gray-50 rounded-xl shadow-inner">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-8 bg-white rounded-xl shadow-inner prose prose-blue max-w-none">
                    {textOutput ? (
                      isMarkdown(textOutput) ? (
                        <ReactMarkdown
                          components={{
                            h1: ({  ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                            h2: ({  ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-3 text-gray-800" {...props} />,
                            h3: ({  ...props }) => <h3 className="text-xl font-medium mt-4 mb-2 text-gray-700" {...props} />,
                            p: ({  ...props }) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
                            ul: ({  ...props }) => <ul className="list-disc list-inside mb-4 text-gray-700 pl-4" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 text-gray-700 pl-4" {...props} />,
                            li: ({ ...props }) => <li className="mb-2 pl-2" {...props} />,
                            strong: ({  ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                          }}
                        >
                          {textOutput}
                        </ReactMarkdown>
                      ) : (
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {textOutput.split('\n').map((line, index) => (
                            <p key={index} className="mb-4">{line}</p>
                          ))}
                        </div>
                      )
                    ) : (
                      <span className="text-gray-400 italic">Response will appear here...</span>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Agent4;
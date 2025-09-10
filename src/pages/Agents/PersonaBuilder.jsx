import React, { useState } from 'react';

const PersonaBuilder = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [personaResults, setPersonaResults] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [builderState, setBuilderState] = useState('idle'); // idle, building, completed
  const [isLoading, setIsLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState({ show: false, type: '', text: '' });

  const API_BASE = 'https://triumphant-perception-production.up.railway.app/persona';

  const showWebhookMessage = (type, text) => {
    setWebhookMessage({ show: true, type, text });
    setTimeout(() => {
      setWebhookMessage({ show: false, type: '', text: '' });
    }, 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      showWebhookMessage('error', 'Please upload a valid CSV file.');
    }
  };

  const startPersonaBuilder = async () => {
    setIsLoading(true);
    setBuilderState('building');
    setPersonaResults(null);
    setPdfFile(null);

    try {
      const formData = new FormData();
      if (csvFile) {
        formData.append('csv', csvFile);
      }

      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        body: csvFile ? formData : null,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setPersonaResults(data.personas);
      setPdfFile(data.pdf_file);
      setBuilderState('completed');
      showWebhookMessage('success', 'Personas generated successfully!');
    } catch (error) {
      console.error('Error generating personas:', error);
      showWebhookMessage('error', `Failed to generate personas: ${error.message}`);
      setBuilderState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToDrive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/upload_to_drive`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      showWebhookMessage('success', 'PDF uploaded to Google Drive successfully!');
    } catch (error) {
      console.error('Error uploading to Drive:', error);
      showWebhookMessage('error', `Failed to upload to Google Drive: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetBuilder = () => {
    setCsvFile(null);
    setPersonaResults(null);
    setPdfFile(null);
    setBuilderState('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 md:px-8 lg:px-12 py-8">
        {/* Webhook Message */}
        {webhookMessage.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              webhookMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
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
              className="lucide lucide-users h-4 w-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="m22 21-2-2" />
              <path d="M16 16l2 2" />
            </svg>
            Persona Builder
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              AI-Powered Persona Builder
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Upload a CSV file to generate detailed buyer personas using AI clustering and analysis, or use the default dataset.
          </p>
        </div>

        {/* Persona Builder Form */}
        {builderState === 'idle' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Build Your Customer Personas</h2>
            <p className="text-gray-600 mb-6 text-center">
              Upload a CSV file with user data (including a 'conversion_rate' column) or use the default dataset to generate personas.
            </p>

            <div className="max-w-6xl mx-auto space-y-8">
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload User Data</h3>
                <div className="flex flex-col items-center gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500">
                    {csvFile ? `Selected: ${csvFile.name}` : 'No file selected. Will use default dataset.'}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={startPersonaBuilder}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? 'Generating Personas...' : 'Generate Personas'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {builderState === 'building' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Building Your Personas</h2>
            <p className="text-gray-600 mb-6 text-center">Analyzing data and generating personas...</p>
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

        {/* Persona Results */}
        {builderState === 'completed' && personaResults && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Generated Personas</h2>
              <div className="flex gap-2">
                <button
                  onClick={uploadToDrive}
                  disabled={isLoading || !pdfFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
                >
                  {isLoading ? 'Uploading...' : 'Upload PDF to Google Drive'}
                </button>
                <button
                  onClick={resetBuilder}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  Build New Personas
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {personaResults.map((persona, index) => (
                <div key={index} className="bg-blue-50 p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">
                    Cluster {persona.cluster} (Priority {persona.priority})
                  </h3>
                  <div className="text-gray-700 whitespace-pre-wrap">{persona.persona}</div>
                </div>
              ))}
            </div>

            {pdfFile && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Generated PDF</h3>
                <p className="text-gray-600">
                  A PDF report has been generated and saved at: <strong>{pdfFile}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaBuilder;
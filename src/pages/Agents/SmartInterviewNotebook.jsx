import React, { useState } from "react";
import apiService from "../../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";




const SmartInterviewNotebook = () => {
  const [interviewDetails, setInterviewDetails] = useState({
    companyName: "",
    position: "",
    seniorityLevel: "",
    userId:"12345"
  });

  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInterviewDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    setTimeout(() => {
      setMessage({ show: false, type: "", text: "" });
    }, 3000);
  };

  const pollForInterviewData = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkInterviewData = async () => {
      if (!isPollingActive) return;

      try {
        const response = await apiService.apiCall(
          "/interviews/interview-notebook-output"
        );
        const interviewData = response.data;

        console.log("Interview response:", interviewData);

        // Handle the API response format
        let interviewText = "";
        if (interviewData) {
          if (interviewData.message) {
            if (interviewData.message === "No output available") {
              // Continue polling if no output is available yet
              attempts++;
              console.log(`Attempt ${attempts}: Waiting for interview data...`);
              if (attempts < maxAttempts && isPollingActive) {
                setTimeout(checkInterviewData, 10000);
                return;
              } else if (isPollingActive) {
                setShowSkeleton(false);
                setGeneratedNotes("No interview data available after timeout.");
                setIsLoading(false);
                isPollingActive = false;
                showMessage(
                  "error",
                  "Timeout: No data received after 5 minutes."
                );
                return;
              }
            } else {
              // If there's actual content in the message
              interviewText = interviewData.message;
            }
          }
          else if (interviewData.output) {
            interviewText = interviewData.output.output || interviewData.output;
          }
          else if (
            interviewData &&
            interviewData.length > 0 &&
            interviewData[0].Notes
          ) {
            // Fallback to old format if needed
            interviewText = interviewData[0].Notes;
          } else if (typeof interviewData === "string") {
            // If the response is a direct string
            interviewText = interviewData;
          }

        }

        if (interviewText && interviewText !== "No output available") {
          setGeneratedNotes(interviewText);
          setInterviewDetails({
            companyName: "",
            position: "",
            seniorityLevel: "",
            userId:"12345"
          });
          setShowSkeleton(false);
          setDataLoaded(true);
          setIsLoading(false);
          isPollingActive = false;
          showMessage("success", "Interview notes generated successfully!");
          return true;
        } else {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for interview data...`);
          if (attempts < maxAttempts && isPollingActive) {
            setTimeout(checkInterviewData, 10000);
          } else if (isPollingActive) {
            setShowSkeleton(false);
            setGeneratedNotes("No interview data available after timeout.");
            setIsLoading(false);
            isPollingActive = false;
            showMessage("error", "Timeout: No data received after 5 minutes.");
          }
        }
      } catch (error) {
        console.error("Error polling for interview data:", error);
        attempts++;
        if (attempts < maxAttempts && isPollingActive) {
          setTimeout(checkInterviewData, 10000);
        } else if (isPollingActive) {
          setShowSkeleton(false);
          setGeneratedNotes("Error retrieving interview data.");
          setIsLoading(false);
          isPollingActive = false;
          showMessage("error", "Failed to retrieve interview data.");
        }
      }
    };

    checkInterviewData();
  };

  const generateInterviewNotebook = async () => {
    if (
      !interviewDetails.companyName.trim() ||
      !interviewDetails.position.trim()
    ) {
      showMessage("error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setDataLoaded(false);
    setGeneratedNotes("Generating your interview notebook...");

    try {
      // Send the interview details to trigger the generation
      try {
        await apiService.apiCall("/interviews/interview-notebook", {
          method: "POST",
          body: JSON.stringify({
            companyName: interviewDetails.companyName,
            position: interviewDetails.position,
            seniorityLevel: interviewDetails.seniorityLevel,
            userId: interviewDetails.userId
          }),
        });

        console.log("Interview details sent successfully");
        showMessage(
          "success",
          "Interview details sent! Generating notebook..."
        );
           // Now poll for the generated output
      await pollForInterviewData();
      } catch (webhookError) {
        console.log("Webhook error:", webhookError);
        showMessage("info", "Error");
      }

   
    } catch (error) {
      console.error("Error generating interview notebook:", error);
      setShowSkeleton(false);
      setIsLoading(false);
      showMessage(
        "error",
        "Failed to generate interview notebook. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 md:px-8 lg:px-12 py-8">
        {/* Message */}
        {message.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : message.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
          >
            {message.text}
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
              className="lucide lucide-notebook h-4 w-4"
            >
              <path d="M2 6h4" />
              <path d="M2 10h4" />
              <path d="M2 14h4" />
              <path d="M2 18h4" />
              <rect width="16" height="20" x="4" y="2" rx="2" />
              <path d="M9 6h1" />
              <path d="M9 10h1" />
              <path d="M9 14h1" />
              <path d="M9 18h1" />
              <path d="M14 6h1" />
              <path d="M14 10h1" />
              <path d="M14 14h1" />
              <path d="M14 18h1" />
            </svg>
            Smart Interview Notebook
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Interview Expert
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Transform your interview preparation with AI-powered note-taking and
            insights. Create comprehensive interview notebooks that help you ace
            every interview.
          </p>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            How It Works
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Our AI analyzes your interview details and generates comprehensive
            notes, questions, and insights. Simply enter your interview
            information, and our system will create a detailed notebook to help
            you prepare and succeed in your interview.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                What You Get
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• AI-generated interview notes</li>
                <li>• Potential questions & answers</li>
                <li>• Company research insights</li>
                <li>• Interview preparation tips</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                Perfect For
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Job interviews</li>
                <li>• Company research</li>
                <li>• Interview preparation</li>
                <li>• Career development</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interview Details Form */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Create Your Interview Notebook
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Enter your interview details and we'll generate comprehensive notes
            for you.
          </p>

          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={interviewDetails.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  value={interviewDetails.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter job position"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Seniority Level
              </label>
              <input
                type="text"
                name="seniorityLevel"
                value={interviewDetails.seniorityLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Junior, Mid-level, Senior, Lead"
              />
            </div>

            <div className="text-center">
              <button
                onClick={generateInterviewNotebook}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-lg px-12 py-3 rounded-2xl shadow-colored"
              >
                {isLoading
                  ? "Generating Notebook..."
                  : "Generate Interview Notebook"}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Interview Notes - Only show after data is loaded */}
        {dataLoaded && !showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Your Interview Notebook
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              AI-generated comprehensive interview preparation notes
            </p>

            <div className="space-y-8 max-w-4xl mx-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h3: ({ children }) => (
                    <h3 className="text-xl md:text-2xl font-bold text-indigo-900 border-l-4 border-indigo-500 pl-4 py-2 mt-6 mb-4 tracking-tight">
                      {children}
                    </h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-indigo-800">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-2 text-gray-800">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-2 text-gray-800">
                      {children}
                    </ol>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-800 text-base md:text-lg leading-relaxed my-4">
                      {children}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-800 text-base md:text-lg leading-relaxed">
                      {children}
                    </li>
                  ),
                  hr: () => (
                    <hr className="my-8 border-t-2 border-indigo-200" aria-hidden="true" />
                  ),
                  h2: ({ children }) => (
                    <section
                      className="bg-gradient-to-b from-white to-indigo-50 shadow-md rounded-xl p-6 md:p-8 border border-indigo-100 hover:shadow-lg transition-all duration-300"
                      role="region"
                      aria-labelledby={`section-heading-${children.toString().replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <h2
                        id={`section-heading-${children.toString().replace(/\s+/g, '-').toLowerCase()}`}
                        className="text-2xl md:text-3xl font-bold text-indigo-900 mb-4"
                      >
                        {children}
                      </h2>
                    </section>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-indigo-600 hover:text-indigo-800 underline hover:underline-offset-4 transition-colors duration-200"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {generatedNotes}
              </ReactMarkdown>
            </div>


          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Your Interview Notebook
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              AI-generated comprehensive interview preparation notes
            </p>

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

export default SmartInterviewNotebook;

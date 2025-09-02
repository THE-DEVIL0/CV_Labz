import React, { useState, useEffect } from 'react';
import apiService from "../../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown

const Agent2 = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [finalBlog, setFinalBlog] = useState(null);

  const showMessage = (type, text, duration = 3000) => {
    setMessage({ show: true, type, text });
    setTimeout(() => setMessage({ show: false, type: "", text: "" }), duration);
  };

  const pollForData = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    let isPollingActive = true;

    const checkData = async () => {
      if (!isPollingActive) return;

      try {
        const response = await apiService.apiCall("/blogs/blog-output");
        const data = response.data;

        if (data?.message === "No output available") {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkData, 10000);
          } else {
            setShowSkeleton(false);
            setIsLoading(false);
            isPollingActive = false;
            showMessage("error", "Timeout: No data received.");
            setOutputText("No data available.");
          }
          return;
        }

        if (data?.output) {
          let outputBlog = data.output.output || data.output;
          if (outputBlog.title && outputBlog.html) {
            setFinalBlog({
              title: outputBlog.title,
              html: outputBlog.html,
              images: [outputBlog.image1, outputBlog.image2].filter(Boolean),
            });
          } else {
            // Clean up raw \n characters and normalize markdown
            const cleanedOutput = outputBlog.replace(/\\n/g, '\n');
            setOutputText(cleanedOutput);
          }
        }

        setShowSkeleton(false);
        setIsLoading(false);
        isPollingActive = false;
      } catch (error) {
        console.error("Polling error:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkData, 10000);
        } else {
          setShowSkeleton(false);
          setIsLoading(false);
          isPollingActive = false;
          showMessage("error", "Failed to retrieve data.");
          setOutputText("Error retrieving data.");
        }
      }
    };

    await checkData();
  };

  useEffect(() => {
    let isPollingActive = true;
    return () => {
      isPollingActive = false;
    };
  }, []);

  const sendInput = async () => {
    if (!inputText.trim()) {
      showMessage("error", "Please enter some input");
      return;
    }
    setIsLoading(true);
    setShowSkeleton(true);
    setOutputText("Waiting for AI response...");
    setFinalBlog(null);
    try {
      await apiService.apiCall("/blogs/blog-input", {
        method: "POST",
        body: JSON.stringify({ message: inputText }),
      });
      await pollForData();
    } catch (error) {
      console.error("Error sending input", error);
      setShowSkeleton(false);
      setIsLoading(false);
      showMessage("error", "Failed to send input");
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Blog Generator
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Create engaging, SEO-optimized blog content effortlessly.
          </p>
        </div>

        {/* Output Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Blog Output</h2>
          {showSkeleton ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : finalBlog ? (
            <div className="prose max-w-none">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {finalBlog.title}
              </h1>
              <div
                className="text-gray-700 leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: finalBlog.html }}
              />
              {finalBlog.images?.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Blog image ${index + 1}`}
                  className="my-4 rounded-md w-full h-auto max-h-64 sm:max-h-80 object-cover"
                />
              ))}
              <button
                onClick={() => {
                  setFinalBlog(null);
                  setOutputText('');
                  setInputText('');
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base"
              >
                Generate New Blog
              </button>
            </div>
          ) : (
            <div className="prose max-w-none text-sm sm:text-base">
              {/**** ✅ Detect if outputText contains HTML anywhere ****/}
              {/<[a-z][\s\S]*>/i.test(outputText) ? (
                <div dangerouslySetInnerHTML={{ __html: outputText }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {outputText}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {/* Input Section */}
        {!finalBlog && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Your Input</h2>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter your blog topic (e.g., 'Write about AI in technology')..."
              aria-label="Blog input"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={sendInput}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-white text-sm sm:text-base ${isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isLoading ? "Generating..." : "Generate Blog"}
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {message.show && (
          <div
            className={`fixed bottom-4 right-4 p-3 rounded-md shadow-md text-white text-sm sm:text-base ${message.type === "error" ? "bg-red-500" : "bg-green-500"
              }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent2;
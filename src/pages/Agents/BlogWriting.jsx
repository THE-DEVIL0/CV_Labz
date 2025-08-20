import React, { useState, useEffect } from 'react';
import apiService from "../../services/api";
import ReactMarkdown from "react-markdown"; // for markdown rendering

const Agent2 = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [finalBlog, setFinalBlog] = useState(null); // null unless blog special case

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
        console.log("Polling response:", data);

        if (data?.message === "No output available") {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkData, 10000);
          } else {
            setShowSkeleton(false);
            setIsLoading(false);
            isPollingActive = false;
            showMessage("error", "Timeout: No data received after 5 minutes.");
            setOutputText("No data available after timeout.");
          }
          return;
        }

        if (data?.output) {
          let outputBlog = data.output.output || data.output; // Fixed typo: data.ouput -> data.output
          // Special case: blog structure with html + title
          if (outputBlog.title && outputBlog.html) {
            setFinalBlog({
              title: outputBlog.title,
              html: outputBlog.html,
              images: [outputBlog.image1, outputBlog.image2].filter(Boolean)
            });
          } else {
            setOutputText(outputBlog); // Assuming output is markdown if not a blog
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
    return () => { isPollingActive = false; };
  }, []);

  const sendInput = async () => {
    if (!inputText.trim()) {
      showMessage("error", "Please enter some input");
      return;
    }
    setIsLoading(true);
    setShowSkeleton(true);
    setOutputText("Waiting for AI response...");
    setFinalBlog(null); // reset special case
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
    <div className="px-4 md:px-14 lg:px-24 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 glass-card text-blue-700 shadow px-3 py-2 rounded-full text-xs font-semibold mb-4">
            Blog Writing
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
            Blog Expert
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Your go-to specialist for creating engaging and SEO-optimized blog content.
          </p>
        </div>

        {/* Output section */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Output</h2>
          {showSkeleton ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : finalBlog ? (
            <>
              <h3 className="text-xl font-semibold mb-4">{finalBlog.title}</h3>
              <div dangerouslySetInnerHTML={{ __html: finalBlog.html }} />
              {finalBlog.images?.map((img, index) => (
                <img key={index} src={img} alt={`Blog image ${index + 1}`} className="my-4" />
              ))}
              <button
                onClick={() => {
                  setFinalBlog(null);
                  setOutputText('');
                  setInputText('');
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 font-medium mt-4"
              >
                Generate New Blog
              </button>
            </>
          ) : (
            <div className="prose max-w-none">
              <ReactMarkdown>{outputText}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Input section (hidden only in blog special case) */}
        {!finalBlog && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Input</h2>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none min-h-[48px]"
              placeholder="Enter your input here..."
              aria-label="User input"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={sendInput}
                disabled={isLoading}
                className={`px-6 py-2 rounded-xl text-white font-medium ${
                  isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Processing..." : "Send"}
              </button>
            </div>
          </div>
        )}

        {message.show && (
          <div
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              message.type === "error"
                ? "bg-red-100 text-red-800"
                : message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
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
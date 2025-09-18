import React, { useState, useEffect, useRef } from "react";
import apiService from "../../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown

const Agent2 = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [finalBlog, setFinalBlog] = useState(null);
  
  // Refs to track polling state and prevent memory leaks
  const pollingRef = useRef(false);
  const timeoutRef = useRef(null);

  const showMessage = (type, text, duration = 3000) => {
    setMessage({ show: true, type, text });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setMessage({ show: false, type: "", text: "" });
    }, duration);
  };

  const pollForData = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    pollingRef.current = true;

    const checkData = async () => {
      if (!pollingRef.current) return;

      try {
        const response = await apiService.apiCall("/blogs/blog-output");
        const data = response.data;

        if (data?.message === "No output available") {
          attempts++;
          if (attempts < maxAttempts && pollingRef.current) {
            timeoutRef.current = setTimeout(checkData, 10000);
          } else {
            if (pollingRef.current) {
              setShowSkeleton(false);
              setIsLoading(false);
              pollingRef.current = false;
              showMessage("error", "Timeout: No data received.");
              setOutputText("No data available.");
            }
          }
          return;
        }

        if (data?.output && pollingRef.current) {
          let outputBlog = data.output.output || data.output;
          if (outputBlog.title && outputBlog.html) {
            setFinalBlog({
              title: outputBlog.title,
              html: outputBlog.html,
              images: [outputBlog["Image 1"], outputBlog["Image 2"]],
            });
          } else {
            const cleanedOutput = outputBlog.replace(/\\n/g, "\n");
            setOutputText(cleanedOutput);
          }
          
          setShowSkeleton(false);
          setIsLoading(false);
          pollingRef.current = false;
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (pollingRef.current) {
          attempts++;
          if (attempts < maxAttempts) {
            timeoutRef.current = setTimeout(checkData, 10000);
          } else {
            setShowSkeleton(false);
            setIsLoading(false);
            pollingRef.current = false;
            showMessage("error", "Failed to retrieve data.");
            setOutputText("Error retrieving data.");
          }
        }
      }
    };

    await checkData();
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      pollingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sendInput = async () => {
    if (!inputText.trim()) {
      showMessage("error", "Please enter some input");
      return;
    }
    
    // Stop any existing polling
    pollingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    setShowSkeleton(true);
    setOutputText("Waiting for AI response...");
    setFinalBlog(null);
    
    try {
      await apiService.apiCall("/blogs/blog-input", {
        method: "POST",
        body: JSON.stringify({ message: inputText }),
        headers: { "Content-Type": "application/json" },
      });
      await pollForData();
    } catch (error) {
      console.error("Error sending input", error);
      setShowSkeleton(false);
      setIsLoading(false);
      showMessage("error", "Failed to send input");
    }
  };

  const handleTitleEdit = (e) => {
    setFinalBlog((prev) => {
      if (!prev) return prev;
      return { ...prev, title: e.target.innerText };
    });
  };

  const handleContentEdit = (e) => {
    const newContent = e.target.innerHTML;
    setFinalBlog((prev) => {
      if (!prev) return prev;
      return { ...prev, html: newContent };
    });
  };

  const handleKeyDown = (e) => {
    // Prevent deleting images with Backspace/Delete
    const selection = window.getSelection();
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      selection?.anchorNode?.parentElement?.tagName === "IMG"
    ) {
      e.preventDefault();
    }
  };

  const saveBlog = async () => {
    if (!finalBlog) return;
    console.log(finalBlog)
    try {
      await apiService.apiCall("/blogs/save", {
        method: "POST",
        body: JSON.stringify({
          title: finalBlog.title,
          markdown: finalBlog.html,
          images: [...finalBlog.images],
        }),
        headers: { "Content-Type": "application/json" },
      });

      showMessage("success", "Blog saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      showMessage("error", "Failed to save blog.");
    }
  };

  const generateNewBlog = () => {
    // Stop any existing polling
    pollingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setFinalBlog(null);
    setOutputText("");
    setInputText("");
    setIsLoading(false);
    setShowSkeleton(false);
  };

  const renderContent = () => {
    if (/<[a-z][\s\S]*>/i.test(outputText)) {
      return <div dangerouslySetInnerHTML={{ __html: outputText }} />;
    }
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {outputText}
      </ReactMarkdown>
    );
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Blog Output
          </h2>
          {showSkeleton ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : finalBlog ? (
            <div className="prose max-w-none">
              {/* Editable Title */}
              <h1
                className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 outline-none focus:bg-gray-50 p-2 rounded"
                contentEditable
                suppressContentEditableWarning
                onBlur={handleTitleEdit}
              >
                {finalBlog.title}
              </h1>

              {/* Editable Body */}
              <div
                className="text-gray-700 leading-relaxed text-sm sm:text-base border p-2 rounded outline-none focus:border-blue-500"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: finalBlog.html }}
                onBlur={handleContentEdit}
                onKeyDown={handleKeyDown}
              />
{/* 
              Locked Images
              {finalBlog.images?.length > 0 && (
                <div className="mt-4">
                  {finalBlog.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Blog image ${index + 1}`}
                      className="my-4 rounded-md w-full h-auto max-h-64 sm:max-h-80 object-cover pointer-events-none select-none"
                    />
                  ))}
                </div> */}

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3 flex-wrap">
                {/* Save Blog */}
                <button
                  onClick={saveBlog}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Save Blog
                </button>

                {/* Generate New Blog */}
                <button
                  onClick={generateNewBlog}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Generate New Blog
                </button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none text-sm sm:text-base">
              {renderContent()}
            </div>
          )}
        </div>

        {/* Input Section */}
        {!finalBlog && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
              Your Input
            </h2>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-vertical"
              placeholder="Enter your blog topic (e.g., 'Write about AI in technology')..."
              aria-label="Blog input"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={sendInput}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-white text-sm sm:text-base transition-colors ${
                  isLoading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
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
            className={`fixed bottom-4 right-4 p-3 rounded-md shadow-md text-white text-sm sm:text-base z-50 transition-opacity ${
              message.type === "error" ? "bg-red-500" : "bg-green-500"
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
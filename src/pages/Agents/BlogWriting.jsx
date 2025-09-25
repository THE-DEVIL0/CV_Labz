import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE_URL = "https://delightful-passion-production.up.railway.app";

const Agent2 = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [finalBlog, setFinalBlog] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [blogType, setBlogType] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  const blogTypes = [
    "Interview tips",
    "Personal branding",
    "Career Growth and Development",
    "Cv and resume writing",
    "Job Search strategies"
  ];

  const pollingRef = useRef(false);
  const timeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const showMessage = (type, text, duration = 3000) => {
    setMessage({ show: true, type, text });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setMessage({ show: false, type: "", text: "" });
    }, duration);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTailwindClassesToHeadings = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    const headingClasses = {
      h1: "text-2xl sm:text-3xl font-bold text-gray-900 mb-4",
      h2: "text-xl sm:text-2xl font-semibold text-gray-800 mt-6 mb-3",
      h3: "text-lg sm:text-xl font-medium text-gray-700 mt-5 mb-2",
      h4: "text-base sm:text-lg font-medium text-gray-600 mt-4 mb-2",
      h5: "text-sm sm:text-base font-medium text-gray-600 mt-3 mb-2",
      h6: "text-sm font-medium text-gray-600 mt-3 mb-2",
    };

    Object.keys(headingClasses).forEach((tag) => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => {
        el.className = headingClasses[tag];
      });
    });

    return doc.body.innerHTML;
  };

  const pollForData = async () => {
    let attempts = 0;
    const maxAttempts = 15;
    pollingRef.current = true;

    const checkData = async () => {
      if (!pollingRef.current) return;

      try {
        const response = await fetch(`${API_BASE_URL}/blogs/blog-output`, {
          method: "GET",
          credentials: "include",
        });

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

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
              html: addTailwindClassesToHeadings(outputBlog.html),
              images: [outputBlog["Image 1"], outputBlog["Image 2"]].filter(Boolean),
              type: blogType
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
    if (!blogType) {
      showMessage("error", "Please select a blog type");
      return;
    }
    
    pollingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    setShowSkeleton(true);
    setOutputText("Waiting for AI response...");
    setFinalBlog(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/blogs/blog-input`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputText }),
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      await pollForData();
    } catch (error) {
      console.error("Error sending input", error);
      setShowSkeleton(false);
      setIsLoading(false);
      showMessage("error", "Failed to send input");
    }
  };

  const handleContentEdit = (e) => {
    const newContent = e.target.innerHTML;
    setFinalBlog((prev) => {
      if (!prev) return prev;
      return { ...prev, html: newContent };
    });
  };

  const handleKeyDown = (e) => {
    const selection = window.getSelection();
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      selection?.anchorNode?.parentElement?.tagName === "IMG"
    ) {
      e.preventDefault();
    }
  };

  const deleteImage = (index) => {
    setFinalBlog((prev) => {
      if (!prev) return prev;
      const urlToDelete = prev.images[index];
      const newImages = prev.images.filter((_, i) => i !== index);
      const newImageFiles = imageFiles.filter((_, i) => i !== index);

      const parser = new DOMParser();
      const doc = parser.parseFromString(prev.html, "text/html");
      const imgs = doc.querySelectorAll("img");
      const targetImg = Array.from(imgs).find((img) => img.src === urlToDelete);
      if (targetImg) {
        targetImg.outerHTML = '<div class="image-placeholder" style="display:none;"></div>';
      }
      const newHtml = doc.body.innerHTML;

      setImageFiles(newImageFiles);
      return { ...prev, html: newHtml, images: newImages };
    });
  };

  const addImage = async () => {
    if (!selectedFile || finalBlog.images.length >= 2) return;

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (selectedFile.size > maxSize) {
      showMessage("error", "Image file is too large. Maximum size is 2MB.");
      setSelectedFile(null);
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setFinalBlog((prev) => {
        if (!prev) return prev;
        const newImages = [...prev.images, dataUrl];

        const parser = new DOMParser();
        const doc = parser.parseFromString(prev.html, "text/html");
        const placeholder = doc.querySelector(".image-placeholder");
        const newImg = doc.createElement("img");
        newImg.src = dataUrl;
        newImg.alt = `Blog image ${newImages.length}`;
        newImg.className = "my-4 rounded-md w-full h-auto max-h-64 sm:max-h-80 object-cover pointer-events-none select-none";

        if (placeholder) {
          placeholder.outerHTML = newImg.outerHTML;
        } else {
          doc.body.appendChild(newImg);
        }
        const newHtml = doc.body.innerHTML;

        return { ...prev, html: newHtml, images: newImages };
      });

      setImageFiles((prev) => {
        const newFiles = [...prev, selectedFile];
        console.log("[addImage] Updated imageFiles:", newFiles.map(f => f.name));
        return newFiles;
      });
      setSelectedFile(null);
    } catch (error) {
      console.error("Error reading file:", error);
      showMessage("error", "Failed to add image.");
    }
  };

  const saveBlog = async () => {
    if (!finalBlog) return;
    setIsSaving(true);
    try {
      console.log("[saveBlog] Starting save process, imageFiles:", imageFiles.map(f => f.name));
      let updatedHtml = finalBlog.html;
      let updatedImages = [...finalBlog.images];

      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((file, index) => {
          console.log(`[saveBlog] Adding file ${index + 1}:`, file.name);
          formData.append("images", file);
        });

        const uploadResponse = await fetch(`${API_BASE_URL}/blogs/upload-images`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const contentType = uploadResponse.headers.get("content-type");
        let uploadData;
        if (contentType && contentType.includes("application/json")) {
          uploadData = await uploadResponse.json();
        } else {
          uploadData = await uploadResponse.text();
        }

        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || `HTTP error! status: ${uploadResponse.status}`);
        }

        console.log("[saveBlog] Upload response:", uploadData);

        if (!uploadData.urls || uploadData.urls.length < imageFiles.length) {
          throw new Error(`Expected ${imageFiles.length} URLs, received ${uploadData.urls?.length || 0}`);
        }

        const { urls } = uploadData;

        const parser = new DOMParser();
        const doc = parser.parseFromString(updatedHtml, "text/html");
        const imgs = doc.querySelectorAll("img");
        imgs.forEach((img, index) => {
          if (urls[index]) {
            console.log(`[saveBlog] Replacing img ${index + 1} src with:`, urls[index]);
            img.src = urls[index];
            updatedImages[index] = urls[index];
          } else {
            console.warn(`[saveBlog] No URL for img ${index + 1}, leaving unchanged`);
          }
        });

        const placeholders = doc.querySelectorAll(".image-placeholder");
        placeholders.forEach((ph) => ph.remove());

        updatedHtml = doc.body.innerHTML;
      } else {
        const parser = new DOMParser();
        const doc = parser.parseFromString(updatedHtml, "text/html");
        const placeholders = doc.querySelectorAll(".image-placeholder");
        placeholders.forEach((ph) => ph.remove());
        updatedHtml = doc.body.innerHTML;
        updatedImages = []; // No images to save
      }

      console.log("[saveBlog] Saving blog with:", { html: updatedHtml, type: finalBlog.type, title: finalBlog.title, images: updatedImages });
      const saveResponse = await fetch(`${API_BASE_URL}/blogs/save`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: updatedHtml,
          type: finalBlog.type,
          title: finalBlog.title,
          images: updatedImages
        }),
      });

      const saveContentType = saveResponse.headers.get("content-type");
      let saveData;
      if (saveContentType && saveContentType.includes("application/json")) {
        saveData = await saveResponse.json();
      } else {
        saveData = await saveResponse.text();
      }

      if (!saveResponse.ok) {
        throw new Error(saveData.message || `HTTP error! status: ${saveResponse.status}`);
      }

      showMessage("success", "Blog saved successfully!");
    } catch (error) {
      console.error("[saveBlog] Error:", error);
      showMessage("error", error.message.includes("upload") ? "Failed to upload images. Ensure all images are under 2MB." : "Failed to save blog.");
    } finally {
      setIsSaving(false);
    }
  };

  const generateNewBlog = () => {
    pollingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setFinalBlog(null);
    setOutputText("");
    setInputText("");
    setBlogType("");
    setIsLoading(false);
    setShowSkeleton(false);
    setSelectedFile(null);
    setImageFiles([]);
    setIsDropdownOpen(false);
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
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Blog Generator
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Create engaging, SEO-optimized blog content effortlessly.
          </p>
        </div>

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
              <div className="mb-4">
                <span className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                  {finalBlog.type}
                </span>
              </div>

              <div
                className="text-gray-700 leading-relaxed text-sm sm:text-base border p-2 rounded outline-none focus:border-blue-500"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: finalBlog.html }}
                onBlur={handleContentEdit}
                onKeyDown={handleKeyDown}
              />

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Manage Images (Max 2)</h3>
                <div className="flex flex-wrap gap-4">
                  {finalBlog.images.map((url, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Blog image ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-md shadow"
                      />
                      <button
                        onClick={() => deleteImage(index)}
                        className="mt-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                {finalBlog.images.length < 2 && (
                  <div className="mt-4 flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="w-full max-w-md p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={addImage}
                      disabled={!selectedFile}
                      className={`ml-3 px-4 py-2 rounded-md text-white text-sm transition-colors ${
                        !selectedFile ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      Add Image
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3 flex-wrap">
                <button
                  onClick={saveBlog}
                  disabled={isSaving}
                  className={`bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base ${
                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? "Saving..." : "Save Blog"}
                </button>
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

        {!finalBlog && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
              Your Input
            </h2>
            <div className="mb-4 relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blog Type
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 bg-white border border-gray-300 rounded-md text-left text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center shadow-sm hover:bg-gray-50 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <span>{blogType || "Select a blog type"}</span>
                <svg
                  className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {blogTypes.map((type) => (
                    <div
                      key={type}
                      onClick={() => {
                        setBlogType(type);
                        setIsDropdownOpen(false);
                      }}
                      className="px-4 py-2 text-sm sm:text-base text-gray-900 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                      role="option"
                      aria-selected={blogType === type}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
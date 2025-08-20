import React, { useState, useEffect } from 'react';
import apiService from '@/services/api'; 

const BrandImageGenerator = () => {
  // Auto mode state
  const [autoMode, setAutoMode] = useState({
    topic: '',
    num_slides: 1,
    size: 'portrait'
  });

  // Manual mode state
  const [manualMode, setManualMode] = useState({
    image_prompt: '',
    small_text: '',
    main_text: '',
    sub_text: '',
    size: 'portrait'
  });

  // App state
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [activeTab, setActiveTab] = useState('auto');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showSkeleton, setShowSkeleton] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleAutoChange = (e) => {
    const { name, value } = e.target;
    setAutoMode(prev => ({
      ...prev,
      [name]: name === 'num_slides' ? parseInt(value) : value
    }));
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualMode(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateAutoImages = async (e) => {
    e.preventDefault();
    if (!autoMode.topic.trim()) {
      showNotification('error', 'Please fill in the topic field.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setGeneratedImages([]);

    try {
      const response = await apiService.apiCall('/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoMode),
      });
      const data = await response.json();
      const images = data.slides.map((base64, i) => ({
        id: Date.now() + i,
        url: `data:image/png;base64,${base64}`,
        prompt: autoMode.topic
      }));
      setGeneratedImages(images);
      setShowSkeleton(false);
      setIsLoading(false);
      showNotification('success', 'Images generated successfully!');
    } catch (error) {
      console.error('Error generating auto images:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showNotification('error', 'Failed to generate images.');
    }
  };

  const generateManualImages = async (e) => {
    e.preventDefault();
    if (!manualMode.image_prompt.trim() || !manualMode.main_text.trim()) {
      showNotification('error', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setShowSkeleton(true);
    setGeneratedImages([]);

    try {
      const response = await apiService.apiCall('/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualMode),
      });
      const data = await response.json();
      const images = data.slides.map((base64, i) => ({
        id: Date.now() + i,
        url: `data:image/png;base64,${base64}`,
        prompt: manualMode.image_prompt
      }));
      setGeneratedImages(images);
      setShowSkeleton(false);
      setIsLoading(false);
      showNotification('success', 'Image generated successfully!');
    } catch (error) {
      console.error('Error generating manual image:', error);
      setShowSkeleton(false);
      setIsLoading(false);
      showNotification('error', 'Failed to generate image.');
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'generated_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Any cleanup if needed
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 md:px-8 lg:px-12 py-8">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {notification.message}
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
              className="lucide lucide-image h-4 w-4"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            Brand Image Generator
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              AI-Powered Image Generator
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Create stunning branded images with AI. Choose between automatic generation or manual customization.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('auto')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Auto Mode
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Manual Mode
            </button>
          </div>
        </div>

        {/* Auto Mode Form */}
        {activeTab === 'auto' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Auto Mode</h2>
            <p className="text-gray-600 mb-6 text-center">Let AI generate complete branded images based on your topic</p>
            
            <form onSubmit={generateAutoImages} className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Topic *</label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={autoMode.topic}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your topic (e.g., Digital Marketing Tips)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Number of Images *</label>
                <input
                  type="number"
                  id="num_slides"
                  name="num_slides"
                  value={autoMode.num_slides}
                  onChange={handleAutoChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Aspect Ratio *</label>
                <select
                  id="size"
                  name="size"
                  value={autoMode.size}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="portrait">Portrait (Mobile)</option>
                  <option value="landscape">Landscape (Web)</option>
                  <option value="square">Square (Auto)</option>
                </select>
              </div>
              
              <div className="text-center">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? 'Generating...' : 'Generate Images'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manual Mode Form */}
        {activeTab === 'manual' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manual Mode</h2>
            <p className="text-gray-600 mb-6 text-center">Customize every aspect of your branded image</p>
            
            <form onSubmit={generateManualImages} className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Image Prompt (for AI background) *</label>
                <textarea
                  id="image_prompt"
                  name="image_prompt"
                  value={manualMode.image_prompt}
                  onChange={handleManualChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the background image you want (e.g., 'modern office with laptop on desk')"
                  rows="4"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Small Text (optional)</label>
                <input
                  type="text"
                  id="small_text"
                  name="small_text"
                  value={manualMode.small_text}
                  onChange={handleManualChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Career Tip #42"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Main Content Text *</label>
                <textarea
                  id="main_text"
                  name="main_text"
                  value={manualMode.main_text}
                  onChange={handleManualChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter your main content (use new lines for formatting)"
                  rows="4"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Sub Text (optional)</label>
                <input
                  type="text"
                  id="sub_text"
                  name="sub_text"
                  value={manualMode.sub_text}
                  onChange={handleManualChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Your tagline or call to action"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Aspect Ratio *</label>
                <select
                  id="size"
                  name="size"
                  value={manualMode.size}
                  onChange={handleManualChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="portrait">Portrait (Mobile)</option>
                  <option value="landscape">Landscape (Web)</option>
                  <option value="square">Square (Auto)</option>
                </select>
              </div>
              
              <div className="text-center">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && !showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image) => (
                <div key={image.id} className="bg-white rounded-xl overflow-hidden shadow-md">
                  <div className="relative pb-[100%]">
                    <img 
                      src={image.url} 
                      alt="Generated content"
                      className="absolute h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600">{image.prompt}</p>
                    <div className="mt-3 flex justify-between">
                      <button 
                        onClick={() => handleDownload(image.url, `generated_${image.id}.png`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Download
                      </button>
                      <button className="text-sm text-gray-600 hover:text-gray-800">
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generating Your Images</h2>
            <p className="text-gray-600 mb-6 text-center">AI is creating your branded content...</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: activeTab === 'auto' ? autoMode.num_slides : 1 }).map((_, index) => (
                <div key={index} className="animate-pulse space-y-4">
                  <div className="h-64 bg-gray-200 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandImageGenerator;
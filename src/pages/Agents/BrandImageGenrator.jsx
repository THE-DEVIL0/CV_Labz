import React, { useState } from 'react';

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
    sub_text: '',
    size: 'portrait'
  });

  // App state
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [activeTab, setActiveTab] = useState('auto');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingIds, setUploadingIds] = useState([]);

  // Backend API base URL
  const API_BASE = 'https://triumphant-perception-production.up.railway.app';

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

  const handleUploadToDrive = async (image) => {
  if (uploadingIds.includes(image.id)) return;
  setUploadingIds(prev => [...prev, image.id]);

  try {
    console.log('📤 Uploading to Drive:', image);
    
    // Fix: Use image.url.url if nested, fallback to image.url
    const imageUrl = image.url.url || image.url;

    if (!imageUrl || !image.title) {
      showNotification('error', 'Invalid image data for upload.');
      return;
    }

    showNotification('info', 'Uploading to Google Drive...');

    const response = await fetch(`${API_BASE}/image/upload-to-drive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUrl, // Use the string URL
        fileName: image.title
      }),
    });

    const data = await response.json();
    console.log('📨 Drive response:', data);

    if (data.error) {
      throw new Error(data.error);
    }

    showNotification('success', `Uploaded! View in Drive`);
    window.open(data.webViewLink, '_blank');
  } catch (error) {
    console.error('Drive upload error:', error);
    showNotification('error', error.message || 'Failed to upload to Google Drive.');
  } finally {
    setUploadingIds(prev => prev.filter(id => id !== image.id));
  }
};

  const generateAutoImages = async (e) => {
  e.preventDefault();
  if (!autoMode.topic.trim()) {
    showNotification('error', 'Please fill in all required fields.');
    return;
  }

  setIsLoading(true);
  setShowSkeleton(true);
  setGeneratedImages([]);

  try {
    console.log('🤖 Sending auto request:', autoMode);
    const response = await fetch(`${API_BASE}/image/auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(autoMode),
    });

    console.log('📨 Auto response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Auto response data:', data);
    
    if (data.error) throw new Error(data.error);

    const timestamp = Date.now();

    // Fix: Access the nested url field
    const images = data.slides.map((slide, i) => {
      console.log(`🖼️ Slide ${i}:`, slide);
      return {
        id: timestamp + i,
        url: slide.url.url || slide.url, // Use slide.url.url if nested, fallback to slide.url
        title: `${autoMode.topic.replace(/\s+/g, "_")}_${timestamp}_${i + 1}`,
        description: `Tip ${i + 1}: ${autoMode.topic}`,
      };
    });

    console.log('📸 Processed images:', images);
    setGeneratedImages(images);
    setShowSkeleton(false);
    setIsLoading(false);
    showNotification('success', 'Images generated successfully!');
  } catch (error) {
    console.error('Error generating auto images:', error);
    setShowSkeleton(false);
    setIsLoading(false);
    showNotification('error', error.message || 'Failed to generate images. Please check your backend connection.');
  }
};

  const generateManualImages = async (e) => {
  e.preventDefault();
  if (!manualMode.image_prompt.trim()) {
    showNotification('error', 'Please fill in all required fields.');
    return;
  }

  setIsLoading(true);
  setShowSkeleton(true);
  setGeneratedImages([]);

  try {
    console.log('👤 Sending manual request:', manualMode);
    const response = await fetch(`${API_BASE}/image/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manualMode),
    });

    console.log('📨 Manual response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Manual response data:', data);

    if (data.error) {
      throw new Error(data.error);
    }

    const timestamp = Date.now();

    // Fix: Access the nested url field
    const images = data.slides.map((slide, i) => {
      console.log(`🖼️ Manual slide:`, slide);
      return {
        id: timestamp + i,
        url: slide.url.url || slide.url, // Use slide.url.url if nested, fallback to slide.url
        title: `Manual_Upload_${timestamp}`,
        description: manualMode.sub_text || "Custom generated image",
      };
    });

    console.log('📸 Processed manual images:', images);
    setGeneratedImages(images);
    setShowSkeleton(false);
    setIsLoading(false);
    showNotification('success', 'Image generated successfully!');
  } catch (error) {
    console.error('Error generating manual image:', error);
    setShowSkeleton(false);
    setIsLoading(false);
    showNotification('error', error.message || 'Failed to generate image. Please check your backend connection.');
  }
};

  const handleDownload = async (url, filename) => {
    try {
      console.log('📥 Downloading image:', url);
      
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });

      console.log('📨 Download response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('✅ Image blob created, size:', blob.size);
      
      const cleanFilename = filename.replace(/[^a-zA-Z0-9-_]/g, '_') + '.png';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      showNotification('success', 'Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      showNotification('error', 'Failed to download image.');
    }
  };

  const handleImageClick = (image) => {
    console.log('🖱️ Image clicked:', image);
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Debug function to check image loading
  const handleImageError = (e, image) => {
    console.error('❌ Image failed to load:', image);
    console.error('Error event:', e);
    showNotification('error', 'Failed to load image. Check console for details.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="px-4 md:px-8 lg:px-12 py-8 w-full max-w-7xl">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success'
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
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            Career Slide Generator
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              AI-Powered Career Slide Generator
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Create stunning career-themed slides with AI. Choose between automatic generation or manual customization.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('auto')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Auto Mode
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Manual Mode
            </button>
          </div>
        </div>

        {/* Auto Mode Form */}
        {activeTab === 'auto' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8 mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Auto Mode</h2>
            <p className="text-gray-600 mb-6 text-center">Let AI generate complete career slides based on your topic</p>

            <form onSubmit={generateAutoImages} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Career Topic *</label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={autoMode.topic}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your career topic (e.g., Interview Skills, Resume Writing)"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Number of Slides *</label>
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
                <p className="text-sm text-gray-500 mt-1">First slide will be the main topic, others will be tips</p>
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
                  <option value="portrait">Portrait (1024x1792)</option>
                  <option value="landscape">Landscape (1792x1024)</option>
                  <option value="square">Square (1024x1024)</option>
                </select>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Slides'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manual Mode Form */}
        {activeTab === 'manual' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8 mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Manual Mode</h2>
            <p className="text-gray-600 mb-6 text-center">Customize every aspect of your career slide</p>

            <form onSubmit={generateManualImages} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Image Prompt (for AI background) *</label>
                <textarea
                  id="image_prompt"
                  name="image_prompt"
                  value={manualMode.image_prompt}
                  onChange={handleManualChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the background image you want (e.g., 'modern office with laptop on desk')"
                  rows="3"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">The AI will generate a background based on this prompt</p>
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
                  <option value="portrait">Portrait (1024x1792)</option>
                  <option value="landscape">Landscape (1792x1024)</option>
                  <option value="square">Square (1024x1024)</option>
                </select>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm px-6 py-3 rounded-xl shadow-colored"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Slide'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && !showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              {activeTab === 'auto' ? 'Generated Career Slides' : 'Generated Slide'}
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {generatedImages.map((image, index) => (
                <div key={image.id} className="flex flex-col items-center">
                  <div
                    className="bg-white rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 cursor-pointer w-64"
                    onClick={() => handleImageClick(image)}
                  >
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-contain"
                        onError={(e) => handleImageError(e, image)}
                        onLoad={() => console.log(`✅ Image ${index} loaded successfully`)}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-800 truncate">{image.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">{image.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <button 
                      onClick={() => handleDownload(image.url, image.title)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleUploadToDrive(image)}
                      disabled={uploadingIds.includes(image.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                    >
                      {uploadingIds.includes(image.id) ? 'Uploading...' : 'Upload to Drive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {showSkeleton && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mx-auto max-w-5xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Generating Your Career Slides</h2>
            <p className="text-gray-600 mb-6 text-center">AI is creating your professional slides...</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: activeTab === 'auto' ? autoMode.num_slides : 1 }).map((_, index) => (
                <div key={index} className="animate-pulse flex flex-col items-center">
                  <div className="bg-gray-200 rounded-2xl w-full h-48"></div>
                  <div className="mt-4 space-y-2 w-full text-center">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto mt-3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
            <div className="bg-white rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 z-10"
                  onClick={closeModal}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="w-full h-auto object-contain max-h-[80vh]"
                  onError={(e) => handleImageError(e, selectedImage)}
                />
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => handleDownload(selectedImage.url, selectedImage.title)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandImageGenerator;
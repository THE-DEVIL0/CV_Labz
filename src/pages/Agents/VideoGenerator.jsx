
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import apiService from '@/services/api';

const VideoGenerator = () => {
    const [videoSettings, setVideoSettings] = useState({
        caption: '',
        avatar: 'male1'
    });

    const [isLoading, setIsLoading] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState(null);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [showSkeleton, setShowSkeleton] = useState(false);

    const avatars = [
        {
            id: 'male1',
            name: 'Alex',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'female1',
            name: 'Sarah',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'male2',
            name: 'James',
            image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'female2',
            name: 'Emma',
            image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'male3',
            name: 'Michael',
            image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'female3',
            name: 'Olivia',
            image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'male4',
            name: 'David',
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'female4',
            name: 'Sophia',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'neutral1',
            name: 'Taylor',
            image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&auto=format&fit=crop'
        },
        {
            id: 'neutral2',
            name: 'Jordan',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&auto=format&fit=crop'
        }
    ];

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => {
            setNotification({ show: false, type: '', message: '' });
        }, 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setVideoSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (value) => {
        setVideoSettings(prev => ({
            ...prev,
            avatar: value
        }));
    };

    const pollForVideo = async () => {
        let attempts = 0;
        const maxAttempts = 10; // 10 attempts * 90 seconds = 15 minutes total
        let isPollingActive = true;

        const checkVideoData = async () => {
            if (!isPollingActive) return;

            try {
                const response = await apiService.apiCall(
                    "/videos/video-output"
                );
                const videoData = response.data;

                console.log("Video response:", videoData);

                // Handle the API response format
                if (videoData) {
                    if (videoData.status === "processing") {
                        // Continue polling if video is still processing
                        attempts++;
                        console.log(`Attempt ${attempts}: Video still processing...`);
                        if (attempts < maxAttempts && isPollingActive) {
                            setTimeout(checkVideoData, 90000); // 90 second delay
                            return;
                        } else if (isPollingActive) {
                            setShowSkeleton(false);
                            setIsLoading(false);
                            isPollingActive = false;
                            showNotification(
                                "error",
                                "Timeout: Video generation took too long."
                            );
                            return;
                        }
                    } else if (videoData.url) {
                        // Video is ready
                        const selectedAvatar = avatars.find(a => a.id === videoSettings.avatar);
                        const finalVideo = {
                            id: Date.now(),
                            url: videoData.url,
                            caption: videoSettings.caption,
                            avatar: selectedAvatar,
                            timestamp: new Date().toLocaleString()
                        };

                        setGeneratedVideo(finalVideo);
                        setShowSkeleton(false);
                        setIsLoading(false);
                        isPollingActive = false;
                        showNotification("success", "Video generated successfully!");
                        return true;
                    }
                } else {
                    attempts++;
                    console.log(`Attempt ${attempts}: No video data yet...`);
                    if (attempts < maxAttempts && isPollingActive) {
                        setTimeout(checkVideoData, 90000); // 90 second delay
                    } else if (isPollingActive) {
                        setShowSkeleton(false);
                        setIsLoading(false);
                        isPollingActive = false;
                        showNotification("error", "Timeout: Video generation took too long.");
                    }
                }
            } catch (error) {
                console.error("Error polling for video data:", error);
                attempts++;
                if (attempts < maxAttempts && isPollingActive) {
                    setTimeout(checkVideoData, 90000);
                } else if (isPollingActive) {
                    setShowSkeleton(false);
                    setIsLoading(false);
                    isPollingActive = false;
                    showNotification("error", "Failed to generate video. Please try again.");
                }
            }
        };

        checkVideoData();
    };

    const generateVideo = async (e) => {
        e.preventDefault();
        if (!videoSettings.caption.trim()) {
            showNotification('error', 'Please enter a caption for your video');
            return;
        }

        setIsLoading(true);
        setShowSkeleton(true);
        setGeneratedVideo(null);

        try {
            // Send the video settings to trigger the generation
            try {
                await apiService.apiCall("/videos/video-input", {
                    method: "POST",
                    body: JSON.stringify({
                        caption: videoSettings.caption,
                        avatar: videoSettings.avatar
                    }),
                });
            }
            catch (error) {
                console.error("Error sending video settings:", error);
            }

            

            console.log("Video settings sent successfully");
            showNotification("success", "Video generation started!");

            // Now poll for the generated video
            await pollForVideo();
        } catch (error) {
            console.error("Error generating video:", error);
            setShowSkeleton(false);
            setIsLoading(false);
            showNotification("error", "Failed to start video generation. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="container px-4 py-12 mx-auto max-w-6xl">
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
                    <div className="inline-flex items-center bg-white/80 backdrop-blur-sm text-blue-700 shadow-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                        >
                            <path d="m22 8-6 4 6 4V8Z" />
                            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                        </svg>
                        AI Video Generator
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Create Professional Videos
                        </span>
                    </h1>

                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Generate engaging videos with AI avatars in seconds.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Settings Card */}
                    <Card className="rounded-2xl overflow-hidden shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                        <div className="p-6 md:p-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Video Settings</h2>

                            <form onSubmit={generateVideo} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700">Video Caption *</label>
                                    <Textarea
                                        id="caption"
                                        name="caption"
                                        value={videoSettings.caption}
                                        onChange={handleInputChange}
                                        className="min-h-[120px]"
                                        placeholder="Enter your video script or message..."
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Select Avatar *</label>
                                    <div className="relative">
                                        <div className="flex space-x-3 pb-2 overflow-x-auto scrollable-avatars">
                                            {avatars.map((avatar) => (
                                                <button
                                                    key={avatar.id}
                                                    type="button"
                                                    onClick={() => handleSelectChange(avatar.id)}
                                                    className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg transition-all ${videoSettings.avatar === avatar.id
                                                        ? 'bg-blue-100 border border-blue-300'
                                                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                                        }`}
                                                >
                                                    <Avatar className="h-12 w-12 mb-1">
                                                        <AvatarImage src={avatar.image} />
                                                        <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs text-gray-600">{avatar.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full mt-6 py-6 text-base font-medium"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating Video...
                                        </span>
                                    ) : (
                                        'Generate Video Now'
                                    )}
                                </Button>
                            </form>
                        </div>
                    </Card>

                    {/* Preview/Result Card */}
                    <Card className="rounded-2xl overflow-hidden shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                        <div className="p-6 md:p-8 h-full flex flex-col">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Video Preview</h2>

                            {(isLoading && showSkeleton) ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="animate-pulse space-y-4 w-full">
                                        <div className="aspect-video bg-gray-200 rounded-xl"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                    </div>
                                    <p className="mt-6 text-gray-500">Creating your video... This may take a few minutes.</p>
                                </div>
                            ) : generatedVideo ? (
                                <div className="flex-1 space-y-6">
                                    <div className="aspect-video bg-black rounded-xl overflow-hidden">
                                        <video
                                            src={generatedVideo.url}
                                            className="w-full h-full object-cover"
                                            controls
                                            poster={generatedVideo.avatar.image}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Caption</h3>
                                            <p className="text-gray-800 mt-1">{generatedVideo.caption}</p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={generatedVideo.avatar.image} />
                                                    <AvatarFallback>AV</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{generatedVideo.avatar.name}</p>
                                                    <p className="text-xs text-gray-500">{generatedVideo.timestamp}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" x2="12" y1="15" y2="3" />
                                                    </svg>
                                                    Download
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={generateVideo}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                        <path d="M3 3v5h5" />
                                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                                        <path d="M16 16h5v5" />
                                                    </svg>
                                                    Regenerate
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl">
                                    <div className="text-center p-6 max-w-xs">
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
                                            className="mx-auto h-12 w-12 text-gray-400 mb-4"
                                        >
                                            <path d="m22 8-6 4 6 4V8Z" />
                                            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Generated</h3>
                                        <p className="text-sm text-gray-500">Enter your caption and select an avatar to generate your first video.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;
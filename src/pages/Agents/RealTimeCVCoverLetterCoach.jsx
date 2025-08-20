import React from 'react';
import { useNavigate } from "react-router-dom";

const Agent3 = () => {

  const navigate = useNavigate();
  return (
    <div className="px-4 md:px-14 lg:px-24 py-8">
      <div className="max-w-4xl mx-auto">
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
              className="lucide lucide-user-check h-4 w-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
            Real-time CV & Cover Letter Coach
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Coach Expert
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Your real-time coach for building professional CVs and cover letters that stand out.
          </p>
        </div>
        
        <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">About This Agent</h2>
          <p className="text-gray-700 mb-8 text-base">
            Agent 3 is your real-time coach for CV and cover letter building. Get instant 
            feedback, suggestions, and guidance as you create professional documents that 
            showcase your skills and experience effectively.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Key Features</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Real-time CV coaching</li>
                <li>• Cover letter guidance</li>
                <li>• ATS optimization</li>
                <li>• Professional formatting</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Use Cases</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• CV building & optimization</li>
                <li>• Cover letter creation</li>
                <li>• Job application support</li>
                <li>• Career transition guidance</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center">
            <button className="inline-flex items-center justify-center gap-2 font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white text-lg px-12 py-6 rounded-2xl shadow-colored"
             onClick={() => navigate("/real-time-cv")}>
              Start Using Agent 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agent3; 
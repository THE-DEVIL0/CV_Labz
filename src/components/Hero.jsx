import React from "react";
import {Link} from 'react-router-dom'
const Hero = () => {
  return (
    <div className="mt-10 px-4 md:px-8 lg:px-12">
      <div className="flex flex-col lg:flex-row items-center justify-between">
        {/* Left Section */}
        <div className="lg:w-1/2 mt-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 glass-card text-blue-700 shadow px-3 py-2 rounded-full text-xs font-semibold">
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
              className="lucide lucide-star h-4 w-4 text-yellow-500"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
            Trusted by 10,000+ job seekers
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
            Find your
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {" "}dream job{" "}
            </span>
            faster
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Create professional resumes, AI-powered cover letters, and prepare
            for interviews, all on one platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto lg:mx-0">
            {[
              "AI-enhanced resumes in minutes",
              "1-on-1 Interview Coaching",
              "Personalized interview tips",
            ].map((text, index) => (
              <div className="flex items-start" key={index}>
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
                  className="lucide lucide-circle-check-big h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0"
                >
                  <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                <span className="text-gray-700 font-medium text-sm">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              
          
            <div className="flex items-center text-gray-600">
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
                className="lucide lucide-clock h-4 w-4 mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-medium text-sm">
                Takes just 5 minutes to get started
              </span>
            </div>
          </div>

          <p className="text-gray-500 mt-4 font-medium text-xs">
            After that, just $9.99/month • Can be cancelled at any time
          </p>
        </div>

        {/* Right Section */}
        <div className="lg:w-1/2 mt-8 lg:mt-0 relative flex justify-center">
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg max-w-xs w-full aspect-[4/5]">
            <img
              src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=800"
              alt="Professional working on resume"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom Right Badge */}
          <div className="absolute -bottom-8 -right-8 backdrop-blur-xl shadow p-4 rounded-2xl hidden md:block">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
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
                  className="lucide lucide-circle-check-big h-5 w-5 text-green-600"
                >
                  <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Resume Approved!</p>
                <p className="text-xs text-gray-600">AI-enhanced improvements</p>
              </div>
            </div>
          </div>

          {/* Top Left Badge */}
          <div className="absolute -top-8 -left-8 backdrop-blur-xl shadow p-4 rounded-2xl bg-white/50 hidden lg:block">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">87%</div>
              <div className="text-xs text-gray-600 font-medium">
                Success rate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, isLoading, error, clearError } = useSession();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });
  const [focusedField, setFocusedField] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    setTimeout(() => {
      setMessage({ show: false, type: '', text: '' });
    }, 4000);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Show error message from context
  useEffect(() => {
    if (error) {
      showMessage('error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await register(formData);
      
      if (result.success) {
        showMessage('success', 'Registration successful! Redirecting...');
        setFormData({ email: '', password: '' });
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        showMessage('error', result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Register error:', error);
      showMessage('error', 'Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Message Notification */}
      {message.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-500 transform ${
          message.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-green-400/50' 
            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border border-red-400/50'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <span className="font-semibold text-sm">{message.text}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Section - Welcome Content */}
            <div className="lg:w-1/2 text-center lg:text-left space-y-8 animate-fade-in-up">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-2xl px-4 py-3 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Join 10,000+ users worldwide</span>
              </div>
              
              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  Create Account
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                  Join our community and unlock unlimited AI-powered image generation possibilities.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                {[
                  { icon: "🎨", title: "AI Image Generation", desc: "Create stunning visuals with advanced AI" },
                  { icon: "🤖", title: "Smart Agents", desc: "Access powerful AI agents for various tasks" },
                  { icon: "🔒", title: "Secure & Private", desc: "Your data is protected with enterprise security" },
                  { icon: "⚡", title: "Lightning Fast", desc: "Generate images in seconds, not minutes" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Section - Register Form */}
            <div className="lg:w-1/2 flex justify-center">
              <div className="w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  
                  {/* Form Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-white/70">Enter your details to get started</p>
                  </div>
                  
                  {/* Register Form */}
                  <form onSubmit={handleRegister} className="space-y-6">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-white/90">
                        Email Address
                      </label>
                      <div className="relative group">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField('')}
                          required
                          className={`w-full px-4 py-4 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 ${
                            focusedField === 'email' ? 'bg-white/20 border-blue-400' : ''
                          }`}
                          placeholder="Enter your email"
                        />
                        <svg
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                            focusedField === 'email' ? 'text-blue-400' : 'text-white/50'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-white/90">
                        Password
                      </label>
                      <div className="relative group">
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField('')}
                          required
                          minLength="6"
                          className={`w-full px-4 py-4 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 ${
                            focusedField === 'password' ? 'bg-white/20 border-blue-400' : ''
                          }`}
                          placeholder="Create a password (min 6 characters)"
                        />
                        <svg
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                            focusedField === 'password' ? 'text-blue-400' : 'text-blue-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Submit Button */}
                    <button 
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-2xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative flex items-center justify-center gap-3">
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Create Account
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                  
                  {/* Form Footer */}
                  <div className="text-center mt-8 pt-6 border-t border-white/20">
                    <p className="text-white/70 mb-4">
                      Already have an account?{' '}
                      <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline">
                        Sign in here
                      </Link>
                    </p>
                    <Link to="/" className="text-white/50 hover:text-white/80 text-sm transition-colors duration-200 hover:underline inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Register;
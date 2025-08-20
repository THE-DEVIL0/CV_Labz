import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useSession();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });
  const [focusedField, setFocusedField] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // Track mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        showMessage('success', 'Login successful! Redirecting...');
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        showMessage('error', result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('error', 'Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs with Parallax */}
        <div 
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.02}px, ${(mousePosition.y - window.innerHeight / 2) * 0.02}px)`
          }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"
          style={{
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * -0.03}px, ${(mousePosition.y - window.innerHeight / 2) * -0.03}px)`
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"
          style={{
            transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.01}px, ${(mousePosition.y - window.innerHeight / 2) * 0.01}px)`
          }}
        ></div>
        
        {/* Additional Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl animate-bounce delay-300"></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl animate-bounce delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-green-400/10 rounded-full blur-2xl animate-bounce delay-1000"></div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
        
        {/* Particle System */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Enhanced Message Notification */}
      {message.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-500 transform ${
          message.show ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
        } ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-green-400/50' 
            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border border-red-400/50'
        } animate-bounce-in`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
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
            
            {/* Left Section - Enhanced Welcome Content */}
            <div className="lg:w-1/2 text-center lg:text-left space-y-8 animate-fade-in-up">
              {/* Enhanced Trust Badge */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-2xl px-4 py-3 rounded-full text-sm font-medium group hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse group-hover:animate-spin"></div>
                <span className="group-hover:text-green-300 transition-colors duration-300">Trusted by 10,000+ users worldwide</span>
              </div>
              
              {/* Enhanced Main Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight animate-text-glow">
                  Sign In
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  Access your AI-powered image generation dashboard and unlock unlimited creative possibilities.
                </p>
              </div>

              {/* Enhanced Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                {[
                  { icon: "🎨", title: "AI Image Generation", desc: "Create stunning visuals with advanced AI", color: "from-purple-500 to-pink-500" },
                  { icon: "🤖", title: "Smart Agents", desc: "Access powerful AI agents for various tasks", color: "from-blue-500 to-cyan-500" },
                  { icon: "🔒", title: "Secure & Private", desc: "Your data is protected with enterprise security", color: "from-green-500 to-emerald-500" },
                  { icon: "⚡", title: "Lightning Fast", desc: "Generate images in seconds, not minutes", color: "from-yellow-500 to-orange-500" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-white/30 relative overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {/* Animated Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    
                    {/* Floating Icon */}
                    <div className="text-4xl mb-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10">
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300 relative z-10">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors duration-300 relative z-10">
                      {feature.desc}
                    </p>
                    
                    {/* Hover Border Effect */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Section - Enhanced Login Form */}
            <div className="lg:w-1/2 flex justify-center">
              <div className="w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 animate-fade-in-up hover:bg-white/15 transition-all duration-500 group" style={{ animationDelay: '200ms' }}>
                  
                  {/* Enhanced Form Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 animate-pulse">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                      Sign In
                    </h2>
                    <p className="text-white/70 group-hover:text-white/90 transition-colors duration-300">Enter your credentials to continue</p>
                  </div>
                  
                  {/* Enhanced Login Form */}
                  <form onSubmit={handleLogin} className="space-y-6">
                    {/* Enhanced Email Field */}
                    <div className="space-y-2 group">
                      <label htmlFor="email" className="block text-sm font-medium text-white/90 group-hover:text-white transition-colors duration-300">
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
                          className={`w-full px-4 py-4 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15 ${
                            focusedField === 'email' ? 'bg-white/20 border-blue-400 shadow-lg shadow-blue-400/25' : ''
                          }`}
                          placeholder="Enter your email"
                        />
                        <svg
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                            focusedField === 'email' ? 'text-blue-400 scale-110' : 'text-white/50'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Enhanced Password Field */}
                    <div className="space-y-2 group">
                      <label htmlFor="password" className="block text-sm font-medium text-white/90 group-hover:text-white transition-colors duration-300">
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
                          className={`w-full px-4 py-4 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15 ${
                            focusedField === 'password' ? 'bg-white/20 border-blue-400 shadow-lg shadow-blue-400/25' : ''
                          }`}
                          placeholder="Enter your password"
                        />
                        <svg
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                            focusedField === 'password' ? 'text-blue-400 scale-110' : 'text-blue-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Enhanced Submit Button */}
                    <button 
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-2xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed transition-all duration-300 hover:shadow-blue-500/25"
                    >
                      {/* Enhanced Button Effects */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-200"></div>
                      
                      <span className="relative flex items-center justify-center gap-3">
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing In...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Sign In
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                  
                  {/* Enhanced Form Footer */}
                  <div className="text-center mt-8 pt-6 border-t border-white/20">
                    <p className="text-white/70 mb-4 group-hover:text-white/90 transition-colors duration-300">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-all duration-200 hover:underline hover:scale-105 inline-block">
                        Sign up here
                      </Link>
                    </p>
                    <Link to="/" className="text-white/50 hover:text-white/80 text-sm transition-all duration-200 hover:underline inline-flex items-center gap-2 group/link">
                      <svg className="w-4 h-4 group-hover/link:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Enhanced Custom CSS for animations */}
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes text-glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1);
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
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
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login; 
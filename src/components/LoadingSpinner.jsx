import React, { useState, useEffect } from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  showText = true,
  variant = 'spinner', // 'spinner', 'dots', 'pulse', 'bars'
  color = 'blue',
  showProgress = false,
  progress = 0,
  duration = 2000,
  onComplete
}) => {
  const [dots, setDots] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Animated dots effect
  useEffect(() => {
    if (variant === 'dots') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [variant]);

  // Fade in effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-complete after duration
  useEffect(() => {
    if (duration && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-600 text-blue-600 bg-blue-50',
    green: 'border-green-600 text-green-600 bg-green-50',
    red: 'border-red-600 text-red-600 bg-red-50',
    yellow: 'border-yellow-600 text-yellow-600 bg-yellow-50',
    gray: 'border-gray-600 text-gray-600 bg-gray-50'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-full bg-current animate-pulse`}></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className={`flex items-center justify-center space-x-1 ${sizeClasses[size]}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 bg-current rounded-full animate-pulse"
                style={{
                  height: `${size === 'sm' ? '12px' : size === 'md' ? '16px' : size === 'lg' ? '20px' : '24px'}`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        );
      
      default: // spinner
        return (
          <div className={`animate-spin rounded-full border-2 border-t-transparent ${colorClasses[color].split(' ')[0]} ${sizeClasses[size]}`}></div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}>
      {/* Main Spinner */}
      <div className={`relative ${colorClasses[color].split(' ')[2]} rounded-lg p-4`}>
        {renderSpinner()}
      </div>
      
      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full max-w-xs mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-current h-2 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: colorClasses[color].split(' ')[1]
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
      
      {/* Text */}
      {showText && text && (
        <div className="mt-4 text-center">
          <p className={`text-sm font-medium ${colorClasses[color].split(' ')[1]}`}>
            {text}
            {variant === 'dots' && <span className="ml-1">{dots}</span>}
          </p>
          {variant === 'dots' && (
            <p className="text-xs text-gray-500 mt-1">
              Please wait while we process your request
            </p>
          )}
        </div>
      )}
      
      {/* Accessibility */}
      <div className="sr-only" role="status" aria-live="polite">
        {text || 'Loading'}
      </div>
    </div>
  );
};

export default LoadingSpinner; 
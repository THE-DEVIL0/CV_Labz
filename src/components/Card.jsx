import React from 'react';

const Card = ({ image, title, description, onClick, className = '' }) => {
  return (
    <div 
      className={`glass-card rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Card; 
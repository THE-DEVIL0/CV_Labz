import React from 'react';
import Card from './Card';

const CardExample = () => {
  const cardData = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
      title: 'Email Marketing',
      description: 'Create engaging email campaigns that convert'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
      title: 'Social Media',
      description: 'Boost your social media presence'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
      title: 'Content Creation',
      description: 'Generate compelling content for your audience'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      title: 'Customer Support',
      description: 'Provide excellent customer service'
    }
  ];

  const handleCardClick = (cardId) => {
    console.log(`Card ${cardId} clicked`);
    // Add your click handler logic here
  };

  return (
    <div className="px-4 md:px-14 lg:px-24 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-[1.05]">
            Reusable
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {" "}Card Component
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            A flexible card component that displays images and titles with optional descriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardData.map((card) => (
            <Card
              key={card.id}
              image={card.image}
              title={card.title}
              description={card.description}
              onClick={() => handleCardClick(card.id)}
              className="hover:scale-105"
            />
          ))}
        </div>

        {/* Example with different styling */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Featured Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop"
              title="Premium Service"
              description="Get access to our premium features and advanced analytics to boost your marketing campaigns."
              onClick={() => console.log('Premium card clicked')}
              className="md:col-span-1"
            />
            <Card
              image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
              title="Analytics Dashboard"
              description="Track your performance with detailed analytics and insights to optimize your strategy."
              onClick={() => console.log('Analytics card clicked')}
              className="md:col-span-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardExample; 
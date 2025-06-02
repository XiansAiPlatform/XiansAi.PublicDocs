import React from 'react';

interface TypingIndicatorProps {
  typingStage: 'contacting' | 'waiting' | 'long-wait';
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingStage }) => {
  const getTypingText = () => {
    switch (typingStage) {
      case 'contacting':
        return 'contacting agent';
      case 'waiting':
      case 'long-wait':
        return 'waiting for reply';
      default:
        return 'typing';
    }
  };

  return (
    <div className="mr-auto bg-white border border-gray-200 text-gray-800 max-w-[85%] rounded-lg px-3 py-2 text-sm shadow">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-gray-600 text-xs">{getTypingText()}</span>
      </div>
    </div>
  );
};

export default TypingIndicator; 
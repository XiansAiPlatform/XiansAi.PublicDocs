import React, { useCallback, useState, useEffect } from 'react';
import { useMetadataSubscription } from '../../../hooks/useMetadataSubscription';

interface TypingIndicatorProps {
  typingStage: 'contacting' | 'waiting' | 'long-wait';
  onContentChange?: () => void;
}

interface ActivityData {
  summary?: string;
  details?: string;
  success?: boolean;
  timestamp?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingStage, onContentChange }) => {
  const [latestActivity, setLatestActivity] = useState<ActivityData | null>(null);

  // Notify parent when content changes (height might change)
  useEffect(() => {
    if (onContentChange) {
      onContentChange();
    }
  }, [latestActivity, onContentChange]);

  // Stable callback to prevent constant re-subscribing
  const handleActivityLogMessage = useCallback((message: any) => {
    console.log('[TypingIndicator] ActivityLog message received:', message);
    
    // Extract ActivityLog details from the metadata
    const activityData = message.data?.metadata || message.metadata;
    if (activityData && activityData.messageType === 'ActivityLog') {
      console.log('[TypingIndicator] ActivityLog details:', {
        summary: activityData.summary,
        details: activityData.details,
        success: activityData.success,
        timestamp: activityData.timestamp,
        stepIndex: message.stepIndex
      });
      
      // Update state with the latest activity
      setLatestActivity({
        summary: activityData.summary,
        details: activityData.details,
        success: activityData.success,
        timestamp: activityData.timestamp
      });
    }
  }, []);

  // Subscribe to ActivityLog metadata messages
  const { latestMessage } = useMetadataSubscription({
    subscriberId: 'typing-indicator',
    messageTypes: ['ActivityLog'],
    onMessage: handleActivityLogMessage
  });

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

  const renderActivityContent = () => {
    if (latestActivity?.summary) {
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            </div>
            <span className="text-blue-600 text-xs font-medium">
              {latestActivity.success === false ? '⚠️ ' : ''}
              {latestActivity.summary}
            </span>
          </div>
          {latestActivity.details && (
            <div className="text-xs text-gray-500 ml-4 pl-2 border-l-2 border-gray-200">
              {latestActivity.details}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-gray-600 text-xs">{getTypingText()}</span>
      </div>
    );
  };

  return (
    <div className={`mr-auto bg-white border text-gray-800 max-w-[85%] rounded-lg px-3 py-2 text-sm shadow transition-all duration-200 ${
      latestActivity?.summary 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-gray-200'
    }`}>
      {renderActivityContent()}
    </div>
  );
};

export default TypingIndicator; 
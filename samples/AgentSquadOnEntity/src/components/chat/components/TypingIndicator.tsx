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
  id?: string; // Add unique identifier
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingStage, onContentChange }) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);

  // Notify parent when content changes (height might change)
  useEffect(() => {
    if (onContentChange) {
      onContentChange();
    }
  }, [activities, onContentChange]);

  // Stable callback to prevent constant re-subscribing
  const handleActivityLogMessage = useCallback((message: any) => {
    console.log('[TypingIndicator] ActivityLog message received:', message);
    
    // First check if the message itself contains the ActivityLog data (top level)
    // Then fall back to checking nested metadata locations
    const activityData = message.messageType === 'ActivityLog' ? message :
                        message.data?.metadata || 
                        message.metadata || 
                        message.data?.Metadata || 
                        message.Metadata ||
                        message.data;
    
    console.log('[TypingIndicator] 🔍 Extracted activityData:', activityData);
    console.log('[TypingIndicator] 📋 Available paths:', {
      'message (top level)': message.messageType === 'ActivityLog' ? 'Found ActivityLog at top level' : 'Not ActivityLog at top level',
      'message.data?.metadata': message.data?.metadata,
      'message.metadata': message.metadata,
      'message.data?.Metadata': message.data?.Metadata,
      'message.Metadata': message.Metadata,
      'message.data': message.data
    });
    
    if (activityData && activityData.messageType === 'ActivityLog') {
      console.log('[TypingIndicator] ✅ ActivityLog details:', {
        summary: activityData.summary,
        details: activityData.details,
        success: activityData.success,
        timestamp: activityData.timestamp,
        stepIndex: message.stepIndex
      });
      
      // Add new activity to the list
      const newActivity: ActivityData = {
        summary: activityData.summary,
        details: activityData.details,
        success: activityData.success,
        timestamp: activityData.timestamp,
        id: `${Date.now()}-${Math.random()}` // Simple unique ID
      };
      
      setActivities(prev => [...prev, newActivity]);
    } else {
      console.log('[TypingIndicator] ❌ Not ActivityLog or no valid activityData:', {
        messageType: activityData?.messageType,
        hasActivityData: !!activityData
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
    if (activities.length > 0) {
      return (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div key={activity.id || index} className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                </div>
                <span className="text-blue-600 text-xs font-medium">
                  {activity.success === false ? '⚠️ ' : ''}
                  {activity.summary}
                </span>
              </div>
              {activity.details && (
                <div className="text-xs text-gray-500 ml-4 pl-2 border-l-2 border-gray-200">
                  {activity.details}
                </div>
              )}
            </div>
          ))}
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
      activities.length > 0 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-gray-200'
    }`}>
      {renderActivityContent()}
    </div>
  );
};

export default TypingIndicator; 
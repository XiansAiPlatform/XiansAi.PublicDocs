import { useEffect, useState, useCallback } from 'react';
import { useWebSocketSteps } from '../context/WebSocketStepsContext';
import { MetadataMessage } from '../middleware/MetadataMessageRouter';

export interface MetadataSubscriptionOptions {
  subscriberId: string;
  messageTypes: string[];
  stepIndex?: number;
  onMessage?: (message: MetadataMessage) => void;
}

/**
 * Custom hook for subscribing to specific metadata message types
 * This demonstrates how UI components can easily subscribe to the messages they're interested in
 */
export function useMetadataSubscription(options: MetadataSubscriptionOptions) {
  const { subscribeToMetadata, unsubscribeFromMetadata } = useWebSocketSteps();
  const [messages, setMessages] = useState<MetadataMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<MetadataMessage | null>(null);

  const handleMessage = useCallback((message: MetadataMessage) => {
    setMessages(prev => [...prev, message]);
    setLatestMessage(message);
    
    // Call external callback if provided
    options.onMessage?.(message);
  }, [options.onMessage]);

  useEffect(() => {
    console.log(`[useMetadataSubscription] Subscribing to messageTypes: ${options.messageTypes.join(', ')} for subscriber: ${options.subscriberId}`);
    
    const unsubscribe = subscribeToMetadata(
      options.subscriberId,
      options.messageTypes,
      handleMessage,
      options.stepIndex
    );

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log(`[useMetadataSubscription] Unsubscribing subscriber: ${options.subscriberId}`);
      unsubscribe();
    };
  }, [options.subscriberId, options.messageTypes.join(','), options.stepIndex, subscribeToMetadata, handleMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLatestMessage(null);
  }, []);

  const getMessagesByType = useCallback((messageType: string) => {
    return messages.filter(msg => msg.messageType === messageType);
  }, [messages]);

  const getLatestMessageByType = useCallback((messageType: string) => {
    const typeMessages = getMessagesByType(messageType);
    return typeMessages.length > 0 ? typeMessages[typeMessages.length - 1] : null;
  }, [getMessagesByType]);

  return {
    messages,
    latestMessage,
    clearMessages,
    getMessagesByType,
    getLatestMessageByType,
    messageCount: messages.length
  };
}

// Convenience hooks for common metadata message types

/**
 * Hook for subscribing to UI update messages
 */
export function useUIUpdateMessages(subscriberId: string, stepIndex?: number) {
  return useMetadataSubscription({
    subscriberId,
    messageTypes: ['UI_UPDATE'],
    stepIndex
  });
}

/**
 * Hook for subscribing to progress messages
 */
export function useProgressMessages(subscriberId: string, stepIndex?: number) {
  return useMetadataSubscription({
    subscriberId,
    messageTypes: ['PROGRESS', 'PROGRESS_UPDATE'],
    stepIndex
  });
}

/**
 * Hook for subscribing to form update messages
 */
export function useFormUpdateMessages(subscriberId: string, stepIndex?: number) {
  return useMetadataSubscription({
    subscriberId,
    messageTypes: ['FORM_UPDATE', 'FIELD_UPDATE', 'VALIDATION_UPDATE'],
    stepIndex
  });
}

/**
 * Hook for subscribing to notification messages
 */
export function useNotificationMessages(subscriberId: string, stepIndex?: number) {
  return useMetadataSubscription({
    subscriberId,
    messageTypes: ['NOTIFICATION', 'ALERT', 'WARNING', 'ERROR_NOTIFICATION'],
    stepIndex
  });
}

/**
 * Hook for subscribing to status messages
 */
export function useStatusMessages(subscriberId: string, stepIndex?: number) {
  return useMetadataSubscription({
    subscriberId,
    messageTypes: ['STATUS_UPDATE', 'STATE_CHANGE', 'WORKFLOW_STATUS'],
    stepIndex
  });
} 
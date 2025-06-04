import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ConnectionState, InboundMessage, HubEvent } from '../types';
import { WebSocketHub } from '../middleware/WebSocketHub';
import { MetadataMessage } from '../middleware/MetadataMessageRouter';
import { useSteps } from './StepsContext';
import { useSettings } from './SettingsContext';
import { getAgentForStep } from '../modules/poa/steps';

interface WebSocketStepsContextType {
  // Connection states
  connectionStates: Map<number, ConnectionState>;
  isConnected: boolean;
  
  // Messages
  chatMessages: Map<number, ChatMessage[]>;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string, metadata?: any) => Promise<void>;
  
  // Metadata subscription
  subscribeToMetadata: (subscriberId: string, messageTypes: string[], callback: (message: MetadataMessage) => void, stepIndex?: number) => () => void;
  unsubscribeFromMetadata: (subscriberId: string) => void;
  
  // Statistics
  getStats: () => any;
}

const WebSocketStepsContext = createContext<WebSocketStepsContextType | null>(null);

export const useWebSocketSteps = () => {
  const context = useContext(WebSocketStepsContext);
  if (!context) {
    throw new Error('useWebSocketSteps must be used within WebSocketStepsProvider');
  }
  return context;
};

interface Props {
  children: React.ReactNode;
}

export const WebSocketStepsProvider: React.FC<Props> = ({ children }) => {
  const { steps, activeStep, isInitialized } = useSteps();
  const { settings } = useSettings();
  
  const [connectionStates, setConnectionStates] = useState<Map<number, ConnectionState>>(new Map());
  const [chatMessages, setChatMessages] = useState<Map<number, ChatMessage[]>>(new Map());
  const [threadIds, setThreadIds] = useState<Map<number, string>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  
  const hubRef = useRef<WebSocketHub | null>(null);

  // Helper functions for message management
  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prevMessages => {
      const newMessagesMap = new Map(prevMessages);
      const existingMessages = newMessagesMap.get(message.stepIndex) || [];
      newMessagesMap.set(message.stepIndex, [...existingMessages, message]);
      return newMessagesMap;
    });

    if (message.threadId) {
      setThreadIds(prev => new Map(prev).set(message.stepIndex, message.threadId!));
    }
  }, []);

  const getThreadId = useCallback((stepIndex: number): string | undefined => {
    return threadIds.get(stepIndex);
  }, [threadIds]);
  
  // Effect to create and manage the WebSocketHub instance and its listeners
  useEffect(() => {
    // Only proceed if we have steps data available
    if (steps.length === 0) {
      return;
    }
    
    const hub = WebSocketHub.getInstance();
    hubRef.current = hub;

    const handleConnectionChange = (event: HubEvent) => {
      const newConnectionStates = hub.getConnectionStates();
      setConnectionStates(new Map(newConnectionStates));
      const currentlyConnected = Array.from(newConnectionStates.values()).some(state => state.status === 'connected');
      setIsConnected(currentlyConnected);
    };

    const handleMessage = (event: HubEvent) => {
      const chatMessage = event.data as ChatMessage;
      addChatMessage(chatMessage);
    };

    const handleError = (event: HubEvent) => {
      console.error(`[WebSocketStepsContext] Event: error`, event.data);
    };

    hub.on('connection_change', handleConnectionChange);
    hub.on('message', handleMessage);
    hub.on('error', handleError);

    // Cleanup function
    return () => {
      hub.off('connection_change', handleConnectionChange);
      hub.off('message', handleMessage);
      hub.off('error', handleError);
      hubRef.current = null;
    };
  }, [addChatMessage, steps.length]);

  // Effect to initialize the hub when settings or steps change
  useEffect(() => {
    // Only proceed if we have steps data available
    if (steps.length === 0) {
      return;
    }
    
    const hub = hubRef.current;
    if (!hub) {
      return;
    }

    const allSettingsPresent = settings.tenantId && settings.agentWebsocketUrl && settings.agentApiKey && settings.participantId;

    if (allSettingsPresent) {
      hub.initialize(settings, steps)
        .then(() => {
          const newConnectionStates = hub.getConnectionStates();
          setConnectionStates(new Map(newConnectionStates));
          const currentlyConnected = Array.from(newConnectionStates.values()).some(state => state.status === 'connected');
          setIsConnected(currentlyConnected);
        })
        .catch(error => {
          console.error(`[WebSocketStepsContext] Error initializing hub:`, error);
        });
    } else {
      hub.disconnectAll().then(() => {
        setConnectionStates(new Map());
        setIsConnected(false);
      });
    }
  }, [settings, steps]);

  // sendMessage using the new architecture
  const sendMessage = useCallback(async (content: string, metadata?: any) => {
    // Check if we have steps data
    if (steps.length === 0) {
      throw new Error('Steps not yet available.');
    }
    
    const hub = hubRef.current;
    if (!hub) {
      throw new Error('Not connected, hub instance not available.');
    }
    
    const currentStepDetails = steps[activeStep];
    if (!currentStepDetails) {
      throw new Error('Current step not found.');
    }

    // Use new agent structure
    const agent = getAgentForStep(currentStepDetails);
    if (!agent) {
      // Fallback to old bot structure for backward compatibility
      if (!currentStepDetails.bot || !currentStepDetails.bot.workflowId) {
        throw new Error('Current step does not have an agent or bot configured.');
      }
    }

    // Optimistic UI Update
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      direction: 'Incoming',
      stepIndex: activeStep,
      timestamp: new Date(),
      metadata,
      threadId: getThreadId(activeStep) || '', 
    };
    addChatMessage(userMessage);

    try {
      if (agent) {
        // Use the new sendMessageToAgent method
        await hub.sendMessageToAgent(content, agent.id);
      } else {
        // This fallback path shouldn't be needed anymore, but keeping for safety
        throw new Error('No agent found for current step.');
      }
    } catch (error) {
      console.error(`[WebSocketStepsContext] Error sending message for step ${activeStep}:`, error);
      throw error;
    }
  }, [activeStep, steps, settings, addChatMessage, getThreadId]);

  // Metadata subscription methods
  const subscribeToMetadata = useCallback((subscriberId: string, messageTypes: string[], callback: (message: MetadataMessage) => void, stepIndex?: number) => {
    const hub = hubRef.current;
    if (!hub) {
      return () => {}; // Return empty unsubscribe function
    }
    
    return hub.subscribeToMetadata(subscriberId, messageTypes, callback, stepIndex);
  }, []);

  const unsubscribeFromMetadata = useCallback((subscriberId: string) => {
    const hub = hubRef.current;
    if (!hub) {
      return;
    }
    
    hub.unsubscribeFromMetadata(subscriberId);
  }, []);

  // Manual connect/disconnect for context consumers
  const manualConnect = useCallback(async () => {
    if (steps.length === 0) {
      return;
    }
    
    const hub = hubRef.current;
    if (hub && settings.tenantId && settings.agentWebsocketUrl) {
      await hub.initialize(settings, steps); 
    } else if (!hub) {
      console.warn('[WebSocketStepsContext] Manual connect called, but hub instance not yet created.');
    } else {
      console.warn('[WebSocketStepsContext] Manual connect called, but settings are incomplete.');
    }
  }, [settings, steps]);

  const manualDisconnect = useCallback(async () => {
    const hub = hubRef.current;
    if (hub) {
      await hub.disconnectAll();
      setConnectionStates(new Map());
      setIsConnected(false);
    }
  }, []);

  // Get statistics from all components
  const getStats = useCallback(() => {
    const hub = hubRef.current;
    
    // Calculate message store stats directly from React state
    const messageStoreStats = {
      totalSteps: Array.from(new Set([...chatMessages.keys()])).length,
      totalChatMessages: Array.from(chatMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
      stepStats: Array.from(new Set([...chatMessages.keys()])).reduce((acc, stepIndex) => {
        acc[stepIndex] = {
          chat: chatMessages.get(stepIndex)?.length || 0
        };
        return acc;
      }, {} as Record<number, { chat: number }>)
    };
    
    return {
      hub: hub?.getStats() || null,
      messageStore: messageStoreStats,
      context: {
        isConnected,
        connectionStatesCount: connectionStates.size
      }
    };
  }, [isConnected, connectionStates, chatMessages]);
  
  const value: WebSocketStepsContextType = {
    connectionStates,
    isConnected,
    chatMessages,
    connect: manualConnect,
    disconnect: manualDisconnect,
    sendMessage,
    subscribeToMetadata,
    unsubscribeFromMetadata,
    getStats
  };
  
  return (
    <WebSocketStepsContext.Provider value={value}>
      {children}
    </WebSocketStepsContext.Provider>
  );
}; 
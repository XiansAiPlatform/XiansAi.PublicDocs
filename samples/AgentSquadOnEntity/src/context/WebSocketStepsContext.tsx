import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, SystemMessage, ConnectionState, InboundMessage, HubEvent } from '../types';
import { WebSocketHub } from '../middleware/WebSocketHub';
import { MessageStore, MessageStoreEvents } from '../middleware/MessageStore';
import { MetadataMessage } from '../middleware/MetadataMessageRouter';
import { useSteps } from './StepsContext';
import { useSettings } from './SettingsContext';

interface WebSocketStepsContextType {
  // Connection states
  connectionStates: Map<number, ConnectionState>;
  isConnected: boolean;
  
  // Messages
  chatMessages: Map<number, ChatMessage[]>;
  systemMessages: Map<number, SystemMessage[]>;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string, metadata?: any) => Promise<void>;
  
  // Metadata subscription
  subscribeToMetadata: (subscriberId: string, messageTypes: string[], callback: (message: MetadataMessage) => void, stepIndex?: number) => () => void;
  unsubscribeFromMetadata: (subscriberId: string) => void;
  
  // UI State from system messages
  uiState: Map<number, any>;
  
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
  const { steps, activeStep } = useSteps();
  const { settings } = useSettings();
  
  const [connectionStates, setConnectionStates] = useState<Map<number, ConnectionState>>(new Map());
  const [chatMessages, setChatMessages] = useState<Map<number, ChatMessage[]>>(new Map());
  const [systemMessages, setSystemMessages] = useState<Map<number, SystemMessage[]>>(new Map());
  const [uiState, setUiState] = useState<Map<number, any>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  
  const hubRef = useRef<WebSocketHub | null>(null);
  const storeRef = useRef<MessageStore | null>(null);
  
  // Initialize MessageStore with events
  if (storeRef.current === null) {
    const messageStoreEvents: MessageStoreEvents = {
      onMessageAdded: (stepIndex, message) => {
        setChatMessages(prevMessages => {
          const newMessagesMap = new Map(prevMessages);
          newMessagesMap.set(stepIndex, storeRef.current!.getChatMessages(stepIndex));
          return newMessagesMap;
        });
      },
      onSystemMessageAdded: (stepIndex, message) => {
        setSystemMessages(prevSystemMessages => {
          const newSystemMessagesMap = new Map(prevSystemMessages);
          newSystemMessagesMap.set(stepIndex, storeRef.current!.getSystemMessages(stepIndex));
          return newSystemMessagesMap;
        });
      },
      onMessagesCleared: (stepIndex) => {
        setChatMessages(prevMessages => {
          const newMessagesMap = new Map(prevMessages);
          newMessagesMap.delete(stepIndex);
          return newMessagesMap;
        });
        setSystemMessages(prevSystemMessages => {
          const newSystemMessagesMap = new Map(prevSystemMessages);
          newSystemMessagesMap.delete(stepIndex);
          return newSystemMessagesMap;
        });
      }
    };
    
    storeRef.current = new MessageStore(messageStoreEvents);
    console.log('[WebSocketStepsContext] MessageStore instance created with events.');
  }
  const currentMessageStore = storeRef.current;
  
  // Effect to create and manage the WebSocketHub instance and its listeners
  useEffect(() => {
    console.log('[WebSocketStepsContext] Mount effect: Getting WebSocketHub singleton instance.');
    
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
      currentMessageStore.addChatMessage(chatMessage);
      // State will be updated via MessageStore events
    };

    const handleSystemMessage = (event: HubEvent) => {
      const systemMessage = event.data as SystemMessage;
      currentMessageStore.addSystemMessage(systemMessage);
      
      // Handle UI state updates
      if (systemMessage.type === 'UI_UPDATE') {
        setUiState(prevUiState => {
          const newUiStateMap = new Map(prevUiState);
          newUiStateMap.set(systemMessage.stepIndex, systemMessage.payload);
          return newUiStateMap;
        });
      }
      // State will be updated via MessageStore events
    };

    const handleError = (event: HubEvent) => {
      console.error(`[WebSocketStepsContext] Event: error`, event.data);
    };

    hub.on('connection_change', handleConnectionChange);
    hub.on('message', handleMessage);
    hub.on('system_message', handleSystemMessage);
    hub.on('error', handleError);
    console.log(`[WebSocketStepsContext] Event listeners attached to hub.`);

    // Cleanup function
    return () => {
      console.log(`[WebSocketStepsContext] Unmount effect: Removing event listeners from WebSocketHub.`);
      hub.off('connection_change', handleConnectionChange);
      hub.off('message', handleMessage);
      hub.off('system_message', handleSystemMessage);
      hub.off('error', handleError);
      hubRef.current = null;
      console.log(`[WebSocketStepsContext] Event listeners removed from hub.`);
    };
  }, [currentMessageStore]);

  // Effect to initialize the hub when settings or steps change
  useEffect(() => {
    const hub = hubRef.current;
    if (!hub) {
      return;
    }

    const allSettingsPresent = settings.tenantId && settings.agentWebsocketUrl && settings.agentApiKey && settings.participantId;

    if (allSettingsPresent) {
      console.log(`[WebSocketStepsContext] Initialize effect: Settings present. Calling hub.initialize.`);
      hub.initialize(settings, steps)
        .then(() => {
          console.log(`[WebSocketStepsContext] Hub initialized successfully.`);
          const newConnectionStates = hub.getConnectionStates();
          setConnectionStates(new Map(newConnectionStates));
          const currentlyConnected = Array.from(newConnectionStates.values()).some(state => state.status === 'connected');
          setIsConnected(currentlyConnected);
        })
        .catch(error => {
          console.error(`[WebSocketStepsContext] Error initializing hub:`, error);
        });
    } else {
      console.log(`[WebSocketStepsContext] Initialize effect: Settings not complete. Ensuring hub connections are down.`);
      hub.disconnectAll().then(() => {
        setConnectionStates(new Map());
        setIsConnected(false);
      });
    }
  }, [settings, steps]);

  // sendMessage using the new architecture
  const sendMessage = useCallback(async (content: string, metadata?: any) => {
    const hub = hubRef.current;
    if (!hub) {
      console.error('Cannot send message: WebSocketHub not initialized.');
      throw new Error('Not connected, hub instance not available.');
    }
    
    const currentStepDetails = steps[activeStep];
    if (!currentStepDetails || !currentStepDetails.bot || !currentStepDetails.bot.workflowId) {
      console.error('Cannot send message: Current step or bot configuration is invalid.');
      throw new Error('Current step does not have a bot configured or workflowId is missing.');
    }

    // Optimistic UI Update
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      direction: 'Incoming',
      stepIndex: activeStep,
      timestamp: new Date(),
      metadata,
      threadId: currentMessageStore.getThreadId(activeStep) || '', 
    };
    currentMessageStore.addChatMessage(userMessage);

    const request: InboundMessage = {
      threadId: currentMessageStore.getThreadId(activeStep),
      agent: currentStepDetails.bot.agent || '',
      workflowType: currentStepDetails.bot.workflowType || '',
      workflowId: currentStepDetails.bot.workflowId,
      participantId: settings.participantId || '',
      content,
      metadata
    };
    
    try {
      await hub.sendMessage(request, activeStep);
    } catch (error) {
      console.error(`[WebSocketStepsContext] Error sending message for step ${activeStep}:`, error);
      throw error;
    }
  }, [activeStep, steps, settings, currentMessageStore]);

  // Metadata subscription methods
  const subscribeToMetadata = useCallback((subscriberId: string, messageTypes: string[], callback: (message: MetadataMessage) => void, stepIndex?: number) => {
    const hub = hubRef.current;
    if (!hub) {
      console.warn('[WebSocketStepsContext] Cannot subscribe to metadata: Hub not initialized');
      return () => {}; // Return empty unsubscribe function
    }
    
    return hub.subscribeToMetadata(subscriberId, messageTypes, callback, stepIndex);
  }, []);

  const unsubscribeFromMetadata = useCallback((subscriberId: string) => {
    const hub = hubRef.current;
    if (!hub) {
      console.warn('[WebSocketStepsContext] Cannot unsubscribe from metadata: Hub not initialized');
      return;
    }
    
    hub.unsubscribeFromMetadata(subscriberId);
  }, []);

  // Manual connect/disconnect for context consumers
  const manualConnect = useCallback(async () => {
    const hub = hubRef.current;
    if (hub && settings.tenantId && settings.agentWebsocketUrl) {
      console.log(`[WebSocketStepsContext] Manual connect called. Re-initializing.`);
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
      console.log(`[WebSocketStepsContext] Manual disconnect called.`);
      await hub.disconnectAll();
      setConnectionStates(new Map());
      setIsConnected(false);
    }
  }, []);

  // Get statistics from all components
  const getStats = useCallback(() => {
    const hub = hubRef.current;
    const store = storeRef.current;
    
    return {
      hub: hub?.getStats() || null,
      messageStore: store?.getStats() || null,
      context: {
        isConnected,
        connectionStatesCount: connectionStates.size,
        chatMessagesCount: Array.from(chatMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
        systemMessagesCount: Array.from(systemMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
        uiStateCount: uiState.size
      }
    };
  }, [isConnected, connectionStates, chatMessages, systemMessages, uiState]);
  
  const value: WebSocketStepsContextType = {
    connectionStates,
    isConnected,
    chatMessages,
    systemMessages,
    connect: manualConnect,
    disconnect: manualDisconnect,
    sendMessage,
    subscribeToMetadata,
    unsubscribeFromMetadata,
    uiState,
    getStats
  };
  
  return (
    <WebSocketStepsContext.Provider value={value}>
      {children}
    </WebSocketStepsContext.Provider>
  );
}; 
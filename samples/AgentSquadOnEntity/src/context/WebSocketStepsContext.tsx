import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, SystemMessage, ConnectionState, InboundMessage, HubEvent } from '../types';
import { WebSocketHub } from '../middleware/WebSocketHub';
import { MessageStore, MessageStoreEvents } from '../middleware/MessageStore';
import { MetadataMessage } from '../middleware/MetadataMessageRouter';
import { EntityStore } from '../middleware/EntityStore';
import { DocumentService } from '../modules/poa/services/DocumentService';
import { useSteps } from './StepsContext';
import { useSettings } from './SettingsContext';
import { getAgentForStep } from '../modules/poa/steps';

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
  const { steps, activeStep, isInitialized } = useSteps();
  const { settings } = useSettings();
  
  const [connectionStates, setConnectionStates] = useState<Map<number, ConnectionState>>(new Map());
  const [chatMessages, setChatMessages] = useState<Map<number, ChatMessage[]>>(new Map());
  const [systemMessages, setSystemMessages] = useState<Map<number, SystemMessage[]>>(new Map());
  const [uiState, setUiState] = useState<Map<number, any>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  
  const hubRef = useRef<WebSocketHub | null>(null);
  const storeRef = useRef<MessageStore | null>(null);
  const entityStoreRef = useRef<EntityStore>(EntityStore.getInstance());
  const documentServiceRef = useRef<DocumentService>(DocumentService.getInstance());
  
  // Initialize MessageStore with events - but only once
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
  }
  const currentMessageStore = storeRef.current;
  
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
      currentMessageStore.addChatMessage(chatMessage);
    };

    const handleSystemMessage = (event: HubEvent) => {
      const systemMessage = event.data as SystemMessage;
      currentMessageStore.addSystemMessage(systemMessage);
      
      if (systemMessage.type === 'UI_UPDATE') {
        setUiState(prevUiState => {
          const newUiStateMap = new Map(prevUiState);
          newUiStateMap.set(systemMessage.stepIndex, systemMessage.payload);
          return newUiStateMap;
        });
      }
      
      if (systemMessage.type === 'ENTITY_UPDATE' || systemMessage.type === 'DATA') {
        entityStoreRef.current.handleSystemMessage(systemMessage);
      }

      if (systemMessage.payload && 
          (systemMessage.payload.messageType === 'DocumentResponse' || 
           systemMessage.payload.messageType === 'FetchDocumentResponse')) {
        documentServiceRef.current.handleDocumentResponse(systemMessage.payload);
      }
    };

    const handleError = (event: HubEvent) => {
      console.error(`[WebSocketStepsContext] Event: error`, event.data);
    };

    hub.on('connection_change', handleConnectionChange);
    hub.on('message', handleMessage);
    hub.on('system_message', handleSystemMessage);
    hub.on('error', handleError);

    // Cleanup function
    return () => {
      hub.off('connection_change', handleConnectionChange);
      hub.off('message', handleMessage);
      hub.off('system_message', handleSystemMessage);
      hub.off('error', handleError);
      hubRef.current = null;
    };
  }, [currentMessageStore, steps.length]);

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
      threadId: currentMessageStore.getThreadId(activeStep) || '', 
    };
    currentMessageStore.addChatMessage(userMessage);

    // Prepare request using agent or fallback to bot
    let request: InboundMessage;
    if (agent) {
      request = {
        threadId: currentMessageStore.getThreadId(activeStep),
        agent: agent.agent,
        workflowType: agent.workflowType || '',
        workflowId: agent.workflowId,
        participantId: settings.participantId || '',
        content,
        metadata
      };
    } else {
      // Fallback to old bot structure
      request = {
        threadId: currentMessageStore.getThreadId(activeStep),
        agent: currentStepDetails.bot!.agent || '',
        workflowType: currentStepDetails.bot!.workflowType || '',
        workflowId: currentStepDetails.bot!.workflowId!,
        participantId: settings.participantId || '',
        content,
        metadata
      };
    }
    
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
    const store = storeRef.current;
    const entityStore = entityStoreRef.current;
    
    return {
      hub: hub?.getStats() || null,
      messageStore: store?.getStats() || null,
      entityStore: entityStore?.getStats() || null,
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
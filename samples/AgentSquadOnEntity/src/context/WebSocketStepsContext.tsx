import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, SystemMessage, ConnectionState, InboundMessage, HubEvent } from '../types';
import { WebSocketHub } from '../middleware/WebSocketHub';
import { MessageStore } from '../middleware/MessageStore';
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
  
  // UI State from system messages
  uiState: Map<number, any>;
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
  
  // Initialize storeRef once. MessageStore itself is lightweight.
  if (storeRef.current === null) {
    storeRef.current = new MessageStore();
    console.log('[WebSocketStepsContext] MessageStore instance created.');
  }
  const currentMessageStore = storeRef.current; // Stable reference
  
  // Effect to create and manage the single WebSocketHub instance and its listeners
  useEffect(() => {
    console.log('[WebSocketStepsContext] Mount effect: Getting WebSocketHub singleton instance.');
    
    // Get the singleton instance instead of creating a new one
    const hub = WebSocketHub.getInstance();
    hubRef.current = hub;

    const handleConnectionChange = (event: HubEvent) => {
      setConnectionStates(hub.getConnectionStates());
      const currentStates = hub.getConnectionStates();
      const currentlyConnected = Array.from(currentStates.values()).some(state => state.status === 'connected');
      setIsConnected(currentlyConnected);
    };

    const handleMessage = (event: HubEvent) => {
      const chatMessage = event.data as ChatMessage;
      currentMessageStore.addChatMessage(chatMessage);
      setChatMessages(prevMessages => {
        const newMessagesMap = new Map(prevMessages);
        newMessagesMap.set(chatMessage.stepIndex, [...currentMessageStore.getChatMessages(chatMessage.stepIndex)]);
        return newMessagesMap;
      });
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
      setSystemMessages(prevSystemMessages => {
        const newSystemMessagesMap = new Map(prevSystemMessages);
        newSystemMessagesMap.set(systemMessage.stepIndex, [...currentMessageStore.getSystemMessages(systemMessage.stepIndex)]);
        return newSystemMessagesMap;
      });
    };

    const handleError = (event: HubEvent) => {
      console.error(`[WebSocketStepsContext] Event: error`, event.data);
    };

    hub.on('connection_change', handleConnectionChange);
    hub.on('message', handleMessage);
    hub.on('system_message', handleSystemMessage);
    hub.on('error', handleError);
    console.log(`[WebSocketStepsContext] Event listeners attached to hub.`);

    // Cleanup function for this effect (runs on component unmount)
    return () => {
      console.log(`[WebSocketStepsContext] Unmount effect: Removing event listeners from WebSocketHub.`);
      hub.off('connection_change', handleConnectionChange);
      hub.off('message', handleMessage);
      hub.off('system_message', handleSystemMessage);
      hub.off('error', handleError);
      // Don't disconnect or reset the singleton - other components might still need it
      // Only remove our event listeners
      hubRef.current = null; // Clean up the ref on unmount
      console.log(`[WebSocketStepsContext] Event listeners removed from hub.`);
    };
  }, [currentMessageStore]);

  // Effect to initialize the hub (call hub.initialize) when settings or steps change
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
          setConnectionStates(hub.getConnectionStates());
          const currentStates = hub.getConnectionStates();
          const currentlyConnected = Array.from(currentStates.values()).some(state => state.status === 'connected');
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
  }, [settings, steps]); // Rerun when settings or steps change

  // sendMessage now uses the persistent hub from hubRef
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
      threadId: currentMessageStore.getThreadId(activeStep) || '', // Get current threadId
    };
    currentMessageStore.addChatMessage(userMessage);
    setChatMessages(prevMessages => {
      const newMessagesMap = new Map(prevMessages);
      newMessagesMap.set(userMessage.stepIndex, [...currentMessageStore.getChatMessages(userMessage.stepIndex)]);
      return newMessagesMap;
    });

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
      // console.log(`[WebSocketStepsContext HUB: ${hub.hubInstanceId}] Message sent via hub for step ${activeStep}.`);
    } catch (error) {
      console.error(`[WebSocketStepsContext] Error sending message for step ${activeStep}:`, error);
      // Optionally, revert optimistic update here or show an error to the user
      throw error;
    }
  }, [activeStep, steps, settings, currentMessageStore]);

  // Simplified connect/disconnect for context consumers (mostly for manual control, if ever needed)
  // The primary connection logic is now handled by the useEffects.
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
  
  const value: WebSocketStepsContextType = {
    connectionStates,
    isConnected,
    chatMessages,
    systemMessages,
    connect: manualConnect, // Expose manual control if needed
    disconnect: manualDisconnect, // Expose manual control if needed
    sendMessage,
    uiState
  };
  
  return (
    <WebSocketStepsContext.Provider value={value}>
      {children}
    </WebSocketStepsContext.Provider>
  );
}; 
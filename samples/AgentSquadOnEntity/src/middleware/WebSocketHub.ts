import { HubConnection } from '@microsoft/signalr';
import { BotAgent, ConnectionState, HubEvent, OutboundMessage } from '../types';
import { SettingsData } from '../context/SettingsContext';
import { StepDefinition } from '../components/power-of-attorney/types';
import { ConnectionManager, ConnectionManagerEvents } from './ConnectionManager';
import { MessageProcessor, MessageProcessorEvents, Message } from './MessageProcessor';
import { MetadataMessageRouter } from './MetadataMessageRouter';
import { EventDispatcher } from './EventDispatcher';

export interface SendMessageRequest {
  threadId?: string;
  agent: string;
  workflowType: string;
  workflowId: string;
  participantId: string;
  content: string;
  metadata?: any;
}

// Hub event types for the EventDispatcher
export interface HubEvents {
  message: HubEvent;
  connection_change: HubEvent;
  error: HubEvent;
  system_message: HubEvent;
  thread_history: HubEvent;
}

/**
 * WebSocketHub - Refactored to use modular components
 * 
 * This class now coordinates between specialized components:
 * - ConnectionManager: Handles SignalR connections
 * - MessageProcessor: Processes and routes messages
 * - MetadataMessageRouter: Routes metadata messages to UI components
 * - EventDispatcher: Clean event system
 */
export class WebSocketHub {
  private static instance: WebSocketHub | null = null;
  private static instanceLock: boolean = false;

  private connectionManager: ConnectionManager;
  private messageProcessor: MessageProcessor;
  private metadataRouter: MetadataMessageRouter;
  private eventDispatcher: EventDispatcher<HubEvents>;
  private settings: SettingsData | null = null;
  private steps: StepDefinition[] = [];
  private readonly hubInstanceId: string;

  private constructor() {
    this.hubInstanceId = crypto.randomUUID();
    console.log(`[WebSocketHub] New instance created with ID: ${this.hubInstanceId}`);

    // Initialize components
    this.metadataRouter = new MetadataMessageRouter();
    this.eventDispatcher = new EventDispatcher<HubEvents>();
    
    // Initialize ConnectionManager with event handlers
    const connectionEvents: ConnectionManagerEvents = {
      onConnectionChange: (stepIndex, state) => {
        this.eventDispatcher.emit('connection_change', {
          type: 'connection_change',
          stepIndex,
          data: state
        });
      },
      onConnectionReady: (stepIndex, connection) => {
        this.setupSignalRHandlers(connection, stepIndex);
        // Request thread history after connection is ready
        this.loadThreadHistory(stepIndex);
      },
      onConnectionError: (stepIndex, error) => {
        this.eventDispatcher.emit('error', {
          type: 'error',
          stepIndex,
          data: { error: `Connection error: ${error}`, stepIndex }
        });
      }
    };
    this.connectionManager = new ConnectionManager(connectionEvents);

    // Initialize MessageProcessor with event handlers
    const messageEvents: MessageProcessorEvents = {
      onChatMessage: (stepIndex, message) => {
        this.eventDispatcher.emit('message', {
          type: 'message',
          stepIndex,
          data: message
        });
      },
      onSystemMessage: (stepIndex, message) => {
        this.eventDispatcher.emit('system_message', {
          type: 'system_message',
          stepIndex,
          data: message
        });
      },
      onThreadUpdate: (stepIndex, threadId) => {
        this.connectionManager.setThreadId(stepIndex, threadId);
      },
      onError: (stepIndex, error) => {
        this.eventDispatcher.emit('error', {
          type: 'error',
          stepIndex,
          data: { error: `Message processing error: ${error}`, stepIndex }
        });
      }
    };
    this.messageProcessor = new MessageProcessor(messageEvents, this.metadataRouter);
  }

  // Singleton pattern
  public static getInstance(): WebSocketHub {
    if (WebSocketHub.instanceLock) {
      while (WebSocketHub.instanceLock && !WebSocketHub.instance) {
        // Wait for instance creation
      }
    }
    
    if (!WebSocketHub.instance) {
      WebSocketHub.instanceLock = true;
      WebSocketHub.instance = new WebSocketHub();
      WebSocketHub.instanceLock = false;
      console.log(`[WebSocketHub] Singleton instance created with ID: ${WebSocketHub.instance.hubInstanceId}`);
    } else {
      console.log(`[WebSocketHub] Returning existing singleton instance with ID: ${WebSocketHub.instance.hubInstanceId}`);
    }
    
    return WebSocketHub.instance;
  }

  public static resetInstance(): void {
    if (WebSocketHub.instance) {
      WebSocketHub.instance.disconnectAll();
      WebSocketHub.instance = null;
      console.log(`[WebSocketHub] Singleton instance reset`);
    }
  }

  /**
   * Initialize the hub with settings and steps
   */
  async initialize(settings: SettingsData, steps: StepDefinition[]): Promise<void> {
    this.settings = settings;
    this.steps = steps;
    
    console.log(`[WebSocketHub] Initializing with ${steps.length} steps`);
    await this.connectionManager.initialize(settings, steps);
  }

  /**
   * Setup SignalR event handlers for a connection
   */
  private setupSignalRHandlers(connection: HubConnection, stepIndex: number): void {
    console.log(`[WebSocketHub] Setting up SignalR handlers for step ${stepIndex}`);

    // Handle received messages (real-time)
    connection.on('ReceiveMessage', (message: Message) => {
      console.log(`[WebSocketHub] ReceiveMessage for step ${stepIndex}:`, message);
      this.messageProcessor.processMessage(message.workflowId, message, stepIndex);
    });

    // Handle received metadata (delivered separately)
    connection.on('ReceiveMetadata', (metadata: any) => {
      console.log(`[WebSocketHub] ReceiveMetadata for step ${stepIndex}:`, metadata);
      this.messageProcessor.processMetadata(metadata, stepIndex);
    });

    // Handle thread ID updates
    connection.on('InboundProcessed', (threadId: string) => {
      console.log(`[WebSocketHub] InboundProcessed for step ${stepIndex}: ${threadId}`);
      this.messageProcessor.processThreadUpdate(threadId, stepIndex);
    });

    // Handle thread history
    connection.on('ThreadHistory', (history: Message[]) => {
      console.log(`[WebSocketHub] ThreadHistory for step ${stepIndex}: ${history.length} messages`);
      this.messageProcessor.processThreadHistory(history, stepIndex);
    });

    // Connection established
    connection.on('Connected', () => {
      console.log(`[WebSocketHub] Connected event for step ${stepIndex}`);
    });
  }

  /**
   * Load thread history for a step
   */
  private async loadThreadHistory(stepIndex: number): Promise<void> {
    const step = this.steps[stepIndex];
    if (!step?.bot?.workflowType || !this.settings?.participantId) {
      console.warn(`[WebSocketHub] Cannot load thread history for step ${stepIndex}: missing workflowType or participantId`);
      return;
    }

    const connection = this.connectionManager.getConnection(stepIndex);
    if (!connection) {
      console.warn(`[WebSocketHub] Cannot load thread history for step ${stepIndex}: no connection`);
      return;
    }

    try {
      await connection.invoke('GetThreadHistory',
        step.bot.workflowType,
        this.settings.participantId,
        1,  // Page number
        20  // Page size
      );
    } catch (error) {
      console.error(`[WebSocketHub] Error loading thread history for step ${stepIndex}:`, error);
    }
  }

  /**
   * Send message through specific step connection
   */
  async sendMessage(message: any, stepIndex: number): Promise<void> {
    const connection = this.connectionManager.getConnection(stepIndex);
    if (!connection || connection.state !== 'Connected') {
      throw new Error(`No connection available for step ${stepIndex}`);
    }

    const step = this.steps[stepIndex];
    if (!step.bot) {
      throw new Error(`No bot configured for step ${stepIndex}`);
    }

    const defaultMetadata = this.settings?.defaultMetadata ? JSON.parse(this.settings.defaultMetadata) : {};

    try {
      const request: SendMessageRequest = {
        threadId: this.connectionManager.getThreadId(stepIndex),
        agent: step.bot.agent || '',
        workflowType: step.bot.workflowType || '',
        workflowId: step.bot.workflowId || '',
        participantId: this.settings?.participantId || '',
        content: typeof message === 'string' ? message : message.content,
        metadata: defaultMetadata
      };

      await connection.invoke('SendInboundMessage', request);
      console.log(`[WebSocketHub] Message sent successfully for step ${stepIndex}`);
    } catch (error) {
      console.error(`[WebSocketHub] Error sending message for step ${stepIndex}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to metadata messages by messageType
   */
  subscribeToMetadata(subscriberId: string, messageTypes: string[], callback: (message: any) => void, stepIndex?: number) {
    return this.metadataRouter.subscribe({
      id: subscriberId,
      messageTypes,
      callback,
      stepIndex
    });
  }

  /**
   * Unsubscribe from metadata messages
   */
  unsubscribeFromMetadata(subscriberId: string): void {
    this.metadataRouter.unsubscribe(subscriberId);
  }

  /**
   * Get chat history for a specific workflow
   */
  getChatHistory(workflowId: string): Message[] {
    return this.messageProcessor.getChatHistory(workflowId);
  }

  /**
   * Event subscription methods
   */
  on(event: keyof HubEvents, callback: (event: HubEvent) => void): void {
    this.eventDispatcher.on(event, callback);
  }

  off(event: keyof HubEvents, callback: (event: HubEvent) => void): void {
    this.eventDispatcher.off(event, callback);
  }

  /**
   * Get connection states
   */
  getConnectionStates(): Map<number, ConnectionState> {
    return this.connectionManager.getConnectionStates();
  }

  /**
   * Get connection state for specific step
   */
  getStepConnectionState(stepIndex: number): ConnectionState | null {
    return this.connectionManager.getStepConnectionState(stepIndex);
  }

  /**
   * Get current thread ID for a step
   */
  getThreadId(stepIndex: number): string | undefined {
    return this.connectionManager.getThreadId(stepIndex);
  }

  /**
   * Disconnect specific step
   */
  async disconnectStep(stepIndex: number): Promise<void> {
    await this.connectionManager.disconnectStep(stepIndex);
  }

  /**
   * Disconnect all steps
   */
  async disconnectAll(): Promise<void> {
    await this.connectionManager.disconnectAll();
  }

  /**
   * Get hub statistics
   */
  getStats(): {
    hubId: string;
    connectionStats: any;
    metadataStats: any;
    eventStats: any;
  } {
    return {
      hubId: this.hubInstanceId,
      connectionStats: this.connectionManager.getConnectionStates(),
      metadataStats: this.metadataRouter.getStats(),
      eventStats: this.eventDispatcher.getStats()
    };
  }
}

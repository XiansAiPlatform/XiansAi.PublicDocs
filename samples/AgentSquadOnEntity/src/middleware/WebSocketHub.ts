import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BotAgent, ConnectionState, HubEvent, OutboundMessage } from '../types';
import { SettingsData } from '../context/SettingsContext';
import { StepDefinition } from '../components/power-of-attorney/steps';

export interface SignalRConnection {
  connection: HubConnection;
  stepIndex: number;
  reconnectAttempts: number;
  threadId?: string;
}

export interface Message {
  content: string;
  direction: 'Incoming' | 'Outgoing';
  createdAt: Date;
  workflowId: string;
  threadId: string;
  participantId: string;
  metadata?: any;
}

export interface SendMessageRequest {
  threadId?: string;
  agent: string;
  workflowType: string;
  workflowId: string;
  participantId: string;
  content: string;
  metadata?: any;
}

export class WebSocketHub {
  private connections: Map<number, SignalRConnection> = new Map();
  private listeners: Map<string, Set<(event: HubEvent) => void>> = new Map();
  private settings: SettingsData | null = null;
  private steps: StepDefinition[] = [];
  private chatHistories: Map<string, Message[]> = new Map();
  private connectionLocks: Map<number, Promise<void>> = new Map();
  private processedMessages: Set<string> = new Set();
  private readonly hubInstanceId: string; // Unique ID for this instance

  constructor() {
    this.hubInstanceId = crypto.randomUUID(); // Assign a unique ID to each hub instance
    console.log(`[WebSocketHub] New instance created with ID: ${this.hubInstanceId}`);
    this.listeners.set('message', new Set());
    this.listeners.set('connection_change', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('system_message', new Set());
    this.listeners.set('thread_history', new Set());
  }

  // Initialize the hub with settings and steps
  async initialize(settings: SettingsData, steps: StepDefinition[]): Promise<void> {
    this.settings = settings;
    this.steps = steps;
    
    // Clear processed messages when reinitializing
    this.processedMessages.clear();
    
    // Connect to all steps that have bots
    const connectionPromises = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.bot && step.bot.workflowId)
      .map(({ step, index }) => this.connectToStep(step, index));
    
    await Promise.allSettled(connectionPromises);
  }

  // Connect to a specific step's bot
  private async connectToStep(step: StepDefinition, stepIndex: number): Promise<void> {
    if (!step.bot || !step.bot.workflowId) return;
    
    // Check if there's already a connection attempt in progress for this step
    const existingLock = this.connectionLocks.get(stepIndex);
    if (existingLock) {
      console.log(`Connection attempt already in progress for step ${stepIndex}, waiting...`);
      await existingLock;
      return;
    }

    // Create a connection lock to prevent concurrent attempts
    const connectionPromise = this.doConnectToStep(step, stepIndex);
    this.connectionLocks.set(stepIndex, connectionPromise);
    
    try {
      await connectionPromise;
    } finally {
      this.connectionLocks.delete(stepIndex);
    }
  }

  private async doConnectToStep(step: StepDefinition, stepIndex: number): Promise<void> {
    // Disconnect existing connection if any
    if (this.connections.has(stepIndex)) {
      await this.disconnectStep(stepIndex);
    }

    try {
      const hubUrl = this.buildHubUrl();
      
      // Create the SignalR connection with authentication
      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          // Add timeout to prevent hanging connections
          timeout: 30000,
          // Skip negotiation for WebSocket-only connections if needed
          skipNegotiation: false,
          transport: 1 // WebSockets only
        })
        .withAutomaticReconnect({
          // Custom retry delays in milliseconds
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) {
              // First retry after 1 second
              return 1000;
            }
            // Subsequent retries with exponential backoff
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Start the connection with retry logic BEFORE creating the SignalRConnection object
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          await connection.start();
          console.log(`Connected to SignalR hub for step ${stepIndex}`);
          break;
        } catch (startError) {
          retries++;
          if (retries >= maxRetries) {
            throw startError;
          }
          console.warn(`Connection attempt ${retries} failed for step ${stepIndex}, retrying...`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      // Only create and store the connection object AFTER successful connection
      const signalRConnection: SignalRConnection = {
        connection,
        stepIndex,
        reconnectAttempts: 0
      };

      // Store the connection in the map only after successful establishment
      this.connections.set(stepIndex, signalRConnection);
      this.setupSignalRHandlers(signalRConnection, step, stepIndex);
      
      // Emit connection established event to notify UI
      this.emit({
        type: 'connection_change',
        stepIndex,
        data: { status: 'connected', stepIndex } as ConnectionState
      });
      
      // Give the connection a moment to fully establish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Subscribe to the agent after connection - use the stored connection
      try {
        await this.subscribeToAgent(step.bot!, stepIndex);
      } catch (error) {
        console.warn(`Failed to subscribe to agent for step ${stepIndex}:`, error);
        // Don't fail the connection for subscription errors
      }
      
      // Load initial chat history - use the stored connection
      try {
        await this.getThreadHistory(step.bot!, stepIndex);
      } catch (error) {
        console.warn(`Failed to load thread history for step ${stepIndex}:`, error);
        // Don't fail the connection for history loading errors
      }
      
    } catch (error) {
      console.error(`Error connecting to SignalR hub for step ${stepIndex}:`, error);
      this.emit({
        type: 'error',
        stepIndex,
        data: { error: `Failed to connect: ${error}`, stepIndex }
      });
      throw error;
    }
  }

  // Build SignalR Hub URL - URL should include tenantId as query parameter
  private buildHubUrl(): string {
    if (!this.settings) throw new Error('Hub not initialized');
    
    const baseUrl = this.settings.agentWebsocketUrl;
    const tenantId = this.settings.tenantId || '';
    const token = this.settings.agentApiKey || '';
    
    // Include auth token as query parameter since WebSocket doesn't support headers
    return `${baseUrl}?tenantId=${encodeURIComponent(tenantId)}&access_token=${encodeURIComponent(token)}`;
  }

  // Subscribe to a specific agent
  private async subscribeToAgent(bot: BotAgent, stepIndex: number): Promise<void> {
    const signalRConnection = this.connections.get(stepIndex);
    if (!signalRConnection) {
      console.error(`No SignalR connection found for step ${stepIndex}`);
      return;
    }

    // Check if connection is in a usable state (Connected or Connecting)
    const connectionState = signalRConnection.connection.state;
    if (connectionState !== 'Connected' && connectionState !== 'Connecting') {
      console.error(`Connection not ready for step ${stepIndex}, state: ${connectionState}`);
      return;
    }

    try {
      await signalRConnection.connection.invoke('SubscribeToAgent',
        bot.workflowId,
        this.settings?.userId,
        this.settings?.tenantId
      );
      console.log(`Subscribed to agent: ${bot.title} (${bot.workflowId})`);
    } catch (error) {
      console.error(`Error subscribing to agent ${bot.title}:`, error);
    }
  }

  // Get thread history for an agent
  private async getThreadHistory(bot: BotAgent, stepIndex: number): Promise<void> {
    const signalRConnection = this.connections.get(stepIndex);
    if (!signalRConnection) {
      console.error(`No SignalR connection found for step ${stepIndex}`);
      return;
    }

    // Check if connection is in a usable state (Connected or Connecting)
    const connectionState = signalRConnection.connection.state;
    if (connectionState !== 'Connected' && connectionState !== 'Connecting') {
      console.error(`Connection not ready for step ${stepIndex}, state: ${connectionState}`);
      return;
    }

    // Check if we have the required parameters for GetThreadHistory
    if (!bot.workflowType || !this.settings?.userId) {
      console.warn(`Missing required parameters for GetThreadHistory: workflowType=${bot.workflowType}, userId=${this.settings?.userId}`);
      // Skip loading thread history if we don't have the required parameters
      return;
    }

    try {
      await signalRConnection.connection.invoke('GetThreadHistory',
        bot.workflowType,
        this.settings.userId,
        1,  // Page number
        20  // Page size
      );
    } catch (error) {
      console.error(`Error getting thread history for ${bot.title}:`, error);
      // Don't re-throw the error to prevent connection failure
    }
  }

  // Create a robust fingerprint for a message to handle potential micro-variations in timestamps
  private getMessageFingerprint(workflowId: string, message: Message): string {
    const normalizedTimestamp = message.createdAt ? new Date(Math.round(new Date(message.createdAt).getTime() / 1000) * 1000).toISOString() : 'no-timestamp';
    const fingerprintObj = {
      wId: workflowId,
      c: message.content,
      d: message.direction,
      pId: message.participantId,
      tId: message.threadId,
      ts: normalizedTimestamp
    };
    // console.log('[WebSocketHub] Generating fingerprint. Object:', fingerprintObj); // Optional: log object before stringify
    return JSON.stringify(fingerprintObj);
  }

  // Process a message - This is the central point for deduplication and UI event emission for new messages.
  private processMessage(workflowId: string, message: Message, stepIndex: number): boolean {
    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Received raw message object:`, JSON.parse(JSON.stringify(message)));
    const fingerprint = this.getMessageFingerprint(workflowId, message);
    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Generated fingerprint: ${fingerprint}`);
    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Size of processedMessages BEFORE 'has' check: ${this.processedMessages.size}`);

    if (this.processedMessages.has(fingerprint)) {
      console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Skipping DUPLICATE message with fingerprint: ${fingerprint}`, {
        content: message.content.substring(0, 30) + '...',
      });
      console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Size of processedMessages AFTER failed 'has' check (duplicate found): ${this.processedMessages.size}`);
      return false; // Duplicate
    }

    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Adding NEW fingerprint to processedMessages: ${fingerprint}`);
    this.processedMessages.add(fingerprint);
    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Size of processedMessages AFTER 'add': ${this.processedMessages.size}`);

    setTimeout(() => {
      const wasPresent = this.processedMessages.delete(fingerprint);
      // console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] Fingerprint ${fingerprint} ${wasPresent ? 'deleted' : 'not found for deletion'} after timeout. Current size: ${this.processedMessages.size}`);
    }, 300000);

    if (!this.chatHistories.has(workflowId)) {
      this.chatHistories.set(workflowId, []);
    }
    this.chatHistories.get(workflowId)?.push(message);

    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Emitting UI event for NEW message:`, {
      content: message.content.substring(0, 30) + '...',
      direction: message.direction,
      stepIndex
    });

    this.emit({
      type: 'message',
      stepIndex,
      data: { 
        id: crypto.randomUUID(), 
        content: message.content,
        direction: message.direction,
        stepIndex,
        timestamp: message.createdAt || new Date(),
        threadId: message.threadId,
        metadata: message.metadata
      }
    });
    
    return true; 
  }

  // Setup SignalR event handlers
  private setupSignalRHandlers(signalRConnection: SignalRConnection, step: StepDefinition, stepIndex: number): void {
    const { connection } = signalRConnection;
    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] setupSignalRHandlers for step ${stepIndex}`);

    // Connection state change handlers
    connection.onreconnecting((error) => {
      console.log(`Reconnecting to step ${stepIndex}...`, error);
      signalRConnection.reconnectAttempts++;
      this.emit({
        type: 'connection_change',
        stepIndex,
        data: { status: 'connecting', stepIndex } as ConnectionState
      });
    });

    connection.onreconnected((connectionId) => {
      console.log(`Reconnected to step ${stepIndex}. Connection ID: ${connectionId}`);
      signalRConnection.reconnectAttempts = 0;
      this.emit({
        type: 'connection_change',
        stepIndex,
        data: { status: 'connected', stepIndex } as ConnectionState
      });
      
      // Re-subscribe to agent after reconnection
      if (step.bot) {
        this.subscribeToAgent(step.bot, stepIndex);
      }
    });

    connection.onclose((error) => {
      console.log(`Connection closed for step ${stepIndex}`, error);
      this.emit({
        type: 'connection_change',
        stepIndex,
        data: { status: 'disconnected', stepIndex } as ConnectionState
      });
    });

    // Handle received messages (real-time)
    connection.on('ReceiveMessage', (message: Message) => {
      console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] setupSignalRHandlers: Raw 'ReceiveMessage' event from SignalR client for step ${stepIndex}. Message object:`, JSON.parse(JSON.stringify(message)));
      try {
        this.processMessage(message.workflowId, message, stepIndex);
      } catch (error) {
        console.error(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] Error in 'ReceiveMessage' handler for step ${stepIndex}:`, error);
      }
    });

    // Handle thread ID updates
    connection.on('InboundProcessed', (threadId: string) => {
      console.log(`Thread ID updated for step ${stepIndex}: ${threadId}`);
      signalRConnection.threadId = threadId;
      
      // Emit system message for thread update
      this.emit({
        type: 'system_message',
        stepIndex,
        data: {
          type: 'INFO',
          stepIndex,
          payload: { threadId },
          timestamp: new Date()
        }
      });
    });

    // Handle thread history
    connection.on('ThreadHistory', (history: Message[]) => {
      if (!history || history.length === 0) {
        // console.log(`[WebSocketHub] 'ThreadHistory' event for step ${stepIndex}: No history messages.`); // Less verbose
        return;
      }
      const workflowId = history[0].workflowId; 
      console.log(`[WebSocketHub] 'ThreadHistory' event for step ${stepIndex}: Processing ${history.length} historical messages for workflow ${workflowId}.`);
      let newMessagesProcessedCount = 0;
      for (const histMessage of history) {
        // Log raw historical message before processing
        // console.log(`[WebSocketHub] ThreadHistory: Processing historical message:`, JSON.parse(JSON.stringify(histMessage))); 
        if (this.processMessage(workflowId, histMessage, stepIndex)) {
          newMessagesProcessedCount++;
        }
      }
      console.log(`[WebSocketHub] 'ThreadHistory' for step ${stepIndex}: ${newMessagesProcessedCount} new messages processed and UI events emitted.`);
    });

    // Connection established
    connection.on('Connected', () => {
      this.emit({
        type: 'connection_change',
        stepIndex,
        data: { status: 'connected', stepIndex } as ConnectionState
      });
    });
  }

  // Send message through specific step connection
  async sendMessage(message: any, stepIndex: number): Promise<void> {
    const signalRConnection = this.connections.get(stepIndex);

    if (!signalRConnection || signalRConnection.connection.state !== 'Connected') {
      throw new Error(`No connection available for step ${stepIndex}`);
    }

    const step = this.steps[stepIndex];
    if (!step.bot) {
      throw new Error(`No bot configured for step ${stepIndex}`);
    }

    try {
      // Create SendMessageRequest according to documentation
      const request: SendMessageRequest = {
        threadId: signalRConnection.threadId,
        agent: step.bot.agent || '',
        workflowType: step.bot.workflowType || '',
        workflowId: step.bot.workflowId || '',
        participantId: this.settings?.userId || '',
        content: typeof message === 'string' ? message : message.content,
        metadata: typeof message === 'object' ? message.metadata : null
      };

      // Invoke the SendInboundMessage method on the hub
      await signalRConnection.connection.invoke('SendInboundMessage', request);
      console.log(`Message sent successfully for step ${stepIndex}`);
    } catch (error) {
      console.error(`Error sending message for step ${stepIndex}:`, error);
      throw error;
    }
  }

  // Get chat history for a specific workflow
  getChatHistory(workflowId: string): Message[] {
    return this.chatHistories.get(workflowId) || [];
  }

  // Event emitter methods
  on(event: HubEvent['type'] | 'thread_history', callback: (event: HubEvent) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  off(event: HubEvent['type'] | 'thread_history', callback: (event: HubEvent) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: HubEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // Get connection states
  getConnectionStates(): Map<number, ConnectionState> {
    const states = new Map<number, ConnectionState>();
    
    for (const [stepIndex, signalRConnection] of this.connections) {
      states.set(stepIndex, {
        stepIndex,
        status: signalRConnection.connection.state === 'Connected' ? 'connected' : 
                signalRConnection.connection.state === 'Connecting' ? 'connecting' : 
                signalRConnection.connection.state === 'Reconnecting' ? 'connecting' : 'disconnected'
      });
    }
    
    return states;
  }

  // Get connection state for specific step
  getStepConnectionState(stepIndex: number): ConnectionState | null {
    const signalRConnection = this.connections.get(stepIndex);
    if (!signalRConnection) return null;
    
    return {
      stepIndex,
      status: signalRConnection.connection.state === 'Connected' ? 'connected' : 
              signalRConnection.connection.state === 'Connecting' ? 'connecting' : 
              signalRConnection.connection.state === 'Reconnecting' ? 'connecting' : 'disconnected'
    };
  }

  // Get current thread ID for a step
  getThreadId(stepIndex: number): string | undefined {
    return this.connections.get(stepIndex)?.threadId;
  }

  // Disconnect specific step
  async disconnectStep(stepIndex: number): Promise<void> {
    const signalRConnection = this.connections.get(stepIndex);
    if (signalRConnection) {
      try {
        await signalRConnection.connection.stop();
      } catch (error) {
        console.error(`Error disconnecting step ${stepIndex}:`, error);
      }
      this.connections.delete(stepIndex);
    }
  }

  // Disconnect all steps
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(stepIndex => 
      this.disconnectStep(stepIndex)
    );
    await Promise.all(disconnectPromises);
  }
} 
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BotAgent, ConnectionState, HubEvent, OutboundMessage } from '../types';
import { SettingsData } from '../context/SettingsContext';
import { StepDefinition } from '../components/power-of-attorney/types';

export interface SignalRConnection {
  connection: HubConnection;
  stepIndex: number;
  reconnectAttempts: number;
  threadId?: string;
}

export interface Message {
  content: string | null | undefined;
  direction: 'Incoming' | 'Outgoing' | 'Handover' ;
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

/**
 * WebSocketHub manages SignalR connections to chat agents.
 * 
 * This class implements a singleton pattern to prevent multiple instances
 * from being created when React StrictMode causes components to mount twice
 * in development mode. Without this pattern, duplicate connections would be
 * established, causing each message to be received and processed multiple times.
 */
export class WebSocketHub {
  private static instance: WebSocketHub | null = null;
  private static instanceLock: boolean = false;

  private connections: Map<number, SignalRConnection> = new Map();
  private listeners: Map<string, Set<(event: HubEvent) => void>> = new Map();
  private settings: SettingsData | null = null;
  private steps: StepDefinition[] = [];
  private chatHistories: Map<string, Message[]> = new Map();
  private connectionLocks: Map<number, Promise<void>> = new Map();
  private readonly hubInstanceId: string; // Unique ID for this instance

  private constructor() {
    this.hubInstanceId = crypto.randomUUID(); // Assign a unique ID to each hub instance
    console.log(`[WebSocketHub] New instance created with ID: ${this.hubInstanceId}`);
    this.listeners.set('message', new Set());
    this.listeners.set('connection_change', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('system_message', new Set());
    this.listeners.set('thread_history', new Set());
  }

  // Singleton pattern - ensure only one instance exists
  public static getInstance(): WebSocketHub {
    if (WebSocketHub.instanceLock) {
      // If instance creation is in progress, wait for it
      while (WebSocketHub.instanceLock && !WebSocketHub.instance) {
        // Simple busy wait - in a real scenario you might use a Promise
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

  // Method to reset the singleton (useful for testing or complete cleanup)
  public static resetInstance(): void {
    if (WebSocketHub.instance) {
      WebSocketHub.instance.disconnectAll();
      WebSocketHub.instance = null;
      console.log(`[WebSocketHub] Singleton instance reset`);
    }
  }

  // Initialize the hub with settings and steps
  async initialize(settings: SettingsData, steps: StepDefinition[]): Promise<void> {
    this.settings = settings;
    this.steps = steps;
    
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
        this.settings?.participantId,
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
    if (!bot.workflowType || !this.settings?.participantId) {
      console.warn(`Missing required parameters for GetThreadHistory: workflowType=${bot.workflowType}, participantId=${this.settings?.participantId}`);
      // Skip loading thread history if we don't have the required parameters
      return;
    }

    try {
      await signalRConnection.connection.invoke('GetThreadHistory',
        bot.workflowType,
        this.settings.participantId,
        1,  // Page number
        20  // Page size
      );
    } catch (error) {
      console.error(`Error getting thread history for ${bot.title}:`, error);
      // Don't re-throw the error to prevent connection failure
    }
  }

  // Helper function to map backend direction values to frontend direction values
  private mapDirection(backendDirection: string | number): 'Incoming' | 'Outgoing' | 'Handover' {
    // Handle numeric directions from backend
    if (typeof backendDirection === 'number') {
      switch (backendDirection) {
        case 0:
          return 'Incoming';  // User message
        case 1:
          return 'Outgoing';  // Bot message
        case 2:
          return 'Handover';  // Handover message
        default:
          console.warn(`Unknown numeric direction: ${backendDirection}, defaulting to 'Outgoing'`);
          return 'Outgoing';
      }
    }
    
    // Handle string directions from backend
    if (typeof backendDirection === 'string') {
      switch (backendDirection.toLowerCase()) {
        case 'incoming':
          return 'Incoming';
        case 'outgoing':
          return 'Outgoing';
        case 'handover':
          return 'Handover';
        default:
          console.warn(`Unknown string direction: ${backendDirection}, defaulting to 'Outgoing'`);
          return 'Outgoing';
      }
    }
    
    console.warn(`Invalid direction type: ${typeof backendDirection}, value: ${backendDirection}, defaulting to 'Outgoing'`);
    return 'Outgoing';
  }

  // Process a message - simplified without duplication checking
  private processMessage(workflowId: string, message: Message, stepIndex: number): boolean {
    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Received message for step ${stepIndex}`);

    if (!this.chatHistories.has(workflowId)) {
      this.chatHistories.set(workflowId, []);
    }
    this.chatHistories.get(workflowId)?.push(message);

    // Map the backend direction to the expected frontend direction
    const mappedDirection = this.mapDirection(message.direction);
    console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] processMessage: Mapped direction from ${message.direction} to ${mappedDirection}`);

    this.emit({
      type: 'message',
      stepIndex,
      data: { 
        id: crypto.randomUUID(), 
        content: message.content || '',
        direction: mappedDirection,  // Use the mapped direction
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

    // Handle received metadata (delivered separately)
    connection.on('ReceiveMetadata', (message: any) => {
      console.log(`################## [WebSocketHub INSTANCE: ${this.hubInstanceId}] setupSignalRHandlers: Raw 'ReceiveMetadata' event from SignalR client for step ${stepIndex}. Message object:`, JSON.parse(JSON.stringify(message)));
      try {
        // Process metadata as a system message
        this.emit({
          type: 'system_message',
          stepIndex,
          data: {
            type: 'METADATA',
            stepIndex,
            payload: message,
            timestamp: new Date()
          }
        });
      } catch (error) {
        console.error(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] Error in 'ReceiveMetadata' handler for step ${stepIndex}:`, error);
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
        return;
      }
      
      const workflowId = history[0].workflowId; 
      console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] 'ThreadHistory' event for step ${stepIndex}: Received ${history.length} historical messages for workflow ${workflowId}.`);

      // Sort historical messages in chronological order (oldest first)
      const sortedHistory = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] 'ThreadHistory' for step ${stepIndex}: Sorted ${sortedHistory.length} messages.`);

      for (const histMessage of sortedHistory) {
        this.processMessage(workflowId, histMessage, stepIndex);
      }
      console.log(`[WebSocketHub INSTANCE: ${this.hubInstanceId}] 'ThreadHistory' for step ${stepIndex}: ${sortedHistory.length} messages processed and UI events emitted.`);
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

    // convert the default metadata string to an object
    const defaultMetadata = this.settings?.defaultMetadata ? JSON.parse(this.settings.defaultMetadata) : {};

    try {
      // Create SendMessageRequest according to documentation
      const request: SendMessageRequest = {
        threadId: signalRConnection.threadId,
        agent: step.bot.agent || '',
        workflowType: step.bot.workflowType || '',
        workflowId: step.bot.workflowId || '',
        participantId: this.settings?.participantId || '',
        content: typeof message === 'string' ? message : message.content,
        metadata: defaultMetadata
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
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BotAgent, ConnectionState } from '../types';
import { SettingsData } from '../context/SettingsContext';
import { StepDefinition, Agent } from '../components/types';
import { MessageProcessor, Message } from './MessageProcessor';

export interface SignalRConnection {
  connection: HubConnection;
  agentIndex: number;
  reconnectAttempts: number;
  threadId?: string;
}

export interface ConnectionManagerEvents {
  onConnectionChange: (agentIndex: number, state: ConnectionState) => void;
  onConnectionError: (agentIndex: number, error: any) => void;
}

/**
 * ConnectionManager handles SignalR connection lifecycle and message setup
 * Updated to handle all connection-related logic including SignalR handlers
 */
export class ConnectionManager {
  private connections: Map<number, SignalRConnection> = new Map();
  private connectionLocks: Map<number, Promise<void>> = new Map();
  private settings: SettingsData | null = null;
  private agents: Agent[] = [];
  private events: ConnectionManagerEvents;
  private messageProcessor: MessageProcessor;

  constructor(events: ConnectionManagerEvents, messageProcessor: MessageProcessor) {
    this.events = events;
    this.messageProcessor = messageProcessor;
  }

  /**
   * Initialize with settings and agents
   */
  async initialize(settings: SettingsData, agents: Agent[]): Promise<void> {
    this.settings = settings;
    this.agents = agents;
    
    // Connect to all agents
    const connectionPromises = agents.map((agent, index) => 
      this.connectToAgent(agent, index)
    );
    
    await Promise.allSettled(connectionPromises);
  }

  /**
   * Connect to a specific agent
   */
  private async connectToAgent(agent: Agent, agentIndex: number): Promise<void> {
    if (!agent.workflowId) return;
    
    // Check if there's already a connection attempt in progress for this agent
    const existingLock = this.connectionLocks.get(agentIndex);
    if (existingLock) {
      console.log(`[ConnectionManager] Connection attempt already in progress for agent ${agentIndex}, waiting...`);
      await existingLock;
      return;
    }

    // Create a connection lock to prevent concurrent attempts
    const connectionPromise = this.doConnectToAgent(agent, agentIndex);
    this.connectionLocks.set(agentIndex, connectionPromise);
    
    try {
      await connectionPromise;
    } finally {
      this.connectionLocks.delete(agentIndex);
    }
  }

  /**
   * Actual connection implementation
   */
  private async doConnectToAgent(agent: Agent, agentIndex: number): Promise<void> {
    // Disconnect existing connection if any
    if (this.connections.has(agentIndex)) {
      await this.disconnectStep(agentIndex);
    }

    this.emitConnectionChange(agentIndex, 'connecting');

    try {
      const hubUrl = this.buildHubUrl();
      
      // Create the SignalR connection with authentication
      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          timeout: 30000,
          skipNegotiation: false,
          transport: 1 // WebSockets only
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) {
              return 1000;
            }
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Start the connection with retry logic
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          await connection.start();
          console.log(`[ConnectionManager] Connected to SignalR hub for agent ${agentIndex} (${agent.workflowId})`);
          break;
        } catch (startError) {
          retries++;
          if (retries >= maxRetries) {
            throw startError;
          }
          console.warn(`[ConnectionManager] Connection attempt ${retries} failed for agent ${agentIndex}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      // Create and store the connection object
      const signalRConnection: SignalRConnection = {
        connection,
        agentIndex,
        reconnectAttempts: 0
      };

      this.connections.set(agentIndex, signalRConnection);
      this.setupConnectionHandlers(signalRConnection, agent, agentIndex);
      
      this.emitConnectionChange(agentIndex, 'connected');
      
      // Setup SignalR message handlers and load thread history
      this.setupSignalRHandlers(connection, agentIndex);
      this.loadThreadHistory(agentIndex);
      
      // Give the connection a moment to fully establish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Subscribe to the agent after connection
      try {
        await this.subscribeToAgent(agent, agentIndex);
      } catch (error) {
        console.warn(`[ConnectionManager] Failed to subscribe to agent ${agentIndex}:`, error);
      }
      
    } catch (error) {
      console.error(`[ConnectionManager] Error connecting to SignalR hub for agent ${agentIndex}:`, error);
      this.emitConnectionChange(agentIndex, 'disconnected', error instanceof Error ? error.message : String(error));
      this.events.onConnectionError(agentIndex, error);
      throw error;
    }
  }

  /**
   * Build SignalR Hub URL
   */
  private buildHubUrl(): string {
    if (!this.settings) throw new Error('ConnectionManager not initialized');
    
    const baseUrl = this.settings.agentWebsocketUrl;
    const tenantId = this.settings.tenantId || '';
    const token = this.settings.agentApiKey || '';
    
    return `${baseUrl}?tenantId=${encodeURIComponent(tenantId)}&access_token=${encodeURIComponent(token)}`;
  }

  /**
   * Setup SignalR event handlers for a connection
   * Moved from WebSocketHub for better separation of concerns
   */
  private setupSignalRHandlers(connection: HubConnection, agentIndex: number): void {
    const agent = this.agents[agentIndex];
    console.log(`[ConnectionManager] Setting up SignalR handlers for agent ${agentIndex} (${agent?.workflowId})`);

    // Add a catch-all handler to see ALL events
    const originalOn = connection.on.bind(connection);
    connection.on = function(methodName: string, newMethod: (...args: any[]) => void) {
      console.log(`[ConnectionManager] 🎯 Registering handler for event: ${methodName} on agent ${agentIndex}`);
      return originalOn(methodName, (...args: any[]) => {
        console.log(`[ConnectionManager] 📨 Received event '${methodName}' for agent ${agentIndex}:`, args);
        return newMethod(...args);
      });
    };

    // Handle received messages (real-time)
    connection.on('ReceiveMessage', (message: Message) => {
      console.log(`[ConnectionManager] ✅ ReceiveMessage for agent ${agentIndex} (${agent?.title}):`, message);
      this.messageProcessor.processMessage(message.workflowId, message, agentIndex);
    });

    // Handle received metadata (delivered separately)
    connection.on('ReceiveMetadata', (message: any) => {
      console.log(`[ConnectionManager] 📊 ReceiveMetadata for agent ${agentIndex} (${agent?.title}):`, message);
      console.log(`[ConnectionManager] 🔍 Metadata messageType:`, message?.metadata?.messageType || 'NOT_FOUND');
      this.messageProcessor.processMetadata(message);
    });

    // Handle thread ID updates
    connection.on('InboundProcessed', (threadId: string) => {
      console.log(`[ConnectionManager] InboundProcessed for agent ${agentIndex}: ${threadId}`);
      console.log(`[ConnectionManager] 📤 Message processed by backend, waiting for agent response...`);
      this.messageProcessor.processThreadUpdate(threadId, agentIndex);
    });

    // Handle thread history
    connection.on('ThreadHistory', (history: Message[]) => {
      console.log(`[ConnectionManager] ThreadHistory for agent ${agentIndex}: ${history.length} messages`);
      this.messageProcessor.processThreadHistory(history, agentIndex);
    });

    // Connection established
    connection.on('Connected', () => {
      console.log(`[ConnectionManager] Connected event for agent ${agentIndex}`);
    });

    // Add error handler
    connection.on('Error', (error: any) => {
      console.error(`[ConnectionManager] ❌ Error event for agent ${agentIndex}:`, error);
    });

    // Add general event logging to catch any other events
    connection.onclose((error) => {
      console.log(`[ConnectionManager] Connection closed for agent ${agentIndex}:`, error);
    });

    console.log(`[ConnectionManager] 🎯 All SignalR handlers registered for agent ${agentIndex}`);
  }

  /**
   * Load thread history for an agent
   * Moved from WebSocketHub for better separation of concerns
   */
  private async loadThreadHistory(agentIndex: number): Promise<void> {
    const agent = this.agents[agentIndex];
    if (!agent?.workflowType || !this.settings?.participantId) {
      console.warn(`[ConnectionManager] Cannot load thread history for agent ${agentIndex}: missing workflowType or participantId`);
      return;
    }

    const connection = this.getConnection(agentIndex);
    if (!connection) {
      console.warn(`[ConnectionManager] Cannot load thread history for agent ${agentIndex}: no connection`);
      return;
    }

    try {
      await connection.invoke('GetThreadHistory',
        agent.workflowType,
        this.settings.participantId,
        1,  // Page number
        20  // Page size
      );
    } catch (error) {
      console.error(`[ConnectionManager] Error loading thread history for agent ${agentIndex}:`, error);
    }
  }

  /**
   * Setup connection state change handlers
   */
  private setupConnectionHandlers(signalRConnection: SignalRConnection, agent: Agent, agentIndex: number): void {
    const { connection } = signalRConnection;

    connection.onreconnecting((error) => {
      console.log(`[ConnectionManager] Reconnecting to agent ${agentIndex} (${agent.workflowId})...`, error);
      signalRConnection.reconnectAttempts++;
      this.emitConnectionChange(agentIndex, 'connecting');
    });

    connection.onreconnected((connectionId) => {
      console.log(`[ConnectionManager] Reconnected to agent ${agentIndex} (${agent.workflowId}). Connection ID: ${connectionId}`);
      signalRConnection.reconnectAttempts = 0;
      this.emitConnectionChange(agentIndex, 'connected');
      
      // Re-setup handlers and re-subscribe to agent after reconnection
      this.setupSignalRHandlers(connection, agentIndex);
      this.subscribeToAgent(agent, agentIndex);
    });

    connection.onclose((error) => {
      console.log(`[ConnectionManager] Connection closed for agent ${agentIndex} (${agent.workflowId})`, error);
      this.emitConnectionChange(agentIndex, 'disconnected', error?.toString());
    });
  }

  /**
   * Subscribe to agent workflow after connection is established
   */
  private async subscribeToAgent(agent: Agent, agentIndex: number): Promise<void> {
    if (!this.settings?.participantId) {
      console.warn(`[ConnectionManager] Cannot subscribe to agent ${agentIndex}: missing participantId`);
      return;
    }

    const connection = this.getConnection(agentIndex);
    if (!connection) return;

    try {
      // Calculate what the group ID should be based on server logic
      const expectedGroupId = agent.workflowId + this.settings.participantId + this.settings.tenantId;
      
      console.log(`[ConnectionManager] 🔍 Subscription Debug for agent ${agentIndex}:`);
      console.log(`[ConnectionManager] - WorkflowId: "${agent.workflowId}"`);
      console.log(`[ConnectionManager] - ParticipantId: "${this.settings.participantId}"`);
      console.log(`[ConnectionManager] - TenantId: "${this.settings.tenantId}"`);
      console.log(`[ConnectionManager] - Expected GroupId: "${expectedGroupId}"`);
      
      // Call the correct server method name with individual parameters
      await connection.invoke('SubscribeToAgent', 
        agent.workflowId,
        this.settings.participantId,
        this.settings.tenantId
      );
      
      console.log(`[ConnectionManager] ✅ Successfully subscribed to agent ${agentIndex} (${agent.workflowId})`);
    } catch (error) {
      console.error(`[ConnectionManager] ❌ Error subscribing to agent ${agentIndex} (${agent.workflowId}):`, error);
      throw error;
    }
  }

  /**
   * Get connection for specific agent index
   */
  getConnection(agentIndex: number): HubConnection | null {
    const signalRConnection = this.connections.get(agentIndex);
    return signalRConnection ? signalRConnection.connection : null;
  }

  /**
   * Get thread ID for specific agent index
   */
  getThreadId(agentIndex: number): string | undefined {
    const signalRConnection = this.connections.get(agentIndex);
    return signalRConnection?.threadId;
  }

  /**
   * Set thread ID for specific agent index
   */
  setThreadId(agentIndex: number, threadId: string): void {
    const signalRConnection = this.connections.get(agentIndex);
    if (signalRConnection) {
      signalRConnection.threadId = threadId;
      console.log(`[ConnectionManager] Thread ID set for agent ${agentIndex}: ${threadId}`);
    }
  }

  /**
   * Get all connection states
   */
  getConnectionStates(): Map<number, ConnectionState> {
    const states = new Map<number, ConnectionState>();
    
    for (const [agentIndex, { connection }] of this.connections) {
      const agent = this.agents[agentIndex];
      states.set(agentIndex, {
        stepIndex: agentIndex, // Keep for backward compatibility
        status: this.mapConnectionState(connection.state),
        lastActivity: new Date()
      });
    }
    
    return states;
  }

  /**
   * Get connection state for specific agent
   */
  getStepConnectionState(agentIndex: number): ConnectionState | null {
    const signalRConnection = this.connections.get(agentIndex);
    if (!signalRConnection) return null;

    const agent = this.agents[agentIndex];
    return {
      stepIndex: agentIndex, // Keep for backward compatibility
      status: this.mapConnectionState(signalRConnection.connection.state),
      lastActivity: new Date()
    };
  }

  /**
   * Map SignalR connection state to our connection state
   */
  private mapConnectionState(signalRState: string): ConnectionState['status'] {
    switch (signalRState) {
      case 'Connected':
        return 'connected';
      case 'Connecting':
      case 'Reconnecting':
        return 'connecting';
      default:
        return 'disconnected';
    }
  }

  /**
   * Disconnect specific agent
   */
  async disconnectStep(agentIndex: number): Promise<void> {
    const signalRConnection = this.connections.get(agentIndex);
    if (!signalRConnection) return;

    try {
      console.log(`[ConnectionManager] Disconnecting agent ${agentIndex}...`);
      await signalRConnection.connection.stop();
      this.connections.delete(agentIndex);
      this.emitConnectionChange(agentIndex, 'disconnected');
      console.log(`[ConnectionManager] Agent ${agentIndex} disconnected successfully`);
    } catch (error) {
      console.error(`[ConnectionManager] Error disconnecting agent ${agentIndex}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect all agents
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(agentIndex =>
      this.disconnectStep(agentIndex)
    );
    
    await Promise.allSettled(disconnectPromises);
    this.connections.clear();
    console.log(`[ConnectionManager] All agents disconnected`);
  }

  /**
   * Emit connection state change
   */
  private emitConnectionChange(agentIndex: number, status: ConnectionState['status'], error?: string): void {
    const state: ConnectionState = {
      stepIndex: agentIndex, // Keep for backward compatibility
      status,
      lastError: error,
      lastActivity: new Date()
    };
    
    this.events.onConnectionChange(agentIndex, state);
  }
} 
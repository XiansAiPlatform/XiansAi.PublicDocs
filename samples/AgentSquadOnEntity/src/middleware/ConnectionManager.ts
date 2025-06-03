import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BotAgent, ConnectionState } from '../types';
import { SettingsData } from '../context/SettingsContext';
import { StepDefinition } from '../components/power-of-attorney/types';

export interface SignalRConnection {
  connection: HubConnection;
  stepIndex: number;
  reconnectAttempts: number;
  threadId?: string;
}

export interface ConnectionManagerEvents {
  onConnectionChange: (stepIndex: number, state: ConnectionState) => void;
  onConnectionReady: (stepIndex: number, connection: HubConnection) => void;
  onConnectionError: (stepIndex: number, error: any) => void;
}

/**
 * ConnectionManager handles SignalR connection lifecycle
 * Separated from message processing concerns
 */
export class ConnectionManager {
  private connections: Map<number, SignalRConnection> = new Map();
  private connectionLocks: Map<number, Promise<void>> = new Map();
  private settings: SettingsData | null = null;
  private steps: StepDefinition[] = [];
  private events: ConnectionManagerEvents;

  constructor(events: ConnectionManagerEvents) {
    this.events = events;
  }

  /**
   * Initialize with settings and steps
   */
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

  /**
   * Connect to a specific step's bot
   */
  private async connectToStep(step: StepDefinition, stepIndex: number): Promise<void> {
    if (!step.bot || !step.bot.workflowId) return;
    
    // Check if there's already a connection attempt in progress for this step
    const existingLock = this.connectionLocks.get(stepIndex);
    if (existingLock) {
      console.log(`[ConnectionManager] Connection attempt already in progress for step ${stepIndex}, waiting...`);
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

  /**
   * Actual connection implementation
   */
  private async doConnectToStep(step: StepDefinition, stepIndex: number): Promise<void> {
    // Disconnect existing connection if any
    if (this.connections.has(stepIndex)) {
      await this.disconnectStep(stepIndex);
    }

    this.emitConnectionChange(stepIndex, 'connecting');

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
          console.log(`[ConnectionManager] Connected to SignalR hub for step ${stepIndex}`);
          break;
        } catch (startError) {
          retries++;
          if (retries >= maxRetries) {
            throw startError;
          }
          console.warn(`[ConnectionManager] Connection attempt ${retries} failed for step ${stepIndex}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      // Create and store the connection object
      const signalRConnection: SignalRConnection = {
        connection,
        stepIndex,
        reconnectAttempts: 0
      };

      this.connections.set(stepIndex, signalRConnection);
      this.setupConnectionHandlers(signalRConnection, step, stepIndex);
      
      this.emitConnectionChange(stepIndex, 'connected');
      
      // Notify that connection is ready for message handling
      this.events.onConnectionReady(stepIndex, connection);
      
      // Give the connection a moment to fully establish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Subscribe to the agent after connection
      try {
        await this.subscribeToAgent(step.bot!, stepIndex);
      } catch (error) {
        console.warn(`[ConnectionManager] Failed to subscribe to agent for step ${stepIndex}:`, error);
      }
      
    } catch (error) {
      console.error(`[ConnectionManager] Error connecting to SignalR hub for step ${stepIndex}:`, error);
      this.emitConnectionChange(stepIndex, 'disconnected', error instanceof Error ? error.message : String(error));
      this.events.onConnectionError(stepIndex, error);
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
   * Setup connection state change handlers
   */
  private setupConnectionHandlers(signalRConnection: SignalRConnection, step: StepDefinition, stepIndex: number): void {
    const { connection } = signalRConnection;

    connection.onreconnecting((error) => {
      console.log(`[ConnectionManager] Reconnecting to step ${stepIndex}...`, error);
      signalRConnection.reconnectAttempts++;
      this.emitConnectionChange(stepIndex, 'connecting');
    });

    connection.onreconnected((connectionId) => {
      console.log(`[ConnectionManager] Reconnected to step ${stepIndex}. Connection ID: ${connectionId}`);
      signalRConnection.reconnectAttempts = 0;
      this.emitConnectionChange(stepIndex, 'connected');
      
      // Re-subscribe to agent after reconnection
      if (step.bot) {
        this.subscribeToAgent(step.bot, stepIndex);
      }
    });

    connection.onclose((error) => {
      console.log(`[ConnectionManager] Connection closed for step ${stepIndex}`, error);
      this.emitConnectionChange(stepIndex, 'disconnected', error?.toString());
    });
  }

  /**
   * Subscribe to a specific agent
   */
  private async subscribeToAgent(bot: BotAgent, stepIndex: number): Promise<void> {
    const signalRConnection = this.connections.get(stepIndex);
    if (!signalRConnection) {
      console.error(`[ConnectionManager] No SignalR connection found for step ${stepIndex}`);
      return;
    }

    const connectionState = signalRConnection.connection.state;
    if (connectionState !== 'Connected' && connectionState !== 'Connecting') {
      console.error(`[ConnectionManager] Connection not ready for step ${stepIndex}, state: ${connectionState}`);
      return;
    }

    try {
      await signalRConnection.connection.invoke('SubscribeToAgent',
        bot.workflowId,
        this.settings?.participantId,
        this.settings?.tenantId
      );
      console.log(`[ConnectionManager] Subscribed to agent: ${bot.title} (${bot.workflowId})`);
    } catch (error) {
      console.error(`[ConnectionManager] Error subscribing to agent ${bot.title}:`, error);
    }
  }

  /**
   * Get connection for a step
   */
  getConnection(stepIndex: number): HubConnection | null {
    return this.connections.get(stepIndex)?.connection || null;
  }

  /**
   * Get thread ID for a step
   */
  getThreadId(stepIndex: number): string | undefined {
    return this.connections.get(stepIndex)?.threadId;
  }

  /**
   * Set thread ID for a step
   */
  setThreadId(stepIndex: number, threadId: string): void {
    const connection = this.connections.get(stepIndex);
    if (connection) {
      connection.threadId = threadId;
    }
  }

  /**
   * Get connection states for all steps
   */
  getConnectionStates(): Map<number, ConnectionState> {
    const states = new Map<number, ConnectionState>();
    
    for (const [stepIndex, signalRConnection] of this.connections) {
      states.set(stepIndex, {
        stepIndex,
        status: this.mapConnectionState(signalRConnection.connection.state)
      });
    }
    
    return states;
  }

  /**
   * Get connection state for specific step
   */
  getStepConnectionState(stepIndex: number): ConnectionState | null {
    const signalRConnection = this.connections.get(stepIndex);
    if (!signalRConnection) return null;
    
    return {
      stepIndex,
      status: this.mapConnectionState(signalRConnection.connection.state)
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
   * Disconnect specific step
   */
  async disconnectStep(stepIndex: number): Promise<void> {
    const signalRConnection = this.connections.get(stepIndex);
    if (signalRConnection) {
      try {
        await signalRConnection.connection.stop();
      } catch (error) {
        console.error(`[ConnectionManager] Error disconnecting step ${stepIndex}:`, error);
      }
      this.connections.delete(stepIndex);
      this.emitConnectionChange(stepIndex, 'disconnected');
    }
  }

  /**
   * Disconnect all steps
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(stepIndex => 
      this.disconnectStep(stepIndex)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Emit connection state change
   */
  private emitConnectionChange(stepIndex: number, status: ConnectionState['status'], error?: string): void {
    const state: ConnectionState = {
      stepIndex,
      status,
      ...(error && { lastError: error })
    };
    this.events.onConnectionChange(stepIndex, state);
  }
} 
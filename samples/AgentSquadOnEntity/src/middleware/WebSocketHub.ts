import { HubConnection } from '@microsoft/signalr';
import { BotAgent, ConnectionState, HubEvent, OutboundMessage } from '../types';
import { SettingsData } from '../context/SettingsContext';
import { StepDefinition, Agent } from '../components/types';
import { Agents, getAgentByWorkflowId, getAgentById, getAgentForStep } from '../modules/poa/steps';
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
 * WebSocketHub - Refactored to use modular components and Agents array
 * 
 * This class now coordinates between specialized components:
 * - ConnectionManager: Handles SignalR connections for all agents
 * - MessageProcessor: Processes and routes messages
 * - MetadataMessageRouter: Routes metadata messages to UI components
 * - EventDispatcher: Clean event system
 * 
 * Now initializes connections for all agents in the Agents array, not just step-bound bots
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
  private agents: Agent[] = [];
  private agentIndexMap: Map<string, number> = new Map(); // Maps workflowId to agent index
  private readonly hubInstanceId: string;

  // Helper function to find step index for a given agent index
  private getStepIndexForAgent(agentIndex: number): number | null {
    const agent = this.agents[agentIndex];
    if (!agent) {
      console.warn(`[WebSocketHub] getStepIndexForAgent: Agent not found for agentIndex ${agentIndex}`);
      return null;
    }
    console.log(`[WebSocketHub] getStepIndexForAgent: Mapping for agentIndex ${agentIndex} (Agent: ${agent.title}, Workflow: ${agent.workflowId})`);

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      if (step.botId) {
        const stepAgent = getAgentById(step.botId);
        if (stepAgent && stepAgent.workflowId === agent.workflowId) {
          console.log(`[WebSocketHub] getStepIndexForAgent: Matched agentIndex ${agentIndex} to stepIndex ${i} (Step: ${step.title})`);
          return i;
        }
      }
    }
    console.warn(`[WebSocketHub] getStepIndexForAgent: No step found for agentIndex ${agentIndex} (Agent: ${agent.title}, Workflow: ${agent.workflowId})`);
    return null;
  }

  private constructor() {
    this.hubInstanceId = crypto.randomUUID();
    console.log(`[WebSocketHub] New instance created with ID: ${this.hubInstanceId}`);

    // Initialize components
    this.metadataRouter = new MetadataMessageRouter();
    this.eventDispatcher = new EventDispatcher<HubEvents>();

    // Initialize ConnectionManager with event handlers
    const connectionEvents: ConnectionManagerEvents = {
      onConnectionChange: (agentIndex, state) => {
        const stepIndex = this.getStepIndexForAgent(agentIndex);
        this.eventDispatcher.emit('connection_change', {
          type: 'connection_change',
          stepIndex: stepIndex !== null ? stepIndex : agentIndex,
          data: state
        });
      },
      onConnectionReady: (agentIndex, connection) => {
        this.setupSignalRHandlers(connection, agentIndex);
        this.loadThreadHistory(agentIndex);
      },
      onConnectionError: (agentIndex, error) => {
        const stepIndex = this.getStepIndexForAgent(agentIndex);
        this.eventDispatcher.emit('error', {
          type: 'error',
          stepIndex: stepIndex !== null ? stepIndex : agentIndex,
          data: { error: `Connection error: ${error}`, stepIndex: stepIndex !== null ? stepIndex : agentIndex }
        });
      }
    };
    this.connectionManager = new ConnectionManager(connectionEvents);

    // Initialize MessageProcessor with event handlers - CORRECTED VERSION
    const messageEvents: MessageProcessorEvents = {
      onChatMessage: (agentIndex, message) => {
        // The agentIndex comes in as stepIndex from MessageProcessor's perspective
        // but it's actually an agentIndex that we need to map to the correct stepIndex
        const correctStepIndex = this.getStepIndexForAgent(agentIndex);
        const finalStepIndex = correctStepIndex !== null ? correctStepIndex : agentIndex;
        
        console.log(`[WebSocketHub] messageEvents.onChatMessage: agentIndex=${agentIndex} -> correctStepIndex=${finalStepIndex}, message.stepIndex=${message.stepIndex}, content='${message.content}'`);
        
        // Update the message's stepIndex to use the correct one
        const correctedMessage = {
          ...message,
          stepIndex: finalStepIndex
        };
        
        this.eventDispatcher.emit('message', {
          type: 'message',
          stepIndex: finalStepIndex,
          data: correctedMessage
        });
      },
      onSystemMessage: (agentIndex, message) => {
        // Same mapping logic for system messages
        const correctStepIndex = this.getStepIndexForAgent(agentIndex);
        const finalStepIndex = correctStepIndex !== null ? correctStepIndex : agentIndex;
        
        console.log(`[WebSocketHub] messageEvents.onSystemMessage: agentIndex=${agentIndex} -> correctStepIndex=${finalStepIndex}, message.stepIndex=${message.stepIndex}, type=${message.type}`);
        
        // Update the message's stepIndex to use the correct one
        const correctedMessage = {
          ...message,
          stepIndex: finalStepIndex
        };
        
        this.eventDispatcher.emit('system_message', {
          type: 'system_message',
          stepIndex: finalStepIndex,
          data: correctedMessage
        });
      },
      onThreadUpdate: (agentIndex, threadId) => {
        // Keep using agentIndex for ConnectionManager
        this.connectionManager.setThreadId(agentIndex, threadId);
      },
      onError: (agentIndex, error) => {
        const correctStepIndex = this.getStepIndexForAgent(agentIndex);
        const finalStepIndex = correctStepIndex !== null ? correctStepIndex : agentIndex;
        
        this.eventDispatcher.emit('error', {
          type: 'error',
          stepIndex: finalStepIndex,
          data: { error: `Message processing error: ${error}`, stepIndex: finalStepIndex }
        });
      }
    };
    
    // Use original MessageProcessor constructor
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
   * Now creates connections for all agents, not just step-bound bots
   */
  async initialize(settings: SettingsData, steps: StepDefinition[]): Promise<void> {
    this.settings = settings;
    this.steps = steps;
    this.agents = [...Agents]; // Copy the agents array

    // Build agent index map
    this.agentIndexMap.clear();
    this.agents.forEach((agent, index) => {
      this.agentIndexMap.set(agent.workflowId, index);
    });

    console.log(`[WebSocketHub] Initializing with ${this.agents.length} agents and ${steps.length} steps`);
    console.log(`[WebSocketHub] Agents:`, this.agents.map(a => ({ workflowId: a.workflowId, title: a.title })));

    // Initialize connections for all agents
    await this.connectionManager.initialize(settings, this.agents);
  }

  /**
   * Setup SignalR event handlers for a connection
   * Now uses agent index instead of step index
   */
  private setupSignalRHandlers(connection: HubConnection, agentIndex: number): void {
    const agent = this.agents[agentIndex];
    console.log(`[WebSocketHub] Setting up SignalR handlers for agent ${agentIndex} (${agent?.workflowId})`);

    // Add a catch-all handler to see ALL events
    const originalOn = connection.on.bind(connection);
    connection.on = function(methodName: string, newMethod: (...args: any[]) => void) {
      console.log(`[WebSocketHub] 🎯 Registering handler for event: ${methodName} on agent ${agentIndex}`);
      return originalOn(methodName, (...args: any[]) => {
        console.log(`[WebSocketHub] 📨 Received event '${methodName}' for agent ${agentIndex}:`, args);
        return newMethod(...args);
      });
    };

    // Handle received messages (real-time)
    connection.on('ReceiveMessage', (message: Message) => {
      console.log(`[WebSocketHub] ✅ ReceiveMessage for agent ${agentIndex} (${agent?.title}):`, message);
      this.messageProcessor.processMessage(message.workflowId, message, agentIndex);
    });

    // Handle received metadata (delivered separately)
    connection.on('ReceiveMetadata', (metadata: any) => {
      console.log(`[WebSocketHub] 📊 ReceiveMetadata for agent ${agentIndex} (${agent?.title}):`, metadata);
      console.log(`[WebSocketHub] 🔍 Metadata messageType:`, metadata?.Metadata?.messageType || metadata?.metadata?.messageType || 'NOT_FOUND');
      this.messageProcessor.processMetadata(metadata, agentIndex);
    });

    // Handle thread ID updates
    connection.on('InboundProcessed', (threadId: string) => {
      console.log(`[WebSocketHub] InboundProcessed for agent ${agentIndex}: ${threadId}`);
      console.log(`[WebSocketHub] 📤 Message processed by backend, waiting for agent response...`);
      this.messageProcessor.processThreadUpdate(threadId, agentIndex);
    });

    // Handle thread history
    connection.on('ThreadHistory', (history: Message[]) => {
      console.log(`[WebSocketHub] ThreadHistory for agent ${agentIndex}: ${history.length} messages`);
      this.messageProcessor.processThreadHistory(history, agentIndex);
    });

    // Connection established
    connection.on('Connected', () => {
      console.log(`[WebSocketHub] Connected event for agent ${agentIndex}`);
    });

    // Add error handler
    connection.on('Error', (error: any) => {
      console.error(`[WebSocketHub] ❌ Error event for agent ${agentIndex}:`, error);
    });

    // Add general event logging to catch any other events
    connection.onclose((error) => {
      console.log(`[WebSocketHub] Connection closed for agent ${agentIndex}:`, error);
    });

    console.log(`[WebSocketHub] 🎯 All SignalR handlers registered for agent ${agentIndex}`);
  }

  /**
   * Load thread history for an agent
   */
  private async loadThreadHistory(agentIndex: number): Promise<void> {
    const agent = this.agents[agentIndex];
    if (!agent?.workflowType || !this.settings?.participantId) {
      console.warn(`[WebSocketHub] Cannot load thread history for agent ${agentIndex}: missing workflowType or participantId`);
      return;
    }

    const connection = this.connectionManager.getConnection(agentIndex);
    if (!connection) {
      console.warn(`[WebSocketHub] Cannot load thread history for agent ${agentIndex}: no connection`);
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
      console.error(`[WebSocketHub] Error loading thread history for agent ${agentIndex}:`, error);
    }
  }


  /**
   * Send message through specific step connection
   * Updated to work with new agent structure and step references
   */
  async sendMessage(message: any, stepIndex: number): Promise<void> {
    const step = this.steps[stepIndex];
    if (!step?.botId) {
      throw new Error(`No bot configured for step ${stepIndex}`);
    }

    const agent = getAgentById(step.botId);
    if (!agent) {
      throw new Error(`Agent not found for bot ID: ${step.botId}`);
    }

    const agentIndex = this.agentIndexMap.get(agent.workflowId);
    if (agentIndex === undefined) {
      throw new Error(`Agent index not found for workflow ID: ${agent.workflowId}`);
    }

    const connection = this.connectionManager.getConnection(agentIndex);
    if (!connection || connection.state !== 'Connected') {
      throw new Error(`No connection available for agent ${agentIndex} (${agent.workflowId})`);
    }

    const defaultMetadata = this.settings?.defaultMetadata ? JSON.parse(this.settings.defaultMetadata) : {};

    try {
      const request: SendMessageRequest = {
        threadId: this.connectionManager.getThreadId(agentIndex),
        agent: agent.agent,
        workflowType: agent.workflowType || '',
        workflowId: agent.workflowId,
        participantId: this.settings?.participantId || '',
        content: typeof message === 'string' ? message : message.content,
        metadata: defaultMetadata
      };

      await connection.invoke('SendInboundMessage', request);
      console.log(`[WebSocketHub] Message sent successfully for step ${stepIndex} via agent ${agentIndex} (${agent.workflowId})`);
    } catch (error) {
      console.error(`[WebSocketHub] Error sending message for step ${stepIndex} via agent ${agentIndex}:`, error);
      throw error;
    }
  }

  /**
   * Send message directly to an agent by workflow ID
   */
  async sendMessageToAgent(message: any, workflowId: string): Promise<void> {
    const agentIndex = this.agentIndexMap.get(workflowId);
    if (agentIndex === undefined) {
      throw new Error(`Agent not found for workflow ID: ${workflowId}`);
    }

    const agent = this.agents[agentIndex];
    const connection = this.connectionManager.getConnection(agentIndex);
    if (!connection || connection.state !== 'Connected') {
      throw new Error(`No connection available for agent ${workflowId}`);
    }

    const defaultMetadata = this.settings?.defaultMetadata ? JSON.parse(this.settings.defaultMetadata) : {};

    try {
      const request: SendMessageRequest = {
        threadId: this.connectionManager.getThreadId(agentIndex),
        agent: agent.agent,
        workflowType: agent.workflowType || '',
        workflowId: agent.workflowId,
        participantId: this.settings?.participantId || '',
        content: typeof message === 'string' ? message : message.content,
        metadata: defaultMetadata
      };

      await connection.invoke('SendInboundMessage', request);
      console.log(`[WebSocketHub] Message sent successfully to agent ${workflowId}`);
    } catch (error) {
      console.error(`[WebSocketHub] Error sending message to agent ${workflowId}:`, error);
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
   * Get connection states for all agents
   */
  getConnectionStates(): Map<number, ConnectionState> {
    return this.connectionManager.getConnectionStates();
  }

  /**
   * Get connection state for specific agent by index
   */
  getAgentConnectionState(agentIndex: number): ConnectionState | null {
    return this.connectionManager.getStepConnectionState(agentIndex);
  }

  /**
   * Get connection state for specific agent by workflow ID
   */
  getAgentConnectionStateByWorkflowId(workflowId: string): ConnectionState | null {
    const agentIndex = this.agentIndexMap.get(workflowId);
    return agentIndex !== undefined ? this.getAgentConnectionState(agentIndex) : null;
  }

  /**
   * Get connection state for specific step (backward compatibility)
   */
  getStepConnectionState(stepIndex: number): ConnectionState | null {
    const step = this.steps[stepIndex];
    if (!step?.botId) {
      return null;
    }
    const agent = getAgentById(step.botId);
    return agent ? this.getAgentConnectionStateByWorkflowId(agent.workflowId) : null;
  }

  /**
   * Get current thread ID for an agent
   */
  getAgentThreadId(agentIndex: number): string | undefined {
    return this.connectionManager.getThreadId(agentIndex);
  }

  /**
   * Get current thread ID for an agent by workflow ID
   */
  getAgentThreadIdByWorkflowId(workflowId: string): string | undefined {
    const agentIndex = this.agentIndexMap.get(workflowId);
    return agentIndex !== undefined ? this.getAgentThreadId(agentIndex) : undefined;
  }

  /**
   * Get current thread ID for a step (backward compatibility)
   */
  getThreadId(stepIndex: number): string | undefined {
    const step = this.steps[stepIndex];
    if (!step?.botId) {
      return undefined;
    }
    const agent = getAgentById(step.botId);
    return agent ? this.getAgentThreadIdByWorkflowId(agent.workflowId) : undefined;
  }

  /**
   * Disconnect specific agent
   */
  async disconnectAgent(agentIndex: number): Promise<void> {
    await this.connectionManager.disconnectStep(agentIndex);
  }

  /**
   * Disconnect agent by workflow ID
   */
  async disconnectAgentByWorkflowId(workflowId: string): Promise<void> {
    const agentIndex = this.agentIndexMap.get(workflowId);
    if (agentIndex !== undefined) {
      await this.disconnectAgent(agentIndex);
    }
  }

  /**
   * Disconnect specific step (backward compatibility)
   */
  async disconnectStep(stepIndex: number): Promise<void> {
    const step = this.steps[stepIndex];
    if (step?.botId) {
      const agent = getAgentById(step.botId);
      if (agent) {
        await this.disconnectAgentByWorkflowId(agent.workflowId);
      }
    }
  }

  /**
   * Disconnect all agents
   */
  async disconnectAll(): Promise<void> {
    await this.connectionManager.disconnectAll();
  }

  /**
   * Get all agents
   */
  getAgents(): Agent[] {
    return [...this.agents];
  }

  /**
   * Get agent by workflow ID
   */
  getAgent(workflowId: string): Agent | undefined {
    return getAgentByWorkflowId(workflowId);
  }

  /**
   * Get hub statistics
   */
  getStats(): {
    hubId: string;
    agentCount: number;
    stepCount: number;
    connectionStats: any;
    metadataStats: any;
    eventStats: any;
  } {
    return {
      hubId: this.hubInstanceId,
      agentCount: this.agents.length,
      stepCount: this.steps.length,
      connectionStats: this.connectionManager.getConnectionStates(),
      metadataStats: this.metadataRouter.getStats(),
      eventStats: this.eventDispatcher.getStats()
    };
  }
}

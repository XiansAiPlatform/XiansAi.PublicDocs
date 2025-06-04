import { ChatMessage } from '../types';
import { MetadataMessageRouter } from './MetadataMessageRouter';

export interface Message {
  content: string | null | undefined;
  direction: 'Incoming' | 'Outgoing' | 'Handover' | string | number;
  createdAt: Date;
  workflowId: string;
  threadId: string;
  participantId: string;
  metadata?: any;
}

export interface ProcessedChatMessage extends ChatMessage {
  id: string;
  content: string;
  direction: 'Incoming' | 'Outgoing' | 'Handover';
  stepIndex: number;
  timestamp: Date;
  threadId: string;
  metadata?: any;
}

export interface MessageProcessorEvents {
  onChatMessage: (stepIndex: number, message: ProcessedChatMessage) => void;
  onThreadUpdate: (stepIndex: number, threadId: string) => void;
  onError: (stepIndex: number, error: any) => void;
}

/**
 * MessageProcessor handles transformation and routing of messages
 * Separated from connection concerns
 */
export class MessageProcessor {
  private chatHistories: Map<string, Message[]> = new Map();
  private events: MessageProcessorEvents;
  private metadataRouter: MetadataMessageRouter;

  constructor(events: MessageProcessorEvents, metadataRouter: MetadataMessageRouter) {
    this.events = events;
    this.metadataRouter = metadataRouter;
  }

  /**
   * Process a regular chat message
   */
  processMessage(workflowId: string, message: Message, stepIndex: number): void {
    console.log(`[MessageProcessor] Processing message for step ${stepIndex}`);

    // Store in chat history
    if (!this.chatHistories.has(workflowId)) {
      this.chatHistories.set(workflowId, []);
    }
    this.chatHistories.get(workflowId)?.push(message);

    // Transform to frontend format
    const processedMessage: ProcessedChatMessage = {
      id: crypto.randomUUID(),
      content: message.content || '',
      direction: this.mapDirection(message.direction),
      stepIndex,
      timestamp: message.createdAt || new Date(),
      threadId: message.threadId,
      metadata: message.metadata
    };

    // Emit processed message
    this.events.onChatMessage(stepIndex, processedMessage);
  }

  /**
   * Process metadata message and route to interested subscribers
   */
  processMetadata(message: any): void {
    console.log(`[MessageProcessor] Processing metadata`, message);

    try {
      // Extract messageType and route to specific subscribers
      // Check multiple possible locations for messageType
      const messageType = message?.metadata?.messageType || 'UNKNOWN';
      
      console.log(`[MessageProcessor] Extracted messageType: "${messageType}"`);

      if (message?.metadata === undefined || message?.metadata === null) {
        console.warn(`[MessageProcessor] Metadata is undefined or null`);
        return;
      }

      // Route to interested subscribers
      this.metadataRouter.routeMessage(message.metadata);

    } catch (error) {
      console.error(`[MessageProcessor] Error processing metadata:`, error);
      this.events.onError(0, error);
    }
  }

  /**
   * Process thread history messages
   */
  processThreadHistory(history: Message[], stepIndex: number): void {
    if (!history || history.length === 0) {
      return;
    }
    
    const workflowId = history[0].workflowId; 
    console.log(`[MessageProcessor] Processing ${history.length} historical messages for step ${stepIndex}, workflow ${workflowId}`);

    // Sort historical messages in chronological order (oldest first)
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Process each historical message
    for (const histMessage of sortedHistory) {
      this.processMessage(workflowId, histMessage, stepIndex);
    }

    console.log(`[MessageProcessor] Processed ${sortedHistory.length} historical messages for step ${stepIndex}`);
  }

  /**
   * Process thread ID update
   */
  processThreadUpdate(threadId: string, stepIndex: number): void {
    console.log(`[MessageProcessor] Thread ID updated for step ${stepIndex}: ${threadId}`);
    
    // Emit thread update event
    this.events.onThreadUpdate(stepIndex, threadId);
  }

  /**
   * Map backend direction values to frontend direction values
   */
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
          console.warn(`[MessageProcessor] Unknown numeric direction: ${backendDirection}, defaulting to 'Outgoing'`);
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
          console.warn(`[MessageProcessor] Unknown string direction: ${backendDirection}, defaulting to 'Outgoing'`);
          return 'Outgoing';
      }
    }
    
    console.warn(`[MessageProcessor] Invalid direction type: ${typeof backendDirection}, value: ${backendDirection}, defaulting to 'Outgoing'`);
    return 'Outgoing';
  }

  /**
   * Get chat history for a specific workflow
   */
  getChatHistory(workflowId: string): Message[] {
    return this.chatHistories.get(workflowId) || [];
  }

  /**
   * Clear chat history for a specific workflow
   */
  clearChatHistory(workflowId: string): void {
    this.chatHistories.delete(workflowId);
  }

  /**
   * Clear all chat histories
   */
  clearAllHistories(): void {
    this.chatHistories.clear();
  }
} 
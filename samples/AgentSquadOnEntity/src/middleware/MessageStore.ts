import { ChatMessage, SystemMessage } from '../types';

export interface MessageStoreEvents {
  onMessageAdded: (stepIndex: number, message: ChatMessage) => void;
  onSystemMessageAdded: (stepIndex: number, message: SystemMessage) => void;
  onMessagesCleared: (stepIndex: number) => void;
}

/**
 * MessageStore handles storage and retrieval of messages
 * Focused on data management with proper immutability
 */
export class MessageStore {
  private chatMessages: Map<number, ChatMessage[]> = new Map();
  private systemMessages: Map<number, SystemMessage[]> = new Map();
  private threadIds: Map<number, string> = new Map();
  private events?: MessageStoreEvents;
  
  constructor(events?: MessageStoreEvents) {
    this.events = events;
  }

  /**
   * Add a chat message, ensuring immutability for React change detection
   */
  addChatMessage(message: ChatMessage): ChatMessage[] {
    const existingMessages = this.chatMessages.get(message.stepIndex) || [];
    const newMessages = [...existingMessages, message];
    this.chatMessages.set(message.stepIndex, newMessages);
    
    if (message.threadId) {
      this.threadIds.set(message.stepIndex, message.threadId);
    }

    // Emit event if listener is provided
    this.events?.onMessageAdded(message.stepIndex, message);
    
    return newMessages;
  }
  
  /**
   * Add a system message, ensuring immutability
   */
  addSystemMessage(message: SystemMessage): SystemMessage[] {
    const existingMessages = this.systemMessages.get(message.stepIndex) || [];
    const newMessages = [...existingMessages, message];
    this.systemMessages.set(message.stepIndex, newMessages);

    // Emit event if listener is provided
    this.events?.onSystemMessageAdded(message.stepIndex, message);
    
    return newMessages;
  }

  /**
   * Add multiple chat messages efficiently (for bulk operations like history loading)
   */
  addChatMessages(stepIndex: number, messages: ChatMessage[]): ChatMessage[] {
    if (messages.length === 0) return this.getChatMessages(stepIndex);

    const existingMessages = this.chatMessages.get(stepIndex) || [];
    const newMessages = [...existingMessages, ...messages];
    this.chatMessages.set(stepIndex, newMessages);

    // Update thread ID from the latest message that has one
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].threadId) {
        this.threadIds.set(stepIndex, messages[i].threadId!);
        break;
      }
    }

    // Emit event for each added message
    messages.forEach(message => {
      this.events?.onMessageAdded(stepIndex, message);
    });

    return newMessages;
  }
  
  /**
   * Get chat messages for a step (returns immutable reference)
   */
  getChatMessages(stepIndex: number): ChatMessage[] {
    return this.chatMessages.get(stepIndex) || [];
  }
  
  /**
   * Get system messages for a step
   */
  getSystemMessages(stepIndex: number): SystemMessage[] {
    return this.systemMessages.get(stepIndex) || [];
  }
  
  /**
   * Get all messages (chat + system) for a step, sorted by timestamp
   */
  getAllMessages(stepIndex: number): (ChatMessage | SystemMessage)[] {
    const chatMsgs = this.getChatMessages(stepIndex);
    const systemMsgs = this.getSystemMessages(stepIndex);
    
    return [...chatMsgs, ...systemMsgs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get latest chat message for a step
   */
  getLatestChatMessage(stepIndex: number): ChatMessage | undefined {
    const messages = this.getChatMessages(stepIndex);
    return messages.length > 0 ? messages[messages.length - 1] : undefined;
  }

  /**
   * Get latest system message of a specific type
   */
  getLatestSystemMessage(stepIndex: number, type: SystemMessage['type']): SystemMessage | undefined {
    const messages = this.getSystemMessages(stepIndex);
    return messages
      .filter(msg => msg.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  /**
   * Get thread ID for a step
   */
  getThreadId(stepIndex: number): string | undefined {
    return this.threadIds.get(stepIndex);
  }

  /**
   * Set thread ID for a step
   */
  setThreadId(stepIndex: number, threadId: string): void {
    this.threadIds.set(stepIndex, threadId);
  }

  /**
   * Get message count for a step
   */
  getMessageCount(stepIndex: number): { chat: number; system: number; total: number } {
    const chatCount = this.getChatMessages(stepIndex).length;
    const systemCount = this.getSystemMessages(stepIndex).length;
    
    return {
      chat: chatCount,
      system: systemCount,
      total: chatCount + systemCount
    };
  }

  /**
   * Get all steps that have messages
   */
  getStepsWithMessages(): number[] {
    const chatSteps = Array.from(this.chatMessages.keys());
    const systemSteps = Array.from(this.systemMessages.keys());
    return [...new Set([...chatSteps, ...systemSteps])].sort();
  }
  
  /**
   * Clear messages for a step
   */
  clearStepMessages(stepIndex: number): void {
    this.chatMessages.delete(stepIndex);
    this.systemMessages.delete(stepIndex);
    this.threadIds.delete(stepIndex);

    // Emit event if listener is provided
    this.events?.onMessagesCleared(stepIndex);
  }
  
  /**
   * Clear all messages
   */
  clearAll(): void {
    const allSteps = this.getStepsWithMessages();
    
    this.chatMessages.clear();
    this.systemMessages.clear();
    this.threadIds.clear();

    // Emit events for all cleared steps
    allSteps.forEach(stepIndex => {
      this.events?.onMessagesCleared(stepIndex);
    });
  }

  /**
   * Get store statistics
   */
  getStats(): {
    totalSteps: number;
    totalChatMessages: number;
    totalSystemMessages: number;
    stepStats: Record<number, { chat: number; system: number }>;
  } {
    const stepStats: Record<number, { chat: number; system: number }> = {};
    let totalChatMessages = 0;
    let totalSystemMessages = 0;

    const allSteps = this.getStepsWithMessages();
    
    allSteps.forEach(stepIndex => {
      const chatCount = this.getChatMessages(stepIndex).length;
      const systemCount = this.getSystemMessages(stepIndex).length;
      
      stepStats[stepIndex] = { chat: chatCount, system: systemCount };
      totalChatMessages += chatCount;
      totalSystemMessages += systemCount;
    });

    return {
      totalSteps: allSteps.length,
      totalChatMessages,
      totalSystemMessages,
      stepStats
    };
  }
} 
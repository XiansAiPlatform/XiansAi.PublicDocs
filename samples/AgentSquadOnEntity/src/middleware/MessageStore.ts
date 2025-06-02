import { ChatMessage, SystemMessage } from '../types';

export class MessageStore {
  private chatMessages: Map<number, ChatMessage[]> = new Map();
  private systemMessages: Map<number, SystemMessage[]> = new Map();
  private threadIds: Map<number, string> = new Map();
  
  // Add a chat message, ensuring immutability for React change detection
  addChatMessage(message: ChatMessage): void {
    const existingMessages = this.chatMessages.get(message.stepIndex) || [];
    // Create a new array with the old messages and the new one
    this.chatMessages.set(message.stepIndex, [...existingMessages, message]);
    
    if (message.threadId) {
      this.threadIds.set(message.stepIndex, message.threadId);
    }
  }
  
  // Add a system message, ensuring immutability
  addSystemMessage(message: SystemMessage): void {
    const existingMessages = this.systemMessages.get(message.stepIndex) || [];
    this.systemMessages.set(message.stepIndex, [...existingMessages, message]);
  }
  
  // Get chat messages for a step (returns a reference to the array in the map)
  getChatMessages(stepIndex: number): ChatMessage[] {
    return this.chatMessages.get(stepIndex) || [];
  }
  
  // Get system messages for a step
  getSystemMessages(stepIndex: number): SystemMessage[] {
    return this.systemMessages.get(stepIndex) || [];
  }
  
  // Get all messages (chat + system) for a step
  // This will now correctly use the (potentially new) array references from getChatMessages/getSystemMessages
  getAllMessages(stepIndex: number): (ChatMessage | SystemMessage)[] {
    const chatMsgs = this.getChatMessages(stepIndex);
    const systemMsgs = this.getSystemMessages(stepIndex);
    
    // Combine and sort. Ensure to handle ChatMessage and SystemMessage types correctly.
    return [...chatMsgs, ...systemMsgs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
  
  // Get thread ID for a step
  getThreadId(stepIndex: number): string | undefined {
    return this.threadIds.get(stepIndex);
  }
  
  // Clear messages for a step
  clearStepMessages(stepIndex: number): void {
    this.chatMessages.delete(stepIndex);
    this.systemMessages.delete(stepIndex);
    this.threadIds.delete(stepIndex);
  }
  
  // Clear all messages
  clearAll(): void {
    this.chatMessages.clear();
    this.systemMessages.clear();
    this.threadIds.clear();
  }
  
  // Get latest system message of a specific type
  getLatestSystemMessage(stepIndex: number, type: SystemMessage['type']): SystemMessage | undefined {
    const messages = this.getSystemMessages(stepIndex);
    return messages
      .filter(msg => msg.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }
} 
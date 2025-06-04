
export interface MetadataSubscriber {
  id: string;
  messageTypes: string[];
  callback: (message: any) => void;
}

/**
 * MetadataMessageRouter routes metadata messages to interested UI components
 * based on messageType
 */
export class MetadataMessageRouter {
  private subscribers: Map<string, MetadataSubscriber> = new Map();
  private messageTypeIndex: Map<string, Set<string>> = new Map(); // messageType -> subscriber IDs

  /**
   * Subscribe to specific metadata message types
   */
  subscribe(subscriber: MetadataSubscriber): () => void {
    // Store subscriber
    this.subscribers.set(subscriber.id, subscriber);

    // Index by message types
    subscriber.messageTypes.forEach(messageType => {
      if (!this.messageTypeIndex.has(messageType)) {
        this.messageTypeIndex.set(messageType, new Set());
      }
      this.messageTypeIndex.get(messageType)!.add(subscriber.id);
    });

    console.log(`[MetadataMessageRouter] Subscriber ${subscriber.id} registered for types: ${subscriber.messageTypes.join(', ')}`);

    // Return unsubscribe function
    return () => this.unsubscribe(subscriber.id);
  }

  /**
   * Unsubscribe a subscriber
   */
  unsubscribe(subscriberId: string): void {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) return;

    // Remove from message type index
    subscriber.messageTypes.forEach(messageType => {
      const subscriberSet = this.messageTypeIndex.get(messageType);
      if (subscriberSet) {
        subscriberSet.delete(subscriberId);
        if (subscriberSet.size === 0) {
          this.messageTypeIndex.delete(messageType);
        }
      }
    });

    // Remove subscriber
    this.subscribers.delete(subscriberId);
    console.log(`[MetadataMessageRouter] Subscriber ${subscriberId} unregistered`);
  }

  /**
   * Route a metadata message to interested subscribers
   */
  routeMessage(message: any): void {
    const { messageType } = message;
    
    // Find subscribers interested in this message type
    const interestedSubscribers = this.messageTypeIndex.get(messageType);
    if (!interestedSubscribers || interestedSubscribers.size === 0) {
      console.log(`[MetadataMessageRouter] No subscribers for messageType: ${messageType}`);
      return;
    }
    
    interestedSubscribers.forEach(subscriberId => {
      const subscriber = this.subscribers.get(subscriberId);
      if (!subscriber) return;

      try {
        subscriber.callback(message);
        console.log(`[MetadataMessageRouter] Routed ${messageType} message to subscriber ${subscriberId}`);
      } catch (error) {
        console.error(`[MetadataMessageRouter] Error in subscriber ${subscriberId} callback:`, error);
      }
    });
  }

  /**
   * Get statistics about current subscriptions
   */
  getStats(): {
    totalSubscribers: number;
    messageTypes: string[];
    subscribersByType: Record<string, number>;
  } {
    const messageTypes = Array.from(this.messageTypeIndex.keys());
    const subscribersByType: Record<string, number> = {};
    
    messageTypes.forEach(type => {
      subscribersByType[type] = this.messageTypeIndex.get(type)?.size || 0;
    });

    return {
      totalSubscribers: this.subscribers.size,
      messageTypes,
      subscribersByType
    };
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscribers.clear();
    this.messageTypeIndex.clear();
    console.log(`[MetadataMessageRouter] All subscriptions cleared`);
  }
} 
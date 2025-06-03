export interface MetadataMessage {
  messageType: string;
  stepIndex: number;
  data: any;
  timestamp: Date;
  metadata?: any;
}

export interface MetadataSubscriber {
  id: string;
  messageTypes: string[];
  callback: (message: MetadataMessage) => void;
  stepIndex?: number; // Optional: subscribe to specific step only
}

/**
 * MetadataMessageRouter routes metadata messages to interested UI components
 * based on messageType and optional stepIndex filtering
 */
export class MetadataMessageRouter {
  private subscribers: Map<string, MetadataSubscriber> = new Map();
  private messageTypeIndex: Map<string, Set<string>> = new Map(); // messageType -> subscriber IDs
  private stepIndex: Map<number, Set<string>> = new Map(); // stepIndex -> subscriber IDs

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

    // Index by step if specified
    if (subscriber.stepIndex !== undefined) {
      if (!this.stepIndex.has(subscriber.stepIndex)) {
        this.stepIndex.set(subscriber.stepIndex, new Set());
      }
      this.stepIndex.get(subscriber.stepIndex)!.add(subscriber.id);
    }

    console.log(`[MetadataMessageRouter] Subscriber ${subscriber.id} registered for types: ${subscriber.messageTypes.join(', ')}${subscriber.stepIndex !== undefined ? ` (step ${subscriber.stepIndex})` : ''}`);

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

    // Remove from step index
    if (subscriber.stepIndex !== undefined) {
      const stepSubscribers = this.stepIndex.get(subscriber.stepIndex);
      if (stepSubscribers) {
        stepSubscribers.delete(subscriberId);
        if (stepSubscribers.size === 0) {
          this.stepIndex.delete(subscriber.stepIndex);
        }
      }
    }

    // Remove subscriber
    this.subscribers.delete(subscriberId);
    console.log(`[MetadataMessageRouter] Subscriber ${subscriberId} unregistered`);
  }

  /**
   * Route a metadata message to interested subscribers
   */
  routeMessage(message: MetadataMessage): void {
    const { messageType, stepIndex } = message;
    
    // Find subscribers interested in this message type
    const interestedSubscribers = this.messageTypeIndex.get(messageType);
    if (!interestedSubscribers || interestedSubscribers.size === 0) {
      console.log(`[MetadataMessageRouter] No subscribers for messageType: ${messageType}`);
      return;
    }

    // Filter by step index if applicable
    const stepSubscribers = this.stepIndex.get(stepIndex);
    
    interestedSubscribers.forEach(subscriberId => {
      const subscriber = this.subscribers.get(subscriberId);
      if (!subscriber) return;

      // Check if subscriber is interested in this step (if they specified a step filter)
      const isStepMatch = subscriber.stepIndex === undefined || 
                         subscriber.stepIndex === stepIndex ||
                         (stepSubscribers && stepSubscribers.has(subscriberId));

      if (isStepMatch) {
        try {
          subscriber.callback(message);
          console.log(`[MetadataMessageRouter] Routed ${messageType} message to subscriber ${subscriberId}`);
        } catch (error) {
          console.error(`[MetadataMessageRouter] Error in subscriber ${subscriberId} callback:`, error);
        }
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
    this.stepIndex.clear();
    console.log(`[MetadataMessageRouter] All subscriptions cleared`);
  }
} 
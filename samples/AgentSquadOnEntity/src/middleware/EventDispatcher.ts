export type EventCallback<T = any> = (data: T) => void;

export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * EventDispatcher provides a clean event emission and subscription system
 * with type safety and automatic cleanup
 */
export class EventDispatcher<T extends Record<string, any>> {
  private listeners: Map<keyof T, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on<K extends keyof T>(event: K, callback: EventCallback<T[K]>): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(callback);

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Subscribe to an event (alias for on)
   */
  subscribe<K extends keyof T>(event: K, callback: EventCallback<T[K]>): EventSubscription {
    return this.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof T>(event: K, callback: EventCallback<T[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners && eventListeners.size > 0) {
      // Convert to array to avoid issues if listeners modify the set during iteration
      const listenersArray = Array.from(eventListeners);
      
      for (const callback of listenersArray) {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventDispatcher] Error in event listener for '${String(event)}':`, error);
        }
      }
    }
  }

  /**
   * Subscribe to an event only once
   */
  once<K extends keyof T>(event: K, callback: EventCallback<T[K]>): EventSubscription {
    const subscription = this.on(event, (data) => {
      subscription.unsubscribe();
      callback(data);
    });
    
    return subscription;
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount<K extends keyof T>(event: K): number {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): (keyof T)[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if there are any listeners for an event
   */
  hasListeners<K extends keyof T>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Get statistics about the event dispatcher
   */
  getStats(): {
    totalEvents: number;
    totalListeners: number;
    eventStats: Record<string, number>;
  } {
    const eventStats: Record<string, number> = {};
    let totalListeners = 0;

    for (const [event, listeners] of this.listeners.entries()) {
      const count = listeners.size;
      eventStats[String(event)] = count;
      totalListeners += count;
    }

    return {
      totalEvents: this.listeners.size,
      totalListeners,
      eventStats
    };
  }
} 
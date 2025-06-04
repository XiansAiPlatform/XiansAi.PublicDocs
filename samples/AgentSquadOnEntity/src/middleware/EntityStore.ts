import { 
  BaseEntity, 
  EntityAction, 
  EntitySubscription, 
  EntityQueryOptions, 
  EntityStoreState 
} from '../types';

export class EntityStore {
  private static instance: EntityStore | null = null;
  
  private state: EntityStoreState = {
    entities: new Map(),
    entityTypes: new Map(),
    subscriptions: new Map(),
    loading: false,
    error: null
  };

  // Add categories support for organized entity storage
  private categories: Map<string, Map<string, BaseEntity>> = new Map();

  private listeners: Array<(state: EntityStoreState) => void> = [];

  private constructor() {
    console.log('[EntityStore] Instance created');
  }

  public static getInstance(): EntityStore {
    if (EntityStore.instance === null) {
      EntityStore.instance = new EntityStore();
    }
    return EntityStore.instance;
  }

  // State management
  public getState(): EntityStoreState {
    return { ...this.state };
  }

  public subscribe(callback: (state: EntityStoreState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('[EntityStore] Error in listener:', error);
      }
    });
  }

  // Entity operations
  public addEntity<T extends BaseEntity>(entity: T): void {
    const now = new Date();
    const entityWithTimestamp = {
      ...entity,
      updatedAt: now,
      createdAt: entity.createdAt || now,
      version: (entity.version || 0) + 1
    };

    this.state.entities.set(entity.id, entityWithTimestamp);
    this.updateEntityTypeState(entity.type, 'ADD', entityWithTimestamp);
    
    const action: EntityAction<T> = {
      type: 'ADD',
      payload: { entity: entityWithTimestamp },
      timestamp: now
    };

    this.notifySubscriptions([entityWithTimestamp], action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Added entity: ${entity.id} (type: ${entity.type})`);
  }

  public updateEntity<T extends BaseEntity>(entityId: string, updates: Partial<T>): void {
    const existingEntity = this.state.entities.get(entityId);
    if (!existingEntity) {
      console.warn(`[EntityStore] Cannot update non-existent entity: ${entityId}`);
      return;
    }

    const now = new Date();
    const updatedEntity = {
      ...existingEntity,
      ...updates,
      id: entityId, // Ensure ID cannot be changed
      updatedAt: now,
      version: (existingEntity.version || 0) + 1
    } as T;

    this.state.entities.set(entityId, updatedEntity);
    this.updateEntityTypeState(existingEntity.type, 'UPDATE', updatedEntity);

    const action: EntityAction<T> = {
      type: 'UPDATE',
      payload: { entity: updatedEntity },
      timestamp: now
    };

    this.notifySubscriptions([updatedEntity], action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Updated entity: ${entityId} (type: ${existingEntity.type})`);
  }

  public deleteEntity(entityId: string): void {
    const entity = this.state.entities.get(entityId);
    if (!entity) {
      console.warn(`[EntityStore] Cannot delete non-existent entity: ${entityId}`);
      return;
    }

    this.state.entities.delete(entityId);
    this.updateEntityTypeState(entity.type, 'DELETE', entity, entityId);

    const action: EntityAction = {
      type: 'DELETE',
      payload: { entityId },
      timestamp: new Date()
    };

    this.notifySubscriptions([entity], action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Deleted entity: ${entityId} (type: ${entity.type})`);
  }

  public getEntity<T extends BaseEntity>(entityId: string): T | undefined {
    return this.state.entities.get(entityId) as T;
  }

  public getEntities<T extends BaseEntity>(options: EntityQueryOptions = {}): T[] {
    let entities = Array.from(this.state.entities.values());

    // Filter by type
    if (options.type) {
      entities = entities.filter(entity => entity.type === options.type);
    }

    // Filter by IDs
    if (options.ids && options.ids.length > 0) {
      entities = entities.filter(entity => options.ids!.includes(entity.id));
    }

    // Apply custom filter
    if (options.filter) {
      entities = entities.filter(options.filter);
    }

    // Sort entities
    if (options.sortBy) {
      const sortKey = options.sortBy;
      const sortOrder = options.sortOrder || 'asc';
      
      entities.sort((a, b) => {
        let aValue, bValue;
        
        if (typeof sortKey === 'function') {
          aValue = sortKey(a);
          bValue = sortKey(b);
        } else {
          aValue = a[sortKey];
          bValue = b[sortKey];
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      entities = entities.slice(start, end);
    }

    return entities as T[];
  }

  public getEntitiesByType<T extends BaseEntity>(type: string): T[] {
    return this.getEntities<T>({ type });
  }

  // Batch operations
  public addEntities<T extends BaseEntity>(entities: T[]): void {
    const now = new Date();
    const entitiesWithTimestamp = entities.map(entity => ({
      ...entity,
      updatedAt: now,
      createdAt: entity.createdAt || now,
      version: (entity.version || 0) + 1
    }));

    entitiesWithTimestamp.forEach(entity => {
      this.state.entities.set(entity.id, entity);
      this.updateEntityTypeState(entity.type, 'ADD', entity);
    });

    const action: EntityAction<T> = {
      type: 'ADD',
      payload: { entities: entitiesWithTimestamp },
      timestamp: now
    };

    this.notifySubscriptions(entitiesWithTimestamp, action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Added ${entities.length} entities`);
  }

  public clearEntities(type?: string): void {
    if (type) {
      const entitiesToRemove = Array.from(this.state.entities.values())
        .filter(entity => entity.type === type);
      
      entitiesToRemove.forEach(entity => {
        this.state.entities.delete(entity.id);
      });
      
      this.state.entityTypes.delete(type);
      
      console.log(`[EntityStore] Cleared ${entitiesToRemove.length} entities of type: ${type}`);
    } else {
      this.state.entities.clear();
      this.state.entityTypes.clear();
      
      console.log(`[EntityStore] Cleared all entities`);
    }

    const action: EntityAction = {
      type: 'CLEAR',
      payload: type ? { entityId: type } : undefined,
      timestamp: new Date()
    };

    this.notifySubscriptions([], action);
    this.notifyListeners();
  }

  // Entity subscriptions
  public subscribeToEntities(subscription: EntitySubscription): () => void {
    this.state.subscriptions.set(subscription.id, subscription);
    
    console.log(`[EntityStore] Added subscription: ${subscription.id}`);
    
    return () => {
      this.state.subscriptions.delete(subscription.id);
      console.log(`[EntityStore] Removed subscription: ${subscription.id}`);
    };
  }

  private notifySubscriptions(entities: BaseEntity[], action: EntityAction): void {
    this.state.subscriptions.forEach(subscription => {
      try {
        const relevantEntities = entities.filter(entity => {
          // Check if entity type matches
          if (subscription.entityTypes && !subscription.entityTypes.includes(entity.type)) {
            return false;
          }
          
          // Check if entity ID matches
          if (subscription.entityIds && !subscription.entityIds.includes(entity.id)) {
            return false;
          }
          
          return true;
        });

        if (relevantEntities.length > 0 || action.type === 'CLEAR') {
          subscription.callback(relevantEntities, action);
        }
      } catch (error) {
        console.error(`[EntityStore] Error in subscription ${subscription.id}:`, error);
      }
    });
  }

  // Helper methods for entity type state management
  private updateEntityTypeState<T extends BaseEntity>(
    type: string, 
    actionType: EntityAction['type'], 
    entity?: T, 
    entityId?: string
  ): void {
    let typeState = this.state.entityTypes.get(type);
    
    if (!typeState) {
      typeState = {
        entities: new Map(),
        loading: false,
        error: null,
        lastUpdated: null
      };
      this.state.entityTypes.set(type, typeState);
    }

    switch (actionType) {
      case 'ADD':
      case 'UPDATE':
        if (entity) {
          typeState.entities.set(entity.id, entity);
        }
        break;
      case 'DELETE':
        if (entityId) {
          typeState.entities.delete(entityId);
        }
        break;
      case 'CLEAR':
        typeState.entities.clear();
        break;
    }

    typeState.lastUpdated = new Date();
  }

  // Loading and error state management
  public setLoading(loading: boolean): void {
    this.state.loading = loading;
    this.notifyListeners();
  }

  public setError(error: string | null): void {
    this.state.error = error;
    this.notifyListeners();
  }

  // Statistics and debugging
  public getStats() {
    const entityTypeCounts = new Map<string, number>();
    
    this.state.entities.forEach(entity => {
      const currentCount = entityTypeCounts.get(entity.type) || 0;
      entityTypeCounts.set(entity.type, currentCount + 1);
    });

    return {
      totalEntities: this.state.entities.size,
      entityTypes: Array.from(entityTypeCounts.entries()).map(([type, count]) => ({
        type,
        count
      })),
      subscriptions: this.state.subscriptions.size,
      listeners: this.listeners.length,
      loading: this.state.loading,
      error: this.state.error
    };
  }

  // Integration with system messages - enhanced to support categories
  public handleSystemMessage(message: any): void {
    try {
      if (message.type === 'ENTITY_UPDATE' && message.payload) {
        const { action, entity, entityId, entities, category, key } = message.payload;
        
        switch (action) {
          case 'ADD':
            if (category && key && entity) {
              this.addEntityToCategory(category, key, entity);
            } else if (entity) {
              this.addEntity(entity);
            } else if (entities) {
              this.addEntities(entities);
            }
            break;
          case 'UPDATE':
            if (category && key && entity) {
              this.updateEntityInCategory(category, key, entity);
            } else if (entity && entityId) {
              this.updateEntity(entityId, entity);
            }
            break;
          case 'DELETE':
            if (category && key) {
              this.deleteEntityFromCategory(category, key);
            } else if (entityId) {
              this.deleteEntity(entityId);
            }
            break;
          case 'CLEAR':
            if (category) {
              this.clearCategory(category);
            } else {
              this.clearEntities(entity?.type);
            }
            break;
        }
      }
    } catch (error) {
      console.error('[EntityStore] Error handling system message:', error);
      this.setError(`Failed to handle system message: ${error}`);
    }
  }

  // Category operations
  public addEntityToCategory<T extends BaseEntity>(category: string, key: string, entity: T): void {
    const now = new Date();
    const entityWithTimestamp = {
      ...entity,
      updatedAt: now,
      createdAt: entity.createdAt || now,
      version: (entity.version || 0) + 1
    };

    // Ensure category exists
    if (!this.categories.has(category)) {
      this.categories.set(category, new Map());
    }

    const categoryMap = this.categories.get(category)!;
    categoryMap.set(key, entityWithTimestamp);

    // Also add to main entities store for backwards compatibility
    this.state.entities.set(entity.id, entityWithTimestamp);
    this.updateEntityTypeState(entity.type, 'ADD', entityWithTimestamp);
    
    const action: EntityAction<T> = {
      type: 'ADD',
      payload: { entity: entityWithTimestamp },
      timestamp: now
    };

    this.notifySubscriptions([entityWithTimestamp], action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Added entity to category ${category} with key ${key}: ${entity.id} (type: ${entity.type})`);
  }

  public getEntityFromCategory<T extends BaseEntity>(category: string, key: string): T | undefined {
    const categoryMap = this.categories.get(category);
    if (!categoryMap) return undefined;
    return categoryMap.get(key) as T;
  }

  public updateEntityInCategory<T extends BaseEntity>(category: string, key: string, updates: Partial<T>): void {
    const categoryMap = this.categories.get(category);
    if (!categoryMap) {
      console.warn(`[EntityStore] Cannot update entity in non-existent category: ${category}`);
      return;
    }

    const existingEntity = categoryMap.get(key);
    if (!existingEntity) {
      console.warn(`[EntityStore] Cannot update non-existent entity in category ${category} with key ${key}`);
      return;
    }

    const now = new Date();
    const updatedEntity = {
      ...existingEntity,
      ...updates,
      id: existingEntity.id, // Ensure ID cannot be changed
      updatedAt: now,
      version: (existingEntity.version || 0) + 1
    } as T;

    categoryMap.set(key, updatedEntity);
    
    // Also update in main entities store
    this.state.entities.set(existingEntity.id, updatedEntity);
    this.updateEntityTypeState(existingEntity.type, 'UPDATE', updatedEntity);

    const action: EntityAction<T> = {
      type: 'UPDATE',
      payload: { entity: updatedEntity },
      timestamp: now
    };

    this.notifySubscriptions([updatedEntity], action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Updated entity in category ${category} with key ${key}: ${existingEntity.id} (type: ${existingEntity.type})`);
  }

  public deleteEntityFromCategory(category: string, key: string): void {
    const categoryMap = this.categories.get(category);
    if (!categoryMap) {
      console.warn(`[EntityStore] Cannot delete entity from non-existent category: ${category}`);
      return;
    }

    const entity = categoryMap.get(key);
    if (!entity) {
      console.warn(`[EntityStore] Cannot delete non-existent entity in category ${category} with key ${key}`);
      return;
    }

    categoryMap.delete(key);
    
    // Also remove from main entities store
    this.state.entities.delete(entity.id);
    this.updateEntityTypeState(entity.type, 'DELETE', entity, entity.id);

    const action: EntityAction = {
      type: 'DELETE',
      payload: { entityId: entity.id },
      timestamp: new Date()
    };

    this.notifySubscriptions([entity], action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Deleted entity from category ${category} with key ${key}: ${entity.id} (type: ${entity.type})`);
  }

  public getEntitiesFromCategory<T extends BaseEntity>(category: string): Map<string, T> {
    const categoryMap = this.categories.get(category);
    if (!categoryMap) return new Map();
    return new Map(categoryMap) as Map<string, T>;
  }

  public clearCategory(category: string): void {
    const categoryMap = this.categories.get(category);
    if (!categoryMap) return;

    const entities = Array.from(categoryMap.values());
    
    // Remove from main entities store
    entities.forEach(entity => {
      this.state.entities.delete(entity.id);
      this.updateEntityTypeState(entity.type, 'DELETE', entity, entity.id);
    });

    categoryMap.clear();

    const action: EntityAction = {
      type: 'CLEAR',
      payload: { entityId: category },
      timestamp: new Date()
    };

    this.notifySubscriptions(entities, action);
    this.notifyListeners();
    
    console.log(`[EntityStore] Cleared category ${category}: ${entities.length} entities removed`);
  }
} 
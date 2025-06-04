import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  BaseEntity, 
  EntityAction, 
  EntitySubscription, 
  EntityQueryOptions, 
  EntityStoreState 
} from '../types';
import { EntityStore } from '../middleware/EntityStore';

interface EntityContextType {
  // State
  entities: Map<string, BaseEntity>;
  loading: boolean;
  error: string | null;
  
  // Entity operations
  addEntity: <T extends BaseEntity>(entity: T) => void;
  updateEntity: <T extends BaseEntity>(entityId: string, updates: Partial<T>) => void;
  deleteEntity: (entityId: string) => void;
  getEntity: <T extends BaseEntity>(entityId: string) => T | undefined;
  getEntities: <T extends BaseEntity>(options?: EntityQueryOptions) => T[];
  getEntitiesByType: <T extends BaseEntity>(type: string) => T[];
  
  // Batch operations
  addEntities: <T extends BaseEntity>(entities: T[]) => void;
  clearEntities: (type?: string) => void;
  
  // Subscription management
  subscribeToEntities: (subscription: Omit<EntitySubscription, 'id'>) => () => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Statistics
  getStats: () => any;
}

const EntityContext = createContext<EntityContextType | null>(null);

export const useEntities = () => {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntities must be used within EntityProvider');
  }
  return context;
};

interface Props {
  children: React.ReactNode;
}

export const EntityProvider: React.FC<Props> = ({ children }) => {
  const entityStore = useRef(EntityStore.getInstance());
  const [state, setState] = useState<EntityStoreState>(() => entityStore.current.getState());

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = entityStore.current.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Entity operations
  const addEntity = useCallback(<T extends BaseEntity>(entity: T) => {
    entityStore.current.addEntity(entity);
  }, []);

  const updateEntity = useCallback(<T extends BaseEntity>(entityId: string, updates: Partial<T>) => {
    entityStore.current.updateEntity(entityId, updates);
  }, []);

  const deleteEntity = useCallback((entityId: string) => {
    entityStore.current.deleteEntity(entityId);
  }, []);

  const getEntity = useCallback(<T extends BaseEntity>(entityId: string): T | undefined => {
    return entityStore.current.getEntity<T>(entityId);
  }, []);

  const getEntities = useCallback(<T extends BaseEntity>(options: EntityQueryOptions = {}): T[] => {
    return entityStore.current.getEntities<T>(options);
  }, []);

  const getEntitiesByType = useCallback(<T extends BaseEntity>(type: string): T[] => {
    return entityStore.current.getEntitiesByType<T>(type);
  }, []);

  // Batch operations
  const addEntities = useCallback(<T extends BaseEntity>(entities: T[]) => {
    entityStore.current.addEntities(entities);
  }, []);

  const clearEntities = useCallback((type?: string) => {
    entityStore.current.clearEntities(type);
  }, []);

  // Subscription management
  const subscribeToEntities = useCallback((subscription: Omit<EntitySubscription, 'id'>): () => void => {
    const subscriptionWithId: EntitySubscription = {
      ...subscription,
      id: crypto.randomUUID()
    };
    
    return entityStore.current.subscribeToEntities(subscriptionWithId);
  }, []);

  // State management
  const setLoading = useCallback((loading: boolean) => {
    entityStore.current.setLoading(loading);
  }, []);

  const setError = useCallback((error: string | null) => {
    entityStore.current.setError(error);
  }, []);

  // Statistics
  const getStats = useCallback(() => {
    return entityStore.current.getStats();
  }, []);

  const value: EntityContextType = {
    entities: state.entities,
    loading: state.loading,
    error: state.error,
    addEntity,
    updateEntity,
    deleteEntity,
    getEntity,
    getEntities,
    getEntitiesByType,
    addEntities,
    clearEntities,
    subscribeToEntities,
    setLoading,
    setError,
    getStats
  };

  return (
    <EntityContext.Provider value={value}>
      {children}
    </EntityContext.Provider>
  );
};

// Specialized hooks for specific entity types
export const useEntitySubscription = <T extends BaseEntity>(
  entityTypes?: string[],
  entityIds?: string[],
  onUpdate?: (entities: T[], action: EntityAction) => void
) => {
  const { subscribeToEntities } = useEntities();
  const callbackRef = useRef(onUpdate);
  
  // Update callback ref when onUpdate changes
  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!callbackRef.current) return;

    const unsubscribe = subscribeToEntities({
      entityTypes,
      entityIds,
      callback: (entities, action) => {
        if (callbackRef.current) {
          callbackRef.current(entities as T[], action);
        }
      }
    });

    return unsubscribe;
  }, [subscribeToEntities, entityTypes, entityIds]);
};

export const useEntity = <T extends BaseEntity>(entityId: string) => {
  const { getEntity } = useEntities();
  const [entity, setEntity] = useState<T | undefined>(() => getEntity<T>(entityId));

  useEntitySubscription<T>(
    undefined,
    [entityId],
    (entities, action) => {
      if (action.type === 'DELETE' && action.payload?.entityId === entityId) {
        setEntity(undefined);
      } else if (entities.length > 0) {
        setEntity(entities[0]);
      }
    }
  );

  return entity;
};

export const useEntitiesByType = <T extends BaseEntity>(type: string) => {
  const { getEntitiesByType } = useEntities();
  const [entities, setEntities] = useState<T[]>(() => getEntitiesByType<T>(type));

  useEntitySubscription<T>(
    [type],
    undefined,
    () => {
      // Refresh entities when any entity of this type changes
      setEntities(getEntitiesByType<T>(type));
    }
  );

  return entities;
};

export const useEntitiesQuery = <T extends BaseEntity>(options: EntityQueryOptions) => {
  const { getEntities } = useEntities();
  const [entities, setEntities] = useState<T[]>(() => getEntities<T>(options));

  useEntitySubscription<T>(
    options.type ? [options.type] : undefined,
    options.ids,
    () => {
      // Refresh entities when relevant entities change
      setEntities(getEntities<T>(options));
    }
  );

  return entities;
}; 
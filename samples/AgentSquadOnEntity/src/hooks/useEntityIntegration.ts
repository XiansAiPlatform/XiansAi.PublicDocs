import { useCallback, useEffect, useRef } from 'react';
import { useEntities, useEntitySubscription } from '../context/EntityContext';
import { useSteps } from '../context/StepsContext';
import { BaseEntity, EntityAction } from '../types';
import { 
  DocumentEntity, 
  PersonEntity, 
  TaskEntity, 
  FindingEntity,
  AuditResultEntity,
  createDocumentEntity,
  createPersonEntity,
  createTaskEntity,
  createFindingEntity,
  createAuditResultEntity
} from '../types/entities';

/**
 * Hook for integrating entity management into existing workflow components
 * Provides common patterns and utilities for entity operations
 */
export const useEntityIntegration = () => {
  const { addEntity, updateEntity, deleteEntity, getEntitiesByType } = useEntities();
  const { activeStep } = useSteps();

  // Helper functions for creating entities related to the current step
  const createStepDocument = useCallback((data: Omit<DocumentEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const document = createDocumentEntity({
      ...data,
      metadata: {
        ...data.metadata,
        stepIndex: activeStep
      }
    });
    addEntity(document);
    return document;
  }, [addEntity, activeStep]);

  const createStepPerson = useCallback((data: Omit<PersonEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const person = createPersonEntity({
      ...data,
      metadata: {
        ...data.metadata,
        stepIndex: activeStep
      }
    });
    addEntity(person);
    return person;
  }, [addEntity, activeStep]);

  const createStepTask = useCallback((data: Omit<TaskEntity, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'stepIndex'>) => {
    const task = createTaskEntity({
      ...data,
      stepIndex: activeStep
    });
    addEntity(task);
    return task;
  }, [addEntity, activeStep]);

  const createStepFinding = useCallback((data: Omit<FindingEntity, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'stepIndex' | 'discoveredAt'>) => {
    const finding = createFindingEntity({
      ...data,
      stepIndex: activeStep,
      discoveredAt: new Date()
    });
    addEntity(finding);
    return finding;
  }, [addEntity, activeStep]);

  const createStepAuditResult = useCallback((data: Omit<AuditResultEntity, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'stepIndex'>) => {
    const auditResult = createAuditResultEntity({
      ...data,
      stepIndex: activeStep
    });
    addEntity(auditResult);
    return auditResult;
  }, [addEntity, activeStep]);

  // Get entities for the current step
  const getCurrentStepEntities = useCallback(<T extends BaseEntity>(entityType: string): T[] => {
    return getEntitiesByType<T>(entityType).filter(entity => 
      entity.metadata?.stepIndex === activeStep || 
      (entity as any).stepIndex === activeStep
    );
  }, [getEntitiesByType, activeStep]);

  // Batch operations for common workflows
  const createWorkflowEntities = useCallback((entities: {
    documents?: Omit<DocumentEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>[];
    persons?: Omit<PersonEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>[];
    tasks?: Omit<TaskEntity, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'stepIndex'>[];
    findings?: Omit<FindingEntity, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'stepIndex' | 'discoveredAt'>[];
    auditResults?: Omit<AuditResultEntity, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'stepIndex'>[];
  }) => {
    const results: {
      documents: DocumentEntity[];
      persons: PersonEntity[];
      tasks: TaskEntity[];
      findings: FindingEntity[];
      auditResults: AuditResultEntity[];
    } = {
      documents: [],
      persons: [],
      tasks: [],
      findings: [],
      auditResults: []
    };

    entities.documents?.forEach(data => {
      results.documents.push(createStepDocument(data));
    });

    entities.persons?.forEach(data => {
      results.persons.push(createStepPerson(data));
    });

    entities.tasks?.forEach(data => {
      results.tasks.push(createStepTask(data));
    });

    entities.findings?.forEach(data => {
      results.findings.push(createStepFinding(data));
    });

    entities.auditResults?.forEach(data => {
      results.auditResults.push(createStepAuditResult(data));
    });

    return results;
  }, [createStepDocument, createStepPerson, createStepTask, createStepFinding, createStepAuditResult]);

  return {
    // Entity creation helpers
    createStepDocument,
    createStepPerson,
    createStepTask,
    createStepFinding,
    createStepAuditResult,
    createWorkflowEntities,

    // Entity queries
    getCurrentStepEntities,

    // Direct access to core functions
    addEntity,
    updateEntity,
    deleteEntity,
    getEntitiesByType,

    // Current step context
    activeStep
  };
};

/**
 * Hook for tracking entity changes and displaying notifications
 */
export const useEntityNotifications = (
  entityTypes?: string[],
  onNotification?: (message: string, entities: BaseEntity[], action: EntityAction) => void
) => {
  const notificationTimeoutRef = useRef<number>();

  useEntitySubscription(
    entityTypes,
    undefined,
    (entities, action) => {
      if (entities.length === 0 && action.type !== 'CLEAR') return;

      const entityTypesList = [...new Set(entities.map(e => e.type))].join(', ');
      let message = '';

      switch (action.type) {
        case 'ADD':
          message = `Added ${entities.length} ${entityTypesList} entit${entities.length === 1 ? 'y' : 'ies'}`;
          break;
        case 'UPDATE':
          message = `Updated ${entities.length} ${entityTypesList} entit${entities.length === 1 ? 'y' : 'ies'}`;
          break;
        case 'DELETE':
          message = `Deleted ${entityTypesList} entity`;
          break;
        case 'CLEAR':
          message = `Cleared all entities${entityTypes ? ` of type: ${entityTypes.join(', ')}` : ''}`;
          break;
        default:
          message = `${action.type} operation on ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}`;
      }

      if (onNotification) {
        onNotification(message, entities, action);
      } else {
        console.log(`[Entity Notification] ${message}`, entities);
      }
    }
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);
};

/**
 * Hook for form integration with entity management
 * Provides common patterns for forms that create/update entities
 */
export const useEntityForm = <T extends BaseEntity>(
  entityType: string,
  entityId?: string,
  onSave?: (entity: T) => void,
  onError?: (error: string) => void
) => {
  const { addEntity, updateEntity, getEntity } = useEntities();
  const existingEntity = entityId ? getEntity<T>(entityId) : undefined;

  const saveEntity = useCallback(async (entityData: Partial<T>) => {
    try {
      if (entityId && existingEntity) {
        // Update existing entity
        updateEntity(entityId, {
          ...entityData,
          updatedAt: new Date()
        });
        const updatedEntity = { ...existingEntity, ...entityData } as T;
        onSave?.(updatedEntity);
      } else {
        // Create new entity
        const newEntity = {
          id: crypto.randomUUID(),
          type: entityType,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...entityData
        } as T;
        addEntity(newEntity);
        onSave?.(newEntity);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save entity';
      onError?.(errorMessage);
    }
  }, [entityId, existingEntity, entityType, addEntity, updateEntity, onSave, onError]);

  const resetForm = useCallback(() => {
    // This would typically reset form state
    // Implementation depends on your form library
  }, []);

  return {
    saveEntity,
    resetForm,
    existingEntity,
    isEditing: !!entityId && !!existingEntity
  };
};

/**
 * Hook for real-time entity synchronization with external data sources
 */
export const useEntitySync = <T extends BaseEntity>(
  entityType: string,
  externalDataFetcher?: () => Promise<T[]>,
  syncInterval?: number
) => {
  const { addEntity, updateEntity, getEntitiesByType, clearEntities } = useEntities();
  const syncTimeoutRef = useRef<number>();

  const syncEntities = useCallback(async () => {
    if (!externalDataFetcher) return;

    try {
      const externalEntities = await externalDataFetcher();
      const localEntities = getEntitiesByType<T>(entityType);
      const localEntityMap = new Map(localEntities.map(e => [e.id, e]));

      // Add or update entities from external source
      externalEntities.forEach(externalEntity => {
        const localEntity = localEntityMap.get(externalEntity.id);
        
        if (!localEntity) {
          // Add new entity
          addEntity(externalEntity);
        } else if (localEntity.updatedAt < externalEntity.updatedAt) {
          // Update if external version is newer
          updateEntity(externalEntity.id, externalEntity);
        }
      });

      // Optionally remove entities that no longer exist externally
      // This depends on your sync strategy
      
    } catch (error) {
      console.error(`[Entity Sync] Failed to sync ${entityType} entities:`, error);
    }
  }, [entityType, externalDataFetcher, getEntitiesByType, addEntity, updateEntity]);

  // Set up periodic sync
  useEffect(() => {
    if (syncInterval && syncInterval > 0) {
      const startSync = () => {
        syncEntities();
        syncTimeoutRef.current = setTimeout(startSync, syncInterval);
      };
      
      startSync();
      
      return () => {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
      };
    }
  }, [syncEntities, syncInterval]);

  return {
    syncEntities,
    clearLocalEntities: () => clearEntities(entityType)
  };
}; 
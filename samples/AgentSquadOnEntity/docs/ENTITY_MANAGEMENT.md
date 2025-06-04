# Entity Management System

## Overview

The Entity Management System provides a centralized, real-time state management solution for all entities in your application. It integrates seamlessly with your existing WebSocket infrastructure to provide live updates across all UI components.

## Architecture

### Core Components

1. **EntityStore** (`src/middleware/EntityStore.ts`) - Singleton store that manages all entity state
2. **EntityContext** (`src/context/EntityContext.tsx`) - React context provider with hooks
3. **Entity Types** (`src/types/entities.ts`) - Type definitions for different entity types
4. **WebSocket Integration** - Automatic real-time updates from system messages

### Key Features

- **Centralized State Management**: Single source of truth for all entities
- **Real-time Updates**: Automatic synchronization with backend via WebSocket messages
- **Type Safety**: Full TypeScript support with generic entity types
- **Subscription System**: Components can subscribe to specific entity changes
- **Optimistic Updates**: Immediate UI updates with server synchronization
- **Flexible Querying**: Filter, sort, and paginate entities
- **Batch Operations**: Efficient bulk entity operations

## Entity Types

### Base Entity

All entities extend the `BaseEntity` interface:

```typescript
interface BaseEntity {
  id: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
  metadata?: Record<string, any>;
}
```

### Built-in Entity Types

- **DocumentEntity**: Legal documents (POA, wills, contracts)
- **PersonEntity**: People involved in legal processes
- **TaskEntity**: Workflow tasks and assignments
- **FindingEntity**: Legal findings and recommendations
- **AuditResultEntity**: Document audit results

## Usage

### 1. Setup (Already Done)

The EntityProvider is already integrated into your app in `App.tsx`:

```typescript
<StepsProvider>
  <EntityProvider>
    <WebSocketStepsProvider>
      <MainLayout />
    </WebSocketStepsProvider>
  </EntityProvider>
</StepsProvider>
```

### 2. Basic Operations

```typescript
import { useEntities } from '../context/EntityContext';
import { createDocumentEntity } from '../types/entities';

const MyComponent = () => {
  const { addEntity, updateEntity, deleteEntity, getEntity } = useEntities();

  // Create and add a new document
  const createDocument = () => {
    const doc = createDocumentEntity({
      title: 'Power of Attorney',
      content: 'Document content...',
      documentType: 'power_of_attorney',
      status: 'draft',
      tags: ['legal', 'poa']
    });
    addEntity(doc);
  };

  // Update an existing entity
  const updateDocument = (id: string) => {
    updateEntity(id, { 
      status: 'pending_review',
      updatedAt: new Date()
    });
  };

  // Delete an entity
  const removeDocument = (id: string) => {
    deleteEntity(id);
  };

  return (
    <div>
      <button onClick={createDocument}>Create Document</button>
      {/* Your UI */}
    </div>
  );
};
```

### 3. Reading Entities with Hooks

#### Get All Entities of a Type

```typescript
import { useEntitiesByType } from '../context/EntityContext';
import { DocumentEntity } from '../types/entities';

const DocumentList = () => {
  const documents = useEntitiesByType<DocumentEntity>('document');

  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <p>Status: {doc.status}</p>
        </div>
      ))}
    </div>
  );
};
```

#### Get a Specific Entity

```typescript
import { useEntity } from '../context/EntityContext';
import { DocumentEntity } from '../types/entities';

const DocumentDetail = ({ documentId }: { documentId: string }) => {
  const document = useEntity<DocumentEntity>(documentId);

  if (!document) {
    return <div>Document not found</div>;
  }

  return (
    <div>
      <h1>{document.title}</h1>
      <p>{document.content}</p>
      <p>Last updated: {document.updatedAt.toLocaleString()}</p>
    </div>
  );
};
```

#### Query Entities with Filters

```typescript
import { useEntitiesQuery } from '../context/EntityContext';
import { TaskEntity } from '../types/entities';

const PendingTasks = () => {
  const pendingTasks = useEntitiesQuery<TaskEntity>({
    type: 'task',
    filter: (entity) => (entity as TaskEntity).status === 'pending',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  return (
    <div>
      {pendingTasks.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  );
};
```

### 4. Real-time Subscriptions

```typescript
import { useEntitySubscription } from '../context/EntityContext';
import { DocumentEntity } from '../types/entities';

const DocumentNotifications = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEntitySubscription<DocumentEntity>(
    ['document'], // Subscribe to document changes
    undefined,     // All document IDs
    (entities, action) => {
      const message = `${action.type}: ${entities.length} document(s) updated`;
      setNotifications(prev => [message, ...prev.slice(0, 4)]);
    }
  );

  return (
    <div>
      <h3>Document Updates</h3>
      {notifications.map((msg, index) => (
        <p key={index}>{msg}</p>
      ))}
    </div>
  );
};
```

### 5. Backend Integration

The system automatically handles WebSocket messages with type `ENTITY_UPDATE` or `DATA`. Your backend should send messages in this format:

```json
{
  "type": "ENTITY_UPDATE",
  "stepIndex": 0,
  "payload": {
    "action": "ADD|UPDATE|DELETE|CLEAR",
    "entity": { /* entity data */ },
    "entityId": "entity-id",
    "entities": [ /* array of entities */ ]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Example Backend Messages

**Add Entity:**
```json
{
  "type": "ENTITY_UPDATE",
  "stepIndex": 0,
  "payload": {
    "action": "ADD",
    "entity": {
      "id": "doc-123",
      "type": "document",
      "title": "New POA Document",
      "status": "draft",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Update Entity:**
```json
{
  "type": "ENTITY_UPDATE",
  "stepIndex": 0,
  "payload": {
    "action": "UPDATE",
    "entityId": "doc-123",
    "entity": {
      "status": "approved",
      "updatedAt": "2024-01-01T01:00:00Z"
    }
  }
}
```

**Delete Entity:**
```json
{
  "type": "ENTITY_UPDATE",
  "stepIndex": 0,
  "payload": {
    "action": "DELETE",
    "entityId": "doc-123"
  }
}
```

### 6. Custom Entity Types

Create your own entity types by extending `BaseEntity`:

```typescript
// types/entities.ts
export interface CustomEntity extends BaseEntity {
  type: 'custom';
  customField: string;
  customData: any;
}

export const createCustomEntity = (data: Omit<CustomEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): CustomEntity => ({
  id: crypto.randomUUID(),
  type: 'custom',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
});
```

## Best Practices

### 1. Entity Design
- Keep entities focused and cohesive
- Use meaningful entity types
- Include relevant metadata for filtering
- Consider relationships between entities

### 2. Performance
- Use `useEntitiesByType` for type-specific lists
- Use `useEntity` for individual entity details
- Implement pagination for large entity sets
- Use subscriptions judiciously to avoid unnecessary re-renders

### 3. Error Handling
- Always check for entity existence before operations
- Handle loading and error states in your UI
- Implement optimistic updates with rollback capability

### 4. TypeScript
- Always specify generic types for type safety
- Use the provided helper functions for entity creation
- Extend entity interfaces for custom properties

## Debugging

### Entity Store Statistics

```typescript
const { getStats } = useEntities();
const stats = getStats();

console.log('Entity Statistics:', {
  totalEntities: stats.totalEntities,
  entityTypes: stats.entityTypes,
  subscriptions: stats.subscriptions,
  listeners: stats.listeners
});
```

### WebSocket Integration Statistics

```typescript
const { getStats } = useWebSocketSteps();
const stats = getStats();

console.log('Full System Stats:', stats);
```

## Demo Component

Check out `src/components/EntityDemo.tsx` for a comprehensive example of how to use the entity management system. You can integrate this component into your application to see the system in action.

## Migration Guide

If you have existing state management, here's how to migrate:

1. **Identify Entities**: List all data types that should be entities
2. **Create Entity Types**: Define TypeScript interfaces extending `BaseEntity`
3. **Replace State**: Replace local state with entity hooks
4. **Add Subscriptions**: Set up real-time subscriptions where needed
5. **Update Backend**: Modify your backend to send `ENTITY_UPDATE` messages

## FAQ

**Q: How do I handle entity relationships?**
A: Use `relatedEntityIds` arrays and query related entities using `useEntitiesQuery` with ID filters.

**Q: Can I use this with Redux/Zustand?**
A: Yes, but it's recommended to use the entity system as your primary state management for entities to avoid conflicts.

**Q: How do I handle offline scenarios?**
A: The system maintains local state even when disconnected. Implement a sync mechanism when the connection is restored.

**Q: Can I persist entities to localStorage?**
A: You can extend the EntityStore to add persistence capabilities, but be mindful of data freshness and synchronization.

**Q: How do I handle large datasets?**
A: Use pagination in your queries and implement virtual scrolling for large lists. Consider server-side filtering for very large datasets. 
# Entity Management Integration Examples

This document provides practical examples of how to integrate the entity management system into your existing React components.

## Example 1: Simple Form Integration

Here's how to convert a traditional form component to use entity management:

### Before (Traditional State)

```typescript
// Old way with local state
const DocumentForm = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Make API call
      await api.createDocument({ title, content, status });
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="Document Title" 
      />
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        placeholder="Document Content" 
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="draft">Draft</option>
        <option value="pending_review">Pending Review</option>
      </select>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Document'}
      </button>
    </form>
  );
};
```

### After (Entity Management)

```typescript
import { useEntityIntegration } from '../hooks/useEntityIntegration';
import { DocumentEntity } from '../types/entities';

const DocumentForm = ({ documentId }: { documentId?: string }) => {
  const { createStepDocument, updateEntity, getEntity } = useEntityIntegration();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft' as const,
    documentType: 'power_of_attorney' as const,
    tags: ['legal']
  });

  // Load existing document if editing
  const existingDocument = documentId ? getEntity<DocumentEntity>(documentId) : undefined;
  
  useEffect(() => {
    if (existingDocument) {
      setFormData({
        title: existingDocument.title,
        content: existingDocument.content,
        status: existingDocument.status,
        documentType: existingDocument.documentType,
        tags: existingDocument.tags
      });
    }
  }, [existingDocument]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (documentId && existingDocument) {
      // Update existing document
      updateEntity(documentId, formData);
    } else {
      // Create new document
      createStepDocument(formData);
    }
    
    // Reset form
    setFormData({
      title: '',
      content: '',
      status: 'draft',
      documentType: 'power_of_attorney',
      tags: ['legal']
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.title} 
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
        placeholder="Document Title" 
      />
      <textarea 
        value={formData.content} 
        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))} 
        placeholder="Document Content" 
      />
      <select 
        value={formData.status} 
        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
      >
        <option value="draft">Draft</option>
        <option value="pending_review">Pending Review</option>
      </select>
      <button type="submit">
        {documentId ? 'Update Document' : 'Create Document'}
      </button>
    </form>
  );
};
```

## Example 2: Real-time List Component

### Before (Manual Updates)

```typescript
const DocumentList = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.getDocuments();
        setDocuments(response.data);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
    
    // Set up polling for updates
    const interval = setInterval(fetchDocuments, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        documents.map(doc => (
          <div key={doc.id}>
            <h3>{doc.title}</h3>
            <p>Status: {doc.status}</p>
          </div>
        ))
      )}
    </div>
  );
};
```

### After (Real-time Entity Updates)

```typescript
import { useEntitiesByType, useEntityNotifications } from '../context/EntityContext';
import { DocumentEntity } from '../types/entities';

const DocumentList = () => {
  const documents = useEntitiesByType<DocumentEntity>('document');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Listen for real-time updates
  useEntityNotifications(
    ['document'],
    (message) => {
      setNotifications(prev => [message, ...prev.slice(0, 4)]);
    }
  );

  return (
    <div>
      {/* Show recent notifications */}
      {notifications.length > 0 && (
        <div className="mb-4 p-2 bg-blue-50 rounded">
          <h4 className="font-semibold">Recent Updates:</h4>
          {notifications.map((msg, index) => (
            <p key={index} className="text-sm text-blue-700">{msg}</p>
          ))}
        </div>
      )}

      {/* Document list */}
      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="p-4 border rounded">
            <h3 className="font-semibold">{doc.title}</h3>
            <p className="text-sm text-gray-600">Status: {doc.status}</p>
            <p className="text-xs text-gray-500">
              Updated: {doc.updatedAt.toLocaleString()}
            </p>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-gray-500 text-center py-8">No documents found</p>
        )}
      </div>
    </div>
  );
};
```

## Example 3: Component with Related Entities

```typescript
import { useEntity, useEntitiesQuery } from '../context/EntityContext';
import { DocumentEntity, TaskEntity, PersonEntity } from '../types/entities';

const DocumentDetails = ({ documentId }: { documentId: string }) => {
  const document = useEntity<DocumentEntity>(documentId);
  
  // Get related tasks for this document
  const relatedTasks = useEntitiesQuery<TaskEntity>({
    type: 'task',
    filter: (entity) => {
      const task = entity as TaskEntity;
      return task.relatedEntityIds?.includes(documentId) || false;
    }
  });

  // Get people involved with this document
  const relatedPersons = useEntitiesQuery<PersonEntity>({
    type: 'person',
    filter: (entity) => {
      const person = entity as PersonEntity;
      return person.metadata?.documentIds?.includes(documentId) || false;
    }
  });

  if (!document) {
    return <div>Document not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Document Details */}
      <div>
        <h1 className="text-2xl font-bold">{document.title}</h1>
        <p className="text-gray-600">Status: {document.status}</p>
        <div className="mt-4">
          <p>{document.content}</p>
        </div>
      </div>

      {/* Related Tasks */}
      <div>
        <h2 className="text-lg font-semibold">Related Tasks ({relatedTasks.length})</h2>
        <div className="mt-2 space-y-2">
          {relatedTasks.map(task => (
            <div key={task.id} className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-gray-600">Status: {task.status}</p>
              <p className="text-sm text-gray-600">Priority: {task.priority}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related People */}
      <div>
        <h2 className="text-lg font-semibold">People Involved ({relatedPersons.length})</h2>
        <div className="mt-2 space-y-2">
          {relatedPersons.map(person => (
            <div key={person.id} className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium">{person.firstName} {person.lastName}</h3>
              <p className="text-sm text-gray-600">Role: {person.role}</p>
              <p className="text-sm text-gray-600">Email: {person.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Example 4: Migration from Existing Context

If you have an existing context for managing documents, here's how to migrate:

### Before (Custom Context)

```typescript
// Old DocumentContext
const DocumentContext = createContext<{
  documents: Document[];
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
} | null>(null);

const DocumentProvider = ({ children }: { children: React.ReactNode }) => {
  const [documents, setDocuments] = useState<Document[]>([]);

  const addDocument = (doc: Document) => {
    setDocuments(prev => [...prev, doc]);
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      addDocument,
      updateDocument,
      deleteDocument
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
```

### After (Using Entity Management)

```typescript
// Updated component using entity management
const DocumentManager = () => {
  const { 
    createStepDocument, 
    updateEntity, 
    deleteEntity, 
    getCurrentStepEntities 
  } = useEntityIntegration();

  // Get documents for current step
  const documents = getCurrentStepEntities<DocumentEntity>('document');

  const addDocument = (data: Omit<DocumentEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    createStepDocument(data);
  };

  const updateDocument = (id: string, updates: Partial<DocumentEntity>) => {
    updateEntity(id, updates);
  };

  const removeDocument = (id: string) => {
    deleteEntity(id);
  };

  return (
    <div>
      {/* Your document management UI */}
      {documents.map(doc => (
        <div key={doc.id}>
          <h3>{doc.title}</h3>
          <button onClick={() => updateDocument(doc.id, { status: 'approved' })}>
            Approve
          </button>
          <button onClick={() => removeDocument(doc.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

## Example 5: Backend Integration for Real-time Updates

Here's how your backend should send entity updates:

### WebSocket Message Handler

```typescript
// In your backend WebSocket handler
const sendEntityUpdate = (socket, action, entity, entityId?) => {
  const message = {
    type: 'ENTITY_UPDATE',
    stepIndex: entity?.stepIndex || 0,
    payload: {
      action,
      entity,
      entityId
    },
    timestamp: new Date().toISOString()
  };
  
  socket.send(JSON.stringify(message));
};

// Examples of sending updates
sendEntityUpdate(socket, 'ADD', newDocument);
sendEntityUpdate(socket, 'UPDATE', updatedDocument, documentId);
sendEntityUpdate(socket, 'DELETE', null, documentId);
```

### REST API Integration

```typescript
// Component that syncs with REST API
const DocumentSync = () => {
  const { syncEntities } = useEntitySync<DocumentEntity>(
    'document',
    async () => {
      const response = await fetch('/api/documents');
      return response.json();
    },
    60000 // Sync every minute
  );

  return (
    <div>
      <button onClick={syncEntities}>Manual Sync</button>
      {/* Your UI */}
    </div>
  );
};
```

## Key Benefits of Migration

1. **Real-time Updates**: Automatic synchronization across all components
2. **Reduced Complexity**: No need for manual state synchronization
3. **Type Safety**: Full TypeScript support with entity types
4. **Performance**: Optimized updates and subscriptions
5. **Consistency**: Single source of truth for all entity data
6. **Scalability**: Easy to add new entity types and relationships

## Migration Checklist

- [ ] Identify all data types that should become entities
- [ ] Create entity type definitions extending `BaseEntity`
- [ ] Replace local state with entity hooks
- [ ] Add entity subscriptions for real-time updates
- [ ] Update backend to send `ENTITY_UPDATE` messages
- [ ] Test entity operations (CRUD)
- [ ] Verify real-time updates work correctly
- [ ] Remove old context providers and state management
- [ ] Update documentation for team members

## Best Practices

1. **Start Small**: Migrate one entity type at a time
2. **Test Thoroughly**: Ensure all CRUD operations work
3. **Monitor Performance**: Watch for unnecessary re-renders
4. **Use TypeScript**: Leverage type safety for entity operations
5. **Document Changes**: Update team on new patterns and hooks
6. **Real-time First**: Design components to handle live updates 
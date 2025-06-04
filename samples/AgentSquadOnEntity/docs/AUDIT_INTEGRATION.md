# Audit Integration Guide

## Overview

The audit integration allows your application to automatically request document audits and receive real-time audit results through the WebSocket connection. Audit results are stored in the entity management system and can be displayed across different UI components.

## How It Works

### 1. Audit Flow

1. **Trigger**: When a user enters the document scope step and fills in form data
2. **Request**: The application sends an audit request message via WebSocket
3. **Processing**: The backend processes the document and returns audit results
4. **Storage**: Audit results are automatically saved to the entity store
5. **Display**: UI components can display audit results in real-time

### 2. Integration Components

- **AuditResultEntity**: Entity type for storing audit data
- **DocumentScope Component**: Sends audit requests and handles responses
- **Entity Store**: Manages audit result persistence
- **WebSocket Hub**: Handles metadata message routing
- **AuditResultsDisplay Component**: Reusable UI for displaying results

## Backend Message Format

### Outbound Audit Request

When the document scope form is filled, the application sends:

```json
{
  "action": "audit_document",
  "documentId": "doc-123",
  "documentType": "contract",
  "purpose": "Legal agreement for services",
  "parties": ["Company A", "Company B"],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Inbound Audit Response

Your backend should respond with a metadata message containing `auditResult`:

```json
{
  "metadata": {
    "auditResult": {
      "findings": [
        {
          "type": 0,
          "message": "At least one witness is required",
          "description": "Maximum Witnesses Limit by ensuring that a Power of Attorney document does not exceed the maximum allowed number of witnesses (2)",
          "link": "https://theprep.ai"
        }
      ],
      "errors": [
        {
          "type": 0,
          "message": "At least one witness is required",
          "description": "Maximum Witnesses Limit documentation",
          "link": "https://theprep.ai"
        }
      ],
      "warnings": [],
      "recommendations": [],
      "information": [
        {
          "type": 3,
          "message": "In Norway 70% of the time, at least one representative is also a witness.",
          "description": "Document",
          "link": null
        }
      ],
      "isSuccess": false,
      "hasErrors": true,
      "hasWarnings": false,
      "hasRecommendations": false,
      "hasInformation": true,
      "data": {
        "principal": {
          "userId": "20420d0f-7b24-49e3-bd7d-29bcc74f3828",
          "fullName": "Kari Nordmann",
          "nationalId": "01417012345",
          "address": "Parkveien 1, 0350 Oslo"
        },
        "scope": "Property and financial matters",
        "representatives": [
          {
            "id": "e6d591ec-7a95-43ef-bbde-66eb4e23ad54",
            "fullName": "Nora Hansen",
            "nationalId": "01017012347",
            "relationship": "Backup Fullmektig"
          }
        ],
        "conditions": [],
        "witnesses": []
      }
    }
  }
}
```

## Usage Examples

### 1. Basic Integration in Components

```typescript
import { useEntitiesByType } from '../context/EntityContext';
import { AuditResultEntity } from '../types/entities';

const MyComponent = () => {
  const auditResults = useEntitiesByType<AuditResultEntity>('audit_result');
  
  return (
    <div>
      {auditResults.map(audit => (
        <div key={audit.id}>
          <h3>Audit for Document: {audit.documentId}</h3>
          <p>Status: {audit.isSuccess ? 'Success' : 'Failed'}</p>
          <p>Errors: {audit.errors.length}</p>
          <p>Warnings: {audit.warnings.length}</p>
        </div>
      ))}
    </div>
  );
};
```

### 2. Using the AuditResultsDisplay Component

```typescript
import AuditResultsDisplay from '../components/AuditResultsDisplay';

const DocumentView = ({ documentId }: { documentId: string }) => {
  return (
    <div>
      <h1>Document Details</h1>
      
      {/* Show audit results for specific document */}
      <AuditResultsDisplay 
        documentId={documentId}
        className="mt-4"
        showEmpty={true}
      />
    </div>
  );
};
```

### 3. Step-specific Audit Results

```typescript
import AuditResultsDisplay from '../components/AuditResultsDisplay';
import { useSteps } from '../context/StepsContext';

const StepAuditResults = () => {
  const { activeStep } = useSteps();
  
  return (
    <AuditResultsDisplay 
      stepIndex={activeStep}
      className="audit-results"
    />
  );
};
```

### 4. Manual Audit Request

```typescript
import { useWebSocketSteps } from '../context/WebSocketStepsContext';

const ManualAuditTrigger = ({ documentId }: { documentId: string }) => {
  const { sendMessage, isConnected } = useWebSocketSteps();
  
  const requestAudit = async () => {
    if (!isConnected) return;
    
    const auditMessage = {
      action: 'audit_document',
      documentId,
      documentType: 'contract',
      purpose: 'Manual audit request',
      parties: [],
      timestamp: new Date().toISOString()
    };
    
    await sendMessage(JSON.stringify(auditMessage));
  };
  
  return (
    <button onClick={requestAudit} disabled={!isConnected}>
      Request Audit
    </button>
  );
};
```

## Entity Store Integration

### Creating Audit Results Programmatically

```typescript
import { useEntityIntegration } from '../hooks/useEntityIntegration';
import { createAuditResultEntity } from '../types/entities';

const CreateAuditResult = () => {
  const { addEntity } = useEntityIntegration();
  
  const createSampleAudit = () => {
    const auditResult = createAuditResultEntity({
      documentId: 'doc-123',
      findings: [],
      errors: [{
        type: 0,
        message: 'Sample error',
        description: 'This is a sample error',
        link: null
      }],
      warnings: [],
      recommendations: [],
      information: [],
      isSuccess: false,
      hasErrors: true,
      hasWarnings: false,
      hasRecommendations: false,
      hasInformation: false,
      data: {
        principal: {
          userId: 'user-123',
          fullName: 'John Doe',
          nationalId: '123456789',
          address: '123 Main St'
        },
        scope: 'Test scope',
        representatives: [],
        conditions: [],
        witnesses: []
      }
    });
    
    addEntity(auditResult);
  };
  
  return (
    <button onClick={createSampleAudit}>
      Create Sample Audit
    </button>
  );
};
```

### Querying Audit Results

```typescript
import { useEntitiesQuery } from '../context/EntityContext';
import { AuditResultEntity } from '../types/entities';

const FailedAudits = () => {
  const failedAudits = useEntitiesQuery<AuditResultEntity>({
    type: 'audit_result',
    filter: (entity) => {
      const audit = entity as AuditResultEntity;
      return !audit.isSuccess;
    },
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  
  return (
    <div>
      <h2>Failed Audits ({failedAudits.length})</h2>
      {failedAudits.map(audit => (
        <div key={audit.id}>
          Document: {audit.documentId} - Errors: {audit.errors.length}
        </div>
      ))}
    </div>
  );
};
```

## Real-time Updates

Audit results are automatically updated in real-time when received from the backend. All components using audit result entities will automatically re-render with the latest data.

### Subscribing to Audit Updates

```typescript
import { useEntitySubscription } from '../context/EntityContext';
import { AuditResultEntity } from '../types/entities';

const AuditNotifications = () => {
  const [notifications, setNotifications] = useState<string[]>([]);
  
  useEntitySubscription<AuditResultEntity>(
    ['audit_result'],
    undefined,
    (entities, action) => {
      if (action.type === 'ADD' || action.type === 'UPDATE') {
        const messages = entities.map(audit => 
          `Audit ${action.type.toLowerCase()}: ${audit.documentId} - ${audit.isSuccess ? 'Success' : 'Failed'}`
        );
        setNotifications(prev => [...messages, ...prev.slice(0, 4)]);
      }
    }
  );
  
  return (
    <div>
      <h3>Audit Notifications</h3>
      {notifications.map((msg, index) => (
        <p key={index}>{msg}</p>
      ))}
    </div>
  );
};
```

## Configuration

### Backend Message Types

Make sure your backend sends metadata messages with the following types for audit results:
- `audit_result`
- `document_audit`

### Metadata Subscription

The document scope component automatically subscribes to audit-related metadata. You can customize this by modifying the subscription in the component:

```typescript
const unsubscribe = subscribeToMetadata(
  subscriberId,
  ['audit_result', 'document_audit', 'custom_audit_type'], // Add custom types
  handleAuditResult,
  activeStep
);
```

## Error Handling

### Backend Errors

If the backend returns an error during audit processing, handle it in your audit result:

```json
{
  "metadata": {
    "auditResult": {
      "findings": [],
      "errors": [{
        "type": -1,
        "message": "Audit service temporarily unavailable",
        "description": "Please try again later",
        "link": null
      }],
      "warnings": [],
      "recommendations": [],
      "information": [],
      "isSuccess": false,
      "hasErrors": true,
      "hasWarnings": false,
      "hasRecommendations": false,
      "hasInformation": false,
      "data": {}
    }
  }
}
```

### Connection Issues

The document scope component includes connection status indicators and will only send audit requests when connected.

## Best Practices

1. **Debounce Requests**: Audit requests are automatically debounced to prevent excessive calls
2. **Error Handling**: Always include error states in your audit responses
3. **Real-time First**: Design UI to handle real-time audit updates
4. **Entity Relationships**: Link audit results to document entities using `documentId`
5. **Performance**: Use `useEntitiesByType` for type-specific queries
6. **User Feedback**: Show loading states while waiting for audit results

## Testing

You can test the audit functionality by:

1. Navigate to the "Entity Demo" step to see the entity management system in action
2. Navigate to the "Scope" step and fill in the form to trigger audit requests
3. Use the browser console to monitor WebSocket messages and entity updates
4. Check the entity store statistics to verify audit results are being stored

The system includes comprehensive logging to help debug issues with audit requests and responses. 
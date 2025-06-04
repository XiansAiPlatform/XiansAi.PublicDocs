# WebSocket Architecture Refactor

## Overview

The WebSocket messaging system has been refactored to improve readability, clarity, encapsulation, and proper design. The original monolithic classes have been broken down into focused, modular components with clear separation of concerns.

## Key Improvements

### 1. **Separation of Concerns**
- **ConnectionManager**: Handles SignalR connection lifecycle
- **MessageProcessor**: Processes and transforms messages
- **MetadataMessageRouter**: Routes metadata messages to interested UI components
- **EventDispatcher**: Clean, type-safe event system
- **WebSocketStepsContext**: Direct React state management for messages (simplified from MessageStore)
- **WebSocketHub**: Orchestrates all components (much cleaner)

### 2. **Simplified Message Management**
- Messages are now managed directly in React state using useState and Maps
- Eliminated the complex MessageStore layer for better simplicity
- Direct state updates with proper immutability for React change detection
- Reduced complexity and improved maintainability

### 3. **Metadata Message Distribution**
- Messages are now routed based on `messageType` attribute in `message.metadata`
- UI components can subscribe to specific message types
- Automatic cleanup and type safety
- Support for step-specific subscriptions

### 4. **Improved Type Safety**
- All components use proper TypeScript interfaces
- Event system with generic type constraints
- Clear separation between internal and external types

### 5. **Better Error Handling**
- Isolated error handling in each component
- Proper error propagation and logging
- No silent failures

## Architecture Components

### MetadataMessageRouter
Routes metadata messages to interested subscribers based on messageType.

```typescript
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
```

**Key Features:**
- Subscribe to multiple message types
- Optional step-specific filtering
- Automatic indexing for performance
- Statistics and debugging support

### ConnectionManager
Handles SignalR connection lifecycle separately from message processing.

**Key Features:**
- Connection pooling per step
- Automatic reconnection with exponential backoff
- State management and reporting
- Clean separation from message handling

### MessageProcessor
Processes and transforms messages from SignalR to frontend format.

**Key Features:**
- Direction mapping (backend ↔ frontend)
- Message validation and transformation
- History processing
- Metadata extraction and routing

### EventDispatcher
Type-safe event system with automatic cleanup.

**Key Features:**
- Generic type constraints
- Subscription management
- Error isolation
- Statistics and debugging

### WebSocketStepsContext (Simplified Message Management)
Manages chat and system messages directly in React state, eliminating the need for a separate MessageStore layer.

**Key Features:**
- Direct React state management with useState and Maps
- Immutable updates for proper React change detection
- Built-in helper functions for message operations
- Simplified thread ID management
- Statistics calculated directly from React state

**Example Usage:**
```typescript
// Direct state management in WebSocketStepsContext
const [chatMessages, setChatMessages] = useState<Map<number, ChatMessage[]>>(new Map());
const [systemMessages, setSystemMessages] = useState<Map<number, SystemMessage[]>>(new Map());
const [threadIds, setThreadIds] = useState<Map<number, string>>(new Map());

// Helper functions for message operations
const addChatMessage = useCallback((message: ChatMessage) => {
  setChatMessages(prevMessages => {
    const newMessagesMap = new Map(prevMessages);
    const existingMessages = newMessagesMap.get(message.stepIndex) || [];
    newMessagesMap.set(message.stepIndex, [...existingMessages, message]);
    return newMessagesMap;
  });

  if (message.threadId) {
    setThreadIds(prev => new Map(prev).set(message.stepIndex, message.threadId!));
  }
}, []);
```

### WebSocketHub
Orchestrates all components and handles message distribution.

**Key Features:**
- Message distribution to all components
- Automatic error handling and logging
- Statistics and debugging support

## Usage Examples

### 1. Basic UI Component Subscription

```typescript
import { useMetadataSubscription } from '../hooks/useMetadataSubscription';

function ProgressBar({ stepIndex }: { stepIndex: number }) {
  const { latestMessage } = useMetadataSubscription({
    subscriberId: 'progress-bar',
    messageTypes: ['PROGRESS_UPDATE'],
    stepIndex
  });

  const progress = latestMessage?.data?.percentage || 0;
  
  return <div className="progress-bar" style={{ width: `${progress}%` }} />;
}
```

### 2. Form Update Component

```typescript
import { useFormUpdateMessages } from '../hooks/useMetadataSubscription';

function DynamicForm({ stepIndex }: { stepIndex: number }) {
  const { getLatestMessageByType } = useFormUpdateMessages('dynamic-form', stepIndex);
  
  const fieldUpdate = getLatestMessageByType('FIELD_UPDATE');
  const validationUpdate = getLatestMessageByType('VALIDATION_UPDATE');
  
  // Use the updates to modify form state
  return <form>{/* Form content */}</form>;
}
```

### 3. Notification System

```typescript
import { useNotificationMessages } from '../hooks/useMetadataSubscription';

function NotificationCenter() {
  const { messages } = useNotificationMessages('notification-center');
  
  return (
    <div className="notifications">
      {messages.map(msg => (
        <div key={msg.timestamp.getTime()} className={`alert alert-${msg.data.level}`}>
          {msg.data.message}
        </div>
      ))}
    </div>
  );
}
```

### 4. Custom Subscription with Callback

```typescript
function CustomComponent() {
  useMetadataSubscription({
    subscriberId: 'custom-component',
    messageTypes: ['CUSTOM_UPDATE', 'SPECIAL_EVENT'],
    onMessage: (message) => {
      console.log('Received metadata:', message);
      // Custom handling logic
    }
  });
  
  return <div>Custom Component</div>;
}
```

## Message Types

The system supports various metadata message types. Here are some common examples:

### UI Updates
- `UI_UPDATE`: General UI state changes
- `PROGRESS_UPDATE`: Progress bar updates
- `STATUS_UPDATE`: Status indicator changes

### Form Management
- `FORM_UPDATE`: Form structure changes
- `FIELD_UPDATE`: Individual field updates
- `VALIDATION_UPDATE`: Validation state changes

### Notifications
- `NOTIFICATION`: General notifications
- `ALERT`: Alert messages
- `WARNING`: Warning messages
- `ERROR_NOTIFICATION`: Error notifications

### Workflow Management
- `STATE_CHANGE`: Workflow state changes
- `WORKFLOW_STATUS`: Workflow status updates
- `STEP_COMPLETE`: Step completion events

## Benefits of the New Architecture

### For Developers
1. **Easier to understand**: Each class has a single responsibility
2. **Easier to test**: Components can be tested in isolation
3. **Easier to extend**: New message types and handlers can be added easily
4. **Better debugging**: Clear separation makes issues easier to trace

### For UI Components
1. **Selective subscriptions**: Only receive messages you care about
2. **Type safety**: Full TypeScript support for message structures
3. **Automatic cleanup**: No memory leaks from forgotten subscriptions
4. **Performance**: Efficient message routing and filtering

### For System Performance
1. **Reduced coupling**: Components don't depend on each other's internals
2. **Better memory management**: Automatic cleanup and garbage collection
3. **Optimized updates**: Only interested components are notified
4. **Scalable**: Easy to add new message types and subscribers

## Migration Guide

### From Old System
```typescript
// Old way - manual event listening
useEffect(() => {
  const handleSystemMessage = (event) => {
    if (event.data.type === 'METADATA' && event.data.payload.messageType === 'PROGRESS_UPDATE') {
      // Handle progress update
    }
  };
  
  hub.on('system_message', handleSystemMessage);
  return () => hub.off('system_message', handleSystemMessage);
}, []);
```

### To New System
```typescript
// New way - declarative subscription
const { latestMessage } = useMetadataSubscription({
  subscriberId: 'my-component',
  messageTypes: ['PROGRESS_UPDATE']
});
```

## Debugging and Statistics

### Component Statistics
```typescript
import { useWebSocketSteps } from '../context/WebSocketStepsContext';

function DebugPanel() {
  const { getStats } = useWebSocketSteps();
  const stats = getStats();
  
  return (
    <pre>{JSON.stringify(stats, null, 2)}</pre>
  );
}
```

### Router Statistics
The MetadataMessageRouter provides statistics about active subscriptions:
```typescript
const stats = metadataRouter.getStats();
console.log('Active subscriptions:', stats);
```

## Best Practices

### 1. Unique Subscriber IDs
Always use unique subscriber IDs to avoid conflicts:
```typescript
const subscriberId = `${componentName}-${componentId}`;
```

### 2. Component-Specific Message Types
Create specific message types for your components:
```typescript
// Good
messageTypes: ['USER_PROFILE_UPDATE', 'USER_SETTINGS_CHANGE']

// Avoid
messageTypes: ['UPDATE'] // Too generic
```

### 3. Cleanup
The hooks handle cleanup automatically, but for manual subscriptions:
```typescript
useEffect(() => {
  const unsubscribe = subscribeToMetadata(/* ... */);
  return unsubscribe; // Always return cleanup function
}, []);
```

### 4. Error Handling
Handle errors gracefully in your callbacks:
```typescript
const { latestMessage } = useMetadataSubscription({
  subscriberId: 'my-component',
  messageTypes: ['DATA_UPDATE'],
  onMessage: (message) => {
    try {
      // Process message
    } catch (error) {
      console.error('Error processing metadata message:', error);
    }
  }
});
```

## Conclusion

This refactored architecture provides a much cleaner, more maintainable, and more powerful system for handling WebSocket messages. The separation of concerns makes the code easier to understand and extend, while the metadata routing system provides flexible and type-safe message distribution to UI components. 
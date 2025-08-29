# Proactive Messages

## Sending Messages to User

Use `MessageHub.Agent2User` to send messages to users without a `MessageThread` reference. Useful for offline users or initiating conversations.

## Interface Overview

The `IAgent2User` interface provides methods to send chat and data messages, either from the current workflow or by impersonating another workflow:

### Basic Methods (Current Workflow)

```csharp
// Send chat message from current workflow
public Task SendChat(string participantId, string content, object? data = null, string? requestId = null, string? scope = null);

// Send data message from current workflow
public Task SendData(string participantId, string content, object data, string? requestId = null, string? scope = null);
```

### Impersonation Methods (Type-based)

```csharp
// Send chat message as another workflow type
public Task SendChatAs(Type flowClassType, string participantId, string content, object? data = null, string? requestId = null, string? scope = null);

// Send data message as another workflow type
public Task SendDataAs(Type flowClassType, string participantId, string content, object data, string? requestId = null, string? scope = null);
```

### Impersonation Methods (String-based)

```csharp
// Send chat message using workflow ID or type name
public Task SendChatAs(string workflowIdOrType, string participantId, string content, object? data = null, string? requestId = null, string? scope = null);

// Send data message using workflow ID or type name
public Task SendDataAs(string workflowIdOrType, string participantId, string content, object data, string? requestId = null, string? scope = null);
```

## Usage Examples

```csharp
// From current workflow
await MessageHub.Agent2User.SendChat(userId, "Hello!");
await MessageHub.Agent2User.SendData(userId, "Status update", statusData);

// Impersonate by type
await MessageHub.Agent2User.SendChatAs(typeof(MyFlow), userId, "Hello from MyFlow!");
await MessageHub.Agent2User.SendDataAs(typeof(MyFlow), userId, "Data from MyFlow", payload);

// Impersonate by string
await MessageHub.Agent2User.SendChatAs("MyWorkflowId", userId, "Hello!");
await MessageHub.Agent2User.SendDataAs("MyWorkflowType", userId, "Update", data);
```

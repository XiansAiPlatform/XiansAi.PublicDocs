# Agent Initiated Message

## Sending Messages to Users

Agents can send messages to users using the `_messageThread.SendChat` static method. This method is designed to be used within a workflow context where an agent needs to communicate with a user.

### Method Signatures

```csharp
// For plain text communication
public static async Task<string?> SendChat(
    string content,           // The message content to send
    object? data = null   // Optional metadata to attach to the message
)

// For structured data communication
public static async Task<string?> SendData(
    object data,        // The metadata to send
    string? content = null   // Optional message content to send
)
```

### Usage Example

```csharp
private readonly MessageThread _messageThread;

// Basic message sending
await _messageThread.SendChat("Hello user!");

// Sending a message with metadata
var metadata = new { 
    messageType = "notification",
    priority = "high"
};
await _messageThread.SendData(metadata);
```

### Important Notes

1. The `SendChat` method must be called from within a workflow context where `AgentContext` is properly initialized and the `metadata` parameter is optional, can be used to attach additional context or information to the message.
2. The `SendData` method can be used to send structured information to a conversation, chat thread, or messaging system within an application.
3. Both methods returns a `Task<string?>` which indicates whether the message was sent successfully.

### Message Structure

When a message is sent, it is wrapped in an `ChatOrDataRequest` object with the following properties:

- Text: The actual message content
- ParticipantId: The target user's ID
- Metadata: Any additional data attached to the message
- WorkflowId: Automatically populated from AgentContext
- WorkflowType: Automatically populated from AgentContext
- Agent: Automatically populated from AgentContext

### Return Value

The method returns a `Task<string?>` where the string value is the MessageThread ID if the message was sent successfully. The MessageThread ID can be used to reference this conversation thread in future interactions.

```csharp
var threadId = await _messageThread.SendChat("Hello!");
_logger.LogInformation($"Message sent successfully. Thread ID: {threadId}");
```

## Sending Messages as Another Workflow (Impersonation)

In cases where you want to send a message on behalf of a specific workflow without having a `MessageThread` reference, use the methods in `MessageHub`:

### Method Signatures

```csharp
public static async Task SendChatAs(
    Type flowClassType,   // The flow class to impersonate
    string participantId, // Target user's ID
    string content,       // Message content
    object? data = null,  // Optional structured data
    string? requestId = null,
    string? scope = null
);

public static async Task SendDataAs(
    Type flowClassType,   // The flow class to impersonate
    string participantId, // Target user's ID
    string content,       // Optional message content to accompany data
    object data,          // Structured data payload
    string? requestId = null,
    string? scope = null
);
```

### Usage Example (Impersonation)

```csharp
// Send a chat message as a specific flow
await MessageHub.SendChatAs(typeof(MyFlow), userId, "Hello from MyFlow!");

// Send structured data (with optional content) as a specific flow
var payload = new { action = "notify", level = "info" };
await MessageHub.SendDataAs(typeof(MyFlow), userId, "FYI", payload);
```

### Notes

1. No `MessageThread` reference is required by the sender.
2. The message is sent using the workflow ID and type derived from `flowClassType`.
3. `requestId` and `scope` are optional and can be used for correlation and scoping.
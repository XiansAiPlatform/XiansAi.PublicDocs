# Agent Initiated Message

## Sending Messages to Users

Agents can send messages to users using the `MessageHub.Send` static method. This method is designed to be used within a workflow context where an agent needs to communicate with a user.

### Method Signature

```csharp
public static async Task<string?> Send(
    string content,           // The message content to send
    string participantId,     // The ID of the user/participant to send the message to
    object? metadata = null   // Optional metadata to attach to the message
)
```

### Usage Example

```csharp
// Basic message sending
await MessageHub.Send("Hello user!", "user123");

// Sending a message with metadata
var metadata = new { 
    messageType = "notification",
    priority = "high"
};
await MessageHub.Send("Important update!", "user123", metadata);
```

### Important Notes

1. The `Send` method must be called from within a workflow context where `AgentContext` is properly initialized.
2. The method returns a `Task<string?>` which indicates whether the message was sent successfully.
3. The `participantId` should be a valid identifier for the target user.
4. The `metadata` parameter is optional and can be used to attach additional context or information to the message.

### Message Structure

When a message is sent, it is wrapped in an `OutgoingMessage` object with the following properties:

- Content: The actual message content
- ParticipantId: The target user's ID
- Metadata: Any additional data attached to the message
- WorkflowId: Automatically populated from AgentContext
- WorkflowType: Automatically populated from AgentContext
- Agent: Automatically populated from AgentContext

### Return Value

The method returns a `Task<string?>` where the string value is the MessageThread ID if the message was sent successfully. The MessageThread ID can be used to reference this conversation thread in future interactions.

```csharp
var threadId = await MessageHub.Send("Hello!", "user123");
_logger.LogInformation($"Message sent successfully. Thread ID: {threadId}");
```

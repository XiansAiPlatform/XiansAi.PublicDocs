# Handling Data Messages

Data messages require explicit handling in agent flows, unlike chat messages which are automatically processed by SemanticKernel.

## Chat vs Data Messages

**Chat Messages:**

- Automatically intercepted by SemanticKernel when `await InitConversation()` is called under the `[WorkflowRun]` method
- Routed directly to Semantic Kernel for processing

**Data Messages:**

- NOT routed to Semantic Kernel
- Require explicit listeners and manual processing
- Best practice: Queue messages and process them in the `[WorkflowRun]` method

## Implementation Pattern

### 1. Setup Data Handler Subscription

Subscribe to data messages in your flow constructor:

```csharp
public DocumentDataFlow()
{
    _messageHub.SubscribeDataHandler(
        (MessageThread thread) => {
            _logger.LogInformation($"MessageThread received: {thread.ThreadId}");
            _messageQueue.Enqueue(thread);
        });
}
```

### 2. Queue Messages

Use a concurrent queue to store incoming data messages:

```csharp
private readonly ConcurrentQueue<MessageThread> _messageQueue = new();
```

### 3. Process Messages in WorkflowRun

Handle queued messages in your main workflow loop:

```csharp
[WorkflowRun]
public async Task Run()
{
    while (true)
    {
        var messageThread = await DequeueMessage();
        if (messageThread == null) continue;
        
        var messageType = Message.GetMessageType(messageThread);
        
        if (messageType == nameof(FetchDocument))
        {
            await HandleDocumentRequest(messageThread);
        }
    }
}
```

### 4. Dequeue Messages Deterministically

```csharp
private async Task<MessageThread?> DequeueMessage()
{
    await Workflow.WaitConditionAsync(() => _messageQueue.Count > 0);
    return _messageQueue.TryDequeue(out var thread) ? thread : null;
}
```

## Complete Example

```csharp
[Workflow("Document Data Flow")]
public class DocumentDataFlow : FlowBase
{
    private readonly ConcurrentQueue<MessageThread> _messageQueue = new();
    private static readonly Logger<DocumentDataFlow> _logger = Logger<DocumentDataFlow>.For();

    public DocumentDataFlow()
    {
        _messageHub.SubscribeDataHandler(
            (MessageThread thread) => {
                _logger.LogInformation($"MessageThread received: {thread.ThreadId}");
                _messageQueue.Enqueue(thread);
            });
    }

    [WorkflowRun]
    public async Task Run()
    {
        while (true)
        {
            try
            {
                var messageThread = await DequeueMessage();
                if (messageThread == null) continue;
                
                var messageType = Message.GetMessageType(messageThread);
                
                if (messageType == nameof(FetchDocument))
                {
                    await HandleDocumentRequest(messageThread);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Error processing data message", ex);
            }
        }
    }
    
    private async Task HandleDocumentRequest(MessageThread messageThread)
    {
        var documentRequest = FetchDocument.FromThread(messageThread);
        
        var result = await Workflow.ExecuteActivityAsync(
            (IDocumentDataActivities act) => act.ValidateDocument(documentRequest.DocumentId), 
            _activityOptions);
            
        await messageThread.SendData(new DocumentResponse {
            AuditResult = result,
        });
    }
}
```

## Key Points

- Data messages bypass SemanticKernel and require manual handling
- Always use deterministic queuing with `Workflow.WaitConditionAsync()`
- Process messages within the `[WorkflowRun]` method for proper Temporal workflow execution
- Handle exceptions to prevent workflow failures

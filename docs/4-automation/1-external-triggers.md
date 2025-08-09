# External Communication with Agent Workflows

External parties can communicate with Agent workflows by sending Data messages to trigger specific operations. This enables integration with external systems, APIs, and applications.

## Message Communication

### Message Types and Threads

External systems send [Data messages](https://github.com/XiansAiPlatform/sdk-web-typescript/blob/main/docs/message-types.md){:target="_blank"} to Agent workflows. These messages are part of [message threads](../2-agent-communication/11-thread-and-scope.md){:target="_blank"} that organize conversations and context.

### Communication Protocols

External parties can send messages through:

- **REST API**: HTTP requests for synchronous communication
- **WebSocket**: Real-time bidirectional communication
- **Server-Sent Events (SSE)**: Server-to-client streaming

Detailed API documentation: [User API Reference](https://github.com/XiansAiPlatform/XiansAi.Server/blob/main/XiansAi.Server.Src/docs/user-api/index.md)

## Calling the Agent - HTTP

Both REST and WebSocket clients can send Data messages:

### REST API - Synchronous

```javascript
// REST API call
const response = await fetch('/api/user/rest/converse', {
  method: 'POST',
  params: {
    workflow: 'MyAgent:MyFlow',
    type: 'Data',
    text: 'ProcessDocument',  // Method name
    participantId: 'user@example.com'
  },
  body: JSON.stringify({     // Method arguments
    documentId: 'doc-123',
    options: { validate: true }
  })
});

```

See [REST API](https://github.com/XiansAiPlatform/XiansAi.Server/blob/main/XiansAi.Server.Src/docs/user-api/rest-api.md){:target="_blank"} for more details. There are Synchronous and Asynchronous methods available.

### WebSocket

```javascript
// WebSocket using TypeScript SDK
await connection.invoke("SendInboundMessage", {
  participantId: "user-123", 
  workflow: "customer-support",
  type: "Data",
  text: "ProcessDocument",
  data: {
    documentId: 'doc-123',
    options: { validate: true }
  }
}, "Data");
```

See [WebSocket Client](https://github.com/XiansAiPlatform/XiansAi.Server/blob/main/XiansAi.Server.Src/docs/user-api/websocket-api.md){:target="_blank"} for more details.

## On Agent - RPC Invocation

### Data Message Structure

Workflows receive Data messages using RPC-style method invocation:

- **`text`**: Method name to invoke
- **`data`**: Method arguments (JSON)

### Setup Data Processor

Configure data processing in your workflow:

```csharp
var agent = new Agent("Document Agent");
var flow = agent.AddFlow<DocumentFlow>();

// Option 1: Process in Temporal Activity (default)
flow.SetDataProcessor<DocumentProcessor>();

// Option 2: Process in Temporal Workflow
flow.SetDataProcessor<DocumentProcessor>(processInWorkflow: true);
```

### Processing Location

Use the `processInWorkflow` parameter to control execution:

| Parameter Value | Execution Location | Use Cases | Benefits |
|---|---|---|---|
| **`false` (default)** | Temporal Activity | • Stateless, one-off operations<br>• Simple data processing | • Direct IO operations |
| **`true`** | Temporal Workflow | • Complex orchestration scenarios<br>• When you need Temporal business process capabilities | • Access to workflow features (timers, signals, queries) |

### Data Processor Implementation

```csharp
public class DocumentProcessor
{
    public DocumentProcessor(MessageThread messageThread) { }
    
    // Method invoked by external 'ProcessDocument' calls
    public async Task<DocumentResult> ProcessDocument(DocumentRequest request)
    {
        // Process the document
        return new DocumentResult
        {
            Id = request.DocumentId,
            Status = "processed",
            ValidationResults = await ValidateDocument(request)
        };
    }
    
    // Method invoked by external 'GetStatus' calls
    public DocumentStatus GetStatus(string documentId)
    {
        return _documentService.GetStatus(documentId);
    }
}
```

### Accessing the Flow Instance

When `processInWorkflow: true`, you can receive the active Flow instance via the processor's constructor for workflow state management:

```csharp
public class DocumentProcessor
{
    private readonly MessageThread _messageThread;
    private readonly DocumentFlow _flow;
    
    // In workflow mode: Both MessageThread and Flow instance available
    public DocumentProcessor(MessageThread messageThread, DocumentFlow flow)
    {
        _messageThread = messageThread;
        _flow = flow;
    }
    
    public async Task<DocumentResult> ProcessDocument(DocumentRequest request)
    {
        // Access workflow state through _flow instance
        _flow.DocumentsProcessed++;
        
        return new DocumentResult { /* ... */ };
    }
}
```

**Constructor Parameters by Mode:**

- **Activity mode (`processInWorkflow: false`)**: Only `MessageThread` parameter allowed
- **Workflow mode (`processInWorkflow: true`)**: Both `MessageThread` and Flow instance parameters available

**Lifecycle and State:**

- Data processor instances are created per invocation
- For state management across invocations, use the passed Flow instance when in workflow mode
- In activity mode, use external storage or the MessageThread for state coordination

For detailed implementation guidance, see [Handling Data as RPC](../2-agent-communication/10-handling-data-rpc.md).

## Example

### Document Processing Service

```csharp
public class DocumentProcessor
{
    public async Task<ProcessingResult> ProcessDocument(DocumentRequest request)
    {
        var result = await _processor.ProcessAsync(request.Content);
        
        return new ProcessingResult
        {
            DocumentId = request.DocumentId,
            ProcessedAt = DateTime.UtcNow,
            Status = "completed",
            ExtractedData = result.Data
        };
    }
}
```

### External API Call

```bash
POST /api/user/rest/converse?workflow=DocumentAgent:DocumentFlow&type=Data&text=ProcessDocument

{
  "DocumentId": "doc-123",
  "Content": "base64-encoded-content",
  "Options": {
    "extractMetadata": true,
    "validateFormat": true
  }
}
```

### Response

```json
{
  "requestId": "req-456",
  "threadId": "thread-789",
  "response": {
    "text": null,
    "data": {
      "DocumentId": "doc-123",
      "ProcessedAt": "2024-01-15T10:30:00Z",
      "Status": "completed",
      "ExtractedData": { /* processed data */ }
    },
    "direction": 1,
    "messageType": 1,
    "scope": null,
    "hint": null
  }
}
```

This approach enables seamless integration between external systems and Agent workflows through standardized Data message communication.

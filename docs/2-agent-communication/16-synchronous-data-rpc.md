# Synchronous Data RPC

Synchronous Data RPC provides a simplified RPC-style mechanism for agents to send structured data messages directly to other agents. This approach maintains an HTTP connection until the response is received, with a default 5-minute timeout.

## Overview

The `Agent2Agent` class enables workflows to send data messages synchronously to other workflow agents, supporting:

- **Direct workflow ID/Type targeting**: Send to a specific workflow instance
- **Class-Type-based singleton targeting**: Send to the singleton instance of a workflow type
- **Immediate responses**: Get responses without complex queuing mechanisms
- **Built-in timeout handling**: Configurable timeout (default: 300 seconds)

## Core Interface

```csharp
interface IAgent2Agent {
    Task<MessageResponse> SendData(string workflowIdOrType, object data, string methodName, ...);
    Task<MessageResponse> SendData(Type targetWorkflowType, object data, string methodName, ...);
}
```

## Usage Patterns

### 1. Send Data to Specific Workflow

```csharp
// Send to specific workflow instance
var response = await MessageHub.Agent2Agent.SendData(
    workflowIdOrType: "DocumentProcessor-123",
    data: new ProcessDocumentRequest { DocumentId = "doc-456" },
    methodName: "ProcessDocument"
);
```

### 2. Send Data to Workflow Type (Singleton)

```csharp
// Send to singleton instance of DocumentProcessor workflow
var response = await MessageHub.Agent2Agent.SendData(
    targetWorkflowType: typeof(DocumentProcessorFlow),
    data: new ProcessDocumentRequest { DocumentId = "doc-456" },
    methodName: "ProcessDocument"
);
```

### 3. Advanced Options

```csharp
var response = await MessageHub.Agent2Agent.SendData(
    targetWorkflowType: typeof(PaymentProcessor),
    data: paymentRequest,
    methodName: "ProcessPayment",
    requestId: Guid.NewGuid().ToString(),
    scope: "payment-processing",
    authorization: "Bearer token123",
    hint: "high-priority",
    timeoutSeconds: 60  // Custom timeout
);
```

## Message Response Handling

```csharp
var response = await MessageHub.Agent2Agent.SendData(...);

if (response != null)
{
    // Handle successful response
    var result = response.Data;
}
else
{
    // Handle timeout or no response
    _logger.LogWarning("No response received from target agent");
}
```

## Receiving Synchronous Data Messages

The receiving agent must handle synchronous data messages through **RPC processors** for optimal performance and simplicity. Unlike asynchronous data messages that require manual queuing, synchronous messages are processed directly through method invocation.

### Setting Up RPC Processor

The receiving workflow should implement a DataProcessor class to handle incoming synchronous data messages:

```csharp
public class DocumentDataProcessor 
{
    private readonly MessageThread _messageThread;

    public DocumentDataProcessor(MessageThread messageThread) 
    {
        _messageThread = messageThread;
    }

    public async Task<ProcessResult> ProcessDocument(ProcessDocumentRequest request) 
    {
        // Handle the synchronous data message
        return new ProcessResult 
        { 
            DocumentId = request.DocumentId,
            Status = "Processed",
            ProcessedAt = DateTime.UtcNow
        };
    }
}
```

### Register RPC Processor

Register the processor with your flow:

```csharp
var agent = new AgentTeam("Document Processor Agent");
var flow = agent.AddAgent<DocumentProcessorFlow>();
flow.SetDataProcessor<DocumentDataProcessor>();  // Enable RPC handling
await agent.RunAsync();
```

!!! info "Complete RPC Implementation Guide"
    For detailed implementation instructions, method signatures, parameter handling, and error management, see [Handling Data as RPC](10-handling-data-rpc.md).

## Comparison with Asynchronous Data Handling

| Feature | Synchronous Data RPC | [Asynchronous Data Handling](8-handling-data-messages.md) |
|---------|---------------------|--------------------------|
| **Response Pattern** | Immediate (RPC-style) | Event-driven queuing |
| **Connection** | Holds HTTP connection | Fire-and-forget |
| **Timeout** | 5 minutes default | No timeout |
| **Complexity** | Low (single method call) | High (queuing, event handling) |
| **Use Case** | Simple request-response | Complex orchestration |
| **Fault Tolerance** | Connection-based | Temporal workflow guarantees |
| **Scalability** | Limited by connection pool | High (async processing) |

## Best Practices

### When to Use Synchronous Data RPC

- ✅ Simple request-response scenarios with structured data
- ✅ When you need immediate confirmation
- ✅ Short-lived operations (< 5 minutes)
- ✅ Direct agent-to-agent data processing

### When to Use Asynchronous Data Handling

- ✅ Long-running processes
- ✅ Complex workflow orchestration
- ✅ High-throughput scenarios
- ✅ When fault tolerance is critical

!!! example "Sample Implementation"
    See a complete working example of agent-to-agent synchronous data communication at [GitHub Samples](https://github.com/XiansAiPlatform/samples/tree/main/a2a-communications).

This synchronous data RPC approach provides a much simpler alternative to manual data message handling while maintaining the flexibility to communicate between different types of workflow agents using structured data.

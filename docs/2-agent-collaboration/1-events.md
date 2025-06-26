# Events Between Agent Flows

Events provide a powerful mechanism for communication between different flows in the XiansAI system. This document explains how to implement event-based communication between flows.

## Overview

Events in XiansAI allow flows to:

- Send events to other flows
- Subscribe to and handle events from other flows
- Pass data between flows asynchronously

## Sending Events

To send an event from one flow to another, use the `MessageHub.SendFlowMessage` method. Here's how to implement it:

```csharp
// Define an event payload class
public class NewsReportRequest
{
    [JsonPropertyName("url")]
    public required string Url { get; set; }
    
    [JsonPropertyName("recipientEmail")]
    public required string RecipientEmail { get; set; }
}

// Send an event
MessageHub.SendFlowMessage(
    typeof(NewsReportFlow),  // Target flow type
    new NewsReportRequest {  // Event payload
        Url = url, 
        RecipientEmail = recipientEmail 
    }
);
```

## Receiving Events

To receive events in a flow, subscribe to them in the flow's constructor using the `_messageHub.SubscribeFlowMessageHandler` method:

```csharp
public class NewsReportFlow : FlowBase
{
    private readonly Queue<NewsReportRequest> _newsRequests = new Queue<NewsReportRequest>();

    public NewsReportFlow()
    {
        _messageHub.SubscribeAsyncFlowMessageHandler<NewsReportRequest>(async (args) =>
        {
            if (args.Payload != null)
            {
                _newsRequests.Enqueue(args.Payload);
            }
        });
    }
}
```

## Complete Example

Here's a complete example showing how two flows can communicate using events:

1. **Sending Flow (Capabilities.cs)**:

```csharp
[Capability("Send summary report")]
[Parameter("url", "URL of the news article")]
[Parameter("recipientEmail", "Email address of the recipient")]
[Returns("Success message")]
public static string SendSummaryReport(string url, string recipientEmail)
{
    MessageHub.SendFlowMessage(
        typeof(NewsReportFlow), 
        new NewsReportRequest { Url = url, RecipientEmail = recipientEmail }
    );
    return "Success";
}
```

2. **Receiving Flow (NewsReportFlow.cs)**:

```csharp
[Workflow("News Report Flow")]
public class NewsReportFlow : FlowBase
{
    private readonly Queue<NewsReportRequest> _newsRequests = new Queue<NewsReportRequest>();

    public NewsReportFlow()
    {
        _messageHub.SubscribeAsyncFlowMessageHandler<NewsReportRequest>(async (args) =>
        {
            if (args.Payload != null)
            {
                _newsRequests.Enqueue(args.Payload);
            }
        });
    }

    [WorkflowRun]
    public async Task<string> Run()
    {
        // Wait for events to arrive
        await Workflow.WaitConditionAsync(() => _newsRequests.Count > 0);
        var request = _newsRequests.Dequeue();
        
        // Process the event...
    }
}
```

## Event Flow

1. A capability or flow sends an event using ` MessageHub.SendFlowMessage`
2. The target flow receives the event through its subscription
3. The receiving flow processes the event in its workflow
4. The workflow can wait for events using `Workflow.WaitConditionAsync`

This event-based communication pattern enables loose coupling between flows while maintaining type safety and reliable message delivery.

## SDK Reference

### MessageHub Class

The `MessageHub` class provides the core functionality for event-based communication between flows.

#### Sending flow messages Events

**Using Flow Type**:

```csharp
await MessageHub.SendFlowMessage(
    typeof(NewsReportFlow),  // Target flow type
    payload                 // Optional payload object
);
```

#### Subscribing to Events

The `MessageHub` class provides two ways to subscribe to events:

1. **Async Handler**:

```csharp
_messageHub.SubscribeAsyncFlowMessageHandler<NewsReportRequest>(async (args) =>
{
    // Handle event asynchronously
    await ProcessEventAsync(metadata, payload);
});
```

2. **Sync Handler**:

```csharp
_messageHub.SubscribeFlowMessageHandler<NewsReportRequest>((args) =>
{
    // Handle event synchronously
    ProcessEvent(metadata, payload);
});
```

#### Unsubscribing from Events

To remove event handlers:

```csharp
// Remove async handler
_messageHub.UnsubscribeAsyncFlowMessageHandler<NewsReportRequest>(asyncHandler);

// Remove sync handler
_messageHub.UnsubscribeFlowMessageHandler<NewsReportRequest>(syncHandler);
```

### Event Metadata

Each event includes metadata about its source:

```csharp
public class EventMetadata
{
    public required string SourceWorkflowId { get; set; }
    public required string SourceWorkflowType { get; set; }
    public required string SourceAgent { get; set; }
}
```

### Event Handlers

Two types of event handlers are supported:

1. **Async Handler**:

```csharp
public delegate Task EventReceivedAsyncHandler<T>(EventMetadata metadata, T? payload);
```

2. **Sync Handler**:

```csharp
public delegate void EventReceivedHandler<T>(EventMetadata metadata, T? payload);
```

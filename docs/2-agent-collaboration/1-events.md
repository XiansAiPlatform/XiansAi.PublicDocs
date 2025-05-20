# Events Between Agent Flows

Events provide a powerful mechanism for communication between different flows in the XiansAI system. This document explains how to implement event-based communication between flows.

## Overview

Events in XiansAI allow flows to:

- Send events to other flows
- Subscribe to and handle events from other flows
- Pass data between flows asynchronously

## Sending Events

To send an event from one flow to another, use the `EventHub.Publish` method. Here's how to implement it:

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
EventHub.Publish(
    typeof(NewsReportFlow),  // Target flow type
    NewsReportFlow.SendSummaryReportEvent,  // Event name
    new NewsReportRequest {  // Event payload
        Url = url, 
        RecipientEmail = recipientEmail 
    }
);
```

## Receiving Events

To receive events in a flow, subscribe to them in the flow's constructor using the `_eventHub.Subscribe` method:

```csharp
public class NewsReportFlow : FlowBase
{
    public const string SendSummaryReportEvent = "SendSummaryReport";
    Queue<NewsReportRequest> _newsRequests = new();

    public NewsReportFlow()
    {
        _eventHub.Subscribe<NewsReportRequest>((metadata, payload) =>
        {
            Workflow.Logger.LogInformation("Received News Report Request for URL: {Url}", payload?.Url);
            if (payload != null)
            {
                _newsRequests.Enqueue(payload);
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
    EventHub.Send(
        typeof(NewsReportFlow), 
        NewsReportFlow.SendSummaryReportEvent, 
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
    public const string SendSummaryReportEvent = "SendSummaryReport";
    Queue<NewsReportRequest> _newsRequests = new();

    public NewsReportFlow()
    {
        _eventHub.Subscribe<NewsReportRequest>((metadata, payload) =>
        {
            Workflow.Logger.LogInformation("Received News Report Request for URL: {Url}", payload?.Url);
            if (payload != null)
            {
                _newsRequests.Enqueue(payload);
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

1. A capability or flow sends an event using `EventHub.Send`
2. The target flow receives the event through its subscription
3. The receiving flow processes the event in its workflow
4. The workflow can wait for events using `Workflow.WaitConditionAsync`

This event-based communication pattern enables loose coupling between flows while maintaining type safety and reliable message delivery.

## SDK Reference

### EventHub Class

The `EventHub` class provides the core functionality for event-based communication between flows.

#### Publishing Events

There are two ways to publish events:

1. **Using Flow Type**:

```csharp
await EventHub.Publish(
    typeof(NewsReportFlow),  // Target flow type
    "EventName",            // Event type
    payload                 // Optional payload object
);
```

2. **Using Workflow ID and Type**:

```csharp
await EventHub.Publish(
    "target-workflow-id",   // Target workflow ID
    "target-workflow-type", // Target workflow type
    "EventName",           // Event type
    payload                // Optional payload object
);
```

#### Subscribing to Events

The `EventHub` class provides two ways to subscribe to events:

1. **Async Handler**:

```csharp
_eventHub.Subscribe<NewsReportRequest>(async (metadata, payload) =>
{
    // Handle event asynchronously
    await ProcessEventAsync(metadata, payload);
});
```

2. **Sync Handler**:

```csharp
_eventHub.Subscribe<NewsReportRequest>((metadata, payload) =>
{
    // Handle event synchronously
    ProcessEvent(metadata, payload);
});
```

#### Unsubscribing from Events

To remove event handlers:

```csharp
// Remove async handler
_eventHub.Unsubscribe<NewsReportRequest>(asyncHandler);

// Remove sync handler
_eventHub.Unsubscribe<NewsReportRequest>(syncHandler);
```

### Event Metadata

Each event includes metadata about its source:

```csharp
public class EventMetadata
{
    public required string EventType { get; set; }
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

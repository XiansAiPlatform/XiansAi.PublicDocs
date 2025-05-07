# Sending and Receiving Events

## Overview
Events are a powerful mechanism to facilitate communication between separate workflows in Xians AI. They allow one workflow to send data or a trigger to another, enabling loosely coupled, event-driven behavior across the system.

Events can be sent from:
- Inside a workflow
- Inside an activity
- Inside a capability

## Sending Events

To send an event, begin by importing the events namespace:

```csharp
using XiansAi.Events;
```

### Sending an Event Example

```csharp
var eventType = "AppointmentCompleted";
var workflowId = AgentContext.GetSingletonWorkflowIdFor(typeof(ConsultantBot));
var workflowType = AgentContext.GetWorkflowTypeFor(typeof(ConsultantBot));

_logger.LogInformation("Sending event: {EventType} to workflow: {WorkflowId}",
    eventType, workflowId);

// Inform the ConsultantBot about the completed appointment
await EventHub.SendEvent(
    workflowId,
    workflowType,
    eventType,
    appointmentData);
```

### Explanation

1. **Define the event type:**
   ```csharp
   var eventType = "AppointmentCompleted";
   ```
   This string acts as an identifier for the event being sent.

2. **Get the target workflow ID and type:**
   ```csharp
   var workflowId = AgentContext.GetSingletonWorkflowIdFor(typeof(ConsultantBot));
   var workflowType = AgentContext.GetWorkflowTypeFor(typeof(ConsultantBot));
   ```
   These values identify which workflow instance and type should receive the event.

3. **Send the event via EventHub:**
   ```csharp
   await EventHub.SendEvent(...);
   ```
   The `SendEvent` method pushes the event to the target workflow.

### SendEvent Method Signature

```csharp
public static Task SendEvent(
    string targetWorkflowId,
    string targetWorkflowType,
    string evtType,
    object? payload = null);
```

- `targetWorkflowId`: The unique ID of the target workflow.
- `targetWorkflowType`: The class/type name of the workflow.
- `evtType`: String label for the event.
- `payload`: Optional data to be passed with the event.

## Defining the Event Payload

The payload is a data object sent with the event. Below is a sample data model used as a payload:

```csharp
using System.Text.Json.Serialization;

namespace XiansAi.Models;

public class AppointmentData
{
    [JsonPropertyName("appointmentId")]
    public string? AppointmentId { get; set; }

    [JsonPropertyName("patientName")]
    public string? PatientName { get; set; }

    [JsonPropertyName("doctorName")]
    public string? DoctorName { get; set; }

    [JsonPropertyName("prescription")]
    public string? Prescription { get; set; }

    [JsonPropertyName("doctorNote")]
    public string? DoctorNote { get; set; }
}
```

This model can be serialized and sent as the payload in `SendEvent`.

## Receiving Events

A workflow can receive events by registering a handler and managing an internal event queue.

### Step 1: Create an Event Queue

Define a private queue inside your workflow class to store incoming events:

```csharp
private readonly Queue<AppointmentData> _eventQueue = new Queue<AppointmentData>();
```

### Step 2: Register the Event Handler

Inside your workflow constructor, register an event handler with the `EventHub`:

```csharp
public ConsultantBot()
{
    _eventHub.RegisterHandler((args) =>
    {
        var payload = EventHub.CastPayload<AppointmentData>(args);
        _eventQueue.Enqueue(payload);
        _logger.LogInformation("Enqueued event for appointment: {AppointmentId}",
            payload.AppointmentId);
    });
}
```

- `RegisterHandler` listens for incoming events.
- `CastPayload<T>()` safely casts the payload to the expected type.
- The payload is then enqueued for processing.

### Step 3: Process Events in the Workflow Loop

Continuously monitor and process events in your workflow loop:

```csharp
while (true)
{
    try
    {
        await Workflow.WaitConditionAsync(() => _eventQueue.Count > 0);

        var payload = _eventQueue.Dequeue();
        Console.WriteLine(payload.PatientName);

        // Further logic here...
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error while processing event.");
    }
}
```

- `Workflow.WaitConditionAsync` waits until the event queue is non-empty.
- Events are then dequeued and processed as needed.

## Summary

| Operation         | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `SendEvent`        | Dispatches a named event to a specific workflow with optional payload.     |
| `RegisterHandler`  | Listens for incoming events in the target workflow.                       |
| `Event Queue`      | Temporarily holds incoming event data until the workflow is ready to process them. |
| `Payload`          | Custom data object passed with the event (e.g., `AppointmentData`).       |

This event-driven mechanism is essential for coordinating actions across different workflows while maintaining modular, asynchronous processing.

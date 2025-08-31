# Accessing Agents Through WebSocket Connection

This guide demonstrates how to create a .NET console application that connects to XiansAI agents using SignalR WebSocket connections.

## Prerequisites

- .NET 8.0 or later
- Microsoft.AspNetCore.SignalR.Client NuGet package
- Newtonsoft.Json NuGet package
- DotNetEnv NuGet package

## Project Setup

1. Create a new .NET console application:
```bash
dotnet new console -n AgentChatClient
cd AgentChatClient
```

2. Add required NuGet packages:
```bash
dotnet add package Microsoft.AspNetCore.SignalR.Client
dotnet add package Newtonsoft.Json
dotnet add package DotNetEnv
```

3. Create a `.env` file in your project directory:
```env
WEBSOCKET_URL=https://your-hub-url/ws/chat
API_KEY=your-api-key
TENANT_ID=your-tenant-id
PARTICIPANT_ID=your-participant-id
```
 API key can be generated from the Xians portal. Navigate to Settings > API Keys tab > Create API Key (only Tenant or System admins have access to generate API keys).

## Agent Configuration

1. Create an `agents.json` file in your project directory with the following structure:
```json
[
    {
        "id": "tenant:agent-name:workflow-name",
        "name": "bot-name",
        "agent": "agent-name",
        "workflowType": "workflow-type"
    }
]
```

2. Use the following model to represent agent configuration:
```csharp
public class AgentConfig
{
    public required string Id { get; set; }           // Unique identifier for the agent
    public required string Name { get; set; }         // Display name of the agent
    public required string Agent { get; set; }        // Agent identifier
    public required string WorkflowType { get; set; } // Type of workflow the agent handles
}
```

## Message Model (Recieved message format via websocket)

Use the following model for Coversation and to receive messages from the agent via websocket:
```csharp
public class Message
{
    public string Id { get; set; } = null!;
    public required string ThreadId { get; set; }
    public required string TenantId { get; set; }
    public required DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public required string CreatedBy { get; set; }
    public required string Direction { get; set; } // Incoming or Outgoing
    public string? Text { get; set; }
    public string? Status { get; set; } // FailedToDeliverToWorkflow or DeliveredToWorkflow
    public object? Data { get; set; }
    public required string ParticipantId { get; set; }
    public required string WorkflowId { get; set; }
    public required string WorkflowType { get; set; }
    public string? MessageType { get; set; } // Chat, Data, or Handoff
}
```

## Send Message Request Model

Use to send messages to the agent via websocket:
```csharp
public class SendMessageRequest
{
    public required string ParticipantId { get; set; }
    public string? WorkflowId { get; set; }
    public required string WorkflowType { get; set; }
    public required string Agent { get; set; }
    public object? Data { get; set; }
    public string? Text { get; set; }
    public string? ThreadId { get; set; }
    public string? Authorization { get; set; }
}
```

## Setup Websocket Connection

Before subscribing to agents, you need to establish a Websocket connection. Here's how to set up and start the connection:

```csharp
private static async Task SetupWebsocketConnection()
{
    _connection = new HubConnectionBuilder()
        .WithUrl($"{_webSocketUrl}?tenantId={_tenantId}", options =>
        {
            options.Headers.Add("Authorization", $"Bearer {_apiKey}");
        })
        .WithAutomaticReconnect()
        .Build();

    // Setup message handlers
    _connection.On<Message>("ReceiveMessage", HandleReceivedMessage);
    _connection.On<string>("InboundProcessed", HandleInboundProcessed);
    _connection.On<List<Message>>("ThreadHistory", HandleThreadHistory);

    try
    {
        await _connection.StartAsync();
        Console.WriteLine("Connected to SignalR hub");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error connecting to SignalR hub: {ex.Message}");
        throw;
    }
}
```

**Important notes:**
- The connection requires a valid WebSocket URL, API key, and tenant ID.
- The connection includes automatic reconnection capability.
- Message handlers should be set up before starting the connection.
- Always handle connection errors appropriately.
- The connection must be established before attempting to subscribe to agents.

## Subscribing to Agents

To subscribe to agents, call the `SubscribeToAgent` method through the SignalR connection:

```csharp
await _connection.InvokeAsync("SubscribeToAgent",
    agent.Id,        // The agent's unique identifier (workflowId)
    _participantId,  // Your participant ID
    _tenantId        // Your tenant ID
);
```

## Loading Initial Chat History

The initial chat history is loaded for each agent using:

```csharp
await _connection.InvokeAsync("GetThreadHistory",
    agent.WorkflowType, // Workflow type
    _participantId,     // Participant ID
    1,                  // Page number
    20                  // Page size
);
```

## Sending and Receiving Messages

- Messages are sent using the `SendInboundMessage` method.
- The request model uses the `Text` property for message content.
- The method signature is:
  ```csharp
  await _connection.InvokeAsync("SendInboundMessage", request, "Chat");
  ```
- Wait for a response using a `TaskCompletionSource` with a 15-second timeout.

Example:
```csharp
var request = new SendMessageRequest
{
    ThreadId = _currentThreadId,
    Agent = selectedAgent.Agent,
    WorkflowType = selectedAgent.WorkflowType,
    WorkflowId = selectedAgent.Id,
    ParticipantId = _participantId,
    Text = input,
    Data = null
};

_messageResponseReceived = new TaskCompletionSource<bool>();
await _connection.InvokeAsync("SendInboundMessage", request, "Chat");
Console.WriteLine("Message sent successfully");

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
try
{
    await _messageResponseReceived.Task.WaitAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("No response received within 15 seconds");
}
```

- To send a Data object use the below method signature;
  ```csharp
  await _connection.InvokeAsync("SendInboundMessage", request, "Data");
  ```
Example:

```csharp
var request = new SendMessageRequest
{
    ThreadId = _currentThreadId,
    Agent = selectedAgent.Agent,
    WorkflowType = selectedAgent.WorkflowType,
    WorkflowId = selectedAgent.Id,
    ParticipantId = _participantId,
    Text = null,
    Data = new ExampleDataModel {ExampleName:"hi", ExampleAge:23 }
};

_messageResponseReceived = new TaskCompletionSource<bool>();
await _connection.InvokeAsync("SendInboundMessage", request, "Data");
Console.WriteLine("Message sent successfully");

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
try
{
    await _messageResponseReceived.Task.WaitAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("No response received within 15 seconds");
}
```

## Message Handlers

- `ReceiveMessage`: Handles incoming messages.
```csharp 
_connection.On<Message>("ReceiveMessage", HandleReceivedMessage); 
```

- `InboundProcessed`: Updates the current thread ID.
```csharp 
_connection.On<string>("InboundProcessed", HandleInboundProcessed);
```

- `ThreadHistory`: Loads message history for an agent.
```csharp 
_connection.On<List<Message>>("ThreadHistory", HandleThreadHistory);
```

## Chat History Storage

- Messages are stored in the `_chatHistories` dictionary.
- Key: Agent's WorkflowId.
- Value: List of messages for that agent.

```csharp
private static Dictionary<string, List<Message>> _chatHistories;
```

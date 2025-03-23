# Creating Multi-Flow Agents with XiansAi.Flow

This guide explains how to create an agent with multiple flows using the XiansAi.Flow framework.

## Overview

Multi-flow agents allow you to split complex functionality into separate workflows that can run independently but share the same agent identity. This approach enables:

- Better separation of concerns
- Independent development and scaling of different workflows
- Simpler maintenance and debugging

## Step 1: Define Individual Flows

Each flow should inherit from `FlowBase` and be marked with the `[Workflow]` attribute. The main workflow method should be decorated with `[WorkflowRun]`.

### Example: ChatFlow

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

namespace SalesAssistAgent.Workflows.ChatFlow;

[Workflow("Sales Assist Agent: Chat Flow")]
public class ChatFlow: FlowBase
{
    [WorkflowRun]
    public async Task<string> Run(string name)
    {
        // Your chat logic here
    }
}
```

### Example: CalendarFlow

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

namespace SalesAssistAgent.Workflows.CalendarFlow;

[Workflow("Sales Assist Agent: Calendar Flow")]
public class CalendarFlow: FlowBase
{
    [WorkflowRun]
    public async Task Run(string name)
    {
        // Your calendar logic here
        
    }
}
```

## Step 2: Configure Agent and Flows

In your `Program.cs`, define a single `AgentInfo` object that all flows will share:

```csharp
using XiansAi.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;
using SalesAssistAgent.Workflows.CalendarFlow;
using SalesAssistAgent.Workflows.ChatFlow;

...

// Define the shared AgentInfo for all flows
var agentInfo = new AgentInfo {
    Name = "Sales Assist Agent",
    Description = "A sales assistant that can help with sales tasks",
};

// Create FlowInfo objects for each flow, passing the shared agentInfo
var calendarFlowInfo = new FlowInfo<CalendarFlow>(agentInfo);
var chatFlowInfo = new FlowInfo<ChatFlow>(agentInfo);

...
```

## Step 3: Run Multiple Flows Concurrently

Start and manage all flows concurrently:

```csharp
// Cancellation token for graceful shutdown
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) => { 
    tokenSource.Cancel(); 
    eventArgs.Cancel = true;
};

try
{
    // Create flow runner tasks
    var calendarTask = new FlowRunnerService().RunFlowAsync(calendarFlowInfo, tokenSource.Token);
    var chatTask = new FlowRunnerService().RunFlowAsync(chatFlowInfo, tokenSource.Token);
    
    // Run all flows concurrently
    await Task.WhenAll(calendarTask, chatTask);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}
```

## Best Practices

1. **Shared Identity**: Use a single `AgentInfo` object for all flows to maintain a consistent agent identity.

2. **Flow Separation**: Design flows to handle distinct functionality (e.g., chat handling vs. calendar operations).

3. **Flow Communication**: If flows need to communicate, use activities or signals rather than direct references.

## Complete Example

```csharp
using XiansAi.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;
using YourNamespace.Workflows.Flow1;
using YourNamespace.Workflows.Flow2;

// Configuration
Env.Load();
FlowRunnerService.SetLoggerFactory(LoggerFactory.Create(builder => 
    builder.SetMinimumLevel(LogLevel.Debug).AddConsole()));

// Define shared agent identity
var agentInfo = new AgentInfo {
    Name = "Multi-Flow Agent",
    Description = "Agent with multiple specialized workflows",
};

// Configure flows
var flow1Info = new FlowInfo<Flow1>(agentInfo);
var flow2Info = new FlowInfo<Flow2>(agentInfo);

// Setup cancellation
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, e) => { tokenSource.Cancel(); e.Cancel = true; };

try
{
    // Run flows concurrently
    await Task.WhenAll(
        new FlowRunnerService().RunFlowAsync(flow1Info, tokenSource.Token),
        new FlowRunnerService().RunFlowAsync(flow2Info, tokenSource.Token)
    );
}
catch (OperationCanceledException)
{
    Console.WriteLine("Shutting down gracefully...");
}
```

This architecture allows you to build complex agents with specialized workflows while maintaining a unified agent identity and coordinated lifecycle management.

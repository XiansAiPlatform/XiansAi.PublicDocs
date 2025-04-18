# Your First Agent Flow

AI agent could have a multiple workflows. However in this example, we will create a simple agent with a single workflow.

## Creating an Agent Flow

To create a new agent workflow, create a class that inherits from `XiansAi.Flow.FlowBase`.

`SimpleAgentFlow.cs >`

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow]
public class SimpleAgentFlow: FlowBase
{
    [WorkflowRun]
    public async Task<string> Run(string name)
    {
        var output = "Hello";
        await DelayAsync(TimeSpan.FromSeconds(10));
        output += " World " + name;
        return await Task.FromResult(output + $" {name}!");
    }
}
```

## Agent Flow Naming

To customize an agent's name, use the [Workflow] attribute.
    ```csharp
    [Workflow("My First Agent")]
    public class SimpleFlow: FlowBase
    ```

!!! warning "Important"
    Each agent flow name must be unique within your organization. You can view existing agent definitions in the XiansAI portal.

## Enabling agent visualization

To enable agent visualization, you need to bundle the agent's source code into the assembly. Add the following XML to your `.csproj` file:

```xml
  <ItemGroup>
    <!-- Embed the agent source files -->
    <EmbeddedResource Include="SimpleAgentFlow.cs">
        <LogicalName>%(Filename)%(Extension)</LogicalName>
    </EmbeddedResource>
  </ItemGroup>
```

This configuration embeds the SimpleAgent.cs file as a resource in your assembly.

!!! note "Tip"
    If your agent file is in a subdirectory, specify the full path in the Include attribute. For example: Include="MyNamespace/SimpleAgent.cs"

## Registering the Flow Runner

To register your agent, add it to the Flow Runner in your Program.cs file:

`Program.cs >`

```csharp
using XiansAi.Flow;
using DotNetEnv;

// Env config via DotNetEnv
Env.Load(); // OR Manually set the environment variables

// Define the flow
var flowInfo = new FlowInfo<SimpleAgentFlow>();

try
{
    // Run the flow by passing the flow info to the FlowRunnerService
    await new FlowRunnerService().RunFlowAsync(flowInfo);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}

```

To start the flow runner:

```bash
dotnet build    
dotnet run
```

The Flow Runner will now wait for flow execution requests. To start a new flow, visit the 'Flow Definitions' section in the XiansAI portal and click the 'Start New' button for your SimpleFlow.

!!! bug "Duplicate Name Error"
    If you receive this error:
    ```bash
    > Bad Request: "Another user has already used this flow type name SimpleFlow. Please choose a different flow name."
    ```
    You'll need to choose a unique name using the [Workflow] attribute as shown earlier.

![Start New Agent Run](../images/start-new-flow.png)

You can view agent definition details and visualizations in the XiansAI portal.

![Agent Definition Details](../images/flow-visualization.png)

## Activating the Agent

To activate your agent:

1. Navigate to the agent definitions page
2. Click the 'Activate' button
3. Monitor the 'Agent Runs' section to track your agent's execution

Note: It may take a few seconds for your agent run to appear. Refresh the page if needed.

![Agent Runs](../images/flow-runs.png)

## Configure Logging (optional)

To configure logging for your agent, you can use the `FlowRunnerService` options. This allows you to consistently log messgaes from your workflow, activities as well as from systems messages from `Xians.Lib`.

```csharp
...
    var options = new FlowRunnerOptions
    {
        LoggerFactory = LoggerFactory.Create(builder =>
        builder
            .SetMinimumLevel(LogLevel.Debug)
            .AddConsole())
    };
    // Run the flow 
    await new FlowRunnerService(options).RunFlowAsync(flowInfo, tokenSource.Token);
...
```

## Override Cancellation Token

To override the cancellation token, you can pass a new token to the `RunFlowAsync` method. By default, the cancellation token is cancelled on ctrl+c.

```csharp
// Cancellation token cancelled on ctrl+c
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>{ tokenSource.Cancel(); eventArgs.Cancel = true;};

// Run the flow
await new FlowRunnerService().RunFlowAsync(flowInfo, tokenSource.Token);
```

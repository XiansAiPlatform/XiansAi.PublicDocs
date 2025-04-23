# Flow with Activities

## What are Activities?

Activities are the fundamental building blocks of a flow that handle external interactions and IO operations. They represent discrete steps in your workflow that interact with external systems, such as:

- Making HTTP requests
- Reading/writing to databases
- Calling external services
- File system operations

## Understanding Agent Architecture

Agent can have one or more Flows. Each flow can have one or more Activities.

### The Flow

The `Flow` serves as the orchestrator and defines the sequence of activities to be executed. While powerful in coordinating activities, the Flow class itself:

- Cannot perform direct IO operations
- Should only contain orchestration logic and activity calls

### Activities

Activities are where the actual work happens:

- Implemented as classes that inherit from `ActivityBase`
- Define concrete implementations of IO operations
- Can be tested and mocked independently
- Are executed by the Flow orchestrator

!!! info "Flow Constraints"
    Flow.ai uses [Temporal](https://temporal.io/) as its underlying workflow engine. Temporal provides:
    - Durability for long-running workflows
    - Automatic retry mechanisms
    - State management
    - Error handling
    You can read more about Flow constraints in the [Temporal documentation](https://docs.temporal.io/workflows).

## Example: Movie Suggestion Flow

Let's create a practical example that demonstrates activity usage by building a movie suggestion system. This flow will:

1. Fetch user details from an external API
2. Get movie suggestions based on the user information

### 1. Define the Flow Class

First, create/update the workflow class that orchestrates the activities:

`> SimpleAgentFlow.cs`

```csharp
using Temporalio.Workflows;
using Temporalio.Activities;
using XiansAi.Flow;

namespace SimpleAgent;

[Workflow("Movie Suggestion Flow")]
public class SimpleAgentFlow: FlowBase
{
    [WorkflowRun]
    public async Task<string> Run(string userName)
    {    
        // Get a movie suggestion from Movie API
        var movie = await RunActivityAsync(
                (IMovieActivity a) => a.GetMovieAsync(userName));

        return movie;
    }
}

// Activity interfaces define the contract for our activities
public interface IMovieActivity
{
    [Activity]
    Task<string?> GetMovieAsync(string? userName);
}
```

### 2. Implement the Movie Activity

Create an activity to fetch movie suggestions:

`> MovieActivity.cs`

```csharp
using System.Text.Json;
using XiansAi.Activity;

namespace SimpleAgent;

public class MovieActivity : ActivityBase, IMovieActivity 
{
    private readonly HttpClient _client = new HttpClient();
    private static string URL = "https://freetestapi.com/api/v1/movies/{0}";

    public async Task<string?> GetMovieAsync(string? userName)
    {
        var randomInt = Random.Shared.Next(1, 10);
        var response = await _client.GetStringAsync(string.Format(URL, randomInt));
        var result = JsonSerializer.Deserialize<JsonDocument>(response);
        return result?.RootElement.GetProperty("title").GetString();
    }
}
```

### 4. Configure and Run the Flow

Set up the flow runner in your program:

`> Program.cs`

```csharp
using XiansAi.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;

namespace SimpleAgent;

// Load environment configuration
Env.Load();

// Setup cancellation token for graceful shutdown
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>{ 
    tokenSource.Cancel(); 
    eventArgs.Cancel = true;
};

// Configure the flow within this agent
var flowInfo = new FlowInfo<SimpleAgentFlow>();
// Add the activities to the flow
flowInfo.AddActivities<IMovieActivity>(new MovieActivity());

try
{
    // initiate the runner
    var runnerTask = new FlowRunnerService().RunFlowAsync(flowInfo, tokenSource.Token);
    // Wait for the flow to complete
    await Task.WhenAll(runnerTask);  
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}
```

## Run the Flow

1. Build and run the application:

```bash
dotnet build
dotnet run
```

1. The Flow Runner will start and wait for execution requests.

1. To execute a flow:

    - Navigate to the XiansAI portal
    - Go to 'Flow Definitions' section
    - Find your 'Movie Suggestion Flow'
    - Click 'Activate' to begin execution

## Best Practices

1. **Activity Design**

    - Keep activities focused on a single responsibility
    - Make activities idempotent when possible
    - Handle errors appropriately within activities

2. **Flow Design**

    - Use the Flow class for orchestration only
    - Consider custom retry policies for activities as required

3. **Testing**
    - Unit test activities independently

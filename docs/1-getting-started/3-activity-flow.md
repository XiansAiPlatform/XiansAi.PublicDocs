# Flow Activities

## What are Activities?

Activities are the fundamental building blocks of a flow that handle external interactions and IO operations. They represent discrete steps in your workflow that interact with external systems, such as:

- Making HTTP requests
- Reading/writing to databases
- Calling external services
- File system operations

## Understanding Flow Architecture

### The Flow Class

The `Flow` class serves as the orchestrator and defines the sequence of activities to be executed. While powerful in coordinating activities, the Flow class itself:

- Cannot perform direct IO operations
- Should only contain workflow logic and activity coordination
- Acts as a configuration layer using the full power of C#

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

First, create the workflow class that orchestrates the activities:

`> MovieSuggestionFlow.cs`

```csharp
using Temporalio.Workflows;
using Temporalio.Activities;
using XiansAi.Flow;

[Workflow("Movie Suggestion Flow")]
public class MovieSuggestionFlow: FlowBase
{
    [WorkflowRun]
    public async Task<object[]> Run(string commaSeparatedUserIds)
    {
        // Initialize a list to store the results
        var result = new List<object>();

        // Split the comma separated user ids into an array of integers
        var userIds = commaSeparatedUserIds.Split(',').Select(int.Parse).ToArray();

        // Iterate over each user id
        foreach (var id in userIds)
        {
            // Step 1: Fetch user details from JSONPlaceholder
            var userName = await RunActivityAsync(
                    (IUserActivity a) => a.GetUserNameAsync(id));
        
            // Step 2: Get a movie suggestion from Movie API
            var movie = await RunActivityAsync(
                    (IMovieActivity a) => a.GetMovieAsync(userName));

            // Add the result to the list
            result.Add(new { User = userName, Movie = movie });
        }

        return result.ToArray();
    }
}

// Activity interfaces define the contract for our activities
public interface IUserActivity
{
    [Activity]
    Task<string?> GetUserNameAsync(int id);
}

public interface IMovieActivity
{
    [Activity]
    Task<string?> GetMovieAsync(string? userName);
}
```

### 2. Implement the User Activity

Create an activity to fetch user information:

`> UserActivity.cs`

```csharp
using System.Text.Json;
using XiansAi.Activity;

public class UserActivity : ActivityBase, IUserActivity
{
    private readonly HttpClient _client = new HttpClient();
    private static string URL = "https://jsonplaceholder.typicode.com/users/{0}";

    public async Task<string?> GetUserNameAsync(int id)
    {
        var response = await _client.GetStringAsync(string.Format(URL, id));
        return JsonSerializer.Deserialize<JsonDocument>(response)?.RootElement
            .GetProperty("name").GetString();
    }
}
```

### 3. Implement the Movie Activity

Create an activity to fetch movie suggestions:

`> MovieActivity.cs`

```csharp
using System.Text.Json;
using XiansAi.Activity;

public class MovieActivity : ActivityBase, IMovieActivity 
{
    private readonly HttpClient _client = new HttpClient();
    private static string URL = "https://freetestapi.com/api/v1/movies/{0}";

    public async Task<string?> GetMovieAsync(string? userName)
    {
        var randonInt = Random.Shared.Next(1, 10);
        var response = await _client.GetStringAsync(string.Format(URL, randonInt));
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

// Load environment configuration
Env.Load();

// Configure logging
FlowRunnerService.SetLoggerFactory(LoggerFactory.Create(builder => 
    builder
        .SetMinimumLevel(LogLevel.Debug)
        .AddConsole()
));

// Setup cancellation token for graceful shutdown
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>{ 
    tokenSource.Cancel(); 
    eventArgs.Cancel = true;
};

// Configure the flow
var flowInfo = new FlowInfo<MovieSuggestionFlow>();
flowInfo.AddActivities<IUserActivity>(new UserActivity());
flowInfo.AddActivities<IMovieActivity>(new MovieActivity());

try
{
    var runner = new FlowRunnerService();
    await runner.RunFlowAsync(flowInfo, tokenSource.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}
```

## Running the Flow

1. Build and run the application:

```bash
dotnet build
dotnet run
```

1. The Flow Runner will start and wait for execution requests.

1. To execute a flow:

    - Navigate to the XiansAI portal
    - Go to 'Flow Definitions' section
    - Find your 'MovieSuggestionFlow'
    - Click 'Start New' to begin execution

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
    - Mock external services in tests
    - Test different failure scenarios

## Next Steps

- [Learn about Knowledge](../2-knowledge/1-manage-knowledge.md)

# Flow Without Knowledge

This example demonstrates how to create a poetry generation flow using the Gemini API. The flow takes some words as input and returns a generated poem.

## Flow Overview

The PoetFlow consists of:

- A workflow that orchestrates the poem generation
- An activity that handles the Gemini API communication
- A program to run the flow

## 1. Create the Flow Definition

First, create `PoetFlow.cs` which defines the workflow and activity interface:

`> PoetFlow.cs`

```csharp
using Temporalio.Workflows;
using Temporalio.Activities;
using XiansAi.Flow;

[Workflow("Poet Flow")]
public class PoetFlow: FlowBase
{
    [WorkflowRun]
    public async Task<string?> Run(string keywords)
    {
        var geminiActivity = new ComposerActivity();
        var poem = await RunActivityAsync(
                    (IComposerActivity c) => c.GeneratePoemAsync(keywords));
        return poem;
    }
}

public interface IComposerActivity
{
    [Activity]
    Task<string?> GeneratePoemAsync(string keywords);
}

```

The `PoetFlow` class:

- Inherits from `FlowBase` to get core workflow functionality
- Is decorated with `[Workflow]` attribute to mark it as a Temporal workflow
- Contains a `Run` method that:
  - Takes keywords as input
  - Creates a composer activity
  - Executes the poem generation
  - Returns the generated poem

The `IComposerActivity` interface defines the contract for poem generation.

## 2. Implement the Activity

Create `ComposerActivity.cs` to handle the Gemini API interaction:

`> ComposerActivity.cs`

```csharp
using System.Text.Json;
using XiansAi.Activity;
using System.Text;

public class ComposerActivity : ActivityBase, IComposerActivity 
{
    private static string URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={0}";

    public async Task<string?> GeneratePoemAsync(string keywords)
    {
        var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        var url = string.Format(URL, apiKey);

        var instruction = "Write a poem using the given keywords";

        var jsonPayload = CreateJsonPayload(instruction, keywords);
        var jsonContent = new StringContent(JsonSerializer.Serialize(jsonPayload), Encoding.UTF8, "application/json");
        var response = await new HttpClient().PostAsync(url, jsonContent);
        var responseContent = await response.Content.ReadAsStringAsync();
        return ExtractPoemFromResponse(responseContent);
    }

    private object CreateJsonPayload(string instruction, string keywords)
    {
        return new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = instruction },
                        new { text = keywords }
                    }
                }
            }
        };
    }

    private string? ExtractPoemFromResponse(string responseContent)
    {
        var result = JsonSerializer.Deserialize<JsonDocument>(responseContent);

        // Navigate through the JSON structure to get the poem text
        var candidates = result?.RootElement.GetProperty("candidates");
        if (candidates.HasValue && candidates.Value.GetArrayLength() > 0)
        {
            var content = candidates.Value[0].GetProperty("content");
            var parts = content.GetProperty("parts");
            if (parts.GetArrayLength() > 0)
            {
                return parts[0].GetProperty("text").GetString();
            }
        }
        return null;
    }

    
}
```

The `ComposerActivity` class:

- Inherits from `ActivityBase` and implements `IComposerActivity`
- Handles communication with Gemini's API
- Contains methods to:
    - Generate poems using provided keywords
    - Format the API request payload
    - Parse the API response

## 3. Configure Gemini API Access

You'll need a Gemini API key to use the service:

1. Get your API key from [Gemini API Key](https://aistudio.google.com/apikey)
2. Add it to your `.env` file:

```.env
GEMINI_API_KEY=<your-gemini-api-key>
```

## 4. Setup the Runner

Create `Program.cs` to run the flow:

`> Program.cs`

```csharp
using XiansAi.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;

// Env config via DotNetEnv
Env.Load(); // OR Manually set the environment variables

FlowRunnerService.SetLoggerFactory(LoggerFactory.Create(builder => 
    builder
        .SetMinimumLevel(LogLevel.Debug)
        .AddConsole()
));

// Cancellation token cancelled on ctrl+c
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>{ tokenSource.Cancel(); eventArgs.Cancel = true;};

// Define the flow
var flowInfo = new FlowInfo<PoetFlow>();
flowInfo.AddActivities<IComposerActivity>(new ComposerActivity());

try
{
    var runner = new FlowRunnerService();
    // Run the flow by passing the flow info to the FlowRunnerService
    await runner.RunFlowAsync(flowInfo, tokenSource.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}
```

The program:

- Loads environment variables
- Configures logging
- Sets up cancellation handling
- Creates and runs the flow using `FlowRunnerService`

## 5. Running the Flow

1. Start the service:

```bash
dotnet run
```

1. Use the XiansAI Portal:
    - Go to 'Flow Definitions'
    - Locate 'PoetFlow'
    - Enter keywords (e.g., "love, romance, moon, stars")
    - Click 'Start New'

1. Monitor execution:
    - Check 'Flow Runs' section
    - Select your flow execution
    - View results and details

## Instruction - Limitations

The flow we implemented hard codes the knowledge to the Gemini API. This is not ideal for a number of reasons.

- When business requirements change, we need to update the code.
- Business users are not able to change the knowledge.
- We are not able to track the knowledge used in the flow.

In the next example, we will see how to manage knowledge in XiansAI Portal instead of hard coding them in the code.

[Using Knowledge](./3-using-knowledge.md)

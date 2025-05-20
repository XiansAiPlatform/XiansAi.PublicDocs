# Adding Activities to Your Flow

Activities are the individual steps in a business process flow. They are the building blocks of the flow. We will use the following activities in our flow:

- ExtractContentFromUrlAsync: Extracts the content from a URL
- CreateTextReportAsync: Creates a text report from the content
- SendEmailReportAsync: Sends the text report to the recipient

## Temporal Workflows and Activities

Temporal workflows have an important constraint: they cannot perform I/O operations directly. This means you cannot make HTTP requests, read files, or perform any other external operations directly within a workflow. This restriction exists because workflows must be deterministic - they must produce the same sequence of commands when replayed, regardless of when they are executed.

Instead, all I/O operations must be performed through activities. Activities are the building blocks that handle all external interactions and I/O operations. They can:

- Make HTTP requests
- Read/write files
- Send emails
- Interact with databases
- Perform any other external operations

This separation ensures that workflows remain deterministic while still allowing your application to interact with the outside world through activities.

## Writing the Activity Code

Create a new file `NewsActivities.cs` and add the following code:

`NewsActivities.cs >`

```csharp
using Temporalio.Activities;

interface INewsActivities
{
    [Activity]
    Task<string> ExtractContentFromUrlAsync(string url);
    [Activity]
    Task<string> CreateTextReportAsync(string content);
    [Activity]
    Task SendEmailReportAsync(string reportText, string recipientEmail = "recipient@example.com");
}

public class NewsActivities : INewsActivities
{


    public Task<string> ExtractContentFromUrlAsync(string url)
    {
        Console.WriteLine($"Extracting content from URL: {url}");
        // Dummy implementation - would actually call a service to extract content
        return Task.FromResult($"Extracted content from {url}");
    }

    public Task<string> CreateTextReportAsync(string content)
    {
        Console.WriteLine($"Creating text report from content: {content.Substring(0, Math.Min(50, content.Length))}");
        // Dummy implementation - would actually format the content into a report
        string reportText = $"NEWS REPORT\n\nDate: {DateTime.Now}\n\nCONTENT:\n{content}\n\nEND OF REPORT";
        Console.WriteLine("Text report created successfully");
        return Task.FromResult(reportText);
    }

    public Task SendEmailReportAsync(string reportText, string recipientEmail = "recipient@example.com")
    {
        Console.WriteLine($"Sending email with text report to {recipientEmail}");
        Console.WriteLine($"Report length: {reportText.Length} characters");
        // Dummy implementation - would actually send an email with the report text
        return Task.CompletedTask;
    }
}

```

## Calling the Activities from the Flow

Use Temporal.io Workflow.ExecuteActivityAsync to call the above activities from the flow.

`NewsReportFlow.cs >`

```csharp
using Microsoft.Extensions.Logging;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("News Report Flow")]
public class NewsReportFlow : FlowBase
{
    private readonly ActivityOptions _activityOptions = new()
    {
        StartToCloseTimeout = TimeSpan.FromMinutes(5)
    };

    [WorkflowRun]
    public async Task<string> Run(string newsUrl, string recipientEmail)
    {
        Workflow.Logger.LogInformation("Starting News Report Flow for URL: {Url}", newsUrl);

        // Step 1: Extract content from the URL
        var content = await Workflow.ExecuteActivityAsync(
            (INewsActivities act) => act.ExtractContentFromUrlAsync(newsUrl), _activityOptions);

        Workflow.Logger.LogInformation("Content extracted successfully");

        // Step 2: Create a text report from the content
        var reportText = await Workflow.ExecuteActivityAsync(
            (INewsActivities act) => act.CreateTextReportAsync(content), _activityOptions);

        Workflow.Logger.LogInformation("Text report created successfully");

        // Step 3: Send an email with the text report
        await Workflow.ExecuteActivityAsync(
            (INewsActivities act) => act.SendEmailReportAsync(reportText, recipientEmail), _activityOptions);

        Workflow.Logger.LogInformation("Email sent successfully to: {RecipientEmail}", recipientEmail);

        return reportText;
    }
}
```

## Adding the Activities to the Flow

Update `Program.cs` to include the activities:

`Program.cs >`

```csharp

...

// Create a new runner for the news report flow
var newsReportFlow = new Runner<NewsReportFlow>(agentInfo);

// ****** Add the activities to the flow ******
newsReportFlow.AddFlowActivities<INewsActivities, NewsActivities>();

...

```

## Running the Flow

Now you can run the flow again to see the activities in action.

```bash
dotnet run
```

Now on the portal, navigate to `Agent Definitions` and `Activate` a flow. Then observe the workflow getting executed under `Agent Runs` tab.

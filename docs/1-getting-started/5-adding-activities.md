# Adding Capabilities to Your Bot

Capabilities are function calls that can be executed upon user request. They extend your bot's functionality, allowing it to perform specific actions or access particular services.

## Adding Activities

Activities are the individual steps in a business process flow. They are the building blocks of the flow. We will use the following activities in our flow:

- ExtractContentFromUrlAsync: Extracts the content from a URL
- CreateTextReportAsync: Creates a text report from the content
- SendEmailReportAsync: Sends the text report to the recipient

```csharp
using Temporalio.Activities;
using Microsoft.Extensions.Logging;

namespace XiansAi.Flow
{
    public class NewsActivities
    {
        private readonly ILogger<NewsActivities> _logger;

        public NewsActivities(ILogger<NewsActivities> logger)
        {
            _logger = logger;
        }

        [Activity]
        public Task<string> ExtractContentFromUrlAsync(string url)
        {
            _logger.LogInformation("Extracting content from URL: {Url}", url);
            // Dummy implementation - would actually call a service to extract content
            return Task.FromResult($"Extracted content from {url}");
        }

        [Activity]
        public Task<string> CreateTextReportAsync(string content)
        {
            _logger.LogInformation("Creating text report from content: {ContentPreview}", content.Substring(0, Math.Min(50, content.Length)));
            // Dummy implementation - would actually format the content into a report
            string reportText = $"NEWS REPORT\n\nDate: {DateTime.Now}\n\nCONTENT:\n{content}\n\nEND OF REPORT";
            _logger.LogInformation("Text report created successfully");
            return Task.FromResult(reportText);
        }

        [Activity]
        public Task SendEmailReportAsync(string reportText, string recipientEmail = "recipient@example.com")
        {
            _logger.LogInformation("Sending email with text report to {RecipientEmail}", recipientEmail);
            _logger.LogInformation("Report length: {ReportLength} characters", reportText.Length);
            // Dummy implementation - would actually send an email with the report text
            return Task.CompletedTask;
        }
    }
} 
```

## Adding the Activities to the Flow

`NewsReportFlow.cs>`

```csharp
using Microsoft.Extensions.Logging;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("News Report Flow")]
public class NewsReportFlow : FlowBase
{
    [WorkflowRun]
    public async Task<string> Run(string newsUrl, string recipientEmail)
    {
        Workflow.Logger.LogInformation("Starting News Report Flow for URL: {Url}", newsUrl);

        // Step 1: Extract content from the URL
        var content = await Workflow.ExecuteActivityAsync(
            (NewsActivities act) => act.ExtractContentFromUrlAsync(newsUrl),
            new()
            {
                StartToCloseTimeout = TimeSpan.FromMinutes(5),
                RetryPolicy = new() { MaximumAttempts = 3 }
            });
        
        Workflow.Logger.LogInformation("Content extracted successfully");

        // Step 2: Create a text report from the content
        var reportText = await Workflow.ExecuteActivityAsync(
            (NewsActivities act) => act.CreateTextReportAsync(content),
            new()
            {
                StartToCloseTimeout = TimeSpan.FromMinutes(3),
                RetryPolicy = new() { MaximumAttempts = 2 }
            });
        
        Workflow.Logger.LogInformation("Text report created successfully");

        // Step 3: Send an email with the text report
        await Workflow.ExecuteActivityAsync(
            (NewsActivities act) => act.SendEmailReportAsync(reportText, recipientEmail),
            new()
            {
                StartToCloseTimeout = TimeSpan.FromMinutes(2),
                RetryPolicy = new() { MaximumAttempts = 3 }
            });
        
        Workflow.Logger.LogInformation("Email sent successfully to: {RecipientEmail}", recipientEmail);

        return reportText;
    }
}
```

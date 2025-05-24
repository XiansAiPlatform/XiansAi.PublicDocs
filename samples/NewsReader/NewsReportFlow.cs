using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Temporalio.Workflows;
using XiansAi.Flow;

public class NewsReportRequest
{
    [JsonPropertyName("url")]
    public required string Url { get; set; }
    [JsonPropertyName("recipientEmail")]
    public required string RecipientEmail { get; set; }
    [JsonPropertyName("processKey")]
    public string? ProcessKey { get; set; }
}

[Workflow("My News Reader 2:Report Flow")]
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


    private readonly ActivityOptions _activityOptions = new()
    {
        StartToCloseTimeout = TimeSpan.FromMinutes(5)
    };

    [WorkflowRun]
    public async Task<string> Run()
    {
        await Workflow.WaitConditionAsync(() => _newsRequests.Count > 0);
        var request = _newsRequests.Dequeue();

        Workflow.Logger.LogInformation("Starting News Report Flow for URL: {Url}", request.Url);

        // Step 1: Extract content from the URL
        var content = await Workflow.ExecuteActivityAsync(
            (INewsActivities act) => act.ExtractContentFromUrlAsync(request.Url), _activityOptions);

        Workflow.Logger.LogInformation("Content extracted successfully");

        // Step 2: Create a text report from the content
        var reportText = await Workflow.ExecuteActivityAsync(
            (INewsActivities act) => act.CreateTextReportAsync(content), _activityOptions);

        Workflow.Logger.LogInformation("Text report created successfully");

        // Step 3: Send an email with the text report
        await Workflow.ExecuteActivityAsync(
            (INewsActivities act) => act.SendEmailReportAsync(reportText, request.RecipientEmail), _activityOptions);

        Workflow.Logger.LogInformation("Email sent successfully to: {RecipientEmail}", request.RecipientEmail);

        return reportText;
    }
}
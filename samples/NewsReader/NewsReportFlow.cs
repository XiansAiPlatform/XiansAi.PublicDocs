using Microsoft.Extensions.Logging;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("News Report Flow")]
public class NewsReportFlow : FlowBase
{
    [WorkflowRun]
    public async Task<string> Run(string newsUrl, string recipientEmail)
    {
        Workflow.Logger.LogInformation("Starting News Report Flow for URL: {Url} and recipient email: {RecipientEmail}", newsUrl, recipientEmail);

        return "Report sent successfully";
    }
}
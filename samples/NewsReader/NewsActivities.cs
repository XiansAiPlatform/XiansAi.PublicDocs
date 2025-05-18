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
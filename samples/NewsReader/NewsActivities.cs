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

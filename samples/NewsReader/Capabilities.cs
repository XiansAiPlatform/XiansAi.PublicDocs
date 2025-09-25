using Agentri.Events;
using Agentri.Flow.Router.Plugins;

public static class Capabilities
{
    private static readonly HttpClient _httpClient = new HttpClient();


    [Capability("Send summary report")]
    [Parameter("url", "URL of the news article")]
    [Parameter("recipientEmail", "Email address of the recipient")]
    [Returns("Success message")]
    public static string SendSummaryReport(string url, string recipientEmail)
    {
        EventHub.Publish(
            typeof(NewsReportFlow), 
            NewsReportFlow.SendSummaryReportEvent, 
            new NewsReportRequest { Url = url, RecipientEmail = recipientEmail  }
        );
        return "Success";
    }
    
    [Capability("Get latest news headlines")]
    [Parameter("count", "Number of news items to show (default: 5)")]
    [Returns("List of recent news headlines")]
    public static List<object> GetLatestNewsHeadlines(int count = 5)
    {
        var news = new List<object>
        {
            new 
            {
                title = "News 1",
                summary = "Summary 1"
            },
            new 
            {
                title = "News 2",
                summary = "Summary 2"
            }
        };

        return news;
    }

    [Capability("Search news for a specific term")]
    [Parameter("searchTerm", "Term to search for in news headlines and summaries")]
    [Parameter("count", "Number of news items to show (default: 5)")]
    [Returns("List of news items containing the search term")]
    public static List<object> SearchNews(string searchTerm, int count = 5)
    {
        var news = new List<object>
        {
            new 
            {
                title = "News 1",
                summary = "Summary 1"
            },
            new 
            {
                title = "News 2",
                summary = "Summary 2"
            }
        };

        return news;
    }
    
}
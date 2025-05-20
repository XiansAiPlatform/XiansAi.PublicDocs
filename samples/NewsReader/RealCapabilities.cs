using System.Text.Json;
using XiansAi.Flow.Router.Plugins;

public static class RealCapabilities
{
    private static readonly HttpClient _httpClient = new HttpClient();
    private const string NEWS_API_URL = "https://api.first.org/data/v1/news";
    
    [Capability("Get latest news headlines")]
    [Parameter("count", "Number of news items to show (default: 5)")]
    [Returns("List of recent news headlines")]
    public static async Task<string> GetLatestNewsHeadlines(int count = 5)
    {
        try
        {
            var jsonResponse = await GetNewsData($"?limit={count}");
            return FormatNewsResults(jsonResponse, count);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to retrieve latest news. Error: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
            return $"Failed to retrieve latest news. Error: {ex.Message}";
        }
    }

    [Capability("Search news for a specific term")]
    [Parameter("searchTerm", "Term to search for in news headlines and summaries")]
    [Parameter("count", "Number of news items to show (default: 5)")]
    [Returns("List of news items containing the search term")]
    public static async Task<string> SearchNews(string searchTerm, int count = 5)
    {
        try
        {
            var jsonResponse = await GetNewsData($"?q={Uri.EscapeDataString(searchTerm)}&limit={count}");
            return FormatNewsResults(jsonResponse, count);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to search news for '{searchTerm}'. Error: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
            return $"Failed to search news for '{searchTerm}'. Error: {ex.Message}";
        }
    }
    private static async Task<JsonDocument> GetNewsData(string queryParams = "")
    {
        string url = NEWS_API_URL + queryParams;
        HttpResponseMessage response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    }

    private static string FormatNewsResults(JsonDocument jsonResponse, int count)
    {
        var newsItems = jsonResponse.RootElement.GetProperty("data");
        int totalNews = newsItems.GetArrayLength();
        
        if (totalNews == 0)
        {
            return "No news items found.";
        }

        var result = $"Found {totalNews} news items:\n\n";
        
        for (int i = 0; i < Math.Min(totalNews, count); i++)
        {
            var news = newsItems[i];
            string id = news.TryGetProperty("id", out var idElement) ? idElement.GetRawText() : "N/A";
            string? title = news.TryGetProperty("title", out var titleElement) ? titleElement.GetString() : "No title";
            string? summary = news.TryGetProperty("summary", out var summaryElement) ? summaryElement.GetString() : "No summary available";
            string? published = news.TryGetProperty("published", out var publishedElement) ? publishedElement.GetString() : "No date";
            string? link = news.TryGetProperty("link", out var linkElement) ? linkElement.GetString() : "";

            result += $"{i+1}. {title} (ID: {id})\n";
            result += $"   Published: {published}\n";
            result += $"   Summary: {summary}\n";
            if (!string.IsNullOrEmpty(link))
            {
                result += $"   Link: {link}\n";
            }
            result += "\n";
        }

        if (totalNews > count)
        {
            result += $"(Showing first {count} of {totalNews} results)";
        }

        return result;
    }
    
}
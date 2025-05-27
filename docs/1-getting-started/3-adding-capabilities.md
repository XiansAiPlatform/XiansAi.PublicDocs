# Adding Capabilities to Your Bot

Capabilities are function calls that can be executed upon user request. They extend your bot's functionality, allowing it to perform specific actions or access particular services.

## Ways to Add Capabilities

You can add capabilities to your bot in two ways:

1. By creating a new class that implements the capability
2. Through the Model Configuration Protocol (MCP)

In this guide, we'll focus on the first approach: adding a capability through a new class.

## Adding a Capability Class

1. Create a new class file in your agent project
2. Implement the required functions for capabilities
3. Describe the functions that will be available to the bot

Here's an example of a simple capability class:

```csharp
using XiansAi.Flow.Router.Plugins;

public static class Capabilities
{    
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
```

## Configure the Bot to Use the New Capability

Register your capability class in your bot's configuration:

```csharp
using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("News Reader Agent");

var bot = agent.AddBot<NewsReaderBot>();
bot.AddCapabilities(typeof(Capabilities));

await agent.RunAsync();
```

## Testing the New Capability

After deploying your updated bot, you can test the capability by:

1. Opening your bot in the portal
2. Requesting the bot to use the capability, for example:
   - "What are the latest news headlines?"
   - "Search for news about AI"

The bot should recognize these requests and invoke your capability's `GetLatestNewsHeadlines` or `SearchNews` method with the appropriate parameters.

## Real World Implementations

In a real world implementation, you would use a news API to get the latest news headlines and search for news about a specific term. Capabilities are running as Temporal activities, and therefore you can use any IO operation to get the data you need.

```csharp
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

```

## Best Practices

- Keep capabilities focused on specific functionality
- Use descriptive names for your capability methods
- Include proper documentation using XML comments
- Implement proper error handling in your capability methods
- Consider adding validation for input parameters

## Next Steps

- [New Business Process](4-new-business-process.md)

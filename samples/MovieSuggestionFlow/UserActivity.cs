using System.Text.Json;
using Agentri.Activity;

public class UserActivity : ActivityBase, IUserActivity
{
    private readonly HttpClient _client = new HttpClient();

    private static string URL = "https://jsonplaceholder.typicode.com/users/{0}";

    public async Task<string?> GetUserNameAsync(int id)
    {
        var response = await _client.GetStringAsync(string.Format(URL, id));

        return JsonSerializer.Deserialize<JsonDocument>(response)?.RootElement.GetProperty("name").GetString();
    }
}
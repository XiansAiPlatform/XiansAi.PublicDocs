using System.Text.Json;
using Agentri.Activity;
using System.Text;

public class ComposerActivity : ActivityBase, IComposerActivity 
{
    private static string URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={0}";

    public async Task<string?> GeneratePoemAsync(string keywords)
    {
        var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        var url = string.Format(URL, apiKey);

        var instruction = await GetInstructionAsync() ?? throw new Exception("Instruction not found");
        LogInfo($"Instruction from server: {instruction}");

        var jsonPayload = CreateJsonPayload(instruction, keywords);
        var jsonContent = new StringContent(JsonSerializer.Serialize(jsonPayload), Encoding.UTF8, "application/json");
        var response = await new HttpClient().PostAsync(url, jsonContent);
        var responseContent = await response.Content.ReadAsStringAsync();
        return ExtractPoemFromResponse(responseContent);
    }

    private object CreateJsonPayload(string instruction, string keywords)
    {
        return new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = instruction },
                        new { text = keywords }
                    }
                }
            }
        };
    }

    private string? ExtractPoemFromResponse(string responseContent)
    {
        var result = JsonSerializer.Deserialize<JsonDocument>(responseContent);

        // Navigate through the JSON structure to get the poem text
        var candidates = result?.RootElement.GetProperty("candidates");
        if (candidates.HasValue && candidates.Value.GetArrayLength() > 0)
        {
            var content = candidates.Value[0].GetProperty("content");
            var parts = content.GetProperty("parts");
            if (parts.GetArrayLength() > 0)
            {
                return parts[0].GetProperty("text").GetString();
            }
        }
        return null;
    }

    
}
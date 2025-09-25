using Temporalio.Activities;
using Temporalio.Workflows;
using Agentri.Activity;
using Agentri.Flow;
using System.Text.Json.Serialization;

[Workflow("LinkedIn Reader")]
public class LinkedInReaderFlow: FlowBase
{
    [WorkflowRun]
    public async Task<LinkedInCompany?> Run(string companyName)
    {
        var linkedInUrl = await RunActivityAsync((IUrlSearchActivity activity) => activity.FindLinkedInUrl(companyName));
        if (linkedInUrl == null)
        {
            Console.WriteLine($"Failed to find LinkedIn URL for {companyName}");
            return null;
        }
        var company = await RunActivityAsync((IWebReaderActivity activity) => activity.ReadLinkedInPage(linkedInUrl));
        return company;
    }
}

[Agent("Agentri.Agent.GoogleSearch", AgentType.Package)]
public interface IUrlSearchActivity
{
    [Activity]
    Task<string?> FindLinkedInUrl(string companyName);
}

[Agent("xiansai/web-reader-agent", AgentType.Docker)]
public interface IWebReaderActivity
{
    [Activity]
    [Knowledge("How to Read LinkedIn Company Pages")]
    Task<LinkedInCompany?> ReadLinkedInPage(string url);
}

public class LinkedInCompany
{
    [JsonPropertyName("company_name")]
    public string? Name { get; set; }

    [JsonPropertyName("company_url")]
    public string? Url { get; set; }

    [JsonPropertyName("industry")]
    public string? Industry { get; set; }

    [JsonPropertyName("company_size")]
    public string? CompanySize { get; set; }

    [JsonPropertyName("headquarters")]
    public string? Headquarters { get; set; }

    [JsonPropertyName("company_type")]
    public string? CompanyType { get; set; }

    [JsonPropertyName("specialties")]
    public List<string>? Specialties { get; set; }
}
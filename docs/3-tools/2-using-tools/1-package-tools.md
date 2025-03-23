# Using Package Agents

Package agents are pre-built components distributed as NuGet packages that seamlessly integrate into Xians.ai activities through the .NET SDK interface. They provide ready-to-use functionality that can be easily incorporated into your workflows.

## Installation

Install the agent package into your project using the .NET CLI:

```bash
dotnet add package <package-name>
```

## Implementation Guide

### 1. Define the Activity Interface

Add the `Agent` attribute to your activity interface to enable proper integration with the Xians.ai Portal:

```csharp
[AgentTool("XiansAi.Agent.GoogleSearch", AgentToolType.Package)]
public interface IUrlSearchActivity
{
    [Activity]
    Task<string?> FindLinkedInUrl(string companyName);
}
```

The `AgentTool` attribute requires two parameters:

- `Name`: The fully qualified name of the package (Only used for information in the Xians.ai Portal)
- `Type`: Set to `AgentToolType.Package` for package tools

In the case of a package tool, this only serves information to the Xians.ai Portal. This attribute has no impact on the runtime of the workflow.

### 2. Implement the Activity

Create a class that inherits from `ActivityBase` and implements your interface:

```csharp
public class UrlSearchActivity : ActivityBase, IUrlSearchActivity
{
    private readonly ISearchAgent _searchAgent;

    public UrlSearchActivity()
    {
        var apiKey = Environment.GetEnvironmentVariable("API_KEY");
        // use the Nuget package to create an instance of the agent
        _searchAgent = new GoogleSearchAgent(apiKey); // This is a hypothetical agent that we are using as an example
    }

    public async Task<string?> FindLinkedInUrl(string companyName)
    {
        // Utilize the agent's functionality
        var results = await _searchAgent.SearchAsync($"site:linkedin.com {companyName} company");
        return results.FirstOrDefault()?.Url;
    }
}
```

## Best Practices

- Always check the package documentation for specific configuration requirements
- Handle potential exceptions from agent operations

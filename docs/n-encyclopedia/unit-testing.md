# Unit Testing Xians Router Capabilities

This guide covers how to unit test capabilities that use the Xians semantic router framework.

## Test Class Setup

### Required Imports

```csharp
using AgentTools;
using DotNetEnv;
using System.Reflection;
using XiansAi.Flow;
using XiansAi.Flow.Router;
```

### Environment Variables & Context Setup

```csharp
public class MyCapabilitiesTests
{
    RouterOptions routerOptions = new RouterOptions {
        ProviderName = "openai",
        ApiKey = Env.GetString("OPENAI_API_KEY"),
        ModelName = "gpt-4o-mini",
    };

    static MyCapabilitiesTests()
    {
        // Load environment variables from project root
        var assemblyLocation = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        var projectRoot = Path.GetFullPath(Path.Combine(assemblyLocation!, "..", "..", "..", ".."));
        var envPath = Path.Combine(projectRoot, ".env");
        Env.Load(envPath);

        // Set dummy agent userId and workflowId for testing
        AgentContext.SetLocalContext("test-user", "test-tenant:test-agent:test-workflow");

        // Initialize agents and bots for semantic router
        var agent = new Agent("TestAgent");
        var webBot = agent.AddBot<WebBot>(numberOfWorkers: 3);
        webBot.AddCapabilities(typeof(MyCapability));
        
        var reporterBot = agent.AddBot<ReporterBot>();
        reporterBot.AddKernelModifier(new PdfGeneratorMCP());
    }
}

```

## Environment Configuration

### Required .env Variables

```bash
LOCAL_KNOWLEDGE_FOLDER=./local_knowledge  # Reduces server dependencies
...
```

Benefits of LOCAL_KNOWLEDGE_FOLDER is that it reduces external server dependencies during testing. See [Local Development](../3-knowledge/4-local-dev.md) for more details.

## Test Categories

### Unit Tests

```csharp
[Theory]
[Trait("Category", "Unit")]
[InlineData("test input", "expected output")]
public async Task MyMethod_WithValidInput_ShouldReturnExpectedOutput(string input, string expected)
{
    // Act
    var result = await new MyCapabilities(routerOptions).MyMethod(input);
    
    // Assert
    Assert.Equal(expected, result);
}
```

### Testing Agent-to-Agent Communication

Agent2Agent chat message passing works seamlessly in unit tests when both agents are in the same .NET process. No special configuration needed.


```csharp
public class MyCapabilities
{
    private readonly RouterOptions _routerOptions;
    
    public MyCapabilities(RouterOptions routerOptions)
    {
        _routerOptions = routerOptions;
    }
    
    
    [Capability("Determine if a company is a software product company (ISV) and is a small or medium enterprise (SME)")]
    [Parameter("companyWebsite", "Website of the company to determine if it is a software product company (ISV)")]
    [Returns("True if the company is a software product company (ISV), false otherwise")]
    public async Task<bool> IsSMEProductCompany(Uri companyWebsite) {
        var instruction = @$"
            Url: {companyWebsite}
            Read the content of the above url and return the content in markdown format.
            Return the content in English.
            Do not return any other text.
            First try/retry with scraping tools. If fails try web automation tools. If still fails return text 'ERROR: <reason>'.
        ";
        // Call WebBot Agent to extract the content
        var siteContent = await MessageHub.Agent2Agent.SendChat(typeof(WebBot), instruction);
        if (string.IsNullOrEmpty(siteContent.Text) || siteContent.Text.StartsWith("ERROR"))
        {
            throw new Exception($"Error occurred in reading page content from: {companyWebsite}: {siteContent.Text}");
        }
        return await IsSMEProductCompany(siteContent.Text);
    }
}
```

## Running Tests

```bash
# Run specific test
dotnet test --filter "FullyQualifiedName~MyMethod_WithValidInput"

# Run by category
dotnet test --filter "Category=Unit"
dotnet test --filter "Category=Integration"
```

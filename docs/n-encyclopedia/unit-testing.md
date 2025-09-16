# Unit Testing Xians Router Capabilities

This guide covers how to unit test capabilities that use the Xians semantic router framework.

## Test Class Setup

### Required Imports

```csharp
using AgentTools;
using DotNetEnv;
using Server;
using System.Reflection;
using XiansAi.Flow;
using XiansAi.Flow.Router;
```

### Environment Variables & Context Setup

```csharp
public class MyCapabilitiesTests
{
    /// <summary>
    /// Run with: dotnet test --filter "FullyQualifiedName~MyCapabilitiesTests"
    /// </summary>
    static MyCapabilitiesTests()
    {
        // Load environment variables once for the entire test suite
        var assemblyLocation = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        var projectRoot = Path.GetFullPath(Path.Combine(assemblyLocation!, "..", "..", "..", ".."));
        var envPath = Path.Combine(projectRoot, ".env");
        Env.Load(envPath);

        // Set agent context for testing
        AgentContext.SetLocalContext("test-user", "test-tenant:test-agent:test-workflow");
        AgentContext.RouterOptions = new RouterOptions {
            ProviderName = "openai",
            ApiKey = Env.GetString("OPENAI_API_KEY"),
            ModelName = "gpt-4o-mini",
        };

        // Create agent and add capabilities
        var agent = new Agent("TestAgent");
        
        // Add web bot with capabilities
        var webBot = agent.AddBot<WebBot>(numberOfWorkers: 3);
        webBot.AddCapabilities(typeof(MyCapability));
        webBot.AddCapabilities(typeof(FirecrawlCapability));
        webBot.AddCapabilities(typeof(GoogleSearchCapability));
        webBot.AddKernelModifier(new PlayWrightMCP());

        // Add reporter bot with kernel modifiers
        var reporterBot = agent.AddBot<ReporterBot>();
        reporterBot.AddKernelModifier(new MicrosoftO365MCP());
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
/// <summary>
/// Run with: dotnet test --filter "FullyQualifiedName~MyMethod_WithValidInput_ShouldReturnExpectedOutput"
/// </summary>
[Theory]
[Trait("Category", "Unit")]
[InlineData("test input", "expected output")]
public async Task MyMethod_WithValidInput_ShouldReturnExpectedOutput(string input, string expected)
{
    // Act
    var result = await new MyCapabilities().MyMethod(input);
    
    // Assert
    Assert.Equal(expected, result);
}
```

### Integration Tests

Integration tests require API keys and network access to external services:

```csharp
/// <summary>
/// Run with: dotnet test --filter "FullyQualifiedName~MyIntegrationMethod_WithValidInput_ShouldReturnExpectedResult"
/// </summary>
[Theory]
[Trait("Category", "Integration")]
[InlineData("https://example.com", "Expected Company")]
public async Task MyIntegrationMethod_WithValidInput_ShouldReturnExpectedResult(string url, string expectedCompany)
{
    // Act
    var result = await new MyCapabilities().MyIntegrationMethod(new Uri(url));
    
    // Assert
    Assert.Equal(expectedCompany, result);
    
    // Additional assertions for integration tests
    Assert.NotNull(result);
    Assert.NotEmpty(result);
    
    Console.WriteLine($"Result: {result}");
}
```

### Testing Agent-to-Agent Communication

Agent2Agent chat message passing works seamlessly in unit tests when both agents are in the same .NET process. No special configuration needed.

```csharp
public class MyCapabilities
{
    [Capability("Determine if a company is a software product company (ISV) and is a small or medium enterprise (SME)")]
    [Parameter("companyWebsite", "Website of the company to determine if it is a software product company (ISV)")]
    [Returns("True if the company is a software product company (ISV), false otherwise")]
    public async Task<bool> IsSMEProductCompany(Uri companyWebsite) 
    {
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

### Test Cleanup and File Management

For tests that create temporary files, always use proper cleanup:

```csharp
[Theory]
[Trait("Category", "Unit")]
[InlineData("# Test Content")]
public async Task SaveAsMarkdown_WithValidContent_ShouldCreateFile(string content)
{
    string? filePath = null;
    
    try
    {
        // Act
        filePath = await new MyCapabilities().SaveAsMarkdown(content);
        
        // Assert
        Assert.NotNull(filePath);
        Assert.True(File.Exists(filePath));
        Assert.EndsWith(".md", filePath);
        
        var savedContent = await File.ReadAllTextAsync(filePath);
        Assert.Equal(content, savedContent);
    }
    finally
    {
        // Clean up: Delete the created file
        if (filePath != null && File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
}
```

## Running Tests

```bash
# Run entire test class
dotnet test --filter "FullyQualifiedName~MyCapabilitiesTests"

# Run specific test method
dotnet test --filter "FullyQualifiedName~MyMethod_WithValidInput_ShouldReturnExpectedOutput"

# Run by category
dotnet test --filter "Category=Unit"
dotnet test --filter "Category=Integration"

# Run with console output for debugging
dotnet test --filter "FullyQualifiedName~MyMethod_WithValidInput" --logger "console;verbosity=detailed"
```

## Key Changes from Previous Setup

1. **RouterOptions moved to AgentContext**: Router options are now set globally on `AgentContext.RouterOptions` instead of being passed to capability constructors
2. **Static constructor setup**: All agent and bot initialization happens once in the static constructor
3. **No constructor parameters**: Capability classes no longer need RouterOptions constructor parameters
4. **Enhanced bot setup**: More comprehensive bot configuration with multiple capabilities and kernel modifiers
5. **Better test organization**: Clear separation between Unit and Integration test categories with appropriate traits

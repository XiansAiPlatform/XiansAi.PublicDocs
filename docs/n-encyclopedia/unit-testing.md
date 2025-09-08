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
OPENAI_API_KEY=your_openai_key
LOCAL_KNOWLEDGE_FOLDER=./local_knowledge  # Reduces server dependencies
```

### Benefits of LOCAL_KNOWLEDGE_FOLDER

- Reduces external server dependencies during testing
- Enables offline testing with cached knowledge
- Faster test execution

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

### Integration Tests

```csharp
[Theory]
[Trait("Category", "Integration")]
[InlineData("https://example.com", 100)]
public async Task MyMethod_WithRealData_ShouldReturnValidResult(string url, int minLength)
{
    // Act
    var result = await new MyCapabilities(routerOptions).ExtractContent(new Uri(url));
    
    // Assert
    Assert.NotNull(result);
    Assert.True(result.Length >= minLength);
}
```

## Agent-to-Agent Communication

Agent2Agent chat message passing works seamlessly in unit tests when both agents are in the same .NET process. No special configuration needed.

### Example Capability with Agent-to-Agent Call

```csharp
public class MyCapabilities
{
    private readonly RouterOptions _routerOptions;
    
    public MyCapabilities(RouterOptions routerOptions)
    {
        _routerOptions = routerOptions;
    }
    
    [KernelFunction("generate_and_convert_report")]
    [Description("Generates a markdown report and converts it to PDF")]
    public async Task<string> GenerateAndConvertReport(string companyName, string data)
    {
        // Step 1: Generate markdown report using semantic router
        var router = new SemanticRouter(_routerOptions);
        var markdownContent = await router.RouteAsync(
            $"Generate a professional report for {companyName} with this data: {data}",
            "WebBot"
        );
        
        // Step 2: Agent-to-Agent call to convert to PDF
        var pdfPath = await router.RouteAsync(
            $"Convert this markdown to PDF: {markdownContent}",
            "ReporterBot"
        );
        
        return pdfPath;
    }
}
```

### Testing Agent-to-Agent Communication

```csharp
[Theory]
[Trait("Category", "Integration")]
[InlineData("Acme Corp", "Revenue: $1M, Employees: 50, Founded: 2020")]
public async Task GenerateAndConvertReport_WithValidData_ShouldReturnPdfPath(
    string companyName, 
    string companyData)
{
    // Arrange
    var capability = new MyCapabilities(routerOptions);
    
    // Act
    var result = await capability.GenerateAndConvertReport(companyName, companyData);
    
    try
    {
        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.EndsWith(".pdf", result, StringComparison.OrdinalIgnoreCase);
        Assert.True(File.Exists(result), $"PDF file should exist at: {result}");
        
        Console.WriteLine($"Generated PDF: {result}");
        
        // Verify PDF is not empty
        var fileInfo = new FileInfo(result);
        Assert.True(fileInfo.Length > 0, "PDF should not be empty");
    }
    finally
    {
        // Cleanup
        if (File.Exists(result))
        {
            File.Delete(result);
        }
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

## Best Practices

1. **Static Constructor**: Use static constructor for one-time setup per test class
2. **Router Options**: Pass `RouterOptions` to capabilities for LLM configuration
3. **Test Categories**: Use `[Trait("Category", "Unit|Integration")]` to separate test types
4. **Cleanup**: Use try/finally blocks for file cleanup in tests that create temporary files
5. **Assertions**: Include descriptive error messages in assertions
6. **Console Output**: Use `Console.WriteLine()` for debugging test results

## Example Test Structure

```csharp
[Theory]
[Trait("Category", "Integration")]
[InlineData("input", "expected")]
public async Task MethodName_WithCondition_ShouldExpectedBehavior(string input, string expected)
{
    // Arrange
    var capability = new MyCapabilities(routerOptions);
    
    // Act
    var result = await capability.MyMethod(input);
    
    // Assert
    Assert.NotNull(result);
    Assert.Equal(expected, result);
    Console.WriteLine($"Result: {result}");
}
```

This setup ensures your capability tests can leverage the full power of the Xians semantic router while maintaining fast, reliable test execution.

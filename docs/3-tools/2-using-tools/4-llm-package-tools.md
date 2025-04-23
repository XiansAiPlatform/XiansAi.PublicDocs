# Using LLM Package Tools

LLM (Large Language Model) package tools provide advanced natural language processing capabilities that can be seamlessly integrated into Xians.ai activities through the .NET SDK interface. These tools enable functionalities such as summarization, text generation, and more.

## Installation

Install the LLM package into your project using the .NET CLI:

```bash
dotnet add package AgentTools.Llm
```

## Implementation Guide

### 1. Define the Activity Interface

Define an activity interface and annotate it with the `AgentTool` attribute to enable integration with the Xians.ai Portal. Use the `Knowledge` attribute to provide metadata about the activity's purpose.

```csharp
[AgentTool("AgentTools.Llm", AgentToolType.Package)]
public interface IMedicalBriefCompilationActivity
{
    [Activity]
    [Knowledge("How To Summarize Patient Information")]
    Task<string> SummarizePatientInformation(string content);
}
```

### 2. Setting Up the LLM Instance

To use the LLM package, you need to initialize an LLM provider instance. Follow these steps:

1. **Retrieve the API Key**: Use the `Env.GetString` method to load the `OPENAI_API_KEY` from your environment variables. Ensure the key is set up correctly in your environment.

2. **Instantiate the Provider**: Use the `OpenAiProvider` class to create an instance of the LLM provider. Specify the API key, model name (e.g., `gpt-4o`), and provider ID.

```csharp
var apiKey = Env.GetString("OPENAI_API_KEY");
if (string.IsNullOrWhiteSpace(apiKey))
{
    throw new InvalidOperationException("OPENAI_API_KEY environment variable is not set.");
}

var llmProvider = new OpenAiProvider(
    apiKey: apiKey,
    modelName: "gpt-4o",
    providerId: "gpt-4o"
);
```

### 3. Making LLM Calls

Once the LLM provider is set up, you can make calls to generate completions. Follow these steps:

1. **Build the Prompt**: Use a `StringBuilder` to construct the input prompt. Include any necessary instructions and the content to be processed.

2. **Call the Provider**: Use the `GenerateCompletionAsync` method of the LLM provider to send the prompt and receive the response. Configure options such as `Instructions` and `MaxTokens` as needed.

3. **Handle the Response**: Check the response for validity and handle any errors appropriately.

```csharp
var promptBuilder = new StringBuilder()
    .AppendLine("Please summarize the following patient information:")
    .AppendLine()
    .AppendLine(content);
var prompt = promptBuilder.ToString();

var result = await llmProvider.GenerateCompletionAsync(
    prompt,
    new CompletionOptions
    {
        Instructions = instructions,
        MaxTokens = 2000
    }
);

if (string.IsNullOrWhiteSpace(result))
    throw new InvalidOperationException("LLM returned an empty summary.");
```

### Full Code Example

Below is the complete implementation of an activity using the `AgentTools.Llm` package:

```csharp
using Temporalio.Activities;
using DotNetEnv;
using XiansAi.Activity;
using Microsoft.Extensions.Logging;
using System.Text;
using AgentTools.Llm.Providers;
using AgentTools.Llm.Interfaces;
using AgentTools.Llm.Models;

namespace XiansAi.Noteless.Activities;

// Use the AgentTools.Llm package via NuGet/Package reference
[AgentTool("AgentTools.Llm", AgentToolType.Package)]
public interface IMedicalBriefCompilationActivity
{
    [Activity]
    [Knowledge("How To Summarize Patient Information")]
    Task<string> SummarizePatientInformation(string content);
}

public class MedicalBriefCompilationActivity : ActivityBase, IMedicalBriefCompilationActivity
{
    private readonly ILogger<MedicalBriefCompilationActivity> _logger;
    private readonly ILlmProvider _llmProvider;

    public MedicalBriefCompilationActivity()
    {
        // Initialize console logger
        _logger = LoggerFactory
            .Create(builder => builder.AddConsole())
            .CreateLogger<MedicalBriefCompilationActivity>();

        // Load OpenAI API key from environment
        var apiKey = Env.GetString("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("OPENAI_API_KEY environment variable is not set.");
        }

        // Directly instantiate the OpenAI LLM provider
        _llmProvider = new OpenAiProvider(
            apiKey: apiKey,
            modelName: "gpt-4o",            
            providerId: "gpt-4o"
        );
    }

    public async Task<string> SummarizePatientInformation(string content)
    {
        _logger.LogInformation("Summarizing patient information with AgentTools.Llm...");

        // Load the instruction template from your assets
        var instructions = await GetInstructionAsync();

        // Build the prompt
        var promptBuilder = new StringBuilder()
            .AppendLine("Please summarize the following patient information:")
            .AppendLine()                
            .AppendLine(content);
        var prompt = promptBuilder.ToString();

        // Call the provider
        var result = await _llmProvider.GenerateCompletionAsync(
            prompt,
            new CompletionOptions
            {
                Instructions = instructions,
                MaxTokens = 2000
            }
        );

        if (string.IsNullOrWhiteSpace(result))
            throw new InvalidOperationException("LLM returned an empty summary.");

        _logger.LogInformation("LLM response: {Response}", result.Trim());
        return result.Trim();
    }
}
```

### Best Practices

- Always check the package documentation for specific configuration requirements.
- Handle potential exceptions from LLM operations.
- Use meaningful prompts and instructions to achieve the desired output.
- Ensure sensitive data is handled securely when interacting with LLMs.

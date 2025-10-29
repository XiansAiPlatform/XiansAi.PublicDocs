# Chat Completion

The Xians platform provides a simple chat completion capability through the `SemanticRouterHub.ChatCompletionAsync` static method. This functionality allows you to send a direct prompt to an LLM and receive a response with optional system instructions, without the complexity of chat history or function calling.

## Overview

The `ChatCompletionAsync` method leverages Microsoft's SemanticKernel framework to provide straightforward LLM interactions. It supports optional system instructions to guide the AI's behavior, but unlike the full routing capabilities, it doesn't include chat history or function calling support, focusing on simple prompt-to-response interactions.

## Usage

```csharp
var response = await SemanticRouterHub.ChatCompletionAsync(prompt, systemInstruction, routerOptions);
```

### Parameters

- **prompt** (string): The direct prompt to send to the LLM
- **systemInstruction** (string, optional): System instruction to guide the AI's behavior. Defaults to empty string
- **routerOptions** (RouterOptions, optional): Configuration options for the completion

## Configuration Options

The `RouterOptions` class allows you to configure the LLM behavior:

```csharp
var routerOptions = new RouterOptions
{
    ProviderName = "openai",           // or "azureopenai"
    ModelName = "gpt-4",
    ApiKey = "your-api-key",
    Temperature = 0.3,                 // Controls randomness (default: 0.3)
    MaxTokens = 1000,                  // Maximum response length (default: 10000)
    HTTPTimeoutSeconds = 300,          // HTTP timeout (default: 5 minutes)
    HistorySizeToFetch = 10,           // History size to fetch (default: 10)
    WelcomeMessage = "Hello!",         // Welcome message for empty prompts
    
    // Token limiting features (prevents context_length_exceeded errors)
    TokenLimit = 80000,                // Trigger reduction at 80k tokens (default: 80000)
    TargetTokenCount = 50000,          // Reduce to 50k tokens (default: 50000)
    MaxTokensPerFunctionResult = 10000 // Limit large function results (default: 10000)
};
```

### Available Options

| Property | Description | Default |
|----------|-------------|---------|
| `ProviderName` | LLM provider ("openai", "azureopenai") | From environment/settings |
| `ModelName` | Model to use (e.g., "gpt-4", "gpt-3.5-turbo") | From environment/settings |
| `DeploymentName` | Azure OpenAI deployment name | From environment/settings |
| `Endpoint` | Custom endpoint URL | From environment/settings |
| `ApiKey` | API key for the provider | From environment/settings |
| `Temperature` | Randomness control (0.0-1.0) | 0.3 |
| `MaxTokens` | Maximum tokens in response | 10000 |
| `HTTPTimeoutSeconds` | HTTP timeout in seconds | 300 (5 minutes) |
| `HistorySizeToFetch` | Number of history messages to fetch | 10 |
| `WelcomeMessage` | Message sent for null/empty prompts | null |
| `TokenLimit` | Max tokens before history reduction | 80000 |
| `TargetTokenCount` | Target tokens after reduction | 50000 |
| `MaxTokensPerFunctionResult` | Max tokens per function result | 10000 |

## Example Usage

Here's a practical example from a chat interceptor that analyzes assistant messages:

```csharp
// Basic usage
string prompt = @"Analyze the following assistant message and determine if it contains 
    a direct request for contract information: " + userMessage;

var analysis = await SemanticRouterHub.ChatCompletionAsync(prompt);

// With system instruction
string systemInstruction = "You are a helpful assistant that analyzes messages accurately.";
var detailedAnalysis = await SemanticRouterHub.ChatCompletionAsync(prompt, systemInstruction);

// With full options
var routerOptions = new RouterOptions { Temperature = 0.1, MaxTokens = 500 };
var preciseAnalysis = await SemanticRouterHub.ChatCompletionAsync(prompt, systemInstruction, routerOptions);
```

## Key Characteristics

- **Optional System Instructions**: Supports system instructions to guide AI behavior (defaults to empty string, but underlying implementation uses "You are a helpful assistant. Perform the user's request accurately and concisely." when null/empty)
- **No Chat History**: Each call is independent with no conversation context
- **No Function Calling**: Functions/tools are disabled for simple text responses
- **SemanticKernel Based**: Uses Microsoft SemanticKernel framework internally
- **Provider Agnostic**: Supports OpenAI and Azure OpenAI providers
- **Token Management**: Built-in token limiting to prevent context length errors
- **Configurable Timeouts**: Adjustable HTTP timeouts for different use cases

## When to Use

Use `ChatCompletionAsync` when you need:

- Simple prompt-to-response interactions
- Text analysis or generation tasks
- Independent LLM calls without conversation context
- Quick LLM evaluations or classifications
- System-guided responses without conversation history

For more complex scenarios involving system prompts, chat history, or function calling, use the full routing capabilities instead.
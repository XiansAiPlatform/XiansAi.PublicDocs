# Chat Completion

The Xians platform provides a simple chat completion capability through the `SemanticRouterHub.ChatCompletionAsync` static method. This functionality allows you to send a direct prompt to an LLM and receive a response without the complexity of system prompts or chat history.

## Overview

The `ChatCompletionAsync` method leverages Microsoft's SemanticKernel framework to provide straightforward LLM interactions. Unlike the full routing capabilities that include system prompts, chat history, and function calling, this method focuses on simple prompt-to-response interactions.

## Usage

```csharp
var response = await SemanticRouterHub.ChatCompletionAsync(prompt, options);
```

### Parameters

- **prompt** (string): The direct prompt to send to the LLM
- **options** (RouterOptions, optional): Configuration options for the completion

## Configuration Options

The `RouterOptions` class allows you to configure the LLM behavior:

```csharp
var options = new RouterOptions
{
    ProviderName = "openai",           // or "azureopenai"
    ModelName = "gpt-4",
    ApiKey = "your-api-key",
    Temperature = 0.3,                 // Controls randomness (default: 0.3)
    MaxTokens = 1000                   // Maximum response length (default: 10000)
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

## Example Usage

Here's a practical example from a chat interceptor that analyzes assistant messages:

```csharp
string prompt = @"Analyze the following assistant message and determine if it contains 
    a direct request for contract information: " + userMessage;

var analysis = await SemanticRouterHub.ChatCompletionAsync(prompt);
```

## Key Characteristics

- **No System Prompt**: The method sends only your provided prompt
- **No Chat History**: Each call is independent with no conversation context
- **No Function Calling**: Functions/tools are disabled for simple text responses
- **SemanticKernel Based**: Uses Microsoft SemanticKernel framework internally
- **Provider Agnostic**: Supports OpenAI and Azure OpenAI providers

## When to Use

Use `ChatCompletionAsync` when you need:

- Simple prompt-to-response interactions
- Text analysis or generation tasks
- Independent LLM calls without conversation context
- Quick LLM evaluations or classifications

For more complex scenarios involving system prompts, chat history, or function calling, use the full routing capabilities instead.

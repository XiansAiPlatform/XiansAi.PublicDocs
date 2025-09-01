# Synchronous Chat Messages

Synchronous chat message passing provides a simplified mechanism for agents to send conversational messages directly to other agents. This approach maintains an HTTP connection until the response is received, with a default 5-minute timeout.

## Overview

The `Agent2Agent` class enables workflows to send chat messages synchronously to other workflow agents, supporting:

- **Direct workflow ID/Type targeting**: Send to a specific workflow instance
- **Class-Type-based singleton targeting**: Send to the singleton instance of a workflow type
- **Immediate responses**: Get responses without complex queuing mechanisms
- **Built-in timeout handling**: Configurable timeout (default: 300 seconds)

## Core Interface

```csharp
interface IAgent2Agent {
    Task<MessageResponse> SendChat(string workflowIdOrType, string message, ...);
    Task<MessageResponse> SendChat(Type targetWorkflowType, string message, ...);
}
```

## Usage Patterns

### 1. Send Chat to Specific Workflow

```csharp
// Send chat message to specific workflow instance
var response = await MessageHub.Agent2Agent.SendChat(
    workflowIdOrType: "CustomerServiceAgent-123",
    message: "Please review this customer inquiry and provide a response"
);
```

### 2. Send Chat to Workflow Type (Singleton)

```csharp
// Send chat message to singleton instance of CustomerServiceAgent workflow
var response = await MessageHub.Agent2Agent.SendChat(
    targetWorkflowType: typeof(CustomerServiceFlow),
    message: "Please analyze this customer feedback and categorize it"
);
```

### 3. Chat Messages with Additional Data

```csharp
// Send chat message with optional structured data
var response = await MessageHub.Agent2Agent.SendChat(
    workflowIdOrType: "CustomerServiceAgent",
    message: "Please review this customer inquiry",
    data: new CustomerInquiry { 
        CustomerId = "cust-789", 
        Issue = "Billing question",
        Priority = "High"
    }
);
```

### 4. Advanced Options

```csharp
var response = await MessageHub.Agent2Agent.SendChat(
    targetWorkflowType: typeof(AnalysisBot),
    message: "Analyze the sentiment of this customer feedback",
    requestId: Guid.NewGuid().ToString(),
    scope: "sentiment-analysis",
    authorization: "Bearer token123",
    hint: "urgent-analysis",
    timeoutSeconds: 120  // Custom timeout
);
```

## Real-World Example: Company Name Extraction

Here's a practical example of using synchronous chat to delegate natural language processing tasks:

```csharp
[Capability("Extract the name of the company of interest from an online link, if any")]
[Parameter("url", "URL of the website to extract company of interest from")]
[Returns("Name of the company of interest. If no company is found, return `not-found`.")]
public async Task<string?> ExtractCompanyNameFromLink(string url)
{
    var prompt = @$"
    Read the content in the following link: {url}
    Check if the content mentions about a company.
    If so, extract the name of the company.
    Return the name of the company. If no company is found, return `not-found`.
    Do not return any other text.
    ";
    var response = await MessageHub.Agent2Agent.SendChat(typeof(WebBot), prompt);
    return response.Text;
}
```

This example demonstrates:

- **Task delegation**: Delegating web content analysis to a specialized WebBot agent
- **Clear instructions**: Providing specific prompts for the target agent
- **Simple response handling**: Extracting the text response directly

## Message Response Handling

```csharp
var response = await MessageHub.Agent2Agent.SendChat(...);

if (response != null)
{
    // Handle successful response
    var chatResponse = response.Text;
    var additionalData = response.Data;
    
    // Process the natural language response
    Console.WriteLine($"Agent responded: {chatResponse}");
}
else
{
    // Handle timeout or no response
    _logger.LogWarning("No response received from target agent");
}
```

!!! example "Sample Implementation"
    See a complete working example of agent-to-agent synchronous chat communication at [GitHub Samples](https://github.com/XiansAiPlatform/samples/tree/main/a2a-communications).

This synchronous chat approach provides a powerful way to leverage the conversational capabilities of different agents while maintaining simple, direct communication patterns.

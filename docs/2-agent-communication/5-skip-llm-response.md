# Skipping Semantic Kernel Response

## Overview

In some scenarios, you may want to prevent Semantic Kernel from automatically sending its default response to the user. This can be useful when your capability needs to handle the response manually, send custom formatted messages, or when no response is needed at all.

The Xians AI platform provides a way to skip the automatic Semantic Kernel response by setting the `SkipResponse` property on the `MessageThread` instance.

## When to Skip Responses

You might want to skip the automatic response in the following scenarios:

- **Silent Handoffs**: When transferring a conversation to another agent without the current agent sending a response
- **Custom Response Handling**: When you need to send a specially formatted response using `SendChat` or `SendData`
- **Silent Operations**: When performing background tasks that don't require user feedback
- **Multi-step Processes**: When the capability is part of a larger workflow that will respond later
- **Error Handling**: When you want to handle errors gracefully without confusing automatic responses
- **Data Processing**: When processing data that doesn't require immediate user notification

## Implementation

To skip the Semantic Kernel response, set the `SkipResponse` property to `true` in your capability class:

```csharp
using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;

public class ProcessingCapabilities
{
    private readonly MessageThread _messageThread;
    
    public ProcessingCapabilities(MessageThread messageThread)
    {
        _messageThread = messageThread;
    }

    [Capability("Process data without sending automatic response")]
    [Parameter("data", "The data to process")]
    [Returns("Processing result")]
    public async Task<string> ProcessDataSilently(string data)
    {
        // Skip the automatic Semantic Kernel response
        _messageThread.SkipResponse = true;
        
        // Perform your processing logic
        var result = ProcessData(data);
        
        // Optionally send a custom response if needed
        if (result.RequiresNotification)
        {
            await _messageThread.SendChat($"Processing completed: {result.Summary}");
        }
        
        return result.Details;
    }

    [Capability("Handle user request with custom response format")]
    [Parameter("request", "The user request")]
    [Returns("Status of the operation")]
    public async Task<string> HandleCustomResponse(string request)
    {
        // Skip automatic response to handle manually
        _messageThread.SkipResponse = true;
        
        try
        {
            var response = await ProcessRequest(request);
            
            // Send formatted response with metadata
            var metadata = new {
                timestamp = DateTime.UtcNow,
                requestType = "custom",
                status = "success"
            };
            
            await _messageThread.SendChat(response.Message, metadata);
            return "Success";
        }
        catch (Exception ex)
        {
            // Send error message manually
            await _messageThread.SendChat($"An error occurred: {ex.Message}");
            return "Error";
        }
    }
}
```

## Usage Patterns

### 1. Silent Handoffs

This is one of the most important use cases for skipping responses. When one agent hands off to another agent, the first agent should skip its response to prevent duplicate or confusing messages to the user.

```csharp
[Capability("Transfer conversation to specialized support agent")]
[Parameter("userQuery", "The user's original query")]
[Parameter("context", "Additional context for the handoff")]
public async Task<string> HandoffToSupportAgent(string userQuery, string context = "")
{
    // Skip response from this agent since the target agent will handle communication
    _messageThread.SkipResponse = true;
    
    // Prepare handoff context
    var handoffMessage = string.IsNullOrEmpty(context) 
        ? userQuery 
        : $"{userQuery}\n\nContext: {context}";
    
    // Perform the handoff
    _messageThread.SendHandoff(typeof(SupportBot), handoffMessage);
    
    return "Handoff completed to support agent";
}

[Capability("Route technical queries to engineering team")]
[Parameter("technicalQuery", "The technical question from the user")]
[Parameter("urgency", "Priority level: low, medium, high")]
public async Task<string> RouteToEngineering(string technicalQuery, string urgency = "medium")
{
    // Silent handoff - no response from routing agent
    _messageThread.SkipResponse = true;
    
    // Add routing metadata to the handoff
    var routingContext = $"Priority: {urgency}\nQuery: {technicalQuery}";
    
    // Hand off to engineering bot
    _messageThread.SendHandoff(typeof(EngineeringBot), routingContext);
    
    return $"Routed to engineering with {urgency} priority";
}

[Capability("Escalate complex issues to human agent")]
[Parameter("issue", "Description of the complex issue")]
[Parameter("previousAttempts", "What has been tried so far")]
public async Task<string> EscalateToHuman(string issue, string previousAttempts = "")
{
    _messageThread.SkipResponse = true;
    
    var escalationContext = $"Issue: {issue}";
    if (!string.IsNullOrEmpty(previousAttempts))
    {
        escalationContext += $"\nPrevious attempts: {previousAttempts}";
    }
    
    // Handoff to human agent workflow
    _messageThread.SendHandoff(typeof(HumanAgentBot), escalationContext);
    
    return "Escalated to human agent";
}
```

### 2. Silent Background Processing

```csharp
[Capability("Start background task")]
[Parameter("taskData", "Data for the background task")]
public async Task<string> StartBackgroundTask(string taskData)
{
    _messageThread.SkipResponse = true;
    
    // Start the task without immediate response
    _ = Task.Run(async () => await ProcessInBackground(taskData));
    
    return "Task started";
}
```

### 2. Conditional Response Handling

```csharp
[Capability("Process with conditional response")]
[Parameter("input", "Input to process")]
[Parameter("silent", "Whether to process silently")]
public async Task<string> ConditionalProcess(string input, bool silent = false)
{
    if (silent)
    {
        _messageThread.SkipResponse = true;
    }
    
    var result = await ProcessInput(input);
    
    if (!silent)
    {
        // Let Semantic Kernel handle the response automatically
        return $"Processed: {result}";
    }
    
    // Silent mode - no response will be sent
    return result;
}
```

### 4. Custom Error Handling

```csharp
[Capability("Validate and process data")]
[Parameter("data", "Data to validate and process")]
public async Task<string> ValidateAndProcess(string data)
{
    var validation = ValidateData(data);
    
    if (!validation.IsValid)
    {
        // Skip automatic response to send custom error format
        _messageThread.SkipResponse = true;
        
        var errorResponse = new {
            error = true,
            message = validation.ErrorMessage,
            suggestions = validation.Suggestions
        };
        
        await _messageThread.SendData(errorResponse, "Validation failed");
        return "Validation error";
    }
    
    // Valid data - let Semantic Kernel respond normally
    return ProcessValidData(data);
}
```

## Important Notes

1. **Property Setting**: The `SkipResponse` property must be set within the same capability method that you want to skip the response for.

2. **Response Responsibility**: When you skip the automatic response, you become responsible for providing user feedback if needed. Consider the user experience carefully.

3. **Return Values**: Even when skipping responses, your capability method should still return meaningful values for logging and internal processing purposes.

4. **Error Handling**: Be especially careful with error scenarios when skipping responses - users should still be informed of failures through manual responses.

5. **Threading**: The `SkipResponse` property affects only the current execution context and thread.

## Best Practices

- **Use Sparingly**: Only skip responses when you have a specific need and plan to handle user communication manually
- **Silent Handoffs**: Always use `SkipResponse = true` when performing handoffs to prevent duplicate responses
- **Provide Feedback**: If the operation takes time, consider sending progress updates using `SendChat`
- **Handle Errors**: Always ensure users receive appropriate error messages, even in skip response scenarios
- **Document Behavior**: Clearly document when and why capabilities skip automatic responses
- **Test Handoff Flows**: Verify that handoff scenarios work smoothly and users don't experience communication gaps
- **Test Thoroughly**: Verify that the user experience remains smooth when responses are skipped

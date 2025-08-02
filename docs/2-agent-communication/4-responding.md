# Responding to a User

Agents can respond to users through the `MessageThread` interface, which provides methods for sending messages and managing conversations. This is particularly useful when implementing capabilities that need to send responses back to the user.

## Scenario: Manual vs Automatic Responses

The scenario covered in this section focuses on **manual responses** that you implement programmatically in your agent code, as opposed to the automatic responses that Semantic Kernel generates when processing user requests.

While Semantic Kernel automatically generates responses based on your capabilities and function calls, there are situations where you need to:

- Send custom formatted messages
- Respond with structured data
- Send multiple responses during a single operation
- Control the exact timing and content of responses
- Send responses from background processes or workflows

The `MessageThread` interface allows you to implement these manual response scenarios, giving you full control over when and how your agent communicates with users.

## Implementing Response Capabilities

Similar to handoffs, response capabilities can be implemented in a non-static class that receives the `MessageThread` instance through constructor injection:

```csharp
using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;

public class ResponseCapabilities
{
    private readonly MessageThread _messageThread;
    
    public ResponseCapabilities(MessageThread messageThread)
    {
        _messageThread = messageThread;
    }

    [Capability("Send a formatted response to the user")]
    [Parameter("content", "The message content to send")]
    [Parameter("metadata", "Optional metadata to include with the response")]
    [Returns("The response ID if successful, null otherwise")]
    public async Task<string?> SendFormattedResponse(string content, object? data = null)
    {
        return await _messageThread.SendChat(content, data);
    }

    [Capability("Send a structured data response")]
    [Parameter("data", "The data to send")]
    [Returns("The response ID if successful, null otherwise")]
    public async Task<string?> SendDataResponse(object data)
    {
        ...
        await _messageThread.SendData(data);
        ...
    }
}
```

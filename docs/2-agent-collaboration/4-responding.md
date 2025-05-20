# Responding to a User

Agents can respond to users through the `MessageThread` interface, which provides methods for sending messages and managing conversations. This is particularly useful when implementing capabilities that need to send responses back to the user.

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
    public async Task<string?> SendFormattedResponse(string content, string? metadata = null)
    {
        return await _messageThread.Respond(content, metadata);
    }

    [Capability("Send a structured data response")]
    [Parameter("data", "The data to send")]
    [Returns("The response ID if successful, null otherwise")]
    public async Task<string?> SendDataResponse(string data)
    {
        ...
        await _messageThread.Respond(data);
        ...
    }
}
```

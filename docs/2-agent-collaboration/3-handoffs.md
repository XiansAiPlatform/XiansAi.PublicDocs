# Handoff to Another Agent

Handoffs allow one agent to transfer a conversation to another agent that is better suited to handle the user's request. This is particularly useful when dealing with specialized domains or complex workflows that require different expertise.

## Why Use Handoffs?

1. **Specialized Expertise**: Different agents can be optimized for specific domains or tasks, leading to better and more accurate responses.
2. **Improved User Experience**: Users get more relevant and focused assistance by being directed to the most appropriate agent.
3. **Modular Design**: Breaking down complex workflows into specialized agents makes the system more maintainable and easier to update.
4. **Better Resource Management**: Each agent can be optimized for its specific use case, leading to more efficient resource utilization.

## Implementing Handoffs

Handoffs are typically implemented as capabilities in your [bot flow](../1-getting-started/2-first-agent.md). Here's how to implement them:

1. Create a capability class that handles handoffs
2. Register the capability with your agent
3. Implement handoff methods for each target agent

### Example Implementation

```csharp
using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;

public class HandoffCapabilities
{
    private readonly MessageThread _messageThread;
    
    public HandoffCapabilities(MessageThread messageThread)
    {
        _messageThread = messageThread;
    }

    [Capability("Hand over to a specialized agent")]
    [Parameter("originalUserMessage", "The original user message")]
    [Returns("Name of the bot that took over the conversation")]
    public string HandoffToSpecializedBot(string originalUserMessage)
    {
        _messageThread.SendHandoff(typeof(SpecializedBot), originalUserMessage);
        return typeof(SpecializedBot).Name;
    }
}
```
You can also pass a `targetWorkflowId` instead of `workflowType` to enable a handoff to a specific workflow instance.

### Important Implementation Notes

1. **Non-Static Class**: The handoff capability class should not be static because it needs to maintain state with the message thread.
2. **Constructor Injection**: The class requires a `MessageThread` instance to be passed in the constructor, which is used to perform the actual handoff.
3. **Message Thread**: The `MessageThread` class provides the `Handoff` method that transfers the conversation to another agent.
4. **Original Message**: The original user message is passed to the new agent to maintain context.

## Registering Handoff Capabilities

To use handoff capabilities, register them with your agent:

```csharp
using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("Your Agent Name");

var bot = agent.AddBot<YourBot>();
bot.AddCapabilities<HandoffCapabilities>();

await agent.RunAsync();
```

## Best Practices

1. **Clear Handoff Triggers**: Implement clear conditions for when a handoff should occur
2. **User Consent**: Consider asking for user confirmation before performing a handoff

# Sending Welcome Message

The Xians platform supports setting up a **default welcome message** (or initial message) for agents in a conversational flow.  
This feature allows your agent to automatically greet the user with a predefined message when the conversation starts or after certain triggers.

## Overview

With this feature, you can configure your agent to send a **default message** from the agent side without requiring an explicit user query.  
This is useful when you want to create a conversational bot that proactively sends a greeting or initial instructions to the user.

The welcome message will be sent **when the user sends an empty message**, which acts as a trigger for the agent to respond with the predefined content.

## Usage

You can define the welcome message using the `RouterOptions.WelcomeMessage` property.

```csharp
public async Task Run()
{
    SystemPrompt = sysPrompt;

    RouterOptions.WelcomeMessage = "Hei! Welcome 😊";

    // Start the conversation loop
    await InitConversation();
}
```

## Parameters

| Property | Description | Default |
|----------|-------------|---------|
| `WelcomeMessage` | The initial message the agent sends when triggered by an empty user message. | *(None)* |

## Key Characteristics

* **Agent-Initiated**: Message originates from the agent without requiring a prior user query.
* **Trigger by Empty Message**: The welcome message is sent when the user sends an empty message.
* **Customizable**: You can define any text, emoji, or content as your welcome message.
* **Easy Setup**: Set via a single property in `RouterOptions`.

## When to Use

Use the **Default Welcome Message** when you need:

* A conversational bot to greet users upon entering a chat.
* Instructions or onboarding messages before the user starts interacting.
* A way to re-engage the user after a pause or specific action.

For more complex conversation flows involving system prompts, chat history, or function calling, use the full routing capabilities of the Xians platform.



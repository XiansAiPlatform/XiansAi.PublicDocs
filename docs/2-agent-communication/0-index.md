# Agent Communication

The XiansAI platform provides advanced communication capabilities between users, agents, and workflows. This enables seamless collaboration across different participants in the system through multiple protocols and message types.

## User to Agent

Users can communicate with agents through various channels and protocols, with multiple abstraction layers available for different use cases.

### Supported Protocols

The platform supports multiple communication protocols for user-to-agent interaction:

- **WebSocket**: Real-time bidirectional communication for interactive conversations
- **REST API**: HTTP-based messaging for integration with external systems and for synchronous communication with agents
- **Server-Sent Events (SSE)**: One-way agent-to-client streaming for real-time updates

### Available Abstractions

#### TypeScript SDK

Client-side SDK providing high-level abstractions for agent communication, including:

> **📚 TypeScript SDK Documentation**
>
> **Comprehensive documentation for the TypeScript SDK is available here:**  
> **[🔗 XiansAI TypeScript SDK Documentation](https://github.com/XiansAiPlatform/sdk-web-typescript)**
>
> This SDK provides complete client-side integration capabilities for web applications.

#### Server HTTP APIs

RESTful APIs for server-to-server communication:

> **📖 Server HTTP APIs Documentation**
>
> **Comprehensive documentation for the Server HTTP APIs is available here:**  
> **[🔗 XiansAI Server HTTP APIs Documentation](https://github.com/XiansAiPlatform/XiansAi.Server/blob/main/XiansAi.Server.Src/docs/user-api/index.md)**
>
> These APIs enable server-to-server integration and advanced agent communication patterns.

### Message Types

The platform supports two distinct message types with different routing behaviors and use cases:

> **📋 Implementation Details**
>
> **For detailed information on how to specify message types in your code, see:**  
> **[🔗 Message Types Documentation - TypeScript SDK](https://github.com/XiansAiPlatform/sdk-web-typescript/blob/main/docs/message-types.md)**
>
> This guide provides comprehensive examples and implementation patterns for both Chat and Data message types.

#### Chat Messages

**Natural language communication routed through LLM conversational planners:**

- **Type**: `Chat`
- **Format**: Plain text in request body
- **Agent Reception**: `SubscribeChatHandler` method
- **Routing**: Messages are processed through **LLM Planner (Semantic Kernel)**
- **Use Cases**:
  - Natural language conversations
  - When expecting agent tool calling and intelligent responses
  - Conversational AI interactions
  - Complex reasoning and planning tasks
- **Example**: `"Hi I'm Kavish, needs to know the hiring process."`

> **💡 When to Use Chat Messages**
>
> Use Chat messages when you want the agent to:
>
> - Understand natural language intent
> - Perform reasoning and planning
> - Execute tool calls based on conversation context
> - Engage in conversational AI workflows

#### Data Messages

**Structured data communication that bypasses LLM conversational planners:**

- **Type**: `Data`
- **Format**: JSON objects in request body
- **Agent Reception**: `SubscribeDataHandler` method
- **Routing**: Messages are sent **directly to the agent** without LLM processing
- **Use Cases**:
  - Direct structured data exchange
  - System-to-system communication
  - Pre-processed or formatted data transmission
  - Performance-critical scenarios requiring immediate processing
- **Example**: `{"name": "Saman", "age": "24", "message": "hello"}`

> **⚡ When to Use Data Messages**
>
> Use Data messages when you want to:
>
> - Send structured data directly to agent logic
> - Bypass conversational AI processing for performance
> - Implement direct system integrations
> - Send pre-formatted commands or data structures

### Agent Push Messages

Agents can proactively send messages to users through the MessageThread interface:

- **SendChat**: Send plain text messages with optional metadata
- **SendData**: Send structured data objects with optional content
- Messages are delivered through the user's active communication channel (WebSocket, REST callback, etc.)

## Agent to User

Agents can send responses and notifications back to users through various message types and delivery mechanisms.

### Response Capabilities

Agents can implement response capabilities through the `MessageThread` interface:

#### Formatted Responses

- **Method**: `SendChat(content, data)`
- **Purpose**: Send formatted text responses with optional metadata
- **Return**: Message ID for tracking

#### Structured Data Responses

- **Method**: `SendData(data, content)`
- **Purpose**: Send complex data objects with optional text content
- **Return**: Message ID for tracking

### Message Delivery

All agent-to-user messages are delivered through the user's established communication channel, maintaining consistency with the original connection method (WebSocket, REST, etc.).

## Agent to Agent

Inter-agent communication enables complex workflows and specialized task handling through coordinated agent collaboration.

### Message Handoff

Transfer conversations between agents for specialized handling:

#### Use Cases

- **Specialized Expertise**: Route to agents optimized for specific domains
- **Improved User Experience**: Direct users to most appropriate agent
- **Modular Design**: Maintain specialized, focused agents
- **Resource Management**: Optimize agent utilization

#### Handoff Implementation

```csharp
[Capability("Hand over to a specialized agent")]
[Parameter("originalUserMessage", "The original user message")]
[Returns("Name of the bot that took over the conversation")]
public string HandoffToSpecializedBot(string originalUserMessage)
{
    _messageThread.SendHandoff(typeof(SpecializedBot), originalUserMessage);
    return typeof(SpecializedBot).Name;
}
```

### Message Forwarding

Enable complex multi-agent workflows through the `ForwardMessage` mechanism:

#### Architecture Patterns

**Router Bot Pattern**: Central coordinator distributing tasks to specialized agents

- Router Bot analyzes queries and routes to appropriate agents
- Specialized agents handle domain-specific tasks
- Router Bot synthesizes responses from multiple agents

#### Communication Patterns

- **Sequential Processing**: Chain operations across multiple agents
- **Parallel Processing**: Broadcast queries to multiple agents simultaneously
- **Conditional Routing**: Smart routing based on message content
- **Pipeline Processing**: Multi-stage processing through agent chains
- **Event-Driven Communication**: Event-based agent coordination

#### Forwarding Implementation

```csharp
[Capability("Ask from specialized bot")]
[Parameter("routerBotMessage", "Message crafted for the target bot")]
[Returns("Response from specialized bot")]
public async Task<string> AskFromSpecializedBot(string routerBotMessage)
{
    return await _messageThread.ForwardMessage(typeof(SpecializedBot), routerBotMessage);
}
```

This comprehensive communication framework enables building sophisticated multi-agent systems with clear separation of concerns, scalable architecture, and robust inter-agent collaboration capabilities.

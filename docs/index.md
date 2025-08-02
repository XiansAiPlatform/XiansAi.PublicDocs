# Welcome to Xians.ai Documentation

Xians.ai Agent Development Kit (ADK) is a powerful, platform-agnostic framework for creating, deploying, and orchestrating AI agents. Build sophisticated agent systems that are both adaptive and reliable, from simple task-oriented agents to complex multi-agent collaboration systems.

## 🏗️ Architecture

Understand the foundations and components of the Xians.ai platform:

- **[Why a Platform](0-architecture/1-why-xians-platform.md)** - Learn what makes Xians ADK unique and its core features
- **[Platform Components](0-architecture/2-platform-components.md)** - Explore the main components that power the platform
- **[Core Features](0-architecture/3-xians-core-features.md)** - Learn about the key features that make Xians ADK powerful

## 🚀 Quick Start

New to Xians.ai? Start here to get up and running quickly:

- **[Platform Setup](1-getting-started/0-platform-setup.md)** - Install and configure your development environment
- **[Agent Project Setup](1-getting-started/1-agent-project-setting-up.md)** - Create your first agent project

### Non-Deterministic Agents
- **[Conversational Flow](1-getting-started/2-first-agent.md)** - Create your first conversational agent
- **[Adding Capabilities](1-getting-started/3-adding-capabilities.md)** - Extend your agent with custom capabilities

### Deterministic Agents  
- **[Business Process Flow](1-getting-started/4-new-business-process.md)** - Create structured business process flows
- **[Adding Activities](1-getting-started/5-adding-activities.md)** - Extend your workflows with custom activities

## 🔄 Agent Communication

Learn how agents communicate with users and each other:

- **[Introduction](2-agent-communication/0-index.md)** - Overview of agent communication patterns
- **[Message Types](https://github.com/XiansAiPlatform/sdk-web-typescript/blob/main/docs/message-types.md)** - Chat & Data Types documentation
- **[Handling Data Messages](2-agent-communication/8-handling-data-messages.md)** - Handling data messages

### User to Agent Communication
- **[TypeScript SDK](https://github.com/XiansAiPlatform/sdk-web-typescript)** - Web SDK for user interactions
- **[HTTP APIs](https://github.com/XiansAiPlatform/XiansAi.Server/blob/main/XiansAi.Server.Src/docs/user-api/index.md)** - REST API documentation

### Agent to User Communication
- **[Send Message](2-agent-communication/2-messaging.md)** - Send messages to users
- **[Manual Responding](2-agent-communication/4-responding.md)** - Handle user interactions manually
- **[Skip LLM Response](2-agent-communication/5-skip-llm-response.md)** - Bypass LLM for direct responses

### Chat Interceptors
- **[Intercept Chat](2-agent-communication/7-chat-interceptors.md)** - Modify or redirect chat messages

### Agent to Agent Communication
- **[Event Passing](2-agent-communication/1-events.md)** - Enable agents to communicate through events
- **[Handoffs](2-agent-communication/3-handoffs.md)** - Transfer control between different agents
- **[Forwarding](2-agent-communication/6-forward-message.md)** - Forward messages between agents

## 🧠 Agent Knowledge

Manage and utilize knowledge within your agents:

- **[Managing Knowledge](3-knowledge/1-using-portal.md)** - Manage agent knowledge through the web interface
- **[Accessing Knowledge](3-knowledge/2-accessing-knowledge.md)** - Retrieve and use knowledge in your agents
- **[Capabilities as Knowledge](3-knowledge/3-capabilities.md)** - Store and share agent capabilities
- **[Local Development](3-knowledge/3-local-dev.md)** - Work with knowledge in your local environment

## 📖 Encyclopedia

Advanced topics and detailed guides:

- **[Multi-flow Agents](n-encyclopedia/multi-flow-agents.md)** - Build agents with multiple workflow types
- **[Retry Policy](n-encyclopedia/retry-policy.md)** - Handle failures and retries gracefully
- **[Logging](n-encyclopedia/logging.md)** - Monitor and debug your agents
- **[Workflow Best Practices](n-encyclopedia/wf-best-practices.md)** - Follow proven patterns and practices

## 🛠️ Platform Development

Contribute to the Xians.ai platform:

- **[Setup](platform-development/setup.md)** - Set up your development environment for platform contributions

## ⭐ Key Features

- **Enterprise-Grade Workflow Engine** - Built on temporal.io for fault-tolerant, scalable execution
- **Multi-Agent Systems** - Create collaborative agent teams with peer-to-peer communication
- **Event-Driven Architecture** - Seamless agent communication through sophisticated event mechanisms
- **Comprehensive Tooling** - Extensive ecosystem for extending agent capabilities
- **Complete Management Platform** - Full-featured portal for agent management and monitoring
- **Multi-Tenant Ready** - Built for enterprise deployments with tenant isolation
- **Platform Agnostic** - No vendor lock-in to specific LLMs, providers, or cloud platforms

## 🔗 Resources

- **[Code Samples](https://github.com/XiansAiPlatform/XiansAi.PublicDocs/tree/main/samples)** - Working examples to get you started
- **[GitHub Repository](https://github.com/XiansAiPlatform)** - Source code and latest updates
- **[Changelog](https://github.com/XiansAiPlatform/XiansAi.Lib/releases)** - Latest releases and features

## 🎯 Next Steps

1. **[Set up your development environment](1-getting-started/0-platform-setup.md)**
2. **[Create your first agent](1-getting-started/1-agent-project-setting-up.md)**
3. **[Explore the samples](https://github.com/XiansAiPlatform/XiansAi.PublicDocs/tree/main/samples)**


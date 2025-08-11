<div class="hero-section">
  <h1>Xians.ai Docs</h1>
  <p>Enterprise-grade Agent Development Kit for building AI agents.</p>

  <div style="margin-top: 2rem;">
    <a href="1-getting-started/0-platform-setup/" style="margin: 0.5rem; background: var(--xians-primary); border: 1px solid var(--xians-primary); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; font-weight: 500; display: inline-block; transition: background-color 0.15s ease;">Get Started</a>
    <a href="https://github.com/XiansAiPlatform/community-edition/tree/main/samples" style="margin: 0.5rem; background: transparent; border: 1px solid var(--xians-border-dark); color: var(--xians-text-primary); text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; font-weight: 500; display: inline-block; transition: border-color 0.15s ease;">View Examples</a>
  </div>
</div>

<div class="feature-grid">
  <div class="feature-card">
    <h3>Architecture</h3>
    <p>Understand the foundations and components of the Xians.ai platform</p>
    <ul>
      <li><a href="0-architecture/1-why-xians-platform.md"><strong>Why a Platform</strong></a> - Learn what makes Xians ADK unique</li>
      <li><a href="0-architecture/2-platform-components.md"><strong>Platform Components</strong></a> - Explore the main components</li>
      <li><a href="0-architecture/3-xians-core-features.md"><strong>Core Features</strong></a> - Key features that make Xians ADK powerful</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Quick Start</h3>
    <p>Begin your agent development journey with our comprehensive setup guides</p>
    <ul>
      <li><a href="1-getting-started/0-platform-setup.md"><strong>Platform Setup</strong></a> - Install and configure your environment</li>
      <li><a href="1-getting-started/1-agent-project-setting-up.md"><strong>Agent Project Setup</strong></a> - Create your first agent project</li>
    </ul>
    <h4>Non-Deterministic Agents</h4>
    <ul>
      <li><a href="1-getting-started/2-first-agent.md"><strong>Conversational Flow</strong></a> - Create your first conversational agent</li>
      <li><a href="1-getting-started/3-adding-capabilities.md"><strong>Adding Capabilities</strong></a> - Extend with custom capabilities</li>
    </ul>
    <h4>Deterministic Agents</h4>
    <ul>
      <li><a href="1-getting-started/4-new-business-process.md"><strong>Business Process Flow</strong></a> - Create structured business processes</li>
      <li><a href="1-getting-started/5-adding-activities.md"><strong>Adding Activities</strong></a> - Extend workflows with custom activities</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Agent Communication</h3>
    <p>Learn how agents communicate with users and each other</p>
    <ul>
      <li><a href="2-agent-communication/0-index.md"><strong>Introduction</strong></a> - Overview of communication patterns</li>
      <li><a href="https://github.com/XiansAiPlatform/sdk-web-typescript/blob/main/docs/message-types.md"><strong>Message Types</strong></a> - Chat & Data Types documentation</li>
      <li><a href="2-agent-communication/8-handling-data-messages.md"><strong>Data Messages</strong></a> - Handle data communication</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Agent Knowledge</h3>
    <p>Manage and utilize knowledge within your agents</p>
    <ul>
      <li><a href="3-knowledge/1-using-portal.md"><strong>Managing Knowledge</strong></a> - Web interface for knowledge management</li>
      <li><a href="3-knowledge/2-accessing-knowledge.md"><strong>Accessing Knowledge</strong></a> - Retrieve and use knowledge in agents</li>
      <li><a href="3-knowledge/3-capabilities.md"><strong>Capabilities as Knowledge</strong></a> - Store and share agent capabilities</li>
    </ul>
  </div>
</div>

## Comprehensive Documentation Sections

<div class="feature-grid">
  <div class="feature-card">
    <h3>User to Agent Communication</h3>
    <ul>
      <li><a href="https://github.com/XiansAiPlatform/sdk-web-typescript"><strong>TypeScript SDK</strong></a> - Web SDK for user interactions</li>
      <li><a href="https://github.com/XiansAiPlatform/XiansAi.Server/blob/main/XiansAi.Server.Src/docs/user-api/index.md"><strong>HTTP APIs</strong></a> - REST API documentation</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Agent to User Communication</h3>
    <ul>
      <li><a href="2-agent-communication/2-messaging.md"><strong>Send Message</strong></a> - Send messages to users</li>
      <li><a href="2-agent-communication/4-responding.md"><strong>Manual Responding</strong></a> - Handle user interactions manually</li>
      <li><a href="2-agent-communication/5-skip-llm-response.md"><strong>Skip LLM Response</strong></a> - Bypass LLM for direct responses</li>
      <li><a href="2-agent-communication/7-chat-interceptors.md"><strong>Chat Interceptors</strong></a> - Modify or redirect chat messages</li>
      <li><a href="2-agent-communication/12-welcome-msg.md"><strong>Welcome Message</strong></a> - Send the initial welcome message</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Agent to Agent Communication</h3>
    <ul>
      <li><a href="2-agent-communication/1-events.md"><strong>Event Passing</strong></a> - Enable agents to communicate through events</li>
      <li><a href="2-agent-communication/3-handoffs.md"><strong>Handoffs</strong></a> - Transfer control between different agents</li>
      <li><a href="2-agent-communication/6-forward-message.md"><strong>Forwarding</strong></a> - Forward messages between agents</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Encyclopedia</h3>
    <p>Advanced topics and detailed guides</p>
    <ul>
      <li><a href="n-encyclopedia/multi-flow-agents.md"><strong>Multi-flow Agents</strong></a> - Build agents with multiple workflow types</li>
      <li><a href="n-encyclopedia/retry-policy.md"><strong>Retry Policy</strong></a> - Handle failures and retries gracefully</li>
      <li><a href="n-encyclopedia/logging.md"><strong>Logging</strong></a> - Monitor and debug your agents</li>
      <li><a href="n-encyclopedia/wf-best-practices.md"><strong>Workflow Best Practices</strong></a> - Follow proven patterns</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Platform Development</h3>
    <p>Contribute to the Xians.ai platform</p>
    <ul>
      <li><a href="platform-development/setup.md"><strong>Development Setup</strong></a> - Set up your development environment for platform contributions</li>
      <li><a href="3-knowledge/3-local-dev.md"><strong>Local Development</strong></a> - Work with knowledge in your local environment</li>
    </ul>
  </div>
</div>

## Key Features

<div class="feature-grid">
  <div class="feature-card">
    <h3>Enterprise-Grade</h3>
    <p><strong>Workflow Engine</strong> - Built on temporal.io for fault-tolerant, scalable execution with enterprise reliability and performance.</p>
  </div>

  <div class="feature-card">
    <h3>Multi-Agent Systems</h3>
    <p><strong>Collaborative Teams</strong> - Create agent teams with peer-to-peer communication, handoffs, and sophisticated coordination.</p>
  </div>

  <div class="feature-card">
    <h3>Event-Driven</h3>
    <p><strong>Modern Architecture</strong> - Seamless agent communication through sophisticated event mechanisms and real-time messaging.</p>
  </div>

  <div class="feature-card">
    <h3>Comprehensive Tooling</h3>
    <p><strong>Rich Ecosystem</strong> - Extensive tools and libraries for extending agent capabilities and building complex workflows.</p>
  </div>

  <div class="feature-card">
    <h3>Management Platform</h3>
    <p><strong>Full-Featured Portal</strong> - Complete web interface for agent management, monitoring, and knowledge administration.</p>
  </div>

  <div class="feature-card">
    <h3>Platform Agnostic</h3>
    <p><strong>No Vendor Lock-in</strong> - Works with any LLM provider, cloud platform, or infrastructure setup you choose.</p>
  </div>
</div>

## Resources & Next Steps

<div class="feature-grid">
  <div class="feature-card">
    <h3>Resources</h3>
    <ul>
      <li><a href="https://github.com/XiansAiPlatform/XiansAi.PublicDocs/tree/main/samples"><strong>Code Samples</strong></a> - Working examples to get you started</li>
      <li><a href="https://github.com/XiansAiPlatform"><strong>GitHub Organization</strong></a> - Source code and latest updates</li>
      <li><a href="https://github.com/XiansAiPlatform/XiansAi.Lib/releases"><strong>Changelog</strong></a> - Latest releases and features</li>
    </ul>
  </div>

  <div class="feature-card">
    <h3>Getting Started</h3>
    <ol>
      <li><a href="1-getting-started/0-platform-setup.md"><strong>Set up your development environment</strong></a></li>
      <li><a href="1-getting-started/1-agent-project-setting-up.md"><strong>Create your first agent</strong></a></li>
      <li><a href="https://github.com/XiansAiPlatform/XiansAi.PublicDocs/tree/main/samples"><strong>Explore the samples</strong></a></li>
    </ol>
  </div>
</div>

---

<div style="text-align: center; margin: 3rem 0; padding: 2rem; background: var(--xians-bg-secondary); border-radius: 0.5rem; border: 1px solid var(--xians-border-medium);">
  <h3 style="color: var(--xians-text-primary); margin-bottom: 1rem; font-weight: 600;">Ready to build enterprise AI agents?</h3>
  <p style="margin-bottom: 1.5rem; color: var(--xians-text-secondary);">Join enterprise teams developing next-generation AI automation solutions</p>
  <a href="1-getting-started/0-platform-setup/" style="background: var(--xians-primary); color: white; padding: 0.875rem 1.75rem; border-radius: 0.375rem; text-decoration: none; font-weight: 500; display: inline-block; transition: background-color 0.15s ease; border: 1px solid var(--xians-primary);">Start Building Now →</a>
</div>


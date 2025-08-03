# Message Threads and Scopes

Message threads and scopes provide organizational structure for conversations and context management within the Xians AI platform. They enable precise control over message flow, context isolation, and conversation history management.

## Message Threads

Message threads are the fundamental organizational unit for conversations between users and agents. Every message exchange is associated with a specific thread that groups related interactions together.

### Thread Identity

Each message thread is uniquely identified by a composite primary key consisting of:

- **Tenant ID**: Identifies the organization or tenant
- **Workflow ID**: Identifies the specific workflow or agent instance
- **Participant ID**: Identifies the user or participant in the conversation

This three-part identifier ensures that conversations are properly isolated and organized across different tenants, workflows, and users.

All conversations between a specific user and agent are grouped within a single thread, maintaining context and conversation history throughout the interaction lifecycle.

## Message Scopes

Message scopes provide fine-grained organization within a message thread, allowing for logical grouping of related messages and context isolation within a single conversation.

### Scope Purpose

Scopes enable agents and users to organize conversations around specific topics, tasks, or contexts without losing the broader thread continuity. This is particularly valuable in complex workflows where multiple distinct activities occur within the same overall conversation.

### Common Scope Use Cases

**Task-Based Scoping**: When a user is working on multiple tasks simultaneously, each task can be assigned its own scope. This allows the agent to maintain context about each specific task while keeping them logically separated.

**Document-Centric Workflows**: In scenarios involving multiple documents, each document can have its own scope. This enables focused discussions about specific documents without interference from other document-related conversations.

**Project Phases**: Long-running projects can use scopes to organize conversations by project phase, milestone, or sprint, maintaining historical context while focusing on current phase activities.

### Scope Behavior and Access Control

**History Retrieval**: When fetching conversation history, specifying a scope returns only messages within that particular scope, providing focused context for the agent or application.

**Message Sending**: Messages can be sent to specific scopes, ensuring they are associated with the appropriate context and accessible to relevant participants.

**Context Isolation**: When a scope is specified, agents have access only to message history within that scope, creating focused interactions without distraction from other scope content.

**Default Scope Behavior**: Messages sent without a specified scope are accessible when no scope filter is applied, creating a general conversation area within the thread.

## Thread and Scope Interaction

### Hierarchical Organization

Threads and scopes work together in a hierarchical structure:

- **Threads** serve as the top-level conversation container
- **Scopes** provide sub-organization within threads
- **Messages** exist within specific scopes (or in the default scope 'null')

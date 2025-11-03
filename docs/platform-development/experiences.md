---
title: Knowledge Document
summary: Consolidated insights and learnings from monthly knowledge-sharing sessions, organized by key knowledge areas.
---

# Knowledge Document

This document consolidates insights and learnings from monthly knowledge-sharing sessions, organized into chapters by key knowledge areas. Each chapter captures relevant solutions, challenges, and learnings from various projects to facilitate cross-team learning and future reference.

## Chapter 1: Data Processing and Token Management

### Overview

This chapter covers strategies for handling large data payloads, optimizing token usage, and improving performance in AI agent systems, particularly when dealing with large language models (LLMs).

### Learnings and Solutions

- **Data Pre-processing**: Process, clean, and summarize large data outside of LLM calls to provide agents with processed information rather than raw data, reducing token usage and improving performance.
- **Data Formatting**: Convert verbose formats like JSON into token-efficient formats, such as Markdown tables, to reduce payload size and enhance agent performance.
- **Dynamic Model Routing**: Implement a system that automatically switches to a model with a larger token window if the initial request fails due to size limitations.
- **Platform Updates for Token Limits**: Utilize newer platform versions that automatically truncate chat history or input to fit within token limits, preventing errors.
- **Token Management for High Token Size**: Preprocess data to summarize key information and convert to Markdown before routing to an appropriate LLM model based on content token limits.
- **Large Data Handling**: For large responses, modify data and pass it directly to the chat message thread instead of the agent, converting JSON responses to Markdown tables to reduce token usage.

### Challenges

- Slow performance and token limit exceed errors when processing large data payloads, such as JSON files.

## Chapter 2: Multi-Agent System Design

### Overview

This chapter focuses on designing complex, user-friendly, and reliable multi-agent systems, including workflow control and user experience (UX) considerations.

### Learnings and Solutions

- **Dynamic Workflow Control**: Avoid overloading the main agent prompt with complex logic. Have individual tools return instructions for the next step, allowing the workflow to emerge dynamically, keeping prompts simple and reliable.
- **Seamless Multi-Agent UX**: Use a primary super-agent to act as a router and filter, delegating tasks to specialized sub-agents in the background to create the illusion of a single, highly capable agent.
- **Agent2Agent Communication**: Implement handoffs and merge messages from different threads in the frontend to present a unified interface.
- **Workflow Orchestration**: Use tools like LangGraph to manage complex, multi-step agent workflows, leveraging state for inter-agent communication and maintaining execution history.
- **Capability Instructions**: Provide instructions at the end of capabilities to guide the next steps dynamically.

## Chapter 3: Security and Authorization

### Overview

This chapter addresses secure handling of sensitive information and user-specific access in AI systems.

### Learnings and Solutions

- **Secure Authorization**: Pass sensitive tokens (e.g., API keys) through a dedicated authorization field that is not logged to ensure security.
- **PII Masking**: Implement a masking layer to hide Personally Identifiable Information (PII), such as Social Security Numbers, before data is sent to the agent, especially when the agent has direct database access.
- **MCP Authentication**: Modify the kernel to accept a message thread and create a new client for each request to authenticate individual user requests.
- **Iframe Authentication**: Modify the UI to accept a parent token for authentication to avoid double logins.
- **Authorization Handling**: Introduce an authorization field in the AI library to pass user auth tokens in every message thread.

## Chapter 4: Retrieval-Augmented Generation (RAG) and Search Optimization

### Overview

This chapter covers techniques for improving the accuracy and efficiency of Retrieval-Augmented Generation (RAG) systems and search mechanisms.

### Learnings and Solutions

- **Advanced RAG Strategy**: Generate concise summaries and potential user queries for each document, embedding these into the vector database instead of full documents to improve retrieval accuracy.
- **Hybrid Search**: Combine semantics (75% weight) and keyword (25% weight) searches to achieve optimal retrieval results.
- **Model Selection Trade-off**: Switch to larger, more capable models when smaller models fail to deliver satisfactory response quality, justifying higher costs with improved performance.

### Challenges

- Inaccurate retrievals in RAG systems due to overlapping topics and similar wording across documents when embedding full documents.

## Chapter 5: User Experience and Personalization

### Overview

This chapter focuses on enhancing user experience through personalization and seamless interaction with AI agents.

### Learnings and Solutions

- **User Profile for Personalization**: Summarize key user information (e.g., income) from conversation history in a background process and store it to provide personalized advice without redundant questions.
- **UI-Agent Collaboration**: Build interactive UI forms with real-time validations and integrate AI to auto-generate draft documents. Use WebSocket connections to ensure agents receive the latest document updates before edits are applied.
- **Seamless Multi-Agent UX**: Merge messages from different agent threads in the front end to present a unified interface to the user.

## Chapter 6: Performance Optimization

### Overview

This chapter addresses techniques for reducing latency and improving the speed of AI-driven processes.

### Learnings and Solutions

- **Parallel Processing**: Break workflows into multiple small, independent agents that run in parallel to reduce processing time (e.g., achieving feedback generation in under 3 seconds).
- **Structured Outputs**: Ensure each agent in a workflow has a fixed, predictable output structure to enhance reliability and enable end-to-end testing.

### Challenges

- Reducing feedback generation time to under three seconds to meet user expectations.
- Balancing performance (speed and cost) against capability, as larger models or complex multi-agent setups improves results but increases latency and expense.

## Chapter 7: Debugging and Observability

### Overview

This chapter covers tools and strategies for debugging AI agent behavior and improving observability.

### Learnings and Solutions

- **Debugging Tools**: Use tools like Langfuse for tracing and debugging. Implement a debug mode in the system prompt to return exact error messages.
- **Importance of Testing**: Conduct unit testing to identify underlying bugs or incorrect logic, as agents often fail gracefully without explicit error messages.
- **Scraping Strategy**: Use a dedicated scraping service for reliability.

### Challenges

- Difficulty in debugging agent behavior due to unclear error messages, highlighting the need for better observability tools to trace decision-making processes.

## Chapter 8: Real-time Data Access

### Overview

This chapter discusses challenges and strategies for accessing real-time data in AI systems.

### Challenges

- Lack of public APIs for necessary third-party services (e.g., real-time financial data like interest rates), with scraping being infeasible, remains a significant blocker.

## Chapter 9: Development Process and Workflow

### Overview

This chapter covers standardized processes and tools for developing and managing AI agent workflows.

### Learnings and Solutions

- **Standardized Development Process**: Use a feature doc approach, where a prompt generates a detailed document outlining a new feature, serving as a blueprint for implementation.
- **Capability Instructions**: Provide instructions at the end of capabilities to guide the next steps dynamically.



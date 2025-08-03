# Data Exchange with Agents

When sending structured data messages to agents, you have two distinct approaches available, each designed for different use cases and requirements.

## Two Approaches Overview

### 1. Data as Messages (Temporal Workflow)

Process data messages manually within the Temporal workflow class using event listeners and queuing mechanisms.

!!! info "Data Message Handling Documentation"
    For complete implementation details, see [Handling Data Messages](8-handling-data-messages.md).

### 2. Data as RPC (DataProcessor)

Use a simplified RPC-style approach by setting a DataProcessor class to handle data messages as atomic operations.

!!! info "Data Processing PRC Implementation"
    For complete implementation details, see [RPC Data Processing](10-handling-data-rpc.md).

## When to Use Each Approach

### Use Manual Data Handling When

- ✅ You need **long-running workflows** with complex orchestration
- ✅ You require **Temporal workflow capabilities** (retries, timers, child workflows)
- ✅ You need to **coordinate multiple activities** over time
- ✅ You need **durability** and **fault tolerance** for complex business processes

### Use RPC Abstraction When

- ✅ You need **simple, atomic operations** (request → process → respond)
- ✅ You want **immediate responses** without workflow overhead
- ✅ You prefer **simplified development** with less boilerplate
- ✅ You don't need Temporal orchestration features

## Comparison Matrix

| Feature | Manual Handling | RPC Abstraction |
|---------|----------------|-----------------|
| **Execution Context** | Full Temporal Workflow | Single Temporal Activity |
| **Orchestration** | ✅ Full capabilities | ❌ Not available |
| **Complexity** | Higher (manual queuing) | Lower (automatic handling) |
| **Fault Tolerance** | ✅ Full Temporal guarantees | Limited (activity-level only) |
| **Use Case** | Complex business processes | Simple data calls |

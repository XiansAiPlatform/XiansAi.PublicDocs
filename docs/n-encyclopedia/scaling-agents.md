# Scaling Agent Flows

## Overview

In Xians, scalability is achieved through distributed workflow execution using Temporal queues. Every Agent Workflow automatically creates a temporal queue that enables horizontal scaling by allowing multiple agent instances to share the workload seamlessly. This document explains how to configure and scale your agent flows for high-throughput scenarios.

## Temporal Queue Architecture

Each Agent Workflow in Xians is backed by a Temporal queue that serves as the distribution mechanism for work items. When multiple agent instances are deployed, they all connect to the same temporal queue and automatically distribute the workload among themselves.

### Key Benefits

- **Automatic Load Distribution**: Work is automatically distributed across all connected workers
- **Fault Tolerance**: If one worker fails, others continue processing
- **Dynamic Scaling**: Add or remove workers without service interruption
- **Guaranteed Execution**: Temporal ensures all work items are processed exactly once

## Configuring Worker Scalability

### Default Configuration

By default, each Xians agent creates a **single worker** per workflow. This is suitable for development and low-throughput scenarios:

```csharp
// Default single worker configuration
var agent = new AgentTeam("ERP Agent");
var bot = agent.AddAgent<OrderBot>(); // Creates 1 worker by default
bot.AddCapabilities(typeof(OrderCapabilities));
await agent.RunAsync();
```

### Multi-Worker Configuration

For production environments requiring higher throughput, you can configure multiple workers using the `numberOfWorkers` parameter:

```csharp
// Multi-worker configuration for high throughput
var agent = new AgentTeam("ERP Agent");

// Configure 5 workers for the OrderBot workflow
var bot = agent.AddAgent<OrderBot>(numberOfWorkers: 5);
bot.AddCapabilities(typeof(OrderCapabilities));
await agent.RunAsync();
```

### Advanced Worker Configuration

You can configure different worker counts for different workflows within the same agent:

```csharp
var agent = new AgentTeam("Multi-Service Agent");

// High-throughput order processing
var orderBot = agent.AddAgent<OrderBot>(numberOfWorkers: 10);
orderBot.AddCapabilities(typeof(OrderCapabilities));

// Moderate-throughput inventory management
var inventoryBot = agent.AddAgent<InventoryBot>(numberOfWorkers: 3);
inventoryBot.AddCapabilities(typeof(InventoryCapabilities));

// Low-throughput reporting
var reportBot = agent.AddAgent<ReportBot>(numberOfWorkers: 1);
reportBot.AddCapabilities(typeof(ReportCapabilities));

await agent.RunAsync();
```

## Scaling Strategies

### Vertical Scaling (Per-Instance Workers)

Increase the `numberOfWorkers` parameter to handle more concurrent workflows within a single agent instance:

```csharp
// Scale up workers within a single instance
var agent = new AgentTeam("High-Performance Agent");
var bot = agent.AddAgent<ProcessingBot>(numberOfWorkers: 20);
```

**When to use:**

- Single deployment environment
- Sufficient CPU and memory resources
- Simplified deployment management

### Horizontal Scaling (Multiple Instances)

Combine both approaches for maximum throughput:

```csharp
// Multiple instances, each with multiple workers
var agent = new AgentTeam("Hybrid Scaled Agent");
var bot = agent.AddAgent<ProcessingBot>(numberOfWorkers: 8);
```

Deploy this configuration across multiple containers/servers for optimal scaling.

## Performance Considerations

### Optimal Worker Count

The optimal number of workers depends on several factors:

- **CPU Cores**: Generally 1-2 workers per CPU core
- **I/O Operations**: More workers for I/O-heavy workflows
- **Memory Usage**: Consider memory requirements per worker
- **External Dependencies**: Account for rate limits and connection pools

### Example Configurations

```csharp
// CPU-intensive workflows
var cpuBot = agent.AddAgent<DataProcessingBot>(numberOfWorkers: Environment.ProcessorCount);

// I/O-intensive workflows (API calls, database operations)
var ioBot = agent.AddAgent<IntegrationBot>(numberOfWorkers: Environment.ProcessorCount * 2);

// Memory-intensive workflows
var memoryBot = agent.AddAgent<AnalyticsBot>(numberOfWorkers: 2);
```

### Monitoring and Tuning

Monitor these metrics to optimize worker configuration:

- **Queue Depth**: High queue depth indicates need for more workers
- **Worker Utilization**: Low utilization suggests over-provisioning
- **Throughput**: Measure workflows completed per second
- **Error Rates**: High error rates may indicate resource contention

## Best Practices

### 1. Start Conservative

Begin with fewer workers and scale up based on monitoring data:

```csharp
// Start with moderate scaling
var bot = agent.AddAgent<NewWorkflowBot>(numberOfWorkers: 3);
```

### 2. Environment-Specific Configuration

Use configuration files or environment variables for different environments:

```csharp
var workerCount = int.Parse(Environment.GetEnvironmentVariable("WORKER_COUNT") ?? "1");
var bot = agent.AddAgent<ProductionBot>(numberOfWorkers: workerCount);
```

### 3. Resource-Aware Scaling

Consider available resources when setting worker counts:

```csharp
var maxWorkers = Math.Min(Environment.ProcessorCount * 2, 20);
var bot = agent.AddAgent<AdaptiveBot>(numberOfWorkers: maxWorkers);
```

### Monitoring Commands

Use Temporal CLI to monitor queue performance:

```bash
# Check workflow queue status
temporal workflow list --query "WorkflowType='YourWorkflowType'"

# Monitor task queue
temporal task-queue describe --task-queue your-task-queue
```

## Auto Scaling Based on Queue Metrics

### Monitoring Queue Size for Auto Scaling

For dynamic scaling scenarios, you can monitor the Temporal queue size to automatically adjust the number of workers. This approach enables responsive scaling based on actual workload demand.

# Creating Multi-Flow Agents

This guide explains how to create an agent with multiple flows using the XiansAi framework.

## Overview

Multi-flow agents allow you to split complex functionality into separate workflows that can run independently but share the same agent identity. This approach enables:

- Better separation of concerns
- Independent development and scaling of different workflows
- Simpler maintenance and debugging

## Step 1: Define Individual Flows

### Example: ConsultationBot

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

namespace Conversing.Consultation;

[Workflow("Consultation Bot")]
public class ConsultationBot : FlowBase
{
    [WorkflowRun]
    public async Task Run()
    {
        // Your consultation logic here
    }
}
```

### Example: MedicineInfoBot

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

namespace Conversing.MedicineInfo;

[Workflow("Medicine Info Bot")]
public class MedicineInfoBot : FlowBase
{
    [WorkflowRun]
    public async Task Run()
    {
        // Your medicine info logic here
    }
}
```

## Step 2: Configure Agent and Flows

In your `Program.cs`, define a single `Agent` object and configure each flow with its capabilities:

```csharp
using XiansAi.Flow;
using DotNetEnv;
using Conversing.Consultation;
using Conversing.MedicineInfo;
using Conversing.HealthRecords;
using Sensing.ConsultantNotes;

// Env config via DotNetEnv
Env.Load();

// name your agent
var agent = new Agent("Consultation Assist Agent");

// Configure Consultation Bot
var consultationBot = agent.AddBot<ConsultationBot>();
consultationBot.AddCapabilities<UploadCapability>();
consultationBot.AddCapabilities<HandoverCapabilities>();

// Configure Medicine Info Bot
var medicineInfoBot = agent.AddBot<MedicineInfoBot>();
medicineInfoBot.AddCapabilities<FdaInfoCapabilities>();
medicineInfoBot.AddCapabilities<HandoverCapabilities>();

await agent.RunAsync();
```

## Best Practices

1. **Shared Identity**: Use a single `Agent` object for all flows to maintain a consistent agent identity.

2. **Flow Separation**: Design flows to handle distinct functionality (e.g., consultation handling vs. medicine information).

3. **Flow Communication**: If flows need to communicate, use events rather than direct references.

This architecture allows you to build complex agents with specialized workflows while maintaining a unified agent identity and coordinated lifecycle management. Each flow can have its own set of capabilities and activities, making the system modular and maintainable.

# Agent Context Utility (`AgentContext`)

Very short guide to access runtime context and start/execute sub-workflows.

## What it provides

- **TenantId**: From certificate; required for workflow IDs.
- **UserId**: From certificate.
- **AgentName**: First segment of `WorkflowType`.
- **WorkflowId / WorkflowType / WorkflowRunId**: From Temporal context (workflow or activity).
- `StartWorkflow<TWorkflow>(namePostfix, args)`: Fire-and-forget sub-workflow.
- `ExecuteWorkflow<TWorkflow, TResult>(namePostfix, args)`: Sub-workflow returning a result.

## Quick usage

```csharp
// Inside a workflow or activity
var tenantId = AgentContext.TenantId;     // throws if certificate missing tenant
var userId = AgentContext.UserId;         // throws if certificate missing user

var workflowId = AgentContext.WorkflowId;     // current workflow id
var workflowType = AgentContext.WorkflowType; // e.g., "My Agent v1.3.1:Router Bot"
var runId = AgentContext.WorkflowRunId;       // current run id
var agentName = AgentContext.AgentName;       // "My Agent v1.3.1"
```

## Sub-workflows

```csharp
// Start a sub-workflow (no return)
await AgentContext.StartWorkflow<MyFlow>(
    namePostfix: Guid.NewGuid().ToString(),
    args: new object[] { /* flow args */ }
);

// Execute a sub-workflow and get result
var result = await AgentContext.ExecuteWorkflow<MyFlow, MyResult>(
    namePostfix: Guid.NewGuid().ToString(),
    args: new object[] { /* flow args */ }
);
```

## Notes and pitfalls

- **Context required**: `WorkflowId`, `WorkflowType`, and `WorkflowRunId` throw if not in a workflow or activity.
- **Certificate required**: `TenantId` and `UserId` come from the loaded certificate; missing values throw.
- **AgentName derivation**: Computed from the `WorkflowType` (text before the first `:`).

# Workflow Identification Utility (`WorkflowIdentifier`)

A guide to construct and parse workflow names/IDs in Agents.

## Formats

- **Workflow Type**: `AgentName:FlowName`
- **Workflow ID (no postfix)**: `TenantId:AgentName:FlowName`
- **Workflow ID (with postfix)**: `TenantId:AgentName:FlowName:IdPostfix`

## Quick usage

```csharp
// From a full Workflow ID (validates tenant prefix)
var wi1 = new WorkflowIdentifier("tenant:My Agent v1.3.1:Router Bot:123");
wi1.WorkflowId;   // "tenant:My Agent v1.3.1:Router Bot:123"
wi1.WorkflowType; // "My Agent v1.3.1:Router Bot"
wi1.AgentName;    // "My Agent v1.3.1"

// From a Workflow Type (auto-builds an ID without postfix)
var wi2 = new WorkflowIdentifier("My Agent v1.3.1:Router Bot");
wi2.WorkflowId;   // "tenant:My Agent v1.3.1:Router Bot"
wi2.WorkflowType; // "My Agent v1.3.1:Router Bot"
wi2.AgentName;    // "My Agent v1.3.1"

// Static helpers
WorkflowIdentifier.GetWorkflowId("My Agent v1.3.1:Router Bot"); 
WorkflowIdentifier.GetWorkflowType("tenant:My Agent v1.3.1:Router Bot:123"); // "My Agent v1.3.1:Router Bot"

// Note: GetAgentName expects a workflow type. If you pass a full ID,
// it returns the first segment (the tenant).
WorkflowIdentifier.GetAgentName("My Agent v1.3.1:Router Bot"); // "My Agent v1.3.1"
WorkflowIdentifier.GetAgentName("tenant:My Agent v1.3.1:Router Bot"); // "tenant"
```

## With typed flows (`[Workflow(Name = ...)]`)

```csharp
using Temporalio.Workflows;

[Workflow(Name = "My Agent v1.3.1:Router Bot")]
public class RouterBotFlow {}

WorkflowIdentifier.GetWorkflowTypeFor(typeof(RouterBotFlow));
// => "My Agent v1.3.1:Router Bot"

WorkflowIdentifier.GetSingletonWorkflowIdFor(typeof(RouterBotFlow));
// => "{TenantId}:My Agent v1.3.1:Router Bot"

WorkflowIdentifier.GetWorkflowIdFor(typeof(RouterBotFlow), Guid.NewGuid().ToString());
// => "{TenantId}:My Agent v1.3.1:Router Bot:{postfix}"
```

## Pitfalls

- **Tenant validation**: Passing a full ID with the wrong `tenantId` throws.

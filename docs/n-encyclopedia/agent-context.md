# AgentContext Utility Methods

The `AgentContext` class provides essential utility methods and properties for managing workflow execution context, agent information, and sub-workflow operations within the Xians AI platform.

## Workflow Utility Methods

### `GetSingletonWorkflowIdFor(Type flowClassType)`

Give the unique workflow ID for singleton workflows by combining the tenant ID and workflow type.

**Returns:** `string` - Formatted as `{TenantId}:{WorkflowType}`

**Usage:**

```csharp
var workflowId = AgentContext.GetSingletonWorkflowIdFor(typeof(MyWorkflow));
```

### `GetWorkflowTypeFor(Type flowClassType)`

Extracts the workflow type name from a workflow class using the `WorkflowAttribute`.

**Returns:** `string` - The workflow type name

**Throws:** `InvalidOperationException` if WorkflowAttribute.Name is not set

### `StartWorkflow<TWorkflow>(string namePostfix, object[] args)`

Starts a new sub-workflow asynchronously.

**Parameters:**

- `namePostfix`: Suffix to append to workflow name
- `args`: Arguments to pass to the workflow

**Returns:** `Task`

### `ExecuteWorkflow<TWorkflow, TResult>(string namePostfix, object[] args)`

Executes a sub-workflow and waits for its result.

**Parameters:**

- `namePostfix`: Suffix to append to workflow name  
- `args`: Arguments to pass to the workflow

**Returns:** `Task<TResult>` - The workflow execution result

## Context Properties

### Identity and Security

- **`TenantId`** - Gets the current tenant identifier from certificate info
- **`UserId`** - Gets the current user identifier from certificate info
- **`CertificateInfo`** - Gets certificate information for authentication and authorization

### Agent Information

- **`AgentName`** - Gets/sets the current agent name
  - In workflow context: Retrieved from workflow memo
  - Outside workflow: Uses static field value
  - Throws exception if not properly initialized

### Workflow Context

- **`WorkflowId`** - Gets the current workflow identifier
  - Available in workflow, activity, or when explicitly set
- **`WorkflowType`** - Gets the current workflow type
  - Available in workflow, activity, or when explicitly set  
- **`WorkflowRunId`** - Gets the current workflow run identifier
  - Available in workflow, activity, or when explicitly set

## Context Detection

The class automatically detects the execution context:

- **Workflow Context:** Uses `Workflow.InWorkflow` and `Workflow.Info`
- **Activity Context:** Uses `ActivityExecutionContext.HasCurrent` and `ActivityExecutionContext.Current.Info`
- **External Context:** Falls back to static field values

## Usage Patterns

### Within a Workflow

```csharp
// Context properties are automatically available
var currentAgent = AgentContext.AgentName;
var workflowId = AgentContext.WorkflowId;
```

### Within an Activity

```csharp
// Activity context provides workflow information
var workflowType = AgentContext.WorkflowType;
var runId = AgentContext.WorkflowRunId;
```

### Starting Sub-workflows

```csharp
// Fire-and-forget sub-workflow
await AgentContext.StartWorkflow<ProcessingWorkflow>("_batch", new object[] { data });

// Execute and wait for result
var result = await AgentContext.ExecuteWorkflow<CalculationWorkflow, int>("_calc", new object[] { input });
```

This utility class serves as the central access point for workflow context information and sub-workflow management within the Xians AI platform.

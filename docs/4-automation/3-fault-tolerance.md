# Fault Tolerance and Error Handling

## Overview

Xians leverages Temporal workflow capabilities to provide robust fault tolerance and error handling for AI agents. Temporal automatically manages workflow state, retries, and failure recovery, eliminating the need for custom implementation of complex error handling patterns.

## Temporal-Based Fault Tolerance

### Core Principle

To utilize fault tolerance features, critical business logic must run within workflows, not activities. Activities should only perform stateless operations and delegate complex error handling to workflows.

### Workflow Configuration

Enable fault-tolerant processing by setting `processInWorkflow = true`:

```csharp
// Data processing in workflow
flow.SetDataProcessor<MyDataProcessor>(processInWorkflow: true);

// Schedule processing in workflow
flow.SetScheduleProcessor<MyScheduleProcessor>(processInWorkflow: true);
```

### Starting Workflows from Activities

When in an activity, explicitly start a workflow for fault-tolerant execution:

## Retry Policies

### Custom Retry Configuration

Always configure custom retry policies. The default Temporal retry policy attempts infinite retries, which can cause issues:

```csharp
var retryPolicy = new RetryPolicy
{
    InitialInterval = TimeSpan.FromSeconds(1),
    MaximumInterval = TimeSpan.FromMinutes(2),
    BackoffCoefficient = 2.0,
    MaximumAttempts = 5,
    NonRetryableErrorTypes = new[] { "ValidationException", "AuthenticationException" }
};

// Apply to activity execution
await Workflow.ExecuteActivityAsync(
    () => MyActivity.ProcessAsync(data),
    new ActivityOptions 
    { 
        ScheduleToCloseTimeout = TimeSpan.FromMinutes(10),
        RetryPolicy = retryPolicy 
    });
```

### Timeout Configuration

Use `ScheduleToCloseTimeout` to set maximum duration for activity completion:

```csharp
var activityOptions = new ActivityOptions
{
    ScheduleToCloseTimeout = TimeSpan.FromHours(1), // Maximum total time
    StartToCloseTimeout = TimeSpan.FromMinutes(10),  // Per-attempt timeout
    RetryPolicy = retryPolicy
};
```

## Exception Handling

### Recoverable Failures

Activities should throw exceptions for recoverable failures to trigger Temporal's retry mechanisms:

```csharp
[Activity]
public async Task<ProcessResult> ProcessDataActivity(ProcessingRequest request)
{
    try
    {
        var result = await _externalService.ProcessAsync(request);
        return result;
    }
    catch (HttpRequestException ex) when (ex.Message.Contains("timeout"))
    {
        // Let Temporal retry transient network issues
        throw new ApplicationFailureException("Network timeout occurred", ex);
    }
    catch (SqlException ex) when (IsTransientError(ex))
    {
        // Let Temporal retry database connection issues
        throw new ApplicationFailureException("Database connection failed", ex);
    }
}
```

### Non-Retryable Failures

For data validation and permanent failures, set `NonRetryable = true`:

```csharp
[Activity]
public async Task ValidateAndProcess(ProcessingRequest request)
{
    if (string.IsNullOrEmpty(request.UserId))
    {
        // Don't retry validation failures
        throw new ApplicationFailureException(
            "User ID is required", 
            null, 
            nonRetryable: true);
    }
    
    if (!await _authService.IsAuthorized(request.UserId))
    {
        // Don't retry authorization failures
        throw new ApplicationFailureException(
            "User not authorized", 
            null, 
            nonRetryable: true);
    }
    
    // Process the request...
}
```

## Workflow Implementation Examples

### Data Processing Workflow

```csharp
[Workflow]
public class DataProcessingWorkflow
{
    private readonly RetryPolicy _defaultRetryPolicy = new()
    {
        InitialInterval = TimeSpan.FromSeconds(2),
        MaximumInterval = TimeSpan.FromMinutes(5),
        BackoffCoefficient = 2.0,
        MaximumAttempts = 3,
        NonRetryableErrorTypes = new[] { "ValidationException" }
    };

    [WorkflowRun]
    public async Task<ProcessingResult> RunAsync(DataProcessingRequest request)
    {
        // Validate input (non-retryable)
        await Workflow.ExecuteActivityAsync(
            () => ValidationActivity.ValidateAsync(request),
            new ActivityOptions
            {
                StartToCloseTimeout = TimeSpan.FromMinutes(1),
                RetryPolicy = new RetryPolicy { MaximumAttempts = 1 }
            });

        // Process data (retryable)
        var processResult = await Workflow.ExecuteActivityAsync(
            () => ProcessingActivity.ProcessAsync(request),
            new ActivityOptions
            {
                ScheduleToCloseTimeout = TimeSpan.FromHours(2),
                StartToCloseTimeout = TimeSpan.FromMinutes(30),
                RetryPolicy = _defaultRetryPolicy
            });

        // Store results (retryable)
        await Workflow.ExecuteActivityAsync(
            () => StorageActivity.StoreAsync(processResult),
            new ActivityOptions
            {
                StartToCloseTimeout = TimeSpan.FromMinutes(5),
                RetryPolicy = _defaultRetryPolicy
            });

        return processResult;
    }
}
```

## Error Categories and Handling

### Transient Errors (Retryable)

- Network timeouts
- Database connection failures
- Temporary service unavailability
- Rate limiting (429 errors)

```csharp
// Let Temporal handle retries automatically
throw new ApplicationFailureException("Service temporarily unavailable", ex);
```

### Permanent Errors (Non-Retryable)

- Data validation failures
- Authentication/authorization errors
- Business rule violations
- Malformed requests

```csharp
// Prevent unnecessary retries
throw new ApplicationFailureException("Invalid data format", ex, nonRetryable: true);
```

### Timeout Types

- **StartToCloseTimeout**: Maximum time for single activity execution
- **ScheduleToCloseTimeout**: Maximum total time including all retries
- **HeartbeatTimeout**: For long-running activities requiring heartbeats

For more details, see [Temporal Failure Handling](https://docs.temporal.io/encyclopedia/detecting-activity-failures).

## Best Practices

1. **Run Critical Logic in Workflows**: Place fault-tolerant business logic in workflows, not activities
2. **Configure Custom Retry Policies**: Never rely on default infinite retry behavior
3. **Use Appropriate Timeouts**: Set reasonable timeouts to prevent hanging processes
4. **Mark Non-Retryable Errors**: Use `nonRetryable: true` for validation and permanent failures
5. **Implement Compensation**: Use workflow capabilities for rollback and cleanup operations
6. **Monitor Workflow Execution**: Leverage Temporal's UI and metrics for observability

Temporal's workflow engine provides automatic state management, retry logic, and failure recovery, making fault tolerance straightforward and reliable without custom implementation complexity.

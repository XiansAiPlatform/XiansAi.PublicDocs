# Retry Policy in XiansAi Workflows

This guide explains how to implement retry policies in your XiansAi workflows using Temporal's activity options.

## Overview

XiansAi leverages Temporal's robust retry policy system to handle transient failures in activities. The system provides:

- Configurable retry attempts and backoff strategies
- Customizable timeout settings
- Automatic handling of transient failures
- Fine-grained control over activity execution

## Activity Options Configuration

Activities in XiansAi workflows can be configured with various options to control their execution and retry behavior:

```csharp
private readonly ActivityOptions _activityOptions = new()
{
    // Total timeout for all attempts including retries
    ScheduleToCloseTimeout = TimeSpan.FromMinutes(5),
    
    // Timeout for each individual attempt
    StartToCloseTimeout = TimeSpan.FromMinutes(1),
    
    // Timeout for activity heartbeats
    HeartbeatTimeout = TimeSpan.FromSeconds(30),
    
    // Retry policy configuration
    RetryPolicy = new RetryPolicy
    {
        InitialInterval = TimeSpan.FromSeconds(1),
        MaximumInterval = TimeSpan.FromMinutes(1),
        BackoffCoefficient = 2.0,
        MaximumAttempts = 3
    }
};
```

## Timeout Settings

### ScheduleToCloseTimeout
- Total timeout for all attempts including retries
- Must be set if StartToCloseTimeout is not set
- Defaults to workflow execution timeout if unset

### StartToCloseTimeout
- Timeout for each individual retry attempt
- Must be set if ScheduleToCloseTimeout is not set
- Applies to each separate retry attempt

### ScheduleToStartTimeout
- Timeout from schedule to when activity is picked up by a worker
- Defaults to ScheduleToCloseTimeout if unset

### HeartbeatTimeout
- Required for activities to receive cancellation
- Should be set for all but the most instantly completing activities

## Retry Policy Configuration

The RetryPolicy property allows you to configure how activities handle failures:

```csharp
RetryPolicy = new RetryPolicy
{
    // Initial delay between retries
    InitialInterval = TimeSpan.FromSeconds(1),
    
    // Maximum delay between retries
    MaximumInterval = TimeSpan.FromMinutes(1),
    
    // Multiplier for the interval after each retry
    BackoffCoefficient = 2.0,
    
    // Maximum number of retry attempts
    MaximumAttempts = 3,
    
    // Non-retryable error types
    NonRetryableErrorTypes = new[] { "NonRetryableError" }
}
```

## Example Implementation

Here's a complete example of a workflow using activity options with retry policy:

```csharp
using Temporalio.Common;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Example Workflow")]
public class ExampleWorkflow : FlowBase
{
    private readonly ActivityOptions _activityOptions = new()
    {
        ScheduleToCloseTimeout = TimeSpan.FromMinutes(5),
        StartToCloseTimeout = TimeSpan.FromMinutes(1),
        HeartbeatTimeout = TimeSpan.FromSeconds(30),
        RetryPolicy = new RetryPolicy
        {
            InitialInterval = TimeSpan.FromSeconds(1),
            MaximumInterval = TimeSpan.FromMinutes(1),
            BackoffCoefficient = 2.0,
            MaximumAttempts = 3
        }
    };

    [WorkflowRun]
    public async Task<string> Run(string input)
    {
        try
        {
            var result = await Workflow.ExecuteActivityAsync(
                (IExampleActivity a) => a.ProcessData(input), 
                _activityOptions
            );
            return result;
        }
        catch (Exception ex)
        {
            // Handle any non-retryable errors here
            throw;
        }
    }
}
```

## Best Practices

### 1. Timeout Configuration
- Always set appropriate timeouts for your activities
- Consider the nature of the activity when setting timeouts
- Use HeartbeatTimeout for long-running activities

### 2. Retry Policy Design
- Set reasonable MaximumAttempts to prevent infinite retries
- Use exponential backoff with BackoffCoefficient
- Configure appropriate InitialInterval and MaximumInterval
- Specify NonRetryableErrorTypes for errors that shouldn't be retried

### 3. Error Handling
- Implement proper error handling in activities
- Use appropriate error types for different failure scenarios
- Consider using custom exceptions for specific error cases

### 4. Performance Considerations
- Balance retry attempts with overall workflow timeout
- Consider the impact of retries on downstream systems
- Monitor retry patterns to identify systemic issues

## Additional Options

ActivityOptions provides several other useful settings:

- **CancellationType**: Controls how the workflow handles activity cancellation
- **TaskQueue**: Specifies which task queue to use for the activity
- **DisableEagerActivityExecution**: Controls whether to disable eager execution optimization
- **VersioningIntent**: Controls worker versioning behavior
- **ActivityId**: Unique identifier for the activity (use with caution)

## Implementation Details

The retry system uses:
- Exponential backoff for retry intervals
- Configurable maximum attempts
- Customizable error type filtering
- Automatic handling of transient failures
- Integration with Temporal's workflow engine

This architecture allows you to build resilient workflows that can handle transient failures while maintaining control over the retry behavior and execution timeouts.

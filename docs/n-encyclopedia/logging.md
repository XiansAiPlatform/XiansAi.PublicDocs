# Logging in XiansAi Workflows

This guide explains how to implement logging in your XiansAi workflows using the built-in logging framework.

## Overview

XiansAi provides a robust logging system built on top of Microsoft.Extensions.Logging that integrates with Temporal workflows. The system supports multiple log levels, context-aware logging, and configurable output destinations. This approach enables:

- Consistent logging across workflows and activities
- Automatic context capture for better debugging
- Configurable log levels for different environments
- Thread-safe logging implementation

## Step 1: Initialize Logger

To use logging in your workflow or activity, first initialize a static logger instance:

```csharp
using XiansAi.Logging;

public class YourWorkflow : FlowBase
{
    private static readonly Logger<YourWorkflow> _logger = Logger<YourWorkflow>.For();
}
```

## Step 2: Configure Logging

The logging system can be configured through environment variables:

```bash
# Set console log level (defaults to Debug if not set)
CONSOLE_LOG_LEVEL=DEBUG  # Options: TRACE, DEBUG, INFORMATION/INFO, WARNING/WARN, ERROR, CRITICAL
```

## Step 3: Implement Logging

### Workflow Example

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Logging;

[Workflow("Example Workflow")]
public class ExampleWorkflow : FlowBase
{
    private static readonly Logger<ExampleWorkflow> _logger = Logger<ExampleWorkflow>.For();

    private readonly ActivityOptions _activityOptions = new()
    {
        ScheduleToCloseTimeout = TimeSpan.FromMinutes(1)
    };

    [WorkflowRun]
    public async Task<string> Run(string input)
    {
        _logger.LogInformation("Starting workflow with input: " + input);

        try
        {
            var result = await Workflow.ExecuteActivityAsync(
                (IExampleActivity a) => a.ProcessData(input), 
                _activityOptions
            );

            _logger.LogInformation("Workflow completed successfully");
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogCritical("Critical workflow failure that requires admin attention", ex);
            throw;
        }
    }
}
```

### Activity Example

```csharp
using Temporalio.Activities;
using XiansAi.Logging;

public interface IExampleActivity
{
    [Activity]
    Task<string> ProcessData(string input);
}

public class ExampleActivity : IExampleActivity
{
    private static readonly Logger<ExampleActivity> _logger = Logger<ExampleActivity>.For();

    public Task<string> ProcessData(string input)
    {
        _logger.LogInformation("Starting to process data: " + input);

        try
        {
            // Simulate some processing
            var result = input.ToUpper();
            _logger.LogInformation("Data processed successfully");

            return Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed to process data", ex);
            throw;
        }
    }
}
```

## Log Levels

XiansAi supports all standard log levels from Microsoft.Extensions.Logging:

1. **Trace** (`LogTrace`): Most detailed logging level
2. **Debug** (`LogDebug`): Detailed information for debugging
3. **Information** (`LogInformation`): General operational messages
4. **Warning** (`LogWarning`): Potentially harmful situations
5. **Error** (`LogError`): Error events that might still allow the application to continue
6. **Critical** (`LogCritical`): Critical failures that require admin attention and will trigger notifications in the admin panel. Should only be used at the workflow level.

## Best Practices

### 1. Log Level Selection

- Use `LogTrace` for very detailed debugging information
- Use `LogDebug` for general debugging information
- Use `LogInformation` for normal operational messages
- Use `LogWarning` for potentially harmful situations
- Use `LogError` for recoverable errors
- Use `LogCritical` only at the workflow level for failures that require admin attention

### 2. Critical Error Usage

- Use `LogCritical` only at the workflow level
- Use for system-level failures that require immediate attention
- Use for security-related issues
- Use for data integrity problems
- Use for critical business rule violations
- Critical errors will automatically notify administrators via the admin panel
- Activities should use `LogError` or `LogWarning` instead of `LogCritical`

### 3. Exception Logging

Exceptions are optional when logging errors:

```csharp
// In activities, use error level
_logger.LogError("Activity failed", exception);

// In workflows, use critical for important failures
_logger.LogCritical("Critical workflow failure", exception);
```

### 4. Context Usage

- The logger automatically includes workflow context when available
- No need to manually add context information
- Context is preserved across async boundaries

### 5. Performance Considerations

- Logger instances are cached per type
- Lazy initialization ensures minimal overhead
- Context data is collected only when needed

## Implementation Details

The logging system uses:
- Microsoft.Extensions.Logging as the base framework
- ConcurrentDictionary for thread-safe logger caching
- Lazy initialization for performance
- Automatic context detection for workflows and activities
- Environment variable configuration
- Console and API logging providers

This architecture allows you to build robust logging into your workflows while maintaining performance and thread safety. Each workflow and activity can have its own logger instance, making the system modular and maintainable.

# Scheduled Execution (Alternative Method)

## Overview

This document describes an alternative method for scheduling agent workflows using schedule attributes and processors. **This approach is less recommended due to stability concerns** and should only be used for specific use cases where the standard Temporal scheduling features are not suitable.

!!! warning "Recommended Approach"
    For most scheduling use cases, use [Flow Scheduling](2-flow-scheduling.md) instead, which leverages Temporal's native scheduling features and provides better stability and reliability.

This alternative method enables AI agents to execute workflows automatically at predetermined times or intervals using schedule attributes within the workflow itself. While functional, it does not utilize Temporal's native scheduling infrastructure and may have limitations in terms of robustness and fault tolerance.

## How Scheduled Execution Works

### Workflow Structure

To create a scheduled agent workflow, you need two main components:

1. **A Workflow Class**: Inherits from `FlowBase` and defines the main process
2. **A Processor Class**: Contains methods decorated with schedule attributes

### Configuring Schedule Processor

The schedule processor is configured using the `SetScheduleProcessor` method on your flow. This method controls how and where your scheduled tasks execute.

#### Example Workflow

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Invoice Agent:User Request Flow")]
public class UserRequestFlow : FlowBase
{
    [WorkflowRun]
    public async Task Run()
    {
        await InitSchedule();
    }
}
```

#### Example Processor

```csharp
using Temporalio.Workflows;

public class ScheduledProcessor
{
    [CronSchedule("*/1 * * * *")]  // Every 1 minute
    public void FrequentTask() 
    {
        Console.WriteLine($"Processing frequent task");
        Console.WriteLine($"Is In Workflow: {Workflow.InWorkflow}");
        Console.WriteLine($"Processed at: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
    }

    [IntervalSchedule(seconds: 10)]
    public void RunEvery10Seconds()
    {
        Console.WriteLine($"Processing 10-second interval data");
        Console.WriteLine($"Processed at: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
    }
}
```

### Connecting Workflow and Processor

To connect your workflow with a schedule processor, configure it in your `Program.cs`:

```csharp
using XiansAi.Flow;
using DotNetEnv;

// Load environment configuration
Env.Load();

// Create agent
var agent = new AgentTeam("Scheduled Processing Agent");

// Add flow and configure schedule processor
var flow = agent.AddAgent<UserRequestFlow>();
flow.SetScheduleProcessor<ScheduledProcessor>();

// Run the agent
await agent.RunAsync();
```

## SetScheduleProcessor Method Parameters

The `SetScheduleProcessor` method provides fine-grained control over schedule execution behavior:

```csharp
public Flow<TWorkflow> SetScheduleProcessor<TProcessor>(
    bool processInWorkflow = false, 
    bool startAutomatically = true)
```

### Parameters Explained

#### `processInWorkflow` Parameter

Controls where scheduled methods execute within Temporal's architecture:

| Parameter Value | Execution Location | Use Cases | Benefits | Limitations |
|---|---|---|---|---|
| **`false` (default)** | Temporal Activity | • Simple, stateless operations • Direct I/O operations • Independent tasks | • Direct access to external resources • Simple error handling • Better performance for simple tasks | • No access to workflow features • Limited orchestration capabilities |
| **`true`** | Temporal Workflow | • Complex orchestration • Tasks requiring workflow features • Multi-step processes | • Access to timers, signals, queries • Workflow persistence • Advanced error handling | • Cannot perform direct I/O • Must use activities for external calls |

##### Example: Process in Activity (Default)

```csharp
// Configure for simple, stateless operations
flow.SetScheduleProcessor<ScheduledProcessor>(processInWorkflow: false);

public class ScheduledProcessor
{
    [DailySchedule("09:00")]
    public async Task ProcessDailyReports()
    {
        // Direct database access is allowed
        var data = await _database.GetDailyData();
        
        // Direct file operations are allowed
        await File.WriteAllTextAsync("report.txt", data);
        
        // Direct HTTP calls are allowed
        await _httpClient.PostAsync("https://api.example.com", content);
    }
}
```

##### Example: Process in Workflow

```csharp
// Configure for complex orchestration scenarios
flow.SetScheduleProcessor<ScheduledProcessor>(processInWorkflow: true);

public class ScheduledProcessor
{
    [DailySchedule("09:00")]
    public async Task ProcessComplexWorkflow()
    {
        // Access to workflow features
        await Workflow.DelayAsync(TimeSpan.FromMinutes(5));
        
        // Can wait for external signals
        await Workflow.WaitConditionAsync(() => someCondition);
        
        // Use activities for external operations
        var data = await Workflow.ExecuteActivityAsync(
            () => _activities.GetDailyData(),
            ActivityOptions.Default
        );
        
        // Complex orchestration logic
        if (data.RequiresApproval)
        {
            await Workflow.WaitConditionAsync(() => approvalReceived, TimeSpan.FromHours(24));
        }
    }
}
```

### Accessing the Flow instance and processor lifecycle

When `processInWorkflow: true`, you can receive the active Flow instance via the processor's constructor. This is useful when you need workflow context or to coordinate state within the same workflow execution.

```csharp
public class ScheduledProcessor
{
    private readonly UserRequestFlow _userRequestFlow;

    public ScheduledProcessor(UserRequestFlow userRequestFlow)
    {
        Console.WriteLine($"ScheduledProcessor constructed with Flow: {userRequestFlow}");
        _userRequestFlow = userRequestFlow;
    }

    [CronSchedule("*/1 * * * *")]
    public void FrequentTask()
    {
        // Use _userRequestFlow as needed within the workflow context
    }
}
```

Note on lifecycle and state

- Processor instances are created per scheduled invocation. Any fields on the processor are scoped to that single execution and are not shared across runs.
- For state that must persist across invocations, store it on the workflow (via workflow state) or use activities/external storage.

#### `startAutomatically` Parameter

Controls whether schedules begin executing immediately when the workflow starts:

| Parameter Value | Behavior | Use Cases |
|---|---|---|
| **`true` (default)** | Schedules start immediately when workflow runs | • Standard automated processes • Background maintenance tasks • Regular business operations |
| **`false`** | Workflow must be manually triggered | • On-demand scheduling • Conditional schedule activation • Manual process control |

### Configuration Examples

#### Basic Configuration

```csharp
// Simple scheduled tasks with default settings
var flow = agent.AddAgent<UserRequestFlow>();
flow.SetScheduleProcessor<ScheduledProcessor>();
```

#### Advanced Configuration

```csharp
// Complex orchestration with manual control
var flow = agent.AddAgent<UserRequestFlow>();
flow.SetScheduleProcessor<ScheduledProcessor>(
    processInWorkflow: true,     // Enable workflow features
    startAutomatically: false    // Manual schedule control
);
```

#### Business Process Example

```csharp
// Financial processing that requires workflow capabilities
var flow = agent.AddAgent<FinancialWorkflow>();
flow.SetScheduleProcessor<FinancialProcessor>(
    processInWorkflow: true,     // Need timers and signals for approvals
    startAutomatically: false    // Start only after compliance checks
);

public class FinancialProcessor
{
    [MonthlySchedule(1, "09:00")]  // First day of month at 9 AM
    public async Task ProcessMonthlyFinancials()
    {
        // Wait for month-end closing to complete
        await Workflow.WaitConditionAsync(() => monthEndClosed);
        
        // Process with approval timeout
        await Workflow.ExecuteActivityAsync(
            () => _activities.GenerateFinancialReport(),
            new ActivityOptions { ScheduleToCloseTimeout = TimeSpan.FromHours(2) }
        );
        
        // Wait for approval with timeout
        var approved = await Workflow.WaitConditionAsync(
            () => reportApproved, 
            TimeSpan.FromDays(3)
        );
        
        if (approved)
        {
            await Workflow.ExecuteActivityAsync(() => _activities.DistributeReport());
        }
    }
}
```

## Schedule Attributes

The XiansAi platform provides several scheduling attributes for different timing requirements:

### 1. CronSchedule Attribute

The `CronSchedule` attribute supports standard cron expressions and has two variants:

#### Hardcoded Cron Expression

```csharp
[CronSchedule("0 9 * * MON-FRI")]  // 9 AM on weekdays
public void GenerateDailyReport() 
{
    // Generate daily business reports
    Console.WriteLine("Generating daily report...");
}

[CronSchedule("0 0 1 * *")]  // First day of each month at midnight
public void ProcessMonthlyBilling() 
{
    // Process monthly billing cycles
    Console.WriteLine("Processing monthly billing...");
}

[CronSchedule("0 0 1 */3 *")]  // First day of every quarter
public void QuarterlyReview() 
{
    // Perform quarterly business reviews
    Console.WriteLine("Performing quarterly review...");
}

[CronSchedule("*/15 * * * *")]  // Every 15 minutes
public void HealthCheck() 
{
    // System health monitoring
    Console.WriteLine("Performing health check...");
}
```

#### Knowledge-Based Cron Expression

For dynamic scheduling where the cron expression is stored in the Agent Portal's knowledge base:

```csharp
[CronSchedule("Backup Schedule", true)]
public void BackupTask() 
{
    // The actual cron expression is retrieved from the knowledge base
    // using the key "Backup Schedule"
    Console.WriteLine($"Processing backup task");
    Console.WriteLine($"Processed at: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
}
```

**Knowledge-Based Benefits:**

- Schedule can be modified without redeploying the agent
- Business users can update schedules through the Agent Portal
- Centralized schedule management across multiple agents
- Runtime schedule adjustments based on business needs

### 2. IntervalSchedule Attribute

Execute tasks at regular intervals using various time units:

```csharp
// Execute every 30 seconds
[IntervalSchedule(seconds: 30)]
public void MonitorSystemMetrics()
{
    Console.WriteLine("Monitoring system metrics...");
}

// Execute every 5 minutes
[IntervalSchedule(minutes: 5)]
public void ProcessQueuedItems()
{
    Console.WriteLine("Processing queued items...");
}

// Execute every 2 hours
[IntervalSchedule(hours: 2)]
public void SyncExternalData()
{
    Console.WriteLine("Syncing external data...");
}

// Execute every 3 days
[IntervalSchedule(days: 3)]
public void PerformMaintenance()
{
    Console.WriteLine("Performing system maintenance...");
}
```

### 3. DailySchedule Attribute

Execute tasks at a specific time each day:

```csharp
// Every day at 8:30 AM
[DailySchedule("08:30")]
public void MorningReports()
{
    Console.WriteLine("Generating morning reports...");
}

// Every day at 6:00 PM
[DailySchedule("18:00")]
public void EndOfDayProcessing()
{
    Console.WriteLine("Processing end-of-day tasks...");
}

// Every day at midnight
[DailySchedule("00:00")]
public void DailyDataArchival()
{
    Console.WriteLine("Archiving daily data...");
}
```

### 4. WeeklySchedule Attribute

Execute tasks on specific days of the week at designated times:

```csharp
// Every Tuesday at 2:00 PM
[WeeklySchedule(DayOfWeek.Tuesday, "14:00")]
public void WeeklyTeamMeeting()
{
    Console.WriteLine("Preparing weekly team meeting data...");
}

// Every Friday at 5:00 PM
[WeeklySchedule(DayOfWeek.Friday, "17:00")]
public void WeeklyReports()
{
    Console.WriteLine("Generating weekly reports...");
}

// Every Monday at 9:00 AM
[WeeklySchedule(DayOfWeek.Monday, "09:00")]
public void WeeklyPlanning()
{
    Console.WriteLine("Initiating weekly planning process...");
}
```

### 5. MonthlySchedule Attribute

Execute tasks on specific days of the month:

```csharp
// Monthly on the 1st at 9:00 AM
[MonthlySchedule(1, "09:00")]
public void MonthlyBilling()
{
    Console.WriteLine("Processing monthly billing...");
}

// Monthly on the 15th at 2:00 PM
[MonthlySchedule(15, "14:00")]
public void MidMonthReports()
{
    Console.WriteLine("Generating mid-month reports...");
}

// Monthly on the last day (31st, adjusts for shorter months)
[MonthlySchedule(31, "23:59")]
public void MonthEndProcessing()
{
    Console.WriteLine("Processing month-end tasks...");
}
```

## When to Use This Approach

This alternative scheduling method may be appropriate for:

- Legacy systems being migrated to the XiansAi platform
- Specialized scheduling requirements not supported by Temporal's native features
- Experimental or prototype workflows

For production systems and standard scheduling needs, **use [Flow Scheduling](2-flow-scheduling.md)** instead, which provides better stability, reliability, and leverages Temporal's proven scheduling infrastructure.

## Comparison with Flow Scheduling

| Feature | Flow Scheduling (Recommended) | Scheduled Execution (Alternative) |
|---------|-------------------------------|----------------------------------|
| **Stability** | High - Uses Temporal's native scheduling | Lower - Custom implementation |
| **Reliability** | Production-ready with proven fault tolerance | May have limitations |
| **Ease of Use** | Simple setup with `SetScheduleAsync` | Requires processor configuration |
| **Maintenance** | Managed by Temporal | Requires additional oversight |
| **Use Case** | Recommended for all production scenarios | Specific legacy or edge cases |

For most use cases, the schedule attributes and processor configuration described in this document should be replaced with the simpler and more reliable [Flow Scheduling](2-flow-scheduling.md) approach.

# Scheduling SDK

For advanced scenarios where you need to dynamically create and manipulate schedules at runtime, the Xians platform provides the `SchedulerHub` class. This gives you programmatic control over workflow scheduling from within your agent code.

## Overview

The `SchedulerHub` class enables you to:

- Create schedules dynamically based on user input or system events
- Manage existing schedules (pause, unpause, delete, update)
- Trigger immediate workflow executions
- Query and inspect schedule configurations
- Backfill missed executions

## Creating Schedules

You can create schedules in two ways:

### Using Workflow Type

```csharp
using Temporalio.Client.Schedules;
using XiansAi.Scheduler;

// Create a schedule using the workflow class type
var scheduleHandle = await SchedulerHub.CreateScheduleAsync(
    typeof(MyWorkflowFlow),
    new ScheduleSpec {
        CronExpressions = new List<string> { "0 9 * * *" } // Daily at 9 AM
    },
    scheduleName: "daily-report"
);
```

### Using Workflow ID or Type String

```csharp
// Create a schedule using workflow type string
var scheduleHandle = await SchedulerHub.CreateScheduleAsync(
    workflowIdOrType: "MyWorkflowFlow",
    new ScheduleSpec {
        CronExpressions = new List<string> { "*/15 * * * *" } // Every 15 minutes
    },
    scheduleName: "frequent-check",
    options: new WorkflowOptions {
        RunTimeout = TimeSpan.FromMinutes(5)
    }
);
```

## Managing Schedules

### Pause a Schedule

```csharp
await SchedulerHub.PauseAsync(
    scheduleId: "daily-report",
    note: "Paused for maintenance"
);
```

### Unpause a Schedule

```csharp
await SchedulerHub.UnpauseAsync(
    scheduleId: "daily-report",
    note: "Resuming after maintenance"
);
```

### Delete a Schedule

```csharp
await SchedulerHub.DeleteAsync("daily-report");
```

!!! note
    Deleting a schedule does not affect workflow executions that have already been started by the schedule.

### Trigger Immediate Execution

```csharp
// Manually trigger a scheduled workflow to run immediately
await SchedulerHub.TriggerAsync("daily-report");
```

## Querying Schedules

### Describe a Schedule

```csharp
var description = await SchedulerHub.DescribeAsync("daily-report");

Console.WriteLine($"Schedule: {description.Id}");
Console.WriteLine($"Is Paused: {description.Schedule.State.Paused}");
Console.WriteLine($"Next Run: {description.Info.NextActionTimes.FirstOrDefault()}");
```

### List All Schedules

```csharp
var schedules = await SchedulerHub.ListSchedulesAsync();

await foreach (var schedule in schedules)
{
    Console.WriteLine($"Schedule ID: {schedule.ScheduleId}");
    Console.WriteLine($"Workflow Type: {schedule.Info.WorkflowType}");
}
```

## Updating Schedules

```csharp
await SchedulerHub.UpdateAsync("daily-report", input =>
{
    // Modify the schedule specification
    var updatedSchedule = input.Description.Schedule;
    updatedSchedule.Spec.CronExpressions = new List<string> { "0 10 * * *" }; // Change to 10 AM
    
    return new ScheduleUpdate(updatedSchedule);
});
```

## Backfilling Schedules

If you need to execute workflows for missed time periods:

```csharp
var schedulerHub = new SchedulerHub();

await schedulerHub.BackfillAsync(
    scheduleId: "daily-report",
    backfills: new[] {
        new ScheduleBackfill(
            startAt: DateTime.UtcNow.AddDays(-7),
            endAt: DateTime.UtcNow,
            overlap: ScheduleOverlapPolicy.Skip
        )
    }
);
```

## Real-World Example

Here's a practical example from a super agent that manages scheduled subagent runs:

```csharp
[Capability("Schedule a new subagent run definition for the user")]
[Parameter("subagentInstructions", "Subagent definition in JSON format")]
[Parameter("cronTrigger", "Cron trigger for the subagent")]
[Returns("Success message")]
public async Task<string> ScheduleSubAgentRuns(string subagentInstructions, string cronTrigger)
{
    var guid = Guid.NewGuid();

    // Save the subagent configuration to memory
    await MemoryHub.Documents.SaveAsync(new Document {
        Type = "SubAgentDefinition",
        Key: guid.ToString(),
        Content: JsonSerializer.SerializeToElement(subagentInstructions),
        Metadata: new Dictionary<string, object> {
            { "userId", _thread.ParticipantId }
        }
    });

    // Create a schedule using the GUID as the schedule name
    await SchedulerHub.CreateScheduleAsync(
        typeof(ProspectorAgent),
        new ScheduleSpec {
            CronExpressions = new List<string> { cronTrigger }
        },
        scheduleName: guid.ToString()
    );
    
    return "Subagent definition created successfully";
}

[Capability("Delete a scheduled subagent run for the user")]
[Parameter("guid", "GUID of the subagent definition to delete")]
public async Task<string> DeleteScheduledSubAgentRun(string guid)
{
    var existing = await GetScheduledSubAgentRun(guid);
    if (existing == null) {
        return "Subagent definition not found";
    }

    await SchedulerHub.DeleteAsync(guid);
    return "Subagent definition deleted successfully";
}
```

This example shows how to:

- Dynamically create schedules based on user-provided cron expressions
- Use GUIDs as schedule identifiers for easy correlation with stored data
- Clean up schedules when they're no longer needed

## Schedule Specifications

When creating schedules, you can use various `ScheduleSpec` options:

```csharp
var spec = new ScheduleSpec
{
    // Cron expressions (can specify multiple)
    CronExpressions = new List<string> { 
        "0 9 * * 1-5"  // Weekdays at 9 AM
    },
    
    // Or use intervals
    Intervals = new List<ScheduleIntervalSpec> {
        new ScheduleIntervalSpec {
            Every = TimeSpan.FromHours(2),
            Offset = TimeSpan.FromMinutes(15)
        }
    },
    
    // Skip times
    Skip = new List<ScheduleCalendarSpec> {
        new ScheduleCalendarSpec {
            DayOfWeek = new[] { 0, 6 }  // Skip weekends
        }
    },
    
    // Time zone
    TimeZoneId = "America/New_York"
};
```

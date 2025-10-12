# Flow Scheduling

Flow scheduling allows agents to execute repetitively on a defined schedule. This mechanism uses Temporal's native scheduling features and is recommended for most scheduled execution use cases.

## Setting Up a Schedule

To schedule an agent workflow, use the `SetScheduleAsync` method when configuring your agent:

```csharp
// Create the agent team
var agentTeam = new AgentTeam("Percy v4", options);

// Add the agent
var schedulerBot = agentTeam.AddAgent<DiscoveryBot>();
schedulerBot.AddActivities<ArticleActivities>(new ArticleActivities());

// Set up the schedule
await schedulerBot.SetScheduleAsync(new ScheduleSpec {
    Intervals = new List<ScheduleIntervalSpec> {
        new ScheduleIntervalSpec(TimeSpan.FromHours(4))
    }
});
```

This example configures the `DiscoveryBot` to run every 4 hours.

## Schedule Specification Options

The `ScheduleSpec` class provides three ways to define when your workflow should execute:

### Interval-Based Scheduling

Use `Intervals` for simple, repeating time-based schedules:

```csharp
await agent.SetScheduleAsync(new ScheduleSpec {
    Intervals = new List<ScheduleIntervalSpec> {
        new ScheduleIntervalSpec(TimeSpan.FromMinutes(30))
    }
});
```

### Calendar-Based Scheduling

Use `Calendars` for more complex scheduling based on calendar dates and times:

```csharp
await agent.SetScheduleAsync(new ScheduleSpec {
    Calendars = new List<ScheduleCalendarSpec> {
        new ScheduleCalendarSpec {
            Hour = new List<Range> { new Range(9, 17) }, // 9 AM to 5 PM
            DayOfWeek = new List<Range> { new Range(1, 5) } // Monday to Friday
        }
    }
});
```

### Cron-Based Scheduling

Use `CronExpressions` for cron-style scheduling (primarily for migration from legacy systems):

```csharp
await agent.SetScheduleAsync(new ScheduleSpec {
    CronExpressions = new List<string> {
        "0 */2 * * *" // Every 2 hours
    }
});
```

!!! note
    Cron expressions are provided for easy migration from legacy systems. New implementations should prefer `Calendars` for better clarity and functionality.

## Receiving the Schedule ID

When your workflow is triggered by a schedule, it receives the Temporal schedule ID as a parameter:

```csharp
[Workflow("Percy v4: Prospector Agent")]
public class ProspectorAgent : FlowBase
{
    [WorkflowRun]
    public async Task<string?> Run(string scheduleId)
    {
        // Use the scheduleId to retrieve configuration or context
        var subAgentDefinition = await MemoryHub.Documents.QueryAsync(new DocumentQuery
        {
            Type = "SubAgentDefinition",
            Key = scheduleId
        });
        
        // Your scheduled workflow logic here
        // ...
        
        return result;
    }
}
```

The `scheduleId` parameter can be used to:

- Retrieve schedule-specific configuration from the document store
- Track which schedule instance triggered the workflow
- Access user context or instructions associated with the schedule

## Use Cases

Flow scheduling is ideal for:

- **Periodic data collection**: Fetching data from external sources at regular intervals
- **Report generation**: Creating and distributing reports on a schedule
- **Health checks**: Running system monitoring tasks
- **Data synchronization**: Keeping external systems in sync with your platform
- **Proactive notifications**: Sending reminders or updates to users

## Additional Resources

For more detailed information on Temporal scheduling features and advanced configuration options, refer to the [Temporal Schedules documentation](https://docs.temporal.io/develop/dotnet/schedules).



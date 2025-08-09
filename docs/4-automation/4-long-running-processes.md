# Long-running processes with Temporal in Xians

Xians uses Temporal Workflows to reliably run operations that span hours, days, or even years. Workflows are durable: they survive worker restarts, deploys, and outages. This makes them ideal for human-in-the-loop steps, SLAs, escalations, and any process that must “pause” and later resume deterministically.

## Core building blocks

- **Durable Timers**: Pause a Workflow for a precise duration without holding system resources. Timers persist in Temporal and automatically resume when due.
- **Conditional waits**: Block until a business condition becomes true, typically after receiving external input via Signals or Updates.
- **Signals and Updates**: Messages that change Workflow state and resume progress. Signals are fire-and-forget; Updates are validated, tracked, and return results.

## Minimal .NET examples

- **Sleep/wait with a durable timer**

```csharp
// Pause the workflow for 3 days; resumes reliably even across restarts
await Workflow.DelayAsync(TimeSpan.FromDays(3));
```

- **Wait for external approval (Signal) before proceeding**

```csharp

public class DataProcessor {

    private readonly MessageThread _messageThread;
    private readonly ApprovalWorkflow _flow;

    public DataProcessor(MessageThread messageThread, ApprovalWorkflow flow) {
        _messageThread = messageThread;
        _flow = flow;
    }

    public async Task ApproveAsync() {
        _flow.SetApproved(true);
    }
```

```csharp
public class ApprovalWorkflow: FlowBase
{
    private bool approved;

    [WorkflowRun]
    public async Task RunAsync()
    {
        await Workflow.WaitConditionAsync(() => approved);
        // continue after approval
    }

    public void SetApproved(bool approved) { 
        approved = true; 
    }
}
```

## Common Xians scenarios

- **Human approval with expiry**: Start a Workflow when a request is created. Wait for an `ApproveAsync` Signal. If not approved within 7 days, auto-cancel or escalate. Uses a durable timer (SLA) + conditional wait (approval flag).
- **Multi-step onboarding**: Gate each step (KYC, contract, funding) behind a condition. Each gate has a timer for reminders and escalations. Signals/Updates set completion state.
- **External system callback with SLA**: Wait for a Signal from a downstream system indicating completion. In parallel, maintain an SLA timer; on timeout, retry, reroute, or notify ops.
- **Subscription renewals and dunning**: Sleep until renewal date, collect payment via Activity, then either complete or schedule retries/reminders using timers and conditions.
- **Inventory/fulfillment holds**: Park an order awaiting stock availability. Wake via Signal when inventory arrives; otherwise expire after N days and refund.

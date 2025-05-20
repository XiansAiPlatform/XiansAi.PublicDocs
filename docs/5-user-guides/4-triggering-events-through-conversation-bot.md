# Triggering External Workflows from Agent Capabilities

Sometimes your conversational agent must not only reply—but also **orchestrate** downstream processes. For example:

* **After collecting patient info**, kick off a batch job that processes it.
* **When a user requests data export**, send an event to a reporting workflow.

In this guide you’ll build a **Pre-Assessment Bot** whose **SavePatientInfo** capability emits an event. A separate **PatientInfoProcessor** workflow listens for that event and invokes an activity to actually process the data.

---

## Why & When

* **Decoupling concerns**
  The bot handles user interaction; a dedicated workflow handles heavy-lifting (database writes, integration calls).
* **Reliability & scaling**
  Temporal ensures the event is delivered and the processor workflow retries on failure.
* **Auditability**
  Each piece—bot, event, processor workflow, activity—is logged independently.

---

## 1. Define the Pre-Assessment Bot Workflow

Create `PreAssessmentBot.cs` under `XiansAi.Workflows`. It initializes the conversation and registers its capabilities:

```csharp
using Temporalio.Workflows;
using XiansAi.Models;
using XiansAi.Flow;
using Microsoft.Extensions.Logging;
using XiansAi.Events;
using XiansAi.Messaging;
using Temporalio.Exceptions;
using XiansAi.Capabilities;

namespace XiansAi.Workflows;

[Workflow("Pre Assessment Bot")]
public class PreAssessmentBot : FlowBase
{
    private readonly ILogger _logger;
    public PreAssessmentBot()
    {
        _logger = Workflow.Logger;
        // Register the capability class
        Capabilities.Add(typeof(PreAssessmentCapabilities));
    }

    [WorkflowRun]
    public async Task Run()
    {
        // 1️⃣ Load system prompt from Knowledge Hub
        var systemPrompt = await ObtainBotBehaviourKnowledge();

        // 2️⃣ Begin conversation context
        await InitUserConversation(systemPrompt);
    }

    private async Task<string> ObtainBotBehaviourKnowledge()
    {
        var k = await _knowledgeHub.GetKnowledgeAsync("Medical Info Collector Bot");
        if (k == null)
            throw new ApplicationFailureException("Failed to get agent config");
        return k.Content;
    }
}
```

**Explanation**

1. **Constructor**

    - Retrieves a logger for diagnostics.
    - Adds your `PreAssessmentCapabilities` class—these methods become callable by the agent.

2. **Run**

    - Fetches the system prompt (guardrails, tone, capabilities summary).
    - Calls `InitUserConversation` to apply that prompt and start listening for user messages.

---

## 2. Implement the Save-and-Emit Capability

In `PreAssessmentCapabilities.cs`, the bot captures patient info **and** emits a Temporal event so another workflow can act on it:

```csharp
using XiansAi.Router.Plugins;
using XiansAi.Messaging;
using XiansAi.Workflows;
using XiansAi.Models;
using XiansAi.Events;

namespace XiansAi.Capabilities;
public class PreAssessmentCapabilities
{
    private readonly MessageThread _thread;
    public PreAssessmentCapabilities(MessageThread messageThread)
        => _thread = messageThread;

    [Capability("Save Patient Info and trigger processing.")]
    [Parameter("appointmentId", "Unique identifier for the appointment")]
    [Parameter("patientName", "Name of the patient")]
    [Parameter("doctorName", "Name of the doctor")]
    [Returns("Status message of the save operation")]
    public Task<string> SavePatientInfo(
        string appointmentId,
        string patientName,
        string doctorName)
    {
        // 1️⃣ Determine target workflow
        var targetType = AgentContext.GetWorkflowTypeFor(typeof(PatientInfoProcessor));
        var targetId   = AgentContext.GetSingletonWorkflowIdFor(typeof(PatientInfoProcessor));

        // 2️⃣ Define event payload
        var payload = new AppointmentData
        {
            AppointmentId = appointmentId,
            PatientName   = patientName,
            DoctorName    = doctorName
        };

        // 3️⃣ Emit the "Process Patient Info" event
        EventHub.SendEvent(targetId, targetType, "Process Patient Info", payload);

        // 4️⃣ Return immediate confirmation to user
        return Task.FromResult("Patient info saved successfully.");
    }
}
```

***Step-by-Step Explanation:***

1. **Determine Target Workflow**  
   The capability identifies the target workflow where the event should be sent:
    - `AgentContext.GetWorkflowTypeFor(typeof(PatientInfoProcessor))`: Retrieves the workflow type for the `PatientInfoProcessor`. This ensures the event is sent to the correct workflow implementation.
    - `AgentContext.GetSingletonWorkflowIdFor(typeof(PatientInfoProcessor))`: Retrieves the unique workflow ID for the `PatientInfoProcessor`. This ensures the event is sent to a single instance of the workflow. If no instance exists, Temporal will create one automatically.

2. **Define Event Payload**  
   An `AppointmentData` object is created to encapsulate the event data. This object includes fields such as `AppointmentId`, `PatientName`, and `DoctorName`, which are passed as parameters to the capability.

3. **Emit the Event**  
   The `EventHub.SendEvent` method is used to send the event:
    - `targetId`: The ID of the target workflow instance.
    - `targetType`: The type of the target workflow.
    - `"Process Patient Info"`: The event type, which acts as a filter for the receiving workflow.
    - `payload`: The event data encapsulated in the `AppointmentData` object.

4. **Return Confirmation**  
   The capability immediately returns a confirmation message to the user, indicating that the patient info was saved successfully.

---

## 3. Define the Event Payload

Ensure both sender and listener agree on the payload shape. In `XiansAi.Models`:

```csharp
using System.Text.Json.Serialization;

namespace XiansAi.Models;
public class AppointmentData
{
    [JsonPropertyName("appointmentId")]
    public string? AppointmentId { get; set; }

    [JsonPropertyName("patientName")]
    public string? PatientName { get; set; }

    [JsonPropertyName("doctorName")]
    public string? DoctorName { get; set; }
}
```

---

## 4. Build the Processor Workflow

`PatientInfoProcessor.cs` listens for the “Process Patient Info” event and invokes an activity:

```csharp
using Temporalio.Workflows;
using XiansAi.Models;
using XiansAi.Flow;
using Microsoft.Extensions.Logging;
using XiansAi.Events;
using Temporalio.Exceptions;
using XiansAi.Activities;

namespace XiansAi.Workflows;

[Workflow("Patient Info Processing Workflow")]
public class PatientInfoProcessor : FlowBase
{
    private readonly Queue<AppointmentData> _eventQueue = new();
    private readonly ILogger _logger;

    public PatientInfoProcessor()
    {
        _logger = Workflow.Logger;
        // Register handler for incoming events
        _eventHub.RegisterHandler(args =>
        {
            try
            {
                var data = EventHub.CastPayload<AppointmentData>(args);
                _eventQueue.Enqueue(data);
                _logger.LogInformation("Enqueued appointment: {Id}", data.AppointmentId);
            }
            catch { /* ignore non-matching events */ }
        });
    }

    [WorkflowRun]
    public async Task Run()
    {
        while (true)
        {
            // Wait until an event arrives
            await Workflow.WaitConditionAsync(() => _eventQueue.Count > 0);
            var payload = _eventQueue.Dequeue();

            // Invoke the activity to process the info
            var result = await RunActivityAsync(
                (IPatientInfoProcessActivity a) =>
                    a.processInfo(
                        payload.AppointmentId ?? "-",
                        payload.PatientName    ?? "-",
                        payload.DoctorName     ?? "-")
            );

            _logger.LogInformation("Activity result: {Result}", result);
        }
    }
}
```

***Step-by-Step Explanation:***

1. **Event Handler Registration**  
   The workflow registers an event handler using `_eventHub.RegisterHandler`. This handler listens for incoming events:
    - The payload is cast to the `AppointmentData` type using `EventHub.CastPayload<AppointmentData>`.
    - If the cast is successful, the event is added to the `_eventQueue` for processing.
    - Logs are generated to track the enqueued events. Non-matching events are ignored.

2. **Wait for Events**  
   Inside the `Run` method, the workflow enters an infinite loop:
    - `Workflow.WaitConditionAsync(() => _eventQueue.Count > 0)`: Suspends the workflow until there is at least one event in the `_eventQueue`.

3. **Extract Payload**  
   Once an event is available, it is dequeued using `_eventQueue.Dequeue()`. The payload contains the appointment details, such as `AppointmentId`, `PatientName`, and `DoctorName`.

4. **Execute Activity**  
   The workflow invokes an activity to process the extracted payload:
    - `RunActivityAsync`: Executes the `processInfo` method of the `IPatientInfoProcessActivity` interface.
    - The activity processes the patient info (e.g., database writes, API calls) and returns a result.
    - Logs are generated to confirm the activity execution and its result.

By following these steps, the processor workflow ensures that incoming events are handled efficiently and the associated activities are executed to process the data.

---

## 5. Implement the Processing Activity

In `XiansAi.Activities`, define and implement the activity:

```csharp
using Temporalio.Activities;
using Microsoft.Extensions.Logging;

namespace XiansAi.Activities;

public interface IPatientInfoProcessActivity
{
    [Activity]
    Task<string> processInfo(string appointmentId, string patientName, string doctorName);
}

public class PatientInfoProcessActivity : ActivityBase, IPatientInfoProcessActivity
{
    private readonly ILogger<PatientInfoProcessActivity> _logger =
        LoggerFactory.Create(b => b.AddConsole())
                     .CreateLogger<PatientInfoProcessActivity>();

    public Task<string> processInfo(string appointmentId, string patientName, string doctorName)
    {
        _logger.LogInformation("Processing patient info for {Id}", appointmentId);

        // Insert your real processing logic here (DB writes, API calls, etc.)
        var summary = $"Processed Info:\n" +
                      $"- Appointment ID: {appointmentId}\n" +
                      $"- Patient Name: {patientName}\n" +
                      $"- Doctor Name: {doctorName}\n";

        return Task.FromResult(summary);
    }
}
```

---

## 6. Wire Everything in `Program.cs`

Register both workflows and the activity implementation:

```csharp
using XiansAi.Flow;
using DotNetEnv;
using XiansAi.Workflows;
using XiansAi.Activities;

public class Program
{
    public static async Task Main(string[] args)
    {
        Env.Load();

        var agentInfo = new AgentInfo {
            Name        = "Conversation Agent – Sending Events",
            Description = "Pre-Assessment Bot that emits events to trigger downstream workflows."
        };

        // 1️⃣ Pre-Assessment Bot
        var preFlow = new FlowInfo<PreAssessmentBot>(agentInfo);

        // 2️⃣ Patient Info Processor & its activity
        var procFlow = new FlowInfo<PatientInfoProcessor>(agentInfo);
        procFlow.AddActivities<IPatientInfoProcessActivity>(new PatientInfoProcessActivity());

        try
        {
            // Run both workflows in parallel
            await Task.WhenAll(
                new FlowRunnerService().RunFlowAsync(preFlow),
                new FlowRunnerService().RunFlowAsync(procFlow)
            );
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Shutdown requested. Exiting gracefully...");
        }
    }
}
```

---

## 7. Testing the End-to-End Flow

1. **Start your app**

   ```bash
   dotnet run
   ```

   You’ll see both the Pre-Assessment Bot and the PatientInfoProcessor worker poll Temporal.

2. **In Xian AI UI**

   * Navigate to **Agent Definitions**, create an instance of **Pre Assessment Bot**.
   * In **Messaging**, **Create Conversation** for that bot.

3. **Simulate user interaction**

   ```text
   User: Save my patient info for appointment 98765, patient John Doe, doctor Dr. Lee.
   Bot: Sure—what’s the patient’s name?
   User: John Doe
   Bot: Got it—what’s the doctor’s name?
   User: Dr. Lee
   Bot: Patient info saved successfully.
   ```

4. **Observe downstream processing**

    * In your Agent Runs tab, you’ll see:
        * An emitted “Process Patient Info” agent run instance is completed.
        * The **PatientInfoProcessor** dequeues it and runs the activity.
        * Activity logs confirm the data was processed.

---

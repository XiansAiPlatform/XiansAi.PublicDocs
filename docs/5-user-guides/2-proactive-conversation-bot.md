# Proactive Conversation Bot (Event-Driven Initiation)

Sometimes you need your chatbot to start the conversation—rather than waiting for a user prompt. This is crucial when:

- **Appointment reminders**: Remind patients about upcoming visits.
- **Alerts & notifications**: Notify users of status changes (order shipped, ticket updates).
- **Timed check-ins**: Automatically follow up after a certain period.

In this guide, you’ll build a Consultant Bot that listens for an external `AppointmentCompleted` event, then proactively messages the user with their appointment details.

---

## 1. Define the Proactive Workflow

Create `ConsultantBot.cs` under `XiansAi.Workflows`. This workflow:

- Registers an event handler that enqueues incoming appointment events.
- On startup, loads its system prompt from Knowledge Hub.
- Enters an infinite loop, waiting for events, then sends the initial message.

```csharp
using Temporalio.Workflows;
using XiansAi.Models;
using XiansAi.Flow;
using ConversiveAgent;
using Microsoft.Extensions.Logging;
using XiansAi.Events;
using XiansAi.Messaging;
using Temporalio.Exceptions;

namespace XiansAi.Workflows;

[Workflow("Consultant Bot")]
public class ConsultantBot : FlowBase
{
    private readonly Queue<AppointmentData> _eventQueue = new Queue<AppointmentData>();
    private readonly ILogger _logger;

    public ConsultantBot()
    {
        _logger = Workflow.Logger;
        Capabilities.Add(typeof(MedicalCenterCapabilities));

        // 1️⃣ Register event handler for AppointmentCompleted events
        _eventHub.RegisterHandler(args =>
        {
            try
            {
                var payload = EventHub.CastPayload<AppointmentData>(args);
                _eventQueue.Enqueue(payload);
                _logger.LogInformation("Enqueued appointment event: {AppointmentId}", payload.AppointmentId);
            }
            catch (InvalidCastException)
            {
                _logger.LogDebug("Ignored non-appointment event");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing event: {Message}", ex.Message);
            }
        });
    }

    [WorkflowRun]
    public async Task Run()
    {
        // 2️⃣ Load your system prompt from Knowledge Hub
        var systemPrompt = await ObtainBotBehaviourKnowledge();

        // 3️⃣ Initialize conversation context (non-blocking)
        _ = InitUserConversation(systemPrompt);

        // 4️⃣ Loop: wait for events, then send proactive message
        while (true)
        {
            try
            {
                await Workflow.WaitConditionAsync(() => _eventQueue.Count > 0);
                var data = _eventQueue.Dequeue();

                var message = $"Hey {data.PatientName}, your appointment with {data.DoctorName} is confirmed.\n" +
                              $"• Prescription: {data.Prescription}\n" +
                              $"• Doctor’s Note: {data.DoctorNote}";

                // 5️⃣ Send the initial message (creates thread if needed)
                await MessageHub.SendMessageAsync(message, data.AppointmentId ?? "default");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending proactive message: {Message}", ex.Message);
            }
        }
    }

    private async Task<string> ObtainBotBehaviourKnowledge()
    {
        var k = await _knowledgeHub.GetKnowledgeAsync("Consultant Bot Behaviour");
        if (k == null)
            throw new ApplicationFailureException("Failed to get agent config");
        return k.Content;
    }
}
```

***Detailed Explanation of Key Steps:***

- **Event Queue Initialization**  
    The workflow initializes a private `_eventQueue` to store incoming `AppointmentCompleted` events. This queue ensures that events are processed in the order they are received.

- **Event Registration (`_eventHub.RegisterHandler`)**  
  The `_eventHub.RegisterHandler` method is used to listen for incoming events. When an event is received:
    1. The payload is cast to the `AppointmentData` type.
    2. If the cast is successful, the event is added to the `_eventQueue`.
    3. Logs are generated to track the event processing status. Invalid or non-appointment events are ignored.

- **Proactive Loop**  
  Inside the `Run` method, the workflow enters an infinite loop:
    1. It uses `Workflow.WaitConditionAsync` to suspend execution until there is at least one event in the `_eventQueue`.
    2. Once an event is available, it is dequeued using `_eventQueue.Dequeue()`.
    3. A proactive message is constructed using the event data and sent to the user via `MessageHub.SendMessageAsync`. If no conversation thread exists for the given `AppointmentId`, a new thread is created automatically.

- **Error Handling**  
    The workflow includes robust error handling to log and manage any issues that occur during event processing or message sending.

---

## 2. Define Capabilities

Use the same `MedicalCenterCapabilities` as before, which provides methods the bot may call later if the user replies:

```csharp
using XiansAi.Router.Plugins;

namespace ConversiveAgent;
public static class MedicalCenterCapabilities 
{
    [Capability("Retrieve prescription information for a patient.")]
    [Parameter("patientNumber", "Unique identifier for the patient")]
    [Returns("Prescription details including medication names, dosages, and instructions")]
    public static Task<string[]> GetPrescriptionInformation(string patientNumber) { /* … */ }

    [Capability("Retrieve doctor information for a patient.")]
    [Parameter("patientNumber", "Unique identifier for the patient")]
    [Returns("Doctor details including name, specialization, and contact information")]
    public static Task<string> GetDoctorInformation(string patientNumber) { /* … */ }
}
```

These capabilities let your bot answer follow-up questions once the user responds to the proactive message.

---

## 3. Define the Event Payload Model

Make sure your appointment data contract matches what your external workflow sends:

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

    [JsonPropertyName("prescription")]
    public string? Prescription { get; set; }

    [JsonPropertyName("doctorNote")]
    public string? DoctorNote { get; set; }
}
```

---

## 4. Triggering the Event Externally

Create a separate workflow (`EventTriggerWorkflow.cs`) that fires the `AppointmentCompleted` event:

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Events;
using XiansAi.Models;
using Microsoft.Extensions.Logging;

namespace XiansAi.Workflows;

[Workflow("Consultation Event Trigger")]
public class EventTriggerWorkflow : FlowBase
{
    private readonly ILogger _logger = Workflow.Logger;

    [WorkflowRun]
    public async Task<string> Run()
    {
        // 1️⃣ Build your appointment payload
        var data = new AppointmentData {
            AppointmentId = "12345",
            PatientName   = "Alan Brown",
            DoctorName    = "Dr. Smith",
            Prescription  = "Cetirizine 10mg once daily; Paracetamol 500mg as needed; Ibuprofen 400mg every 8 hours.",
            DoctorNote    = "Follow up in 2 weeks."
        };

        _logger.LogInformation("Triggering appointment event for {Id}", data.AppointmentId);

        // 2️⃣ Send event to the ConsultantBot workflow
        await SendAppointmentCompletedEvent(data);
        return "Event Trigger Workflow Completed";
    }

    private async Task SendAppointmentCompletedEvent(AppointmentData data)
    {
        var evtType    = "AppointmentCompleted";
        var wfId       = AgentContext.GetSingletonWorkflowIdFor(typeof(ConsultantBot));
        var wfType     = AgentContext.GetWorkflowTypeFor(typeof(ConsultantBot));

        _logger.LogInformation("Sending event {Type} to workflow {Id}", evtType, wfId);
        await EventHub.SendEvent(wfId, wfType, evtType, data);
        _logger.LogInformation("Event sent");
    }
}
```

***Detailed Explanation of Key Steps:***

- **Payload Preparation**  
    The `Run` method constructs an `AppointmentData` object containing all the necessary details about the appointment, such as the `AppointmentId`, `PatientName`, `DoctorName`, `Prescription`, and `DoctorNote`. This payload is used to encapsulate the event data.

- **Event Type Determination**  
    The event type is set to `"AppointmentCompleted"`. This type acts as a filter, ensuring that only relevant events are processed by the `ConsultantBot` workflow.

- **Workflow Identification**  
    The `AgentContext.GetSingletonWorkflowIdFor` method retrieves the unique workflow ID of the `ConsultantBot`. Similarly, `AgentContext.GetWorkflowTypeFor` fetches the workflow type. These identifiers ensure that the event is sent to the correct workflow instance.

- **Event Dispatching**  
    The `EventHub.SendEvent` method is used to send the event to the `ConsultantBot` workflow. If no instance of the `ConsultantBot` is currently running, the Temporal system automatically creates one to handle the event.

By following these steps, the `EventTriggerWorkflow` ensures that the `ConsultantBot` is notified of new appointment events and can proactively message users with the relevant details.

---

## 5. Wire Everything Up in `Program.cs`

Run both your trigger and your bot workflows together:

```csharp
using XiansAi.Flow;
using DotNetEnv;
using XiansAi.Workflows;

public class Program
{
    public static async Task Main(string[] args)
    {
        Env.Load();

        var agentInfo = new AgentInfo {
            Name        = "Consultation Agent - External Trigger",
            Description = "Starts conversation when an external appointment event occurs.",
        };

        var triggerFlow    = new FlowInfo<EventTriggerWorkflow>(agentInfo);
        var consultantFlow = new FlowInfo<ConsultantBot>(agentInfo);

        try
        {
            await Task.WhenAll(
                new FlowRunnerService().RunFlowAsync(triggerFlow),
                new FlowRunnerService().RunFlowAsync(consultantFlow)
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

## 6. Testing the Proactive Bot

Run your app:

```bash
dotnet run
```

In Xian AI UI:

1. Go to **Agent Definitions**, create an instance of `Consultation Agent - External Trigger`.
2. The `EventTriggerWorkflow` will automatically send an `AppointmentCompleted` event to the `ConsultantBot`.
3. The `ConsultantBot` workflow will listen for the event, process it, and send a proactive message to the relevant user.

To check the user message:

1. Navigate to the **Messaging** tab in the Xian AI UI.
2. Select the agent associated with the `ConsultantBot`.
3. You will find a new message thread for the user, containing the proactive message sent by the agent.

For example, the message might look like this:

```
“Hey Alan Brown, your appointment with Dr. Smith is confirmed. Prescription: Cetirizine… Doctor’s Note: Follow up in 2 weeks.”
```

***Follow-up Q&A:***

The user can reply with “What’s the dosage again?”  
`ConsultantBot` uses `GetPrescriptionInformation` to answer.

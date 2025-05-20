# Simple Conversation Bot

Xians AI provides a way to build intelligent conversational agents using workflows and capabilities. This guide walks you through creating a simple conversation bot that can interact with users, retrieve information, and respond intelligently. Whether you're building a chatbot for customer support or a specialized assistant, this guide will help you get started.

---

## 1. Define the Workflow Class

Create a new C# file (e.g. `ConversationBot.cs`) under `XiansAi.Workflows`. This class inherits from `FlowBase` and kicks off the conversation.

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;
using Temporalio.Exceptions;
using ConversiveAgent;

namespace XiansAi.Workflows;

[Workflow("Conversation Bot")]
public class ConversationBot : FlowBase
{
    public ConversationBot()
    {
        // ⚙️ Register your capability classes here
        Capabilities.Add(typeof(MedicalCenterCapabilities));
    }

    [WorkflowRun]
    public async Task Run()
    {
        // 1️⃣ Get your system prompt (“bot behavior knowledge”) from Xian AI
        var systemPrompt = await ObtainBotBehaviourKnowledge();

        // 2️⃣ Initialize the user conversation (non-blocking)
        _ = await InitUserConversation(systemPrompt);
    }

    private async Task<string> ObtainBotBehaviourKnowledge()
    {
        var systemPromptKnowledge = await _knowledgeHub.GetKnowledgeAsync("Consultant Bot Behaviour");
        if (systemPromptKnowledge == null)
            throw new ApplicationFailureException("Failed to get agent config");

        return systemPromptKnowledge.Content;
    }
}
```

***Step-by-Step Explanation***

1. **Namespace and Imports**:
    - The `using` statements import necessary libraries for Temporal workflows, Xian AI flow management, and exception handling.
    - The `ConversiveAgent` namespace is included to access agent capabilities.

2. **Workflow Attribute**:
    - `[Workflow("Conversation Bot")]` assigns a unique name to the workflow, making it identifiable in the Xian AI platform.

3. **Class Definition**:
    - The `ConversationBot` class inherits from `FlowBase`, which provides foundational functionality for workflows in Xian AI.

4. **Register Capabilities**:
    - The constructor registers the `MedicalCenterCapabilities` class, which defines the agent's skills.

5. **WorkflowRun Method**:
    - This is the entry point for the workflow. It:
        - Retrieves the system prompt (bot behavior knowledge) from Xian AI's Knowledge Hub.
        - Initializes the user conversation using the retrieved system prompt.

6. **ObtainBotBehaviourKnowledge Method**:
    - Fetches the system prompt from the Knowledge Hub using the key `"Consultant Bot Behaviour"`.
    - Throws an exception if the knowledge is not found.

---

## 2. Define Agent’s Capabilities

Capabilities are C# methods annotated so the agent can “plug” into your code. Create, for example, `MedicalCenterCapabilities.cs`:

```csharp
using XiansAi.Router.Plugins;

namespace ConversiveAgent;
public static class MedicalCenterCapabilities 
{
    [Capability("Retrieve prescription information for a patient.")]
    [Parameter("patientNumber", "Unique identifier for the patient")]
    [Returns("Prescription details including medication names, dosages, and instructions")]
    public static Task<string[]> GetPrescriptionInformation(string patientNumber)
    {
        // 🔧 Example/mock data
        var prescriptions = new[]
        {
            "Medication: Amoxicillin, Dosage: 500mg, Instructions: Take 1 tablet every 8 hours for 7 days",
            "Medication: Ibuprofen, Dosage: 200mg, Instructions: Take 1 tablet every 6 hours as needed for pain",
            "Medication: Metformin, Dosage: 1000mg, Instructions: Take 1 tablet twice daily with meals"
        };
        return Task.FromResult(prescriptions);
    }

    [Capability("Retrieve doctor information for a patient.")]
    [Parameter("patientNumber", "Unique identifier for the patient")]
    [Returns("Doctor details including name, specialization, and contact information")]
    public static Task<string> GetDoctorInformation(string patientNumber)
    {
        var doctorInfo = "Doctor Name: Dr. John Smith, Specialization: General Practitioner, Contact: +1-555-123-4567, Email: dr.john.smith@hospital.com";
        return Task.FromResult(doctorInfo);
    }
}
```

***Step-by-Step Explanation***

1. **Namespace and Imports**:
    - The `using` statement imports the `XiansAi.Router.Plugins` namespace, which provides the `[Capability]` attribute and related functionality.

2. **Static Class Definition**:
    - The `MedicalCenterCapabilities` class is defined as `static` because it contains only static methods.

3. **Capability Annotations**:
    - `[Capability(...)]`: Describes the purpose of the method in plain English.
    - `[Parameter(...)]`: Documents the input parameter, including its name and description.
    - `[Returns(...)]`: Documents the return value, including its type and description.

4. **GetPrescriptionInformation Method**:
    - Accepts a `patientNumber` as input.
    - Returns a mock list of prescription details for demonstration purposes.

5. **GetDoctorInformation Method**:
    - Accepts a `patientNumber` as input.
    - Returns a mock string containing doctor details for demonstration purposes.

By defining these capabilities, the agent can perform specific tasks during conversations, such as retrieving prescription or doctor information.

---

## 3. Wiring the Agent.

In your console app’s `Main`, load environment variables, define your agent, and start the Flow Runner.

```csharp
using XiansAi.Flow;
using DotNetEnv;
using XiansAi.Workflows;

public class Program
{
    public static async Task Main(string[] args)
    {
        // Load .env (e.g. Temporal endpoint, Xian API key)
        Env.Load();

        // Define your agent’s metadata
        AgentInfo agentInfo = new AgentInfo {
            Name = "Simple Conversation Agent",
            Description = "A simple conversation agent that can converse with users.",
        };

        // Bind agentInfo to your Workflow class
        var consultationFlowInfo = new FlowInfo<ConversationBot>(agentInfo);

        try
        {
            // Start polling for workflow tasks
            await new FlowRunnerService().RunFlowAsync(consultationFlowInfo);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Shutdown requested. Exiting gracefully...");
        }
    }
}
```

---

## 4. Create the “Knowledge”

Your agent uses a “system prompt” stored in Xian AI’s Knowledge Hub.

1. Log in to the Xian AI platform.
2. Go to the Knowledge tab.
3. Click **Create Knowledge** and give it the exact title you fetch in code (`Consultant Bot Behaviour`).
4. Paste a prompt like this:

```markdown
# Medical Center Agent

You are a chatbot in a medical center. Your job is to help users by providing them information.

## Your Capabilities
- Get Prescription information
- Get Doctor information

## Conversation Style
Use a warm and friendly tone.

# Guardrails
If the user asks something outside your capabilities, respond with:
> “I’m sorry, but that’s outside my scope. Please ask me about prescriptions or doctor info.”
```

And then click on Create.

---

## 5. Register the Agent

In your project folder, run:

```bash
dotnet run
```

This will upload the workflow definition and also will set up a worker as well.

---

## 6. Instantiate the Agent

1. In the Xian AI UI, navigate to **Agent Definitions**.
2. Select your **Simple Conversation Agent**.
3. Run it to create a running instance.

---

## 7. Start a Conversation

1. Go to the **Messaging** tab in Xian AI.
2. Select your **Simple Conversation Agent**.
3. Click **Create Conversation**.
4. Choose **Workflow Type**: “Conversation Bot.”
5. Select the running instance (if multiple).
6. Send your first message, e.g.:

   ```
   Hi, I need my prescription details for patient 12345.
   ```

Watch as the agent routes your request to `GetPrescriptionInformation("12345")` and replies!

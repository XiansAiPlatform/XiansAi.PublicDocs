# Configuring Multiple Chatbots & Automatic Handover

In some scenarios, you’ll want more than one specialized chatbot under a single agent. For example:

- **Pre-Assessment Bot** gathers basic patient info and triages questions.
- **Post-Assessment Bot** handles detailed medical inquiries (drug info, side effects, prescriptions).

If the Pre-Assessment Bot encounters a question outside its scope, it seamlessly hands off the conversation to the Post-Assessment Bot—without the user ever leaving the chat.

## Why Multiple Chatbots?

**Separation of Concerns:**
Each bot focuses on a narrow domain, making prompts simpler and behavior more predictable.

**Clearer Guardrails:**
If a question is out-of-scope, the current bot can defer rather than fumble.

**Scalability:**
You can add new bots for new responsibilities (e.g., billing, scheduling) and they can hand off in either direction.

---

## 1. Define Each Workflow Class

***Pre-Assessment Bot***

This code defines the workflow for the Pre-Assessment Bot. It initializes the bot's capabilities and handles the conversation flow for pre-assessment tasks, such as gathering basic patient information.

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
        Capabilities.Add(typeof(PreAssessmentCapabilities));
    }

    [WorkflowRun]
    public async Task Run()
    {
        var systemPrompt = await ObtainBotBehaviourKnowledge();
        await InitUserConversation(systemPrompt);
    }

    private async Task<string> ObtainBotBehaviourKnowledge()
    {
        var k = await _knowledgeHub.GetKnowledgeAsync("Pre Consultation Agent's System Behaviour");
        if (k == null) throw new ApplicationFailureException("Failed to get agent config");
        return k.Content;
    }
}
```

***Post-Assessment Bot***

This code defines the workflow for the Post-Assessment Bot. It initializes the bot's capabilities and handles the conversation flow for post-assessment tasks, such as answering detailed medical inquiries.

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

[Workflow("Post Assessment Bot")]
public class PostAssessmentBot : FlowBase
{
    private readonly ILogger _logger;
    public PostAssessmentBot()
    {
        _logger = Workflow.Logger;
        Capabilities.Add(typeof(PostAssessmentCapabilities));
    }

    [WorkflowRun]
    public async Task Run()
    {
        var systemPrompt = await ObtainBotBehaviourKnowledge();
        await InitUserConversation(systemPrompt);
    }

    private async Task<string> ObtainBotBehaviourKnowledge()
    {
        var k = await _knowledgeHub.GetKnowledgeAsync("Post Consultation Agent's System Behaviour");
        if (k == null) throw new ApplicationFailureException("Failed to get agent config");
        return k.Content;
    }
}
```

---

## 2. Define Capabilities & Handover Logic

Each capability class defines the specific actions the bot can perform. The handover logic ensures seamless transitions between chatbots when a query is out of scope.

***Structure of Handover Functions***

Handover functions are critical for enabling seamless transitions between chatbots. These functions must adhere to the following structure:

1. **Message Thread Attribute**: Each capability class must have a `MessageThread` attribute to manage the conversation context.
2. **Constructor**: The constructor initializes the `MessageThread` attribute, ensuring the capability class has access to the current conversation thread.
3. **Non-Static Methods**: Capability functions, including handover functions, should be instance methods to operate on the current state of the conversation.

***Defining Handover Capabilities***

The handover capability must be explicitly defined using the `Capability` decorator. This decorator should include a clear description of the handover behavior, input parameters, and return values.

***Handover Logic***

The handover function must:

1. **Select the Target Workflow Type**: Use `AgentContext.GetWorkflowTypeFor` to determine the workflow type of the target chatbot.
2. **Get the Singleton Instance ID**: Use `AgentContext.GetSingletonWorkflowIdFor` to retrieve the singleton instance ID of the target chatbot.
3. **Perform the Handover**: Call the `HandoverTo` method on the `MessageThread` object, passing the user message, target workflow type, and singleton instance ID.
4. **Handle Singleton Creation**: If the target chatbot does not have a singleton instance running, the system will automatically create one during the handover process.

Below is an example of a handover function:

```csharp
[Capability("When out of scope, hand over to Post-Assessment Bot.")]
[Parameter("originalUserMessage", "Unmodified original user message.")]
[Returns("Workflow type name of the bot to handover to.")]
public string HandoverToPostAssessmentBot(string originalUserMessage)
{
    // Determine the target chatbot's workflow type
    var targetType = AgentContext.GetWorkflowTypeFor(typeof(PostAssessmentBot));
    
    // Retrieve the singleton instance ID for the target chatbot
    var targetId = AgentContext.GetSingletonWorkflowIdFor(typeof(PostAssessmentBot));
    
    // Perform the handover, passing the user message and target details
    _thread.HandoverTo(originalUserMessage, targetType, targetId);
    
    // Return the workflow type of the target chatbot
    return targetType;
}
```

This approach ensures that the conversation thread remains intact, and the user experiences a seamless transition between chatbots, even if a singleton instance of the target chatbot needs to be created dynamically.

***PreAssessmentCapabilities***

The following code defines the capabilities for the Pre-Assessment Bot, including the logic to hand over the conversation back to the Post-Assessment Bot when necessary.

```csharp
using XiansAi.Router.Plugins;
using XiansAi.Messaging;
using XiansAi.Workflows;

namespace XiansAi.Capabilities;
public class PreAssessmentCapabilities
{
    private readonly MessageThread _thread;
    public PreAssessmentCapabilities(MessageThread messageThread)
        => _thread = messageThread;

    [Capability("Save Patient Info")]
    public Task<string> SavePatientInfo(/* … */)
    {
        // Save logic…
        return Task.FromResult("Patient info saved successfully.");
    }

    [Capability(
      "When out of scope, hand over to Post-Assessment Bot.")]
    [Parameter("originalUserMessage", "Unmodified original user message.")]
    [Returns("Workflow type name of the bot to handover to.")]
    public string HandoverToPostAssessmentBot(string originalUserMessage)
    {
        var targetType = AgentContext.GetWorkflowTypeFor(typeof(PostAssessmentBot));
        var targetId   = AgentContext.GetSingletonWorkflowIdFor(typeof(PostAssessmentBot));

        _thread.HandoverTo(originalUserMessage, targetType, targetId);
        return targetType;
    }
}
```

***PostAssessmentCapabilities***

The following code defines the capabilities for the Post-Assessment Bot, including the logic to hand over the conversation back to the Pre-Assessment Bot when necessary.

```csharp
using XiansAi.Router.Plugins;
using XiansAi.Messaging;
using XiansAi.Workflows;

namespace XiansAi.Capabilities;
public class PostAssessmentCapabilities
{
    private readonly MessageThread _thread;
    public PostAssessmentCapabilities(MessageThread messageThread)
        => _thread = messageThread;

    [Capability("Get Drug Information")]
    public Task<string> GetDrugInformation(string drugName) { /* … */ }

    [Capability("Get Drug Side Effects")]
    public Task<string> GetDrugSideEffects(string drugName) { /* … */ }

    [Capability("When out of scope, hand over to Pre-Assessment Bot.")]
    [Parameter("originalUserMessage", "Unmodified original user message.")]
    [Returns("Workflow type name of the bot to handover to.")]
    public string HandoverToPreAssessmentBot(string originalUserMessage)
    {
        var targetType = AgentContext.GetWorkflowTypeFor(typeof(PreAssessmentBot));
        var targetId   = AgentContext.GetSingletonWorkflowIdFor(typeof(PreAssessmentBot));
        _thread.HandoverTo(originalUserMessage, targetType, targetId);
        return targetType;
    }
}
```

---

## 3. Wire Up Both Bots in Program.cs

This code demonstrates how to wire up both bots in the `Program.cs` file. It initializes the workflows for the Pre-Assessment and Post-Assessment Bots and runs them concurrently.

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
            Name        = "Medical Center Agents – Handover Demo",
            Description = "Pre- and Post-Assessment bots that hand off seamlessly.",
        };

        var preFlow  = new FlowInfo<PreAssessmentBot>(agentInfo);
        var postFlow = new FlowInfo<PostAssessmentBot>(agentInfo);

        try
        {
            await Task.WhenAll(
                new FlowRunnerService().RunFlowAsync(preFlow),
                new FlowRunnerService().RunFlowAsync(postFlow)
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

## 4. Testing the Handover

***Start your application***

```bash
dotnet run
```

***In Xian AI UI***

1. Go to **Agent Definitions** → Create an instance of **Medical Center Agents – Handover Demo**.
2. In **Messaging**, select that agent and **Create Conversation** (choose the Pre Assessment Bot workflow instance).

***Simulate a chat***

- **User**: “Hi, I’d like to schedule an appointment.”
  - Pre-Assessment Bot answers or captures patient info.

- **User**: “What’s the dosage for Aspirin?”
  - Pre-Assessment Bot sees it’s out of scope and calls `HandoverToPostAssessmentBot(...)`.
  - Post-Assessment Bot picks up and replies: “Aspirin is used to reduce fever, pain, and inflammation.”

Throughout, the conversation thread remains intact; the switch is completely transparent to the user.

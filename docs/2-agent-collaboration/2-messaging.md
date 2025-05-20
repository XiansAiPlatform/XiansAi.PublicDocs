# Semantic Conversations

???+ warning

    This page content is outdated. We are working on updating it. Will be updated by 25th May 2025.

Xians AI provides a way to have a powerful semantic conversation with an agent. This is useful for when you want to have a natural conversation with an agent and execute actions based on the conversation.

## Handling Semantic Conversations

Let's improve the previous example by using semantic router available in the `FlowBase` class.

```csharp
    using Temporalio.Workflows;
    using XiansAi.Flow;
    using ConversiveAgent;
    using XiansAi.Messaging;


    [Workflow("Semantic Agent Flow")]
    public class SemanticAgentFlow: FlowBase
    {
        private readonly Queue<MessageThread> _messageQueue = new Queue<MessageThread>();
        private static readonly string SYSTEM_PROMPT_KNOWLEDGE_KEY = "Support Center Overall Behaviour";

        private readonly string[] _capabilityPlugins = [
            typeof(Capabilities).FullName!
        ];

        public SemanticAgentFlow(): base()
        {
            // Register the message handler
            Messenger.RegisterHandler(_messageQueue.Enqueue);
        }

        [WorkflowRun]
        public async Task<string> Run()
        {
            Console.WriteLine("Semantic Agent Flow started");

            while (true)
            {
                // Wait for a message to be added to the queue
                await Workflow.WaitConditionAsync(() => _messageQueue.Count > 0);

                // Get the message from the queue
                var thread = _messageQueue.Dequeue();

                // Asynchronously process the message
                _ = ProcessMessage(thread);

            }
        }

        private async Task ProcessMessage(MessageThread messageThread)
        {

            // Get the system prompt from the knowledge base
            var systemPrompt = await KnowledgeManager.GetKnowledgeAsync(SYSTEM_PROMPT_KNOWLEDGE_KEY);

            // Route the message to the appropriate flow
            var response = await Router.RouteAsync(messageThread, systemPrompt.Content, _capabilityPlugins);

            // Respond to the user
            await messageThread.Respond(response);
        }
    }

```

There are few changes to the previous example:

1. We use the `Router.RouteAsync` method from `FlowBase` to semantically route messages to appropriate capabilities based on content.
2. We define capability plugins in `_capabilityPlugins` array to extend agent functionality.
3. System prompts are retrieved from a knowledge base using `KnowledgeManager.GetKnowledgeAsync`.

## System Prompt

The system prompt is a prompt that is used to guide the agent's behavior. It is defined in the Portal's knowledge base. Create a new knowledge named `Support Center Overall Behaviour` with content similar to the following:

```markdown
# Support Center Agent
You are a helpful assistant that can answer questions and help with tasks. You are developed by engineers at 99x. 

## Confirmations
Before calling functions in WriteFunctions plugin, always ask the user if they would like to proceed by showing the gathers parameters (if any). If the user would like to proceed, call the tool or function. If the user would not like to proceed, respond that you will not proceed. 

## Guardrails
If the user asks you to do anything where you do not have a associated function to call, respond that you do not have the ability to do that and ask user to contact the support center. Support center contact number is 1234567890 and the email is support@conversive.com

```

## Defining Capabilities

Capabilities are defined as a static classes with all methods are described with `Capability`, `Parameter` and `Returns` attributes.

```csharp
using XiansAi.Router.Plugins;

namespace ConversiveAgent;
public static class Capabilities 
{
    [Capability("Create a new broadband connection for a customer with full service setup.")]
    [Parameter("customerName", "Customer's full name as it will appear on the account")]
    [Parameter("customerEmail", "Valid email address for account communications and updates")]
    [Parameter("address", "Complete installation address including street, city, and postal code")]
    [Parameter("planType", "Preferred broadband plan type (Basic, Standard, Premium, etc.)")]
    [Parameter("contactNumber", "Contact number with country code for installation coordination")]
    [Parameter("preferredDate", "Preferred installation date and time window")]
    [Returns("Confirmation message with order number, estimated installation timeline, and next steps")]
    public static async Task<string> StartNewBroadbandConnectionWorkflow(string customerName, string customerEmail, string address, string planType, string contactNumber, DateTime preferredDate)
    {
        // Process the request
    }

    [Capability("Initialize a billing issue resolution workflow for account discrepancies or disputes.")]
    [Parameter("customerEmail", "Customer's email address for account identification")]
    [Parameter("billMonth", "Month and year of the disputed bill (e.g., 'January 2023')")]
    [Parameter("issueType", "Specific billing issue category (overcharge, missing discount, wrong plan, etc.)")]
    [Parameter("notes", "Detailed description of the billing problem including relevant amounts")]
    [Returns("Confirmation with ticket number, estimated resolution timeframe, and follow-up process")]
    public static async Task<string> StartBillingIssueWorkflow(string customerEmail, string billMonth, string issueType, string notes)
    {
        // Process the request
    }

    [Capability("Initiate technical support troubleshooting workflow for connectivity or device issues.")]
    [Parameter("customerEmail", "Customer's email for account identification and case tracking")]
    [Parameter("deviceType", "Specific device type experiencing issues (Modem, Router, Sim, etc.)")]
    [Parameter("symptoms", "Detailed description of the technical issues including error messages and behavior")]
    [Returns("Initial troubleshooting steps, support case number, and escalation path if needed")]
    public static async Task<string> StartTechnicalSupportWorkflow(string customerEmail, string deviceType, string symptoms)
    {
        // Process the request
    }

    [Capability("Retrieve current available broadband plans with pricing and speed details.")]
    [Parameter("planType", "Optional plan category filter (Residential, Business, Rural, etc.)")]
    [Returns("List of available plans with speed specifications, monthly cost, and included features")]
    public static Task<string[]> GetAvailableBroadbandPlans(string planType)
    {
        // Mock data for broadband plans
        var plans = new string[]
        {
            "Basic Plan: 50 Mbps, $30/month",
            "Standard Plan: 100 Mbps, $50/month",
            "Premium Plan: 200 Mbps, $70/month",
            "Ultimate Plan: 500 Mbps, $100/month"
        };

        return Task.FromResult(plans);
    }
}
```

## Testing Semantic Conversations

Testing semantic conversations follows the same approach as regular agent conversations. Use the `Messaging` section in the Xians AI portal, selecting the appropriate agent, workflow, and running instance.

The primary difference is that semantic routing will automatically direct user messages to the appropriate capability based on the message content, providing more intelligent and context-aware responses.

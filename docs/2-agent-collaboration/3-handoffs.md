# Handing Over Conversations

???+ warning

    This page content is outdated. We are working on updating it. Will be updated by 25th May 2025.
    
This section explains how to transfer a user conversation from one agent flow to another agent flow, allowing for specialized handling of different user requests.

## Overview

Conversation handover enables:

- Routing conversations to specialized agents based on request type
- Maintaining conversation context during transitions
- Creating hierarchical workflows for complex user interactions

## Using Capabilities for Handover

Unlike static capabilities in the previous example, we use an instance of a capability class to handle conversation transfers. This allows access to the current message thread.

```csharp
using Microsoft.Extensions.Logging;
using XiansAi.Messaging;
using XiansAi.Router.Plugins;

namespace ConversiveAgent;
public class Capabilities
{
    private MessageThread _messageThread;

    public Capabilities(MessageThread messageThread)
    {
        _messageThread = messageThread;
    }

    [Capability("Create a new broadband connection for a customer by initiating the installation process.")]
    [Parameter("customerName", "Customer's full name (first and last name)")]
    [Parameter("customerEmail", "Customer's email address in valid format (e.g., name@domain.com)")]
    [Parameter("planType", "Preferred broadband plan type (Basic, Standard, Premium, or Ultimate)")]
    [Parameter("contactNumber", "Customer's contact phone number with country code if applicable")]
    [Returns("Confirmation message indicating that the broadband connection request has been initiated")]
    public async Task<string> OrderNewBroadbandConnection(string customerName, string customerEmail, string planType, string contactNumber)
    {
        // Implementation will use handover methods (see examples below)
    }


    [Capability("Initiate technical support ticket to resolve connectivity or device issues.")]
    [Parameter("customerEmail", "Customer's registered email address for account identification")]
    [Parameter("deviceType", "Type of device experiencing issues: Phone, Internet, or TV")]
    [Parameter("issues", "Summary of the technical issues being experienced")]
    [Returns("Confirmation message indicating that a technical support ticket creation has been initiated")]
    public async Task<string> RaiseTechnicalSupportTicket(string customerEmail, string deviceType, string issues)
    {
        // Implementation will use handover methods (see examples below)
    }

    [Capability("Retrieve detailed information about available broadband plans based on specified type.")]
    [Parameter("planType", "The specific broadband plan category to query (Basic, Standard, Premium, or Ultimate)")]
    [Returns("Array of plan details including bandwidth and pricing information")]
    public Task<string[]> GetAvailablePlans(string planType)
    {
        // Implementation for retrieving plans (not using handover)
    }
}
```

Note that the `MessageThread` instance is passed to the capability class as a constructor parameter. This provides access to the current conversation context and enables handover functionality.

## Handover Methods

There are two ways to handover a conversation to another agent flow:

1. **Handover to an already running flow**: Transfer control to an already running workflow instance. Requires the flow ID of the target workflow.
2. **Start and handover**: Create a new workflow instance and transfer control to it. Requires the workflow type name.

### Method 1: Handing Over to Already Running Flow

To handover to an already running flow, you need the flow ID of the target workflow. The flow ID uniquely identifies an existing workflow instance.

Use `MessageThread.Handover` to handover to an already running flow.

Let's implement the `OrderNewBroadbandConnection` capability from the previous example:

```csharp
public async Task<string> OrderNewBroadbandConnection(string customerName, string customerEmail, string planType, string contactNumber)
{
    // Specify the ID of the existing workflow to handle this request
    var workflowId = "99xio:CustomerSupportAgent:NewConnectionFlow";
    try
    {
        Console.WriteLine("Handling over to New Connection Workflow...");
        
        // Prepare data to send to the target workflow
        var newConnectionRequest = new
        {
            CustomerName = customerName,
            CustomerEmail = customerEmail,
            PlanType = planType,
            ContactNumber = contactNumber,
            MessageContent = _messageThread.IncomingMessage.Content
        };

        // Perform the handover operation
        await _messageThread.Handover(
            workflowId,                     // Target workflow ID
            "Initiate New Connection",      // Action description
            _messageThread.ParticipantId,   // Current participant ID
            newConnectionRequest);          // Data payload
            
        return "New broadband connection request has been initiated. Our team will process your request.";
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in OrderNewBroadbandConnection");
        throw;
    }
}
```

### Method 2: Starting a New Flow and Handing Over

To create a new workflow instance and immediately handover to it, you need the workflow type name.

Use `MessageThread.StartAndHandover` to create a new workflow instance and handover to it.

Let's implement the `RaiseTechnicalSupportTicket` capability from the previous example:

```csharp
public async Task<string> RaiseTechnicalSupportTicket(string customerEmail, string deviceType, string issues)
{
    try
    {
        // Specify the type of workflow to create
        var workflowType = "Support Ticket Flow";
        
        // Prepare data to send to the new workflow
        var ticketRequest = new
        {
            CustomerEmail = customerEmail,
            DeviceType = deviceType,
            Issues = issues,
            MessageContent = _messageThread.IncomingMessage.Content
        };

        // Create a unique ticket ID
        var ticketId = Guid.NewGuid().ToString();

        // Create a new workflow and handover in one operation
        await _messageThread.StartAndHandover(
            workflowType,                   // Workflow type to create
            "Initiate Support Ticket",      // Action description
            _messageThread.ParticipantId,   // Current participant ID
            ticketRequest);                 // Data payload
            
        return "Technical support ticket creation process has been initiated.";
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in RaiseTechnicalSupportTicket");
        throw;
    }
}
```

## Implementing Receiving Flows

When a flow is handed over to another flow, the receiving (child) flow takes over the conversation from the initiating (parent) flow. The child flow continues the conversation based on its own logic.

### Example 1: Dynamic Support Ticket Flow

This flow is created dynamically when needed and terminates once the process is complete:

```csharp
[Workflow("Support Ticket Flow")]
public class SupportTicketFlow: FlowBase
{
    private MessageThread? _messageThread;

    public SupportTicketFlow(): base()
    {
        // Register the message handler to receive the handover
        Messenger.RegisterHandler((MessageThread thread) => {
            _messageThread = thread;
        });
    }

    [WorkflowRun]
    public async Task Run()
    {
        // Wait for a message to be added to the queue
        await Workflow.WaitConditionAsync(() => _messageThread != null);

        // Get the message from the queue
        var metadata = _messageThread!.IncomingMessage.Metadata;
        var message = _messageThread!.IncomingMessage.Content;
        Console.WriteLine($"Support Ticket Flow with message and metadata: {message} {metadata}");

        // Process the message and respond to the user with a staged conversation
        await _messageThread!.Respond($"Support Ticket Created. Your ticket ID is: `{Guid.NewGuid()}`");
        
        // Wait 5 seconds before sending the next message
        await Workflow.DelayAsync(5000);
        
        await _messageThread!.Respond($"Technician allocated to your ticket. You will be contacted shortly.");
        
        // Wait 5 seconds before sending the next message
        await Workflow.DelayAsync(5000);
        
        await _messageThread!.Respond($"Support Ticket Resolved. Thank you for your patience.");
        
        // Wait 5 seconds before sending the next message
        await Workflow.DelayAsync(5000);
        
        await _messageThread!.Respond($"On a scale of 1 to 5, how would you rate your support experience?");
    }
}
```

### Example 2: Persistent New Connection Flow

This flow runs continuously, handling multiple conversation handovers over time:

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Messaging;

[Workflow("New Connection Flow")]
public class NewConnectionFlow: FlowBase
{
    private readonly Queue<MessageThread> _messageQueue = new Queue<MessageThread>();

    public NewConnectionFlow(): base()
    {
        // Register the message handler to queue incoming handovers
        Messenger.RegisterHandler((MessageThread thread) => {
            _messageQueue.Enqueue(thread);
        });
    }

    [WorkflowRun]
    public async Task<string> Run()
    {
        while (true)
        {
            // Wait for a message to be added to the queue
            await Workflow.WaitConditionAsync(() => _messageQueue.Count > 0);

            // Pause for 5 seconds before processing
            await Workflow.DelayAsync(5000);

            // Get the message from the queue
            var thread = _messageQueue.Dequeue();
            var metadata = thread.IncomingMessage.Metadata;
            var message = thread.IncomingMessage.Content;
            Console.WriteLine($"New Connection Flow with message and metadata: {message} {metadata}");

            // Process the request and respond to the user
            await thread.Respond($"New Broadband Connection Created: `{metadata}`");
        }
    }
}
```

## Best Practices

When implementing conversation handovers:

1. Include all necessary context in the handover `Content` and `Metadata`
2. Handle potential exceptions during handover
3. Consider flow lifecycle (persistent vs. temporary) based on use case

using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Messaging;

[Workflow("Support Ticket Flow")]
public class SupportTicketFlow: FlowBase
{
    private MessageThread? _messageThread;

    public SupportTicketFlow(): base()
    {
        // Register the message handler
        Messenger.RegisterHandler((MessageThread thread) => {
            _messageThread = thread;
        });
    }

    [WorkflowRun]
    public async Task Run()
    {
        Console.WriteLine("Support Ticket Flow started with id: " + Workflow.Info.WorkflowId);

        // Wait for a message to be added to the queue
        await Workflow.WaitConditionAsync(() => _messageThread != null);

        Console.WriteLine("Support Ticket Flow waiting for a message to be added to the queue");
        await Workflow.DelayAsync(5000);

        // Get the message from the queue
        var metadata = _messageThread!.IncomingMessage.Metadata;
        var message = _messageThread!.IncomingMessage.Content;
        Console.WriteLine($"Support Ticket Flow with message and metadata: {message} {metadata}");

        // Asynchronously process the message
        await _messageThread!.Respond($"Support Ticket Created. Your ticket ID is: `{Guid.NewGuid()}`");
        await Workflow.DelayAsync(5000);
        await _messageThread!.Respond($"Technician allocated to your ticket. You will be contacted shortly.");
        await Workflow.DelayAsync(5000);
        await _messageThread!.Respond($"Support Ticket Resolved. Thank you for your patience.");
        await Workflow.DelayAsync(5000);
        await _messageThread!.Respond($"On a scale of 1 to 5, how would you rate your support experience?");

    }
}


using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Messaging;

[Workflow("New Connection Flow")]
public class NewConnectionFlow: FlowBase
{
    private readonly Queue<MessageThread> _messageQueue = new Queue<MessageThread>();

    public NewConnectionFlow(): base()
    {
        // Register the message handler
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

            Console.WriteLine("New Connection Flow waiting for a message to be added to the queue");
            await Workflow.DelayAsync(5000);

            // Get the message from the queue
            var thread = _messageQueue.Dequeue();
            var metadata = thread.IncomingMessage.Metadata;
            var message = thread.IncomingMessage.Content;
            Console.WriteLine($"New Connection Flow with message and metadata: {message} {metadata}");

            // Asynchronously process the message
            await thread.Respond($"New Broadband Connection Created: `{metadata}`");
        }
    }

}


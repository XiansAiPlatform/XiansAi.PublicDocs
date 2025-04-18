using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Messaging;

[Workflow("Conversive Flow")]
public class ConversiveAgentFlow: FlowBase
{
    private readonly Queue<MessageThread> _messageQueue = new Queue<MessageThread>();

    public ConversiveAgentFlow(): base()
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

            // Get the message from the queue
            var thread = _messageQueue.Dequeue();
            var message = thread.IncomingMessage.Content;

            // Asynchronously process the message
            await thread.Respond($"Message received: `{message}`");

        }
    }

}


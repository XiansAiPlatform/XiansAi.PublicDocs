using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Conversive Flow")]
public class ConversiveAgentFlow: FlowBase
{
    private readonly Queue<MessageThread> _messageQueue = new Queue<MessageThread>();

    public ConversiveAgentFlow(): base()
    {
        GetMessenger().RegisterHandler(HandleMessage);
    }

    private Task HandleMessage(MessageThread messageThread)
    {
        _messageQueue.Enqueue(messageThread);
        return Task.CompletedTask;
    }   

    [WorkflowRun]
    public async Task<string> Run()
    {
        Console.WriteLine("Conversational Agent Flow started");
        while (true)
        {
            // Wait for a message to be added to the queue
            await Workflow.WaitConditionAsync(() => _messageQueue.Count > 0);
            // Get the message from the queue
            var thread = _messageQueue.Dequeue();
            // Process the message here
            Console.WriteLine($"Processing message: {thread.IncomingMessage.Content}");
            // respond
            await thread.Respond($"Hello, how can I help you today? Your message {thread.IncomingMessage.Content} has been received.");
        }
    }

}

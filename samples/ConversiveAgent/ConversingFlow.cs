    using Temporalio.Workflows;
    using XiansAi.Flow;
    using ConversiveAgent;
    using XiansAi.Messaging;

    [Workflow("Conversing Flow")]
    public class ConversingFlow: FlowBase
    {
        private readonly Queue<MessageThread> _messageQueue = new Queue<MessageThread>();
        private static readonly string SYSTEM_PROMPT_KNOWLEDGE_KEY = "Support Center Agent's System Behaviour";

        private readonly string[] _capabilityPlugins = [
            typeof(Capabilities).FullName!
        ];

        public ConversingFlow(): base()
        {
            // Register the message handler
            Messenger.RegisterHandler(_messageQueue.Enqueue);
        }

        [WorkflowRun]
        public async Task<string> Run()
        {
            Console.WriteLine("Conversing Flow started");

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


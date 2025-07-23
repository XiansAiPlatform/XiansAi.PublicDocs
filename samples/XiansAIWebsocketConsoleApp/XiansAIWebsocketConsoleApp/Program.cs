
using Microsoft.AspNetCore.SignalR.Client;

using Newtonsoft.Json;
using DotNetEnv;

public class AgentConfig
{
    public required string Id { get; set; }           // Unique identifier for the agent
    public required string Name { get; set; }         // Display name of the agent
    public required string Agent { get; set; }        // Agent identifier
    public required string WorkflowType { get; set; } // Type of workflow the agent handles
}



public class Message
{
    public string Id { get; set; } = null!;
    public required string ThreadId { get; set; }
    public required string TenantId { get; set; }
    public required DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public required string CreatedBy { get; set; }
    public required string Direction { get; set; } // Incoming or Outgoing
    public string? Text { get; set; }
    public string? Status { get; set; } // FailedToDeliverToWorkflow or DeliveredToWorkflow
    public object? Data { get; set; }
    public required string ParticipantId { get; set; }
    public required string WorkflowId { get; set; }
    public required string WorkflowType { get; set; }
    public string? MessageType { get; set; } //    Chat, Data, or Handoff
}

public class SendMessageRequest
{
    public required string ParticipantId { get; set; }
    public string? WorkflowId { get; set; }
    public required string WorkflowType { get; set; }
    public required string Agent { get; set; }
    public object? Data { get; set; }
    public string? Text { get; set; }
    public string? ThreadId { get; set; }
    public string? Authorization { get; set; }
}

class Program
{
    private static HubConnection _connection;
    private static List<AgentConfig> _agents;
    private static Dictionary<string, List<Message>> _chatHistories;
    private static string _currentThreadId;
    private static string _selectedAgentId;
    private static TaskCompletionSource<bool> _messageResponseReceived;

    // Global configuration variables
    private static string _webSocketUrl;
    private static string _apiKey;
    private static string _tenantId;
    private static string _participantId;

    static async Task Main(string[] args)
    {
        // Load environment variables
        Env.Load();

        //Initialize configuration
        _webSocketUrl = Environment.GetEnvironmentVariable("WEBSOCKET_URL")
            ?? throw new InvalidOperationException("WEBSOCKET_URL is not configured");
        _apiKey = Environment.GetEnvironmentVariable("API_KEY")
            ?? throw new InvalidOperationException("API_KEY is not configured");
        _tenantId = Environment.GetEnvironmentVariable("TENANT_ID")
            ?? throw new InvalidOperationException("TENANT_ID is not configured");
        _participantId = Environment.GetEnvironmentVariable("PARTICIPANT_ID")
            ?? throw new InvalidOperationException("PARTICIPANT_ID is not configured");

        _chatHistories = new Dictionary<string, List<Message>>();

        // Load agent configurations
        await LoadAgentConfigurations();

        // Setup SignalR connection
        await SetupSignalRConnection();

        // Subscribe to agents
        await SubscribeToAgents();

        // Load initial chat history
        await LoadInitialChatHistory();

        // Start message loop
        await StartMessageLoop();
    }

    private static async Task LoadAgentConfigurations()
    {
        try
        {
            string json = await File.ReadAllTextAsync("""<File Parth to agents.json>""");
            _agents = JsonConvert.DeserializeObject<List<AgentConfig>>(json);
            Console.WriteLine($"Loaded {_agents.Count} agents");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading agent configurations: {ex.Message}");
            throw;
        }
    }

    private static async Task SetupSignalRConnection()
    {
        _connection = new HubConnectionBuilder()
            .WithUrl($"{_webSocketUrl}?tenantId={_tenantId}", options =>
            {
                options.Headers.Add("Authorization", $"Bearer {_apiKey}");
            })
            .WithAutomaticReconnect()
            .Build();

        // Setup message handlers
        _connection.On<Message>("ReceiveMessage", HandleReceivedMessage);
        _connection.On<string>("InboundProcessed", HandleInboundProcessed);
        _connection.On<List<Message>>("ThreadHistory", HandleThreadHistory);

        try
        {
            await _connection.StartAsync();
            Console.WriteLine("Connected to SignalR hub");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error connecting to SignalR hub: {ex.Message}");
            throw;
        }
    }

    private static async Task SubscribeToAgents()
    {
        foreach (var agent in _agents)
        {
            try
            {
                await _connection.InvokeAsync("SubscribeToAgent",
                    agent.Id, //workflowID
                    _participantId,
                    _tenantId);
                Console.WriteLine($"Subscribed to agent: {agent.Name}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error subscribing to agent {agent.Name}: {ex.Message}");
            }
        }
    }

    private static async Task LoadInitialChatHistory()
    {
        foreach (var agent in _agents)
        {
            try
            {
                await _connection.InvokeAsync("GetThreadHistory",
                    agent.WorkflowType,
                    _participantId,
                    1,
                    20);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading history for agent {agent.Name}: {ex.Message}");
            }
        }
    }

    private static void HandleReceivedMessage(Message message)
    {
        Console.WriteLine($"Received message from {message.WorkflowId}: {message.Text}");

        if (!_chatHistories.ContainsKey(message.WorkflowId))
        {
            _chatHistories[message.WorkflowId] = new List<Message>();
        }

        _chatHistories[message.WorkflowId].Add(message);
        // Signal that we've received a response
        _messageResponseReceived?.TrySetResult(true);
    }

    private static void HandleInboundProcessed(string threadId)
    {
        _currentThreadId = threadId;
        Console.WriteLine($"Thread ID updated: {threadId}");
    }

    private static void HandleThreadHistory(List<Message> history)
    {
        if (history == null || !history.Any()) return;

        string agentId = history[0].WorkflowId;
        Console.WriteLine($"Received {history.Count} messages for agent {agentId}");

        if (!_chatHistories.ContainsKey(agentId))
        {
            _chatHistories[agentId] = new List<Message>();
        }

        _chatHistories[agentId].AddRange(history);
    }

    private static async Task StartMessageLoop()
    {
        while (true)
        {
            // Display available agents
            Console.WriteLine("\nAvailable Agents:");
            for (int i = 0; i < _agents.Count; i++)
            {
                Console.WriteLine($"{i + 1}. {_agents[i].Name}");
            }
            Console.WriteLine("0. Exit");

            // Get agent selection
            Console.Write("\nSelect an agent (number): ");
            string selection = Console.ReadLine();

            if (selection == "0")
                break;

            if (!int.TryParse(selection, out int agentIndex) ||
                agentIndex < 1 ||
                agentIndex > _agents.Count)
            {
                Console.WriteLine("Invalid selection. Please try again.");
                continue;
            }

            // Set selected agent
            _selectedAgentId = _agents[agentIndex - 1].Id;
            Console.WriteLine($"\nSelected agent: {_agents[agentIndex - 1].Name}");
            Console.WriteLine("Type 'back' to select another agent or 'exit' to quit");

            // Message input loop for selected agent
            while (true)
            {
                try
                {
                    Console.Write("\nEnter message: ");
                    string input = Console.ReadLine();

                    if (input?.ToLower() == "exit")
                        return;

                    if (input?.ToLower() == "back")
                        break;

                    if (string.IsNullOrEmpty(input))
                        continue;

                    var selectedAgent = _agents.FirstOrDefault(a => a.Id == _selectedAgentId);
                    if (selectedAgent == null)
                        continue;

                    var request = new SendMessageRequest
                    {
                        ThreadId = _currentThreadId,
                        Agent = selectedAgent.Agent,
                        WorkflowType = selectedAgent.WorkflowType,
                        WorkflowId = selectedAgent.Id,
                        ParticipantId = _participantId,
                        Text = input,
                        Data = null
                    };

                    // Create a new TaskCompletionSource for this message
                    _messageResponseReceived = new TaskCompletionSource<bool>();

                    await _connection.InvokeAsync("SendInboundMessage", request, "Chat");
                    Console.WriteLine("Message sent successfully");

                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                    try
                    {
                        await _messageResponseReceived.Task.WaitAsync(cts.Token);
                    }
                    catch (OperationCanceledException)
                    {
                        Console.WriteLine("No response received within 15 seconds");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error {ex.Message}");
                }
            }
        }
    }
}

# Sending a Message via to Agent via REST

This documentation provides a step-by-step guide on how external users can use our REST API endpoint to send messages to an agent.

---

## REST API Endpoint

**URL:**  
`http://localhost:5000/api/user/messaging/inbound`

### Required Query Parameters

| Parameter      | Description                                              |
|----------------|---------------------------------------------------------|
| `workflowId`   | Agent workflow ID                                       |
| `type`         | `Chat` for messaging, `Data` for sending a data payload |
| `apikey`       | API key provided by the tenant admin                    |
| `participantId`| User's participant ID (e.g., email or unique name)      |

### Usage

- **Chat Message:**  
  Send the text in the request body (plain text, not JSON). Example:
```
"Hi I'm Kavish, needs to know the hiring process."
```

- **Data Message:**  
  Send a JSON object in the request body. Example:
  ```json
  {
    "name": "Saman",
    "age": "24",
    "message": "hello"
  }
  ```

### How to read Data Message from Agent Workflow

```csharp
using System.Text.Json;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("HR Agent:HR Flow Data")]
public class HRFlow : FlowBase
{
    private readonly Queue<Detail> _detailQueue = new Queue<Detail>();

    public HRFlow()
    {
        _messageHub.SubscribeDataHandler((messageThread) =>
        {
            var detailsJson = messageThread.LatestMessage.Data.ToString();
            Console.WriteLine($"Received Details - subscribeDataHandler: {detailsJson}");
            var details = JsonSerializer.Deserialize<Detail>(detailsJson!);
            if (details != null)
            {
                __detailQueue.Enqueue(details);
            }
        });
    }

    [WorkflowRun]
    public async Task<Detail> Run()
    {
        await Workflow.WaitConditionAsync(() => __detailQueue.Count > 0);
        var request = __detailQueue.Dequeue();
        Console.WriteLine($"Received Details: {request.Name} {request.Age} {request.Message}");
        return request;
    }
}
```

**Detail Model:**
```csharp
public class Detail
{
    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [JsonPropertyName("age")]
    public required string Age { get; set; }

    [JsonPropertyName("message")]
    public required string Message { get; set; }
}
```
---

### How to read Chat Message from Agent Workflow

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("HR Agent:HR Flow Chat")]
public class HRFlowChat : FlowBase
{
    private readonly Queue<string> _chatRequests = new Queue<string>();

    public HRFlowChat()
    {
        _messageHub.SubscribeChatHandler((messageThread) =>
        {
            var chatMessage = messageThread.LatestMessage.Content;
            Console.WriteLine($"Received message - SubscribeChatHandler: {chatMessage}");
            if (chatMessage != null)
            {
                _chatRequests.Enqueue(chatMessage);
            }
        });
    }

    [WorkflowRun]
    public async Task<string> Run()
    {
            await Workflow.WaitConditionAsync(() => _chatRequests.Count > 0);
            var request = _chatRequests.Dequeue();
            Console.WriteLine($"Received Message: {request}");
            return request;
    }
}
```

---

## Summary

- Use the REST API to send chat or data messages to agent workflows.
- All operations require a valid API key from the tenant admin.

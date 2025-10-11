# Webhooks

Webhooks provide a powerful mechanism for external systems to send messages and trigger events in your XiansAI agents. They enable real-time integration with third-party services, allowing your agents to respond to external events as they occur.

## Overview

Webhooks in XiansAI allow external systems to:

- Send HTTP POST requests to trigger agent workflows
- Pass data and parameters to agent methods
- Receive immediate responses from agents
- Integrate with external services and APIs

## Webhook URL Format

All webhook requests follow this standardized URL format:

```http
POST <server-url>/api/user/webhooks/{workflow}/{methodName}?tenantId={tenantId}&apikey={apikey}&[additional-params]
```

### URL Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `workflow` | Either the WorkflowId or the WorkflowType | ✅ Yes |
| `methodName` | Name of the Temporal Update method to invoke | ✅ Yes |
| `tenantId` | Valid tenant identifier | ✅ Yes |
| `apikey` | Valid API key for the tenant | ✅ Yes |
| `additional-params` | Custom query parameters passed to the method | ❌ Optional |

### Example URL

```http
POST http://localhost:5000/api/user/webhooks/A2A%20Agent%20Team%3A%20Webhook%20Bot/mail-received?apikey=sk-Xnai-jJlpoIrOxiAhrOwOsB1xuO96TfEfZYmJa2u6xMqXjZg&tenantId=default&param=param-value
```

## Implementing Webhook Handlers

### 1. Define Webhook Method

Create a method in your workflow class decorated with the `[WorkflowUpdate]` attribute:

```csharp
[WorkflowUpdate("method-name")]
public async Task<WebhookResponse> WebhookUpdateMethod(IDictionary<string, string> queryParams, string body)
{
    // Process the webhook data
    Console.WriteLine("Webhook received");
    Console.WriteLine(JsonSerializer.Serialize(queryParams));
    Console.WriteLine(body);
    
    // Return response to webhook caller
    var response = new WebhookResponse(HttpStatusCode.OK);
    response.Content = "Webhook processed successfully";
    return response;
}
```

### 2. Method Signature Requirements

- **Update Name**: Must match the `methodName` in the webhook URL
- **Parameters**:
  - `queryParams`: Contains all query parameters except `apikey` and `tenantId`
  - `body`: Contains the raw request body as a string
- **Return Type**: Must return a `WebhookResponse` object which allows you to control the HTTP status code, content, and content type sent back to the webhook caller.

### WebhookResponse Class

The `WebhookResponse` class provides fine-grained control over the HTTP response sent back to the webhook caller:

```csharp
// Basic response with 200 OK status
var response = new WebhookResponse(HttpStatusCode.OK);
response.Content = "Success message";

// Response with custom status code
var errorResponse = new WebhookResponse(HttpStatusCode.BadRequest);
errorResponse.Content = JsonSerializer.Serialize(new { error = "Invalid data" });

// Response with custom content type
var xmlResponse = new WebhookResponse(HttpStatusCode.OK, "<result>success</result>", "application/xml");

// Plain text response (useful for validation tokens)
var validationResponse = new WebhookResponse(HttpStatusCode.OK, "validation-token-123", "text/plain");
```

**Constructor Options:**

- `WebhookResponse(HttpStatusCode statusCode)` - Basic response with status code
- `WebhookResponse(HttpStatusCode statusCode, string content, string contentType)` - Full control over response

**Properties:**

- `StatusCode` - HTTP status code (200, 400, 500, etc.)
- `Content` - Response body content
- `ContentType` - MIME type (defaults to "application/json")

### 3. Complete Webhook Bot Example

```csharp
using System.Text.Json;
using System.Net;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Agent Team: Webhook Bot")]
public class WebhookBot : FlowBase
{
    [WorkflowRun]
    public async Task Run()
    {
        await InitWebhookProcessing();
    }

    [WorkflowUpdate("mail-received")]
    public async Task<WebhookResponse> MailReceived(IDictionary<string, string> queryParams, string body)
    {
        // Optional: Add processing delay
        await Workflow.DelayAsync(TimeSpan.FromSeconds(1));
        
        // Handle validation token (for services like Microsoft Graph)
        if (queryParams.TryGetValue("validationToken", out var validationToken))
        {
            return new WebhookResponse(HttpStatusCode.OK, validationToken, "text/plain");
        }
        
        // Log webhook reception
        Console.WriteLine("Mail received");
        Console.WriteLine(JsonSerializer.Serialize(queryParams));
        Console.WriteLine(body);
        
        // Process the webhook data here
        // ... your business logic ...
        
        // Return response to caller
        var response = new WebhookResponse(HttpStatusCode.OK);
        response.Content = body; // Echo back the received body
        return response;
    }

    [WorkflowUpdate("order-created")]
    public async Task<WebhookResponse> OrderCreated(IDictionary<string, string> queryParams, string body)
    {
        // Parse JSON body
        var orderData = JsonSerializer.Deserialize<OrderData>(body);
        
        // Process order
        await ProcessOrder(orderData);
        
        var response = new WebhookResponse(HttpStatusCode.OK);
        response.Content = JsonSerializer.Serialize(new { status = "processed", orderId = orderData.Id });
        return response;
    }
    
    private async Task ProcessOrder(OrderData order)
    {
        // Your order processing logic
        await Workflow.DelayAsync(TimeSpan.FromSeconds(2));
        Console.WriteLine($"Processed order: {order.Id}");
    }
}

public class OrderData
{
    public string Id { get; set; }
    public string CustomerEmail { get; set; }
    public decimal Amount { get; set; }
}
```

### Understanding InitWebhookProcessing()

The `await InitWebhookProcessing()` call in the workflow's `Run()` method serves several critical functions:

#### 1. Keeps Workflow Active for Webhook Processing

This method holds the workflow indefinitely from completion, allowing it to continue processing incoming webhook requests. Without this call, the workflow would complete immediately and wouldn't be able to handle webhook updates.

```csharp
[WorkflowRun]
public async Task Run()
{
    await InitWebhookProcessing(); // Keeps workflow alive to handle webhooks
}
```

#### 2. Temporal Maintenance (ContinueAsNew)

`InitWebhookProcessing()` performs mandatory Temporal maintenance by automatically calling `ContinueAsNew` when the workflow history becomes too long. This prevents workflows from hitting Temporal's history size limits and ensures optimal performance.

#### 3. Alternative: Asynchronous Initialization

While any workflow can process webhooks, it's a good practice to initialize webhook processing asynchronously if you have other workflow logic to execute:

```csharp
[WorkflowRun]
public async Task Run()
{
    // Start webhook processing asynchronously (fire-and-forget)
    _ = InitWebhookProcessing();
    
    // Continue with other workflow logic
    await PerformOtherTasks();
    
    // Keep workflow running
    await Workflow.WaitConditionAsync(() => false); // Wait indefinitely
}

private async Task PerformOtherTasks()
{
    // Your other workflow logic here
    await SomeInitializationTask();
    await SetupPeriodicTasks();
}
```

#### 4. Best Practices

- **Dedicated Webhook Workflows**: For workflows that only handle webhooks, use `await InitWebhookProcessing()`
- **Mixed Workflows**: For workflows with other logic, use `_ = InitWebhookProcessing()` and manage the workflow lifecycle separately
- **Always Keep Active**: Ensure your webhook workflow never completes if you want to continue receiving webhook calls

!!! info "Workflow Lifecycle and Webhook Processing"
    If your webhook workflow completes (exits the `Run()` method), the system will automatically start a new workflow instance each time a webhook request is received. This "Update with Start" pattern ensures webhooks are always processed, but creates overhead from repeatedly starting new workflow instances.

    For optimal performance with frequent webhooks, keep your workflow active using `InitWebhookProcessing()` to maintain a single long-running instance.

## Agent Configuration

Register your webhook bot with the agent:

```csharp
using XiansAi.Flow;
using DotNetEnv;

// Load environment variables
Env.Load();

// Create agent
var agent = new AgentTeam("Agent Team");

// Add webhook bot
var webhookBot = agent.AddAgent<WebhookBot>();

// Run agent
await agent.RunAsync();
```

## Webhook Security

### API Key Authentication

All webhook requests must include a valid API key in the query parameters:

```http
?apikey=<your-api-key>
```

### Tenant Isolation

Webhooks are tenant-scoped using the `tenantId` parameter:

```http
?tenantId=default
```

## Testing Webhooks

### Using cURL

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "timestamp": "2024-01-15T10:30:00Z"}' \
  "http://localhost:5000/api/user/webhooks/WebhookBot/mail-received?apikey=your-api-key&tenantId=default&source=email"
```

## Common Use Cases

### 1. Email Integration

```csharp
[WorkflowUpdate("email-received")]
public async Task<WebhookResponse> EmailReceived(IDictionary<string, string> queryParams, string body)
{
    var emailData = JsonSerializer.Deserialize<EmailData>(body);
    
    // Process email
    await ProcessEmail(emailData);
    
    // Send to appropriate agent
    await MessageHub.Agent2Agent.SendChat(
        typeof(CustomerServiceAgent),
        $"New email from {emailData.From}: {emailData.Subject}"
    );
    
    var response = new WebhookResponse(HttpStatusCode.OK);
    response.Content = "Email processed";
    return response;
}
```

### 2. Payment Notifications

```csharp
[WorkflowUpdate("payment-completed")]
public async Task<WebhookResponse> PaymentCompleted(IDictionary<string, string> queryParams, string body)
{
    var payment = JsonSerializer.Deserialize<PaymentNotification>(body);
    
    // Update order status
    await UpdateOrderStatus(payment.OrderId, "paid");
    
    // Trigger fulfillment
    await MessageHub.Agent2Agent.SendData(
        typeof(FulfillmentAgent),
        new FulfillmentRequest { OrderId = payment.OrderId },
        "ProcessFulfillment"
    );
    
    var response = new WebhookResponse(HttpStatusCode.OK);
    response.Content = JsonSerializer.Serialize(new { status = "processed" });
    return response;
}
```

### 3. System Monitoring

```csharp
[WorkflowUpdate("system-alert")]
public async Task<WebhookResponse> SystemAlert(IDictionary<string, string> queryParams, string body)
{
    var alert = JsonSerializer.Deserialize<SystemAlert>(body);
    
    if (alert.Severity == "critical")
    {
        // Escalate to on-call engineer
        await MessageHub.Agent2User.SendChat(
            alert.OnCallEngineerId,
            $"🚨 Critical Alert: {alert.Message}"
        );
    }
    
    // Log alert
    Console.WriteLine($"Alert received: {alert.Message}");
    
    var response = new WebhookResponse(HttpStatusCode.OK);
    response.Content = "Alert acknowledged";
    return response;
}
```

## Best Practices

### 1. Error Handling

```csharp
[WorkflowUpdate("process-data")]
public async Task<WebhookResponse> ProcessData(IDictionary<string, string> queryParams, string body)
{
    try
    {
        var data = JsonSerializer.Deserialize<MyData>(body);
        await ProcessBusinessLogic(data);
        
        var response = new WebhookResponse(HttpStatusCode.OK);
        response.Content = JsonSerializer.Serialize(new { status = "success" });
        return response;
    }
    catch (JsonException ex)
    {
        Console.WriteLine($"JSON parsing error: {ex.Message}");
        
        var errorResponse = new WebhookResponse(HttpStatusCode.BadRequest);
        errorResponse.Content = JsonSerializer.Serialize(new { status = "error", message = "Invalid JSON format" });
        return errorResponse;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Processing error: {ex.Message}");
        
        var errorResponse = new WebhookResponse(HttpStatusCode.InternalServerError);
        errorResponse.Content = JsonSerializer.Serialize(new { status = "error", message = "Processing failed" });
        return errorResponse;
    }
}
```

### 2. Async Processing

```csharp
[WorkflowUpdate("long-running-task")]
public async Task<WebhookResponse> LongRunningTask(IDictionary<string, string> queryParams, string body)
{
    // Start async processing
    _ =  Workflow.RunTaskAsync(async () =>
    {
        await ProcessLongRunningTask(body);
    });
    
    // Return immediate response
    var response = new WebhookResponse(HttpStatusCode.Accepted);
    response.Content = JsonSerializer.Serialize(new { status = "accepted", message = "Task queued for processing" });
    return response;
}
```

### 3. Validation

```csharp
[WorkflowUpdate("validate-and-process")]
public async Task<WebhookResponse> ValidateAndProcess(IDictionary<string, string> queryParams, string body)
{
    // Validate required parameters
    if (!queryParams.ContainsKey("source"))
    {
        var errorResponse = new WebhookResponse(HttpStatusCode.BadRequest);
        errorResponse.Content = JsonSerializer.Serialize(new { status = "error", message = "Missing 'source' parameter" });
        return errorResponse;
    }
    
    // Validate body
    if (string.IsNullOrEmpty(body))
    {
        var errorResponse = new WebhookResponse(HttpStatusCode.BadRequest);
        errorResponse.Content = JsonSerializer.Serialize(new { status = "error", message = "Empty request body" });
        return errorResponse;
    }
    
    // Process valid request
    await ProcessValidRequest(queryParams["source"], body);
    
    var response = new WebhookResponse(HttpStatusCode.OK);
    response.Content = JsonSerializer.Serialize(new { status = "success" });
    return response;
}
```

## Integration with Other Agent Features

### Combining with Proactive Messages

```csharp
[WorkflowUpdate("user-action")]
public async Task<WebhookResponse> UserAction(IDictionary<string, string> queryParams, string body)
{
    var action = JsonSerializer.Deserialize<UserAction>(body);
    
    // Send proactive message to user
    await MessageHub.Agent2User.SendChat(
        action.UserId,
        $"We received your {action.ActionType} request and are processing it now."
    );
    
    var response = new WebhookResponse(HttpStatusCode.OK);
    response.Content = "Action acknowledged";
    return response;
}
```

### Triggering Agent-to-Agent Communication

```csharp
[WorkflowUpdate("external-event")]
public async Task<WebhookResponse> ExternalEvent(IDictionary<string, string> queryParams, string body)
{
    var eventData = JsonSerializer.Deserialize<ExternalEvent>(body);
    
    // Route to appropriate agent based on event type
    switch (eventData.Type)
    {
        case "order":
            await MessageHub.Agent2Agent.SendData(
                typeof(OrderProcessingAgent),
                eventData.Data,
                "ProcessOrder"
            );
            break;
            
        case "support":
            await MessageHub.Agent2Agent.SendChat(
                typeof(CustomerSupportAgent),
                eventData.Message
            );
            break;
    }
    
    var response = new WebhookResponse(HttpStatusCode.OK);
    response.Content = "Event routed successfully";
    return response;
}
```

## Architecture Notes

Webhooks use the Temporal "Update with Start" pattern, which provides automatic workflow lifecycle management:

- **Workflow Running**: If the target workflow is already running, the webhook update method is called on the existing instance
- **Workflow Not Running**: If no workflow instance exists, the system automatically starts a new workflow instance and then calls the webhook update method
- **Guaranteed Processing**: This ensures that webhook requests are never lost, regardless of workflow state

!!! tip "Performance Considerations"
    Webhooks hold HTTP connections until the workflow method completes. For long-running processes, consider returning an immediate acknowledgment and processing asynchronously. Webhook requests will timeout in 30 seconds by default.

!!! example "Complete Sample"
    See the complete webhook implementation example in the [A2A Communications Sample](https://github.com/XiansAiPlatform/samples/tree/main/a2a-communications) repository.

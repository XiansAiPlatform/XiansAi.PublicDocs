# Handling Data as RPC

This document explains how the Agent Flow can process data messages once received through the RPC (Remote Procedure Call) pattern.

When an Agent Flow receives a data message, it can process it in two ways: through workflow activities or through direct RPC method invocation. The RPC approach provides a simplified way to handle data messages through direct method invocation, bypassing the workflow orchestration layer. This pattern is ideal for stateless, atomic operations that don't require Temporal workflow orchestration or complex state management.

## Setting Up Data Processor

### 1. Create a Data Processor Class

Create a class with methods that will handle your data operations:

```csharp
public class DataProcessor 
{
    private readonly MessageThread _messageThread;

    public DataProcessor(MessageThread messageThread) 
    {
        _messageThread = messageThread;
    }

    public async Task<ContractWithValidations> ProcessDocumentRequest(DocumentRequest documentRequest) 
    {
        // TODO: Implement the logic to process the document request
        return new ContractWithValidations();
    }
}
```

### 2. Register Data Processor

Register the data processor with your flow in `Program.cs`:

```csharp
var agent = new Agent("Legal Contract Agent");

// Add flow
var flow = agent.AddFlow<LegalContractFlow>();
flow.SetDataProcessor<DataProcessor>();  // Register the data processor

await agent.RunAsync();
```

## Constructor Requirements

Your DataProcessor class constructor can optionally accept a `MessageThread` parameter:

```csharp
public class DataProcessor 
{
    // Option 1: Constructor with MessageThread (automatically injected)
    public DataProcessor(MessageThread messageThread) { }
    
    // Option 2: Parameterless constructor
    public DataProcessor() { }
}
```

The `MessageThread` parameter will be automatically passed by the framework when the processor is instantiated.

## Method Design

### Method Signatures

Your data processor methods can have:

- **Any method name** - will be invoked by name
- **Any parameters** - automatically converted from JSON
- **Any return type** - automatically serialized to JSON response
- **Async or sync** - both `Task<T>` and direct returns supported

```csharp
public class DataProcessor 
{
    // Synchronous method
    public string ProcessSimpleRequest(string input) 
    {
        return $"Processed: {input}";
    }

    // Asynchronous method  
    public async Task<UserData> ProcessUserRequest(int userId, string action) 
    {
        return await _userService.GetUserAsync(userId);
    }

    // Complex object parameters and return types
    public async Task<ValidationResult> ValidateDocument(DocumentRequest request) 
    {
        // Process complex object
        return await _validator.ValidateAsync(request);
    }
}
```

## Invoking Methods via REST API

### API Endpoint Format

e.g.,

```http
POST http://localhost:5000/api/user/rest/converse
```

### Query Parameters

- `workflow` - Agent and workflow type or workflow ID
- `apikey` - Your API key
- `tenantId` - Tenant identifier (usually "default")
- `type` - Must be "Data" for RPC calls
- `participantId` - User identifier
- `text` - **Method name to invoke**

### Example Request

```bash
POST <your-server-url>/api/user/rest/converse?workflow=Legal%20Contract%20Agent:Legal%20Contract%20Flow&apikey=sk-Xnai---&tenantId=default&type=Data&participantId=user@gmail.com&text=ProcessDocumentRequest

Content-Type: application/json

```json
{
  "DocumentId": "contract-123",
  "ValidationType": "full"
}
```

### Response Format

When a data processor method executes successfully, the response follows this format:

```json
{
    "requestId": "f021cef9-da15-4160-a7fb-053c885ea84b",
    "threadId": "688e4717d8636b0ffb690e18",
    "response": {
        "id": "689021145e6400caa55a9dd8",
        "text": null,
        "data": {
            "Contract": {
               ...
            },
            "Validations": [
               ...
            ]
        },
        "createdAt": "2025-08-04T02:55:16.583Z",
        "direction": 1,
        "messageType": 1,
        "scope": null,
        "hint": null
    }
}
```

**Response Fields:**

- `requestId` - Unique identifier for the request
- `threadId` - Thread identifier for the conversation
- `response.id` - Message identifier
- `response.text` - Usually null for data responses
- `response.data` - The actual return value from your method (serialized as JSON)
- `response.createdAt` - Timestamp when the response was created
- `response.direction` - Message direction (1 = outbound)
- `response.messageType` - Type of message (1 = data message)
- `response.scope` - Execution scope
- `response.hint` - Additional hints

## Parameter Passing

Parameters are passed as JSON in the request body and automatically converted to method parameters. The framework supports multiple parameter formats:

### Single Parameter

```json
"simple string value"
```

```json
42
```

```json
{
  "DocumentId": "contract-123",
  "ValidationType": "full"
}
```

### Multiple Parameters (Array Format)

```json
["contract-123", "full", true]
```

```json
[
  "userId123", 
  {
    "action": "validate",
    "options": {
      "strictMode": true
    }
  }
]
```

### Parameter Matching Rules

The framework uses intelligent parameter matching:

1. **Method name matching** - Case insensitive (`processDocumentRequest` matches `ProcessDocumentRequest`)
2. **Parameter count matching** - Exact count preferred, optional parameters supported
3. **Type conversion** - Automatic JSON to .NET type conversion
4. **Method overloading** - First compatible method signature wins

## Example Method Invocations

### Simple String Parameter

**Method:**

```csharp
public string ProcessMessage(string message) => $"Processed: {message}";
```

**Request:**

```bash
POST .../converse?...&text=ProcessMessage
Content-Type: application/json

"Hello World"
```

### Complex Object Parameter

**Method:**

```csharp
public async Task<ContractResult> ProcessDocumentRequest(DocumentRequest request)
```

**Request:**

```bash
POST .../converse?...&text=ProcessDocumentRequest
Content-Type: application/json

{
  "DocumentId": "contract-123",
  "ValidationType": "comprehensive",
  "Options": {
    "includeMetadata": true,
    "validateSignatures": true
  }
}
```

### Multiple Parameters

**Method:**

```csharp
public async Task<UserReport> GenerateReport(string userId, DateTime fromDate, bool includeDetails)
```

**Request:**

```bash
POST .../converse?...&text=GenerateReport
Content-Type: application/json

["user123", "2024-01-01T00:00:00Z", true]
```

## Error Handling

If an error occurs, framework will retry with the default Temporal retry policy. This could be overridden by setting the `SystemActivityOptions` on the `FlowBase` class.

If all retries fail, the error will be returned to the client.

```json
{
    "requestId": "c6a3312f-8a23-4555-b037-026275dbe990",
    "threadId": "688e4717d8636b0ffb690e18",
    "response": {
        "id": "688f38ac6e7f1461070eaf11",
        "text": "Error occurred while processing data",
        "data": {
            "error": "Activity task failed"
        },
        "createdAt": "2025-08-03T10:23:40.054Z",
        "direction": 1,
        "messageType": 1,
        "scope": null,
        "hint": null
    }
}
```

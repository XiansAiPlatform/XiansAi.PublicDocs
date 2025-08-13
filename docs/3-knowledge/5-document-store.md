# Structured Document Store

Agents can save structured information through the Xians server. It should not be used as a database to store transactional data, but agents can store configurations, settings, etc. that are transient. There is no guarantee of data reliability and therefore this store should not be used for critical data.

## Overview

The Document Store provides a simple interface for agents to save, retrieve, and manage JSON documents. Documents are typed objects with metadata and support operations like create, read, update, delete, and query.

## Interface

The `IDocumentStore` interface provides the following operations:

- **Save**: Store new documents or update existing ones
- **Get**: Retrieve documents by ID or by type/key combination
- **Query**: Find documents using metadata filters
- **Update**: Modify existing documents
- **Delete**: Remove single or multiple documents
- **Exists**: Check if a document exists

## Basic Usage

### Saving Documents

```csharp
using XiansAi.Memory;
using System.Text.Json;

// Object to be saved
var counter = new Counter {
    Count = 1,
    Message = "Hello World",
    CreatedAt = DateTime.UtcNow
};

// Create a new document
var document = new Document {
    Content = JsonSerializer.SerializeToElement(counter),
    Type = "Counter",
    Key = "my-counter",
    // optional
    Metadata = new Dictionary<string, object> {
        { "Brand", "Xians" },
        { "Version", "1.0" }
    }
};

// Save with options
var options = new DocumentOptions {
    UseKeyAsIdentifier = true,
    Overwrite = true
};

var savedDoc = await MemoryHub.Documents.SaveAsync(document, options);
```

### Retrieving Documents

```csharp
// Get by ID
var docById = await MemoryHub.Documents.GetAsync("document-id");
if (docById != null) {
    var counter = JsonSerializer.Deserialize<Counter>((JsonElement)docById.Content);
}

// Get by type and key
var docByKey = await MemoryHub.Documents.GetByKeyAsync("Counter", "my-counter");
if (docByKey != null) {
    var counter = JsonSerializer.Deserialize<Counter>((JsonElement)docByKey.Content);
}

// Check if document exists
var exists = await MemoryHub.Documents.ExistsAsync("document-id");
```

### Updating Documents

```csharp
// Retrieve and update
var document = await MemoryHub.Documents.GetByKeyAsync("Counter", "my-counter");

if (document != null) {
    var counter = JsonSerializer.Deserialize<Counter>((JsonElement)document.Content)!;
    counter.Count++;
    counter.LastUpdated = DateTime.UtcNow;
    
    // Update the document content
    document.Content = JsonSerializer.SerializeToElement(counter);
    var success = await MemoryHub.Documents.UpdateAsync(document);
}
```

### Querying Documents

```csharp
// Query by type
var query = new DocumentQuery {
    Type = "Counter"
};

var results = await MemoryHub.Documents.QueryAsync(query);
foreach (var doc in results) {
    var counter = JsonSerializer.Deserialize<Counter>((JsonElement)doc.Content)!;
    Console.WriteLine($"Document: {doc.Key}, Count: {counter.Count}");
}
```

### Deleting Documents

```csharp
// Delete single document
var deleted = await MemoryHub.Documents.DeleteAsync("document-id");

// Delete multiple documents
var idsToDelete = new[] { "doc1", "doc2", "doc3" };
var deleteCount = await MemoryHub.Documents.DeleteManyAsync(idsToDelete);
```

## Document Structure

Documents consist of:

- **Content**: A `JsonElement` containing your serialized object data
- **Type**: A string categorizing the document
- **Key**: An optional custom identifier for the document
- **Metadata**: Key-value pairs for additional information
- **ID**: Auto-generated unique identifier
- **AgentId**: The agent that created or owns this document
- **WorkflowId**: The workflow instance that created this document
- **CreatedAt/UpdatedAt**: Timestamps for creation and last update
- **ExpiresAt**: Optional expiration time for automatic cleanup

## Best Practices

1. **Use meaningful types** - Group related documents with consistent type names
2. **Leverage keys** - Use custom keys for documents you need to retrieve frequently
3. **Add metadata** - Include searchable metadata for querying capabilities
4. **Handle null returns** - Always check for null when retrieving documents
5. **Keep documents small** - Store lightweight configuration and state data only
6. **Serialize/Deserialize properly** - Use `JsonSerializer.SerializeToElement()` for saving and `JsonSerializer.Deserialize<T>()` for reading
7. **Handle JsonElement casting** - Cast document content to `JsonElement` when deserializing

## Example: Counter Service

```csharp
public class Counter {
    public int Count { get; set; }
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUpdated { get; set; }
}
```

This document store is ideal for storing agent configurations, temporary state, user preferences, and other lightweight structured data that doesn't require strong consistency guarantees.
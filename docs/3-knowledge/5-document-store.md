# Structured Document Store

Agents can save structured information through the Xians server. It should not be used as a database to store transactional data, but agents can store configurations, settings, etc. that are transient. There is no guarantee of data reliability and therefore this store should not be used for critical data.

## Overview

The Document Store provides a simple interface for agents to save, retrieve, and manage JSON documents. Documents are typed objects with metadata and support operations like create, read, update, delete, and query.

**Important:** Documents have a default Time-to-Live (TTL) of 30 days and will be automatically deleted after this period unless explicitly configured otherwise.

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

// Create a new document with Type and Key
var document = new Document {
    Content = JsonSerializer.SerializeToElement(counter),
    Type = "Counter",        // Category/namespace for the document
    Key = "my-counter",      // Unique identifier within the "Counter" type
    // optional
    Metadata = new Dictionary<string, object> {
        { "Brand", "Xians" },
        { "Version", "1.0" }
    }
};

// Save with options
var options = new DocumentOptions {
    UseKeyAsIdentifier = true,  // Use Type+Key combination as identifier
    Overwrite = true           // Allow updating existing documents
};

var savedDoc = await MemoryHub.Documents.SaveAsync(document, options);
```

#### Identification Strategies

Option 1: Auto-generated ID (default)

```csharp
var document = new Document {
    Content = JsonSerializer.SerializeToElement(data),
    Type = "UserData"  // Key is optional, ID will be auto-generated
};
// Results in document with auto-generated ID like "doc-12345"
```

Option 2: Type + Key combination

```csharp
var document = new Document {
    Content = JsonSerializer.SerializeToElement(data),
    Type = "UserSettings",
    Key = "user-12345"
};

var options = new DocumentOptions {
    UseKeyAsIdentifier = true  // Required for Type+Key identification
};
// Results in document identifiable by Type="UserSettings" + Key="user-12345"
```

### Retrieving Documents

There are multiple ways to retrieve documents based on how they were saved:

#### Method 1: Retrieve by Auto-generated ID

```csharp
// For documents saved without UseKeyAsIdentifier=true
var docById = await MemoryHub.Documents.GetAsync("auto-generated-id");
if (docById != null) {
    var counter = JsonSerializer.Deserialize<Counter>((JsonElement)docById.Content);
}
```

#### Method 2: Retrieve by Type and Key

```csharp
// For documents saved with Type and Key using UseKeyAsIdentifier=true
var docByKey = await MemoryHub.Documents.GetByKeyAsync("Counter", "my-counter");
if (docByKey != null) {
    var counter = JsonSerializer.Deserialize<Counter>((JsonElement)docByKey.Content);
    Console.WriteLine($"Counter value: {counter.Count}");
}
```

#### Method 3: Query by Type or Metadata

```csharp
// Find all documents of a specific type
var query = new DocumentQuery {
    Type = "Counter",
    Limit = 50
};

var counters = await MemoryHub.Documents.QueryAsync(query);
foreach (var doc in counters) {
    var counter = JsonSerializer.Deserialize<Counter>((JsonElement)doc.Content)!;
    Console.WriteLine($"Counter {doc.Key}: {counter.Count}");
}
```

#### Existence Checks

```csharp
// Check if document exists by ID
var existsById = await MemoryHub.Documents.ExistsAsync("document-id");

// Check if document exists by Type+Key (query with Limit=1)
var existsByKey = await MemoryHub.Documents.QueryAsync(new DocumentQuery {
    Type = "Counter",
    Key = "my-counter",
    Limit = 1
});
var exists = existsByKey.Any();
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
- **Type**: A string categorizing the document (e.g., "Counter", "UserSettings", "Configuration")
- **Key**: An optional custom identifier that, combined with Type, creates a unique document identifier
- **Metadata**: Key-value pairs for additional information and querying
- **ID**: Auto-generated unique identifier (used when Key is not provided)
- **AgentId**: The agent that created or owns this document
- **WorkflowId**: The workflow instance that created this document
- **CreatedAt/UpdatedAt**: Timestamps for creation and last update
- **ExpiresAt**: Optional expiration time for automatic cleanup

### Type and Key Structure

The **Type** and **Key** fields work together to provide a logical identification system:

- **Type**: Acts as a category or namespace for your documents (e.g., "UserPreferences", "GameState", "Configuration")
- **Key**: Acts as a unique identifier within that type (e.g., "user-123", "level-5", "app-settings")

When both Type and Key are provided, they form a composite identifier that allows you to:

- Organize documents logically by category
- Use meaningful, human-readable identifiers
- Retrieve documents without needing to remember auto-generated IDs
- Enable the `UseKeyAsIdentifier` option for upsert behavior

## Document Options

The `DocumentOptions` class provides control over how documents are saved and managed:

### Available Options

```csharp
public class DocumentOptions
{
    /// <summary>
    /// Time-to-live in minutes. Document will be automatically deleted after this time.
    /// Default is 43,200 minutes (30 days).
    /// </summary>
    public int? TtlMinutes { get; set; } = 43200; // 30 days default

    /// <summary>
    /// Whether to overwrite if a document with the same ID exists.
    /// Default is false.
    /// </summary>
    public bool Overwrite { get; set; } = false;

    /// <summary>
    /// When true, uses the combination of Type and Key as the unique identifier.
    /// If a document with the same Type and Key exists, it will be updated.
    /// Requires both Type and Key to be set on the document.
    /// Default is false.
    /// </summary>
    public bool UseKeyAsIdentifier { get; set; } = false;
}
```

### TtlMinutes (Time-to-Live)

Automatically delete documents after a specified time period. **Default is 30 days (43,200 minutes)** if not specified.

```csharp
var options = new DocumentOptions {
    TtlMinutes = 60  // Document expires in 1 hour
};

var document = new Document {
    Content = JsonSerializer.SerializeToElement(temporaryData),
    Type = "TempData",
    Key = "session-12345"
};

await MemoryHub.Documents.SaveAsync(document, options);
```

Use cases for TTL:

- Session data that should expire
- Temporary caches
- Time-sensitive configurations
- Cleanup of old logs or metrics

### Overwrite

Control whether to overwrite existing documents with the same ID:

```csharp
// Default behavior (Overwrite = false) - will fail if document exists
var options1 = new DocumentOptions {
    Overwrite = false  // Default
};

// Allow overwriting existing documents
var options2 = new DocumentOptions {
    Overwrite = true
};

var document = new Document {
    Id = "specific-id",  // Explicit ID
    Content = JsonSerializer.SerializeToElement(data),
    Type = "Configuration"
};

await MemoryHub.Documents.SaveAsync(document, options2);
```

### UseKeyAsIdentifier

Enable upsert behavior using Type + Key combination:

```csharp
var options = new DocumentOptions {
    UseKeyAsIdentifier = true,  // Required for Type+Key identification
    Overwrite = true           // Allow updates to existing documents
};

var document = new Document {
    Content = JsonSerializer.SerializeToElement(userSettings),
    Type = "UserSettings",
    Key = "user-12345"  // Both Type and Key must be provided
};

// First call: Creates new document
var result1 = await MemoryHub.Documents.SaveAsync(document, options);

// Second call: Updates existing document (same Type+Key)
document.Content = JsonSerializer.SerializeToElement(updatedSettings);
var result2 = await MemoryHub.Documents.SaveAsync(document, options);
```

**Important Notes:**

- When `UseKeyAsIdentifier = true`, both `Type` and `Key` must be set on the document
- The system will look for existing documents with the same Type+Key combination
- If found, the existing document will be updated; if not found, a new document is created
- This provides upsert (insert or update) behavior

### Common Option Combinations

**Temporary session data:**

```csharp
var options = new DocumentOptions {
    UseKeyAsIdentifier = true,
    Overwrite = true,
    TtlMinutes = 30  // Auto-delete after 30 minutes
};
```

**Permanent configuration with upsert:**

```csharp
var options = new DocumentOptions {
    UseKeyAsIdentifier = true,
    Overwrite = true
    // No TTL - permanent storage
};
```

**One-time data (no overwrites):**

```csharp
var options = new DocumentOptions {
    Overwrite = false,
    TtlMinutes = 1440  // Keep for 24 hours
};
```

## Document Query

The `DocumentQuery` class provides powerful filtering and pagination capabilities for searching documents:

### Available Query Options

```csharp
public class DocumentQuery
{
    /// <summary>
    /// Filter by document type.
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// Filter by document key.
    /// </summary>
    public string? Key { get; set; }

    /// <summary>
    /// Filter by metadata key-value pairs.
    /// </summary>
    public Dictionary<string, object>? MetadataFilters { get; set; }

    /// <summary>
    /// Maximum number of results to return.
    /// </summary>
    public int? Limit { get; set; } = 100;

    /// <summary>
    /// Number of results to skip for pagination.
    /// </summary>
    public int? Skip { get; set; } = 0;

    /// <summary>
    /// Sort field (e.g., "CreatedAt", "UpdatedAt").
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort direction.
    /// </summary>
    public bool SortDescending { get; set; } = true;

    /// <summary>
    /// Include only documents created after this date.
    /// </summary>
    public DateTime? CreatedAfter { get; set; }

    /// <summary>
    /// Include only documents created before this date.
    /// </summary>
    public DateTime? CreatedBefore { get; set; }
}
```

### Basic Queries

#### Query by Type

```csharp
// Find all user settings documents
var query = new DocumentQuery {
    Type = "UserSettings"
};

var userSettings = await MemoryHub.Documents.QueryAsync(query);
foreach (var doc in userSettings) {
    Console.WriteLine($"User settings for: {doc.Key}");
}
```

#### Query by Type and Key

```csharp
// Find a specific document by type and key
var query = new DocumentQuery {
    Type = "GameState",
    Key = "level-5"
};

var results = await MemoryHub.Documents.QueryAsync(query);
var gameState = results.FirstOrDefault();
```

#### Query with Limit and Pagination

```csharp
// Get first 10 documents
var query = new DocumentQuery {
    Type = "ChatHistory",
    Limit = 10,
    Skip = 0
};

var firstPage = await MemoryHub.Documents.QueryAsync(query);

// Get next 10 documents
query.Skip = 10;
var secondPage = await MemoryHub.Documents.QueryAsync(query);
```

### Advanced Filtering

#### Metadata Filtering

```csharp
// Query by metadata values
var query = new DocumentQuery {
    Type = "UserData",
    MetadataFilters = new Dictionary<string, object> {
        { "Status", "Active" },
        { "Version", "2.0" },
        { "Region", "US" }
    }
};

var activeUsers = await MemoryHub.Documents.QueryAsync(query);
```

#### Date Range Filtering

```csharp
// Find documents created in the last 24 hours
var query = new DocumentQuery {
    Type = "ActivityLog",
    CreatedAfter = DateTime.UtcNow.AddDays(-1),
    Limit = 50
};

var recentActivity = await MemoryHub.Documents.QueryAsync(query);

// Find documents from a specific time period
var weeklyReport = new DocumentQuery {
    Type = "Report",
    CreatedAfter = DateTime.UtcNow.AddDays(-7),
    CreatedBefore = DateTime.UtcNow.AddDays(-1)
};

var weeklyReports = await MemoryHub.Documents.QueryAsync(weeklyReport);
```

#### Sorting Results

```csharp
// Sort by creation date (newest first)
var query = new DocumentQuery {
    Type = "Message",
    SortBy = "CreatedAt",
    SortDescending = true,
    Limit = 20
};

var recentMessages = await MemoryHub.Documents.QueryAsync(query);

// Sort by update date (oldest first)
var oldestFirst = new DocumentQuery {
    Type = "Task",
    SortBy = "UpdatedAt",
    SortDescending = false
};

var oldestTasks = await MemoryHub.Documents.QueryAsync(oldestFirst);
```

### Complex Query Examples

#### Multi-criteria Search

```csharp
// Complex search combining multiple filters
var query = new DocumentQuery {
    Type = "Order",
    MetadataFilters = new Dictionary<string, object> {
        { "Status", "Pending" },
        { "Priority", "High" }
    },
    CreatedAfter = DateTime.UtcNow.AddHours(-6),
    SortBy = "CreatedAt",
    SortDescending = true,
    Limit = 25
};

var urgentOrders = await MemoryHub.Documents.QueryAsync(query);
```

#### Paginated Results with Processing

```csharp
// Process all documents in batches
var pageSize = 50;
var skip = 0;
var hasMore = true;

while (hasMore) {
    var query = new DocumentQuery {
        Type = "LogEntry",
        Limit = pageSize,
        Skip = skip,
        SortBy = "CreatedAt",
        SortDescending = false
    };

    var batch = await MemoryHub.Documents.QueryAsync(query);
    
    // Process this batch
    foreach (var doc in batch) {
        var logEntry = JsonSerializer.Deserialize<LogEntry>((JsonElement)doc.Content)!;
        ProcessLogEntry(logEntry);
    }

    hasMore = batch.Count == pageSize;
    skip += pageSize;
}
```

#### Search by Multiple Types

```csharp
// Note: DocumentQuery filters by single type, so for multiple types, use separate queries
var userQueries = new[] { "UserSettings", "UserProfile", "UserPreferences" }
    .Select(type => new DocumentQuery { Type = type, Limit = 100 });

var allUserDocs = new List<Document>();
foreach (var query in userQueries) {
    var docs = await MemoryHub.Documents.QueryAsync(query);
    allUserDocs.AddRange(docs);
}
```

### Query Performance Tips

1. **Use Type filtering** - Always specify Type when possible for better performance
2. **Limit results** - Set appropriate Limit values to avoid large result sets
3. **Use pagination** - For large datasets, process results in batches using Skip/Limit
4. **Index metadata** - Commonly queried metadata fields perform better
5. **Date range queries** - Use CreatedAfter/CreatedBefore for time-based filtering
6. **Sort efficiently** - Sorting by CreatedAt or UpdatedAt is typically faster

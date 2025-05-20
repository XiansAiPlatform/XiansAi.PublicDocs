# Accessing Knowledge

The `KnowledgeHub` class provides a centralized way for agents to access and update knowledge in the system. It handles both workflow and non-workflow contexts automatically, ensuring proper execution of knowledge operations.

## Fetching Knowledge

To retrieve knowledge from the system, use the `Fetch` method:

```csharp
var knowledge = await KnowledgeHub.Fetch("knowledgeName");
```

This method will:

1. Return the latest version of the specified knowledge
2. If a tenant-specific version exists, it will be returned
3. If no tenant-specific version exists, it will return the latest global version
4. Returns `null` if no knowledge is found

The method automatically handles:

- Workflow contexts through Temporal activities
- Direct execution in non-workflow contexts

## Updating Knowledge

To update or create new knowledge, use the `Update` method:

```csharp
var success = await KnowledgeHub.Update(
    "knowledgeName",
    "knowledgeType",
    "knowledgeContent"
);
```

Parameters:

- `knowledgeName`: The identifier for the knowledge
- `knowledgeType`: The type/format of the knowledge
- `knowledgeContent`: The actual content of the knowledge

The method:

- Returns `true` if the update was successful
- Throws an exception with details if the update fails
- Handles both workflow and non-workflow contexts automatically

## Usage Examples

```csharp
// Inside a workflow
var knowledge = await KnowledgeHub.Fetch("company policies");

// Outside a workflow
var knowledge = await KnowledgeHub.Fetch("product documentation");
```

```csharp
// Inside a workflow
var success = await KnowledgeHub.Update(
    "company_policies",
    "markdown",
    "# Company Policies\n\n1. Policy one\n2. Policy two"
);

// Outside a workflow
var success = await KnowledgeHub.Update(
    "product_documentation",
    "markdown",
    "# Product Documentation\n\n## Features\n..."
);
```

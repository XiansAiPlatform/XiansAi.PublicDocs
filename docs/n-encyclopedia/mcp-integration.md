# MCP Integration

Model Context Protocol (MCP) servers can be seamlessly integrated into Agent workflows by implementing the `IKernelModifier` interface. This allows agents to leverage external tools and services through standardized MCP connections while maintaining the flexibility of the Semantic Kernel framework.

## Overview

MCP integration in XiansAi agents works by:

1. **Kernel Modification**: Implementing `IKernelModifier` to extend the agent's Semantic Kernel
2. **Tool Registration**: Converting MCP tools to Kernel functions and registering them as plugins
3. **Client Management**: Establishing and managing MCP client connections
4. **Runtime Integration**: Making MCP tools available to the LLM during conversation flow

## Implementation Pattern

### 1. Create an MCP Kernel Modifier

Implement the `IKernelModifier` interface to integrate your MCP server:

```csharp
public class PlayWriteMCP : IKernelModifier
{
    private static List<KernelFunction>? functions;


#pragma warning disable SKEXP0001
    public async Task<Kernel> ModifyKernelAsync(Kernel kernel)
    {
        if (functions == null)
        {
            var client = await GetMCPClientForPlaywright();
            var tools = await client.ListToolsAsync();
            functions = tools.Select(f => f.AsKernelFunction()).ToList();
        }
        Console.WriteLine($"Adding Playwright Functions: {functions.Count}");

        kernel.Plugins.AddFromFunctions("Playwright", functions);

        return kernel;
    }
#pragma warning restore SKEXP0001

    public static async Task<IMcpClient> GetMCPClientForPlaywright()
    {
        var clientTransport = new StdioClientTransport(new StdioClientTransportOptions
        {
            Name = "Playwright",
            Command = "npx",
            Arguments = new List<string>() {
                "-y",
                "@playwright/mcp@latest",
                "--isolated",
                "--headless"
            }
        });

        var client = await McpClientFactory.CreateAsync(clientTransport);
        return client;
    }
}
```

### 2. Register the Kernel Modifier with Your Agent

In your `Program.cs`, add the kernel modifier to your bot:

```csharp
using XiansAi.Flow;
using DotNetEnv;

// Load environment variables
Env.Load();

// Create your agent
var agent = new AgentTeam("A2A Agent Team");

// Create and configure your bot
var webBot = agent.AddAgent<WebBot>();
webBot.AddKernelModifier(new PlayWriteMCP());

await agent.RunAsync();
```

### 3. Use MCP Tools in Your Workflow

The MCP tools become available to your agent's LLM automatically:

```csharp
[Workflow("A2A Agent Team: Web Bot")]
public class WebBot : FlowBase
{
    public WebBot(){
        SystemPrompt = "You are a web bot. You can get the information from the web.";
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }
}
```

## Key Components

### IKernelModifier Interface

The `IKernelModifier` interface requires implementation of:

```csharp
Task<Kernel> ModifyKernelAsync(Kernel kernel)
```

This method receives the agent's Semantic Kernel and returns a modified version with additional capabilities.

### MCP Client Setup

- **Transport**: Use `StdioClientTransport` for process-based MCP servers
- **Configuration**: Pass command and arguments to start the MCP server
- **Client Factory**: Use `McpClientFactory.CreateAsync()` to establish connection

### Tool Registration

- **List Tools**: Call `client.ListToolsAsync()` to get available MCP tools
- **Convert Functions**: Use `.AsKernelFunction()` to convert MCP tools to Kernel functions
- **Add Plugin**: Register functions as a named plugin using `kernel.Plugins.AddFromFunctions()`

## Benefits

- **Standardized Integration**: Leverage existing MCP servers without custom adapters
- **Automatic Tool Discovery**: MCP tools are automatically discovered and made available
- **Kernel Extension**: Seamlessly extends the agent's capabilities through the Semantic Kernel
- **Runtime Flexibility**: Tools are available during LLM processing for dynamic usage

## Best Practices

1. **Static Function Caching**: Cache MCP functions statically to avoid repeated client initialization
2. **Error Handling**: Implement proper error handling for MCP client connections
3. **Configuration Options**: Allow configuration of MCP server parameters (like headless mode)
4. **Resource Management**: Properly manage MCP client lifecycle and connections
5. **Plugin Naming**: Use descriptive names for MCP plugins to aid LLM understanding

This pattern allows agents to seamlessly integrate with any MCP-compatible server, extending their capabilities with external tools while maintaining the familiar agent workflow patterns.

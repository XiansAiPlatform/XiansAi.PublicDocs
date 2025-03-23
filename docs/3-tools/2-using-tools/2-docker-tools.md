# Using Docker Agents

Docker agents are containerized applications that run within a Docker environment. They are deployed as Docker images and can be called through the Xians.ai Activity SDK.

## Prerequisites

- Docker installed and running on your system
- Access to the required Docker images

## Implementation Guide

### 1. Define the Activity Interface

Add the `AgentTool` attribute to your activity interface, specifying the Docker image name and agent type as `AgentToolType.Docker`:

```csharp
[AgentTool("xiansai/web-reader-agent", AgentToolType.Docker)]
public interface IWebReaderActivity
{
    [Activity]
    [Knowledge("How to Read LinkedIn Company Pages")]
    Task<LinkedInCompany?> ReadLinkedInPage(string url);
}
```

The `AgentTool` attribute requires:

- `Name`: The Docker image name (e.g., "xiansai/web-reader-agent")
- `Type`: Set to `AgentToolType.Docker` for Docker tools

### 2. Implement the Activity

Create a class that inherits from `ActivityBase` and implements your interface:

```csharp
public class WebReaderActivity : ActivityBase, IWebReaderActivity
{
    private static readonly string MOUNT_PATH = "/prompt.txt";

    public async Task<LinkedInCompany?> ReadLinkedInPage(string url)
    {
        // Get knowledge from server
        var instructionFilePath = await GetInstructionAsTempFile() 
            ?? throw new Exception("Failed to get knowledge");

        // Create your docker agent
        var readerAgent = GetDockerAgent();
        
        // Set environment variables
        readerAgent.SetEnv("OPENAI_MODEL", Env.GetString("OPENAI_MODEL"));
        readerAgent.SetEnv("OPENAI_API_KEY", Env.GetString("OPENAI_API_KEY"));
        
        // Mount volumes for file access
        readerAgent.SetVolume(instructionFilePath, MOUNT_PATH);

        // Set command line arguments
        var commandLineArguments = new Dictionary<string, string>
        {
            { "source", url },
            { "prompt-file", MOUNT_PATH }
        };

        var result = await readerAgent.DockerRun(commandLineArguments);
        return DeserializeLinkedInCompany(result.Output);
    }
}
```

## Configuration Options

### Environment Variables

Docker agents can be configured using environment variables through the `SetEnv` method:

```csharp
readerAgent.SetEnv("VARIABLE_NAME", "value");
```

### Volume Mounting

To share files between your host and the Docker container:

```csharp
readerAgent.SetVolume(hostPath, containerPath);
```

### Port Mapping

To map ports between your host and the Docker container:

```csharp
readerAgent.SetPort(hostPort, containerPort);
```

### Command Line Arguments

Pass arguments to the Docker container using a dictionary. You can also specify whether to run the container in detached mode and whether to remove the container after execution:

```csharp
var arguments = new Dictionary<string, string>
{
    { "argument-name", "value" }
};
await readerAgent.DockerRun(arguments, detach: false, remove: true);
```

### Health Check

To wait until the Docker container is healthy, use the `UntilHealthy` method with a specified timeout:

```csharp
bool isHealthy = await readerAgent.UntilHealthy(timeoutSeconds: 30);
```

## Best Practices

- Always handle Docker agent exceptions appropriately
- Clean up temporary files after Docker execution
- Use environment variables for sensitive configuration
- Ensure proper access permissions for mounted volumes
- Follow Docker security best practices

# Setting Up an Agent Project

## Prerequisites

Before you begin, ensure you have installed:

- [.NET 9 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)

## Creating Your Project

Xians.ai agents run as standard .NET applications, which can be executed locally or deployed to any server environment. Let's create a new project:

```bash
dotnet new console -n MyNewXiansAiFlow
cd MyNewXiansAiFlow
```

## Installing the SDK

Add the Xians.ai SDK to your project:

```bash
dotnet add package XiansAi.Lib
```

## Understanding the Platform

The XiansAi platform consists of two main components:

### App Server

- Manages your agents and knowledge
- Provides monitoring and visualization
- Handles agent administration

### Flow Server

- Executes your agents
- Manages agent state and persistence
- Handles distributed execution

## Configuration Setup

For better security and maintainability, use a .env file to manage your configuration:
You can use a package like [DotNetEnv](https://github.com/tonerdo/dotnet-env) to load the environment variables from the `.env` file without hardcoding them in your code.

`.env file >`

``` .env
# Platform environment variables

FLOW_SERVER_URL=tenant-xyz.ozqzb.tmprl.cloud:7233
FLOW_SERVER_NAMESPACE=tenant-xyz.ozqzb
FLOW_SERVER_API_KEY=12fsd-0fidsfdsfkjsdfnsdfdskdsbf...

APP_SERVER_URL=https://api.xians.ai
APP_SERVER_API_KEY=12fsd-0fidsfdsfkjsdfnsdfdskdsbf...
```

Install the DotNetEnv package:

```bash
dotnet add package DotNetEnv
```

Update your Program.cs:
`Program.cs >`

```csharp
using XiansAi.Flow;
using DotNetEnv;
// Load the environment variables from the .env file
Env.Load();
var flowRunner = new FlowRunnerService();
```

## Validating Your Setup

Test your configuration:

```csharp
using XiansAi.Flow;

var flowRunner = new FlowRunnerService();
await flowRunner.TestMe(); // temp method to validate the configuration
```

Run the application:

```bash
dotnet run
```

If no errors occur, your setup is complete. Remember to remove the `TestMe()` call after validation.

!!! warning "Troubleshooting"
    Common issues include:
    - Incorrect certificate paths
    - Missing environment variables
    - Invalid credentials

## Next Steps

With your environment configured, you're ready to [create your first Agent](2-first-flow.md).

# Setting Up an Agent Project

## Prerequisites

Before you begin, ensure you have installed:

- [.NET 9 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)

## Creating Your Project

Xians.ai agents run as standard .NET applications, which can be executed locally or deployed to any server environment. Let's create a new project:

```bash
dotnet new console -n <Agent-Name>
cd <Agent-Name>
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

Install the DotNetEnv package:

```bash
dotnet add package DotNetEnv
```

Create a `.env` file in the root of your project with the following content:

``` .env
# Platform environment variables

FLOW_SERVER_URL=
FLOW_SERVER_NAMESPACE=
FLOW_SERVER_API_KEY=

APP_SERVER_URL=
APP_SERVER_API_KEY=
```

Replace the values with values obtained from the `Settings` page in the Xians.ai portal.

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

## Agent Configuration

Your agent needs to be configured with the agent server. This is done by obtaining the required settings from the Xians.ai portal's `Settings` page. You should configure these settings in one of the following 3 ways in your `Program.cs` file:

### Configuration (alternative 1 - hardcode app server url and api key)

In your program.cs file, you can configure the platform by setting the following environment variables:

`Program.cs >`

```csharp
using XiansAi;

// manually set the app server url and api key
PlatformConfig.APP_SERVER_URL = `https://api.xians.ai`;
PlatformConfig.APP_SERVER_API_KEY = "your-api-key";
```

### Configuration (alternative 2 - using .env file)

For better security and maintainability, you may use a .env file to manage your configuration:
You can use a package like [DotNetEnv](https://github.com/tonerdo/dotnet-env) to load the environment variables from the `.env` file without hardcoding them in your code.

Install the DotNetEnv package:

```bash
dotnet add package DotNetEnv
```

Create a `.env` file in the root of your project with the following content:

``` .env
# Platform environment variables
APP_SERVER_URL=https://api.xians.ai
APP_SERVER_API_KEY=your-api-key
```

`Program.cs >`

```csharp
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

```

## Next Steps

- [First Agent](2-first-agent.md)

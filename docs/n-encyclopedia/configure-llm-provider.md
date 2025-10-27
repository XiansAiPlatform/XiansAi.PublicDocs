# Configure LLM Provider

This guide explains how to configure Azure OpenAI as your LLM provider for XiansAi agents and workflows.

## Overview

Azure OpenAI integration in XiansAi provides seamless access to OpenAI models through Azure's managed service. Configuration can be done through:

- **Agent-level configuration**: Set RouterOptions directly in your agent code
- **Server-level configuration**: Use environment variables in XiansAi.Server

Choose the method that best fits your deployment strategy and security requirements.

## Method 1: Agent-Level Configuration

Configure Azure OpenAI directly in your agent code using RouterOptions. This approach provides fine-grained control over the LLM configuration for specific agents.

### Configuration

Set the `RouterOptions` property in your agent's `AgentContext`:

```csharp
AgentContext.RouterOptions = new RouterOptions
{
    ProviderName = "azureopenai",
    ApiKey = "your-azure-openai-api-key",
    ModelName = "gpt-4",
    DeploymentName = "your-deployment-name",
    Endpoint = "https://your-resource.openai.azure.com/"
};
```

### Configuration Parameters

#### ProviderName
- **Type**: `string`
- **Required**: Yes
- **Value**: Must be `"azureopenai"`
- **Description**: Identifies Azure OpenAI as the LLM provider

#### ApiKey
- **Type**: `string`
- **Required**: Yes
- **Description**: Your Azure OpenAI API key. Use secure storage mechanisms like Azure Key Vault or environment variables.

#### ModelName
- **Type**: `string`
- **Required**: Yes
- **Description**: The OpenAI model to use (e.g., `"gpt-4"`, `"gpt-35-turbo"`)

#### DeploymentName
- **Type**: `string`
- **Required**: Yes
- **Description**: The name of your Azure OpenAI deployment

#### Endpoint
- **Type**: `string`
- **Required**: Yes
- **Format**: `https://your-resource.openai.azure.com/`
- **Description**: Your Azure OpenAI resource endpoint URL

### Example Implementation

```csharp
// Configure Azure OpenAI for this agent
AgentContext.RouterOptions = new RouterOptions
{
    ProviderName = "azureopenai",
    ApiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY"),
    ModelName = "gpt-4",
    DeploymentName = "gpt-4-deployment",
    Endpoint = "https://your-resource.openai.azure.com/"
};
```

## Method 2: Server-Level Configuration

Configure Azure OpenAI at the XiansAi.Server level using environment variables. This approach centralizes LLM configuration and applies it globally to all agents.

### Environment Variables

Set the following environment variables in your `XiansAi.Server` configuration:

```bash
# LLM Provider Configuration
LLM_PROVIDER=azureopenai
LLM_API_KEY=your-azure-openai-api-key
LLM_ENDPOINT=https://your-resource.openai.azure.com/
LLM_DEPLOYMENT_NAME=your-deployment-name
LLM_MODEL_NAME=gpt-4
```

### .env File Configuration

For local development, you can configure these settings in a `.env` file within your `XiansAi.Server` project:

```env
# Azure OpenAI Configuration
LLM_PROVIDER=azureopenai
LLM_API_KEY=your-azure-openai-api-key
LLM_ENDPOINT=https://your-resource.openai.azure.com/
LLM_DEPLOYMENT_NAME=your-deployment-name
LLM_MODEL_NAME=gpt-4
```

### Environment Variable Details

#### LLM_PROVIDER
- **Required**: Yes
- **Value**: `"azureopenai"`
- **Description**: Specifies Azure OpenAI as the LLM provider

#### LLM_API_KEY
- **Required**: Yes
- **Description**: Your Azure OpenAI API key

#### LLM_ENDPOINT
- **Required**: Yes
- **Format**: `https://your-resource.openai.azure.com/`
- **Description**: Your Azure OpenAI resource endpoint URL

#### LLM_DEPLOYMENT_NAME
- **Required**: Yes
- **Description**: The name of your Azure OpenAI deployment

#### LLM_MODEL_NAME
- **Required**: Yes
- **Description**: The OpenAI model to use (e.g., `"gpt-4"`, `"gpt-35-turbo"`)

### Applying Configuration

1. **For Development**: Update your `.env` file in the `XiansAi.Server` project
2. **For Production**: Set environment variables through your hosting platform's configuration

```bash
# Example for Docker
docker run -e LLM_PROVIDER=azureopenai \
           -e LLM_API_KEY=your-key \
           -e LLM_ENDPOINT=https://your-resource.openai.azure.com/ \
           -e LLM_DEPLOYMENT_NAME=your-deployment \
           -e LLM_MODEL_NAME=gpt-4 \
           xiansai-server

# Example for Azure Container Apps
az containerapp create \
  --env LLM_PROVIDER=azureopenai \
  --env LLM_API_KEY=your-key \
  --env LLM_ENDPOINT=https://your-resource.openai.azure.com/ \
  --env LLM_DEPLOYMENT_NAME=your-deployment \
  --env LLM_MODEL_NAME=gpt-4 \
  ...
```

## Configuration Priority

When both methods are configured:

- **Agent-level configuration** takes precedence over server-level configuration
- If RouterOptions is set in agent code, it overrides the environment variables for that specific agent
- This allows for per-agent customization while providing sensible defaults at the server level

## Getting Azure OpenAI Credentials

To obtain the necessary credentials:

1. **Create an Azure OpenAI resource** in the Azure Portal
2. **Create a deployment** for your desired model (e.g., GPT-4)
3. **Note your endpoint**: Found in the Azure OpenAI resource overview
4. **Get your API key**: Available in the "Keys and Endpoint" section

## Next Steps

- Learn about [retry policies](retry-policy.md) for LLM operations
- Explore [LLM completion options](llm-completion.md)
- Review [deployment options](deployment-options.md) for production


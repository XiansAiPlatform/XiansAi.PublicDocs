# Using Custom Agents

???+ warning

    This page content is outdated. We are working on updating it. Will be updated by 25th May 2025.

Custom agents are fully custom implementations in your Activity classes. They are not distributed as NuGet packages, nor are they containerized. They are simply Activity classes with your own custom logic that are registered in your workflow configuration. It is not recommended to use this unless you have a very specific use case that cannot be met by the other agent types.

## Implementation Guide

### 1. Define the Activity Interface

Add the `AgentTool` attribute to your activity interface to enable proper integration with the Xians.ai Portal:

```csharp
[AgentTool("<Give a name to your tool>", AgentToolType.Custom)]
public interface IUrlSearchActivity
{
    [Activity]
    Task<string?> FindLinkedInUrl(string companyName);  
}
```

The `AgentTool` attribute is not required for the activity runtime, but it is required for the Portal to know that this activity is a custom tool.

### 2. Implement the Activity

Implement the activity interface in a class:

```csharp
public class UrlSearchActivity : ActivityBase, IUrlSearchActivity
{
    public async Task<string?> FindLinkedInUrl(string companyName)
    {
        // Your custom logic here
    }
}
```

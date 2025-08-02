# Inter-Bot Communication with ForwardMessage

## Overview

The `ForwardMessage` feature enables seamless communication between different bots within a multi-agent system. This functionality is crucial for implementing complex workflows where specialized bots need to collaborate to accomplish tasks that require diverse expertise.

## Example Scenario: HR Management System

Throughout this documentation, we'll use a comprehensive HR Management System to illustrate inter-bot communication. This system consists of:

**System Components:**
- **Router Bot**: Central coordinator that analyzes user queries and routes them to appropriate specialized bots
- **HireBot**: Expert recruiter handling job openings, applications, interviews, and onboarding processes
- **PayBot**: Payroll specialist managing salary information, deductions, reimbursements, and tax queries  
- **CareBot**: Employee well-being assistant handling grievances, benefits, and care-related concerns

**Example Query:** *"I heard there's a new position in my department. What's the salary range, and what benefits are included? Also, I'm interested in applying - what's the process?"*

This single query requires coordination between all three specialized bots to provide a comprehensive response.

## Why Inter-Bot Communication Matters

**Separation of Concerns**: Each bot focuses on its specific domain expertise while leveraging capabilities of other bots when needed.

**Scalability**: New bots can be added without modifying existing bots, promoting modular architecture.

**Workflow Orchestration**: Complex tasks can be broken down and distributed across multiple specialized bots.

## Router Bot Architecture

The Router Bot pattern implements a centralized communication hub:

```
                    User Query
                         ↓
                    Router Bot
                   (Coordinator)
                         ↓
              ┌───────────┼───────────┐
              ↓          ↓          ↓
         HireBot      PayBot      CareBot
        (Recruit)    (Payroll)   (Wellbeing)
              ↓          ↓          ↓
              └───────────┼───────────┘
                         ↓
                   Router Bot
               (Synthesizes Response)
                         ↓
                  Complete Answer
```

## Implementation

### System Setup (Program.cs)

```csharp
using XiansAi.Flow;
using DotNetEnv;

Env.Load();

var agent = new Agent("HR Agent");

// Router Bot - Central communication hub
var RouteBot = agent.AddBot<RouterBot>();
RouteBot.AddCapabilities<AskBotCapabilitiesForRouterBot>();

// Specialized Bots
var CareBot = agent.AddBot<CareBot>();
var HireBot = agent.AddBot<HireBot>();
var PayBot = agent.AddBot<PayBot>();

await agent.RunAsync();
```

### Router Bot (RouterBot.cs)

```csharp
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("HR Agent:Router Bot")]
public class RouterBot : RouterFlowBase
{    
    [WorkflowRun]
    public async Task Run()
    {
        var sysPrompt = @"You are the Router Bot, a supervisor agent responsible for coordinating with specialized bots to assist employees effectively. Your task is to analyze each user query, determine the appropriate specialized bot(s) to handle the request, and synthesize a comprehensive response.

You coordinate with:
- HireBot: Handles hiring process, job openings, applications, interviews, and onboarding
- PayBot: Manages payroll, salary components, deductions, and tax-related queries
- CareBot: Handles employee grievances, well-being concerns, and benefits

Process:
1. Analyze user queries to determine their nature
2. Forward queries to appropriate bot(s) based on expertise
3. Combine responses into one clear, complete reply
4. Always respond as a unified HR assistant";

        await InitConversation(sysPrompt);
    }
}
```

### Router Bot Capabilities

```csharp
using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;

public class AskBotCapabilitiesForRouterBot
{
    private readonly MessageThread _messageThread;

    public AskBotCapabilitiesForRouterBot(MessageThread messageThread)
    {
        _messageThread = messageThread;
    }

    [Capability("Ask from Care Bot")]
    [Parameter("routerBotMessage", "The message crafted by the Router Bot for the target bot")]
    [Returns("Response from Care Bot")]
    public async Task<string> AskFromCareBot(string routerBotMessage)
    {
        return await _messageThread.ForwardMessage(typeof(CareBot), routerBotMessage);
    }

    [Capability("Ask from Hire Bot")]
    [Parameter("routerBotMessage", "The message crafted by the Router Bot for the target bot")]
    [Returns("Response from Hire Bot")]
    public async Task<string> AskFromHireBot(string routerBotMessage)
    {
        return await _messageThread.ForwardMessage(typeof(HireBot), routerBotMessage);
    }

    [Capability("Ask from Pay Bot")]
    [Parameter("routerBotMessage", "The message crafted by the Router Bot for the target bot")]
    [Returns("Response from Pay Bot")]
    public async Task<string> AskFromPayBot(string routerBotMessage)
    {
        return await _messageThread.ForwardMessage(typeof(PayBot), routerBotMessage);
    }
}
```

## How ForwardMessage Works

### Core Mechanism
```csharp
var response = await _messageThread.ForwardMessage(typeof(TargetBot), message);
```

**Parameters:**
- `typeof(TargetBot)`: The type of the destination bot
- `message`: The message content to be forwarded

**Process Flow:**
1. Router Bot receives user request
2. Analyzes request and determines appropriate specialized bot
3. Crafts specific message for target bot
4. `ForwardMessage` sends message to target bot
5. Target bot processes message using its specialized capabilities
6. Response returns through message thread
7. Router Bot synthesizes final response


**Best Practices:**
- Use descriptive parameter names
- Explain parameter content and format
- Document return value expectations
- Include context and requirements

## Communication Patterns

### 1. **Sequential Processing**
```csharp
[Capability("Process Employee Onboarding")]
[Parameter("employeeData", "New employee information")]
[Returns("Complete onboarding status")]
public async Task<string> ProcessOnboarding(string employeeData)
{
    var hireResult = await AskFromHireBot($"Create employee: {employeeData}");
    var payResult = await AskFromPayBot($"Setup payroll for: {hireResult}");
    var careResult = await AskFromCareBot($"Schedule orientation for: {hireResult}");
    
    return $"Onboarding completed:\n{hireResult}\n{payResult}\n{careResult}";
}
```

### 2. **Parallel Processing (Broadcast)**
```csharp
[Capability("Broadcast to All Bots")]
[Parameter("query", "Query to send to all bots")]
[Returns("Combined responses from all bots")]
public async Task<string> BroadcastQuery(string query)
{
    var tasks = new[]
    {
        _messageThread.ForwardMessage(typeof(HireBot), query),
        _messageThread.ForwardMessage(typeof(PayBot), query),
        _messageThread.ForwardMessage(typeof(CareBot), query)
    };
    
    var responses = await Task.WhenAll(tasks);
    return string.Join("\n---\n", responses);
}
```

### 3. **Conditional Routing**
```csharp
[Capability("Smart Route Query")]
[Parameter("query", "User query to route")]
[Returns("Response from appropriate bot")]
public async Task<string> SmartRoute(string query)
{
    if (query.Contains("salary") || query.Contains("pay"))
        return await AskFromPayBot(query);
    else if (query.Contains("hiring") || query.Contains("recruitment"))
        return await AskFromHireBot(query);
    else if (query.Contains("benefits") || query.Contains("care"))
        return await AskFromCareBot(query);
    else
        return "Please specify if your query is about pay, hiring, or employee care.";
}
```

### 4. **Pipeline Processing**
```csharp
[Capability("Pipeline Processing")]
[Parameter("inputData", "Raw data to process through pipeline")]
[Returns("Fully processed result")]
public async Task<string> PipelineProcess(string inputData)
{
    var stage1 = await _messageThread.ForwardMessage(typeof(HireBot), 
        $"Validate and prepare: {inputData}");
    var stage2 = await _messageThread.ForwardMessage(typeof(PayBot), 
        $"Process data: {stage1}");
    var stage3 = await _messageThread.ForwardMessage(typeof(CareBot), 
        $"Format final output: {stage2}");
    
    return stage3;
}
```

### 5. **Event-Driven Communication**
```csharp
[Capability("Handle Events")]
[Parameter("eventType", "Type of event (NewEmployee, SalaryReview, etc.)")]
[Parameter("eventData", "Event-specific data")]
[Returns("Event processing results")]
public async Task<string> HandleEvent(string eventType, string eventData)
{
    var responses = new List<string>();
    
    switch (eventType)
    {
        case "NewEmployee":
            responses.Add(await _messageThread.ForwardMessage(typeof(HireBot), 
                $"Process new employee: {eventData}"));
            responses.Add(await _messageThread.ForwardMessage(typeof(PayBot), 
                $"Setup payroll for: {eventData}"));
            responses.Add(await _messageThread.ForwardMessage(typeof(CareBot), 
                $"Schedule orientation for: {eventData}"));
            break;
            
        case "SalaryReview":
            responses.Add(await _messageThread.ForwardMessage(typeof(PayBot), 
                $"Review salary: {eventData}"));
            responses.Add(await _messageThread.ForwardMessage(typeof(CareBot), 
                $"Schedule review meeting: {eventData}"));
            break;
    }
    
    return string.Join("\n\n", responses);
}
```

## Best Practices

### Message Crafting
- Create specific, contextual messages for each target bot
- Include relevant context and parameters
- Use clear, unambiguous language

### Error Handling
```csharp
public async Task<string> SafeForwardMessage(Type botType, string message)
{
    try
    {
        var response = await _messageThread.ForwardMessage(botType, message);
        return response ?? "No response received";
    }
    catch (Exception ex)
    {
        return $"Error communicating with bot: {ex.Message}";
    }
}
```

### Configuration
Ensure proper bot registration and capability assignment:
```csharp
var agent = new Agent("Your Agent Name");
var routerBot = agent.AddBot<RouterBot>();
routerBot.AddCapabilities<InterBotCommunicationCapabilities>();
```

## Conclusion

The ForwardMessage feature enables building sophisticated multi-agent systems with:

- **Modular Architecture**: Each bot maintains specialized focus
- **Scalable Communication**: Easy to add new bots and communication paths
- **Complex Workflow Support**: Orchestrate multi-step processes across bots
- **Maintainable Code**: Clear separation of concerns and responsibilities

This pattern is essential for building robust, extensible AI agent systems that handle complex, multi-domain tasks efficiently.
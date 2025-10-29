# Limiting Router Tokens

## Overview

The XiansAi router automatically manages chat history token limits to prevent `context_length_exceeded` errors. This is especially important when using functions that return large content (like web scraping) or when having long conversations.

## Configuration

Configure token limits in your Flow's constructor by setting `RouterOptions` properties:

```csharp
[Workflow("My Bot")]
public class MyBot : FlowBase
{
    public MyBot()
    {
        SystemPrompt = "You are a helpful assistant.";
        
        // Configure token limits
        RouterOptions.TokenLimit = 80000;                    // Trigger reduction at 80k tokens
        RouterOptions.TargetTokenCount = 50000;              // Reduce to 50k tokens
        RouterOptions.MaxTokensPerFunctionResult = 10000;    // Limit large function results
    }
}
```

## Token Limit Properties

| Property | Default | Description |
|----------|---------|-------------|
| `TokenLimit` | 80,000 | Maximum tokens before chat history reduction triggers. Set to 0 to disable. |
| `TargetTokenCount` | 50,000 | Target token count after reduction. Should be significantly lower than TokenLimit. |
| `MaxTokensPerFunctionResult` | 10,000 | Maximum tokens allowed for a single function result (e.g., web scraping). |

## Model-Specific Recommendations

### GPT-4 (128k context)

```csharp
RouterOptions.TokenLimit = 100000;           // Conservative limit
RouterOptions.TargetTokenCount = 60000;      // Leave room for responses
RouterOptions.MaxTokensPerFunctionResult = 15000;
```

### GPT-3.5 Turbo (16k context)

```csharp
RouterOptions.TokenLimit = 12000;            // Stay well below limit
RouterOptions.TargetTokenCount = 8000;       // Conservative target
RouterOptions.MaxTokensPerFunctionResult = 4000;
```

### GPT-3.5 Turbo (4k context)

```csharp
RouterOptions.TokenLimit = 3000;             // Very conservative
RouterOptions.TargetTokenCount = 2000;       // Leave room for system prompt
RouterOptions.MaxTokensPerFunctionResult = 1000;
```

## How It Works

The router uses a two-stage reduction strategy:

1. **Function Result Truncation**: Large function results (like web scraping) are truncated first
2. **Message History Reduction**: If still over limit, older messages are removed while preserving:
   - System messages
   - Recent conversation context
   - Function call/result pairs

## Common Scenarios

### Web Scraping Bots

When using capabilities that scrape web content:

```csharp
public MyWebBot()
{
    RouterOptions.TokenLimit = 80000;
    RouterOptions.MaxTokensPerFunctionResult = 8000;  // Limit scraped content
}
```

### Long Conversation Bots

For bots with extensive chat history:

```csharp
public MyChatBot()
{
    RouterOptions.TokenLimit = 60000;
    RouterOptions.TargetTokenCount = 30000;           // Aggressive reduction
    RouterOptions.HistorySizeToFetch = 100;           // Fetch more history
}
```

### High-Precision Bots

For bots requiring maximum context:

```csharp
public MyAnalysisBot()
{
    RouterOptions.TokenLimit = 110000;               // Use more context
    RouterOptions.TargetTokenCount = 80000;          // Less aggressive reduction
}
```

## Troubleshooting

### Still Getting Token Limit Errors?

1. **Lower TokenLimit**: Try reducing by 20,000 tokens
2. **Reduce Function Results**: Lower `MaxTokensPerFunctionResult`
3. **Check System Prompt**: Very long system prompts consume tokens
4. **Monitor Logs**: Look for reduction warnings in application logs

### Performance Issues?

1. **Increase TargetTokenCount**: Reduce frequency of reductions
2. **Optimize Functions**: Return smaller, more focused results
3. **Disable if Not Needed**: Set `TokenLimit = 0` for simple bots

## Example: Complete Configuration

```csharp
[Workflow("Percy: Web Reporter")]
public class WebReporterBot : FlowBase
{
    public WebReporterBot()
    {
        SystemPrompt = "You are a web content reporter with scraping capabilities.";
        
        // Token management for web scraping
        RouterOptions.TokenLimit = 85000;                    // Conservative for GPT-4
        RouterOptions.TargetTokenCount = 55000;              // Leave room for analysis
        RouterOptions.MaxTokensPerFunctionResult = 12000;    // Allow larger scraped content
        RouterOptions.HistorySizeToFetch = 20;               // Moderate history
        
        // Other settings
        RouterOptions.MaxTokens = 4096;                      // Response limit
        RouterOptions.Temperature = 0.3;                     // Focused responses
    }
}
```

## Notes

- Token estimation uses ~4 characters per token heuristic
- System messages are always preserved during reduction
- Function call/result pairs are kept together when possible
- Reduction triggers before sending to the AI model, preventing errors
- All reductions are logged for debugging purposes

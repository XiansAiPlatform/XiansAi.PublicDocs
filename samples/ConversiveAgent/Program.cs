using XiansAi.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;

Env.Load();

// Define the flow
var flowInfo = new FlowInfo<ConversiveAgentFlow>();

// Cancellation token cancelled on ctrl+c
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) => { tokenSource.Cancel(); eventArgs.Cancel = true; };



try
{
    var options = new FlowRunnerOptions
    {
        LoggerFactory = LoggerFactory.Create(builder =>
        builder
            .SetMinimumLevel(LogLevel.Debug)
            .AddConsole())
    };
    // Run the flow 
    await new FlowRunnerService(options).RunFlowAsync(flowInfo, tokenSource.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}

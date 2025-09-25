using Agentri.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;

// Env config via DotNetEnv
Env.Load(); // OR Manually set the environment variables

FlowRunnerService.SetLoggerFactory(LoggerFactory.Create(builder => 
    builder
        .SetMinimumLevel(LogLevel.Debug)
        .AddConsole()
));

// Cancellation token cancelled on ctrl+c
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>{ tokenSource.Cancel(); eventArgs.Cancel = true;};

// Define the flow
var flowInfo = new FlowInfo<PoetFlow>();
flowInfo.AddActivities<IComposerActivity>(new ComposerActivity());

try
{
    var runner = new FlowRunnerService();
    // Run the flow by passing the flow info to the FlowRunnerService
    await runner.RunFlowAsync(flowInfo, tokenSource.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}
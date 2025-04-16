using XiansAi.Flow;
using DotNetEnv;

Env.Load();

// Define the flow
var flowInfo = new FlowInfo<ConversiveAgentFlow>();

// Cancellation token cancelled on ctrl+c
var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>{ tokenSource.Cancel(); eventArgs.Cancel = true;};

try
{
    // Run the flow by passing the flow info to the FlowRunnerService
    await new FlowRunnerService().RunFlowAsync(flowInfo, tokenSource.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}

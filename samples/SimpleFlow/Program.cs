using Agentri.Flow;
using DotNetEnv;

// Env config via DotNetEnv
Env.Load(); // OR Manually set the environment variables

// Define the flow
var flowInfo = new FlowInfo<SimpleFlow>();

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
using XiansAi.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;

Env.Load();

var agentInfo = new AgentInfo
{
    Name = "Conversive Agent",
    Description = "A conversational agent that can help with broadband issues.",
};

// Define the flow
var conversiveFlowInfo = new FlowInfo<ConversiveAgentFlow>();
var semanticFlowInfo = new FlowInfo<SemanticAgentFlow>();

try
{
    // Run the flow 
    Task conversiveFlow = new FlowRunnerService().RunFlowAsync(conversiveFlowInfo);
    Task semanticFlow = new FlowRunnerService().RunFlowAsync(semanticFlowInfo);

    await Task.WhenAll(conversiveFlow, semanticFlow);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}

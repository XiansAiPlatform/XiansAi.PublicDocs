using Agentri.Flow;
using DotNetEnv;
using Microsoft.Extensions.Logging;

Env.Load();

var agentInfo = new AgentInfo
{
    Name = "Customer Support Agent",
    Description = "A conversational agent that can help customers on broadband connection services.",
};

// Define the flow
var newConnectionFlowInfo = new FlowInfo<NewConnectionFlow>(agentInfo);
var supportTicketFlowInfo = new FlowInfo<SupportTicketFlow>(agentInfo);
var conversingFlowInfo = new FlowInfo<ConversingFlow>(agentInfo);

// Run the flow 
Task newConnectionFlow = new FlowRunnerService().RunFlowAsync(newConnectionFlowInfo);
Task supportTicketFlow = new FlowRunnerService().RunFlowAsync(supportTicketFlowInfo);
Task conversingFlow = new FlowRunnerService().RunFlowAsync(conversingFlowInfo);

try
{
    await Task.WhenAll(newConnectionFlow, supportTicketFlow, conversingFlow);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Application shutdown requested. Shutting down gracefully...");
}

using Temporalio.Workflows;
using Agentri.Flow;

[Workflow("My News Reader 2:News Bot")]
public class NewsReaderBot : FlowBase
{

    [WorkflowRun]
    public async Task Run()
    {
        string sysPrompt = "You are a news reader bot.";
        await InitConversation(sysPrompt);
    }
}
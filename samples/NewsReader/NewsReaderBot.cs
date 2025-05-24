using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("My News Reader 2:News Bot")]
public class NewsReaderBot : FlowBase
{

    [WorkflowRun]
    public async Task Run()
    {
        string sysPrompt = "You are a news reader bot.";
        await InitUserConversation(sysPrompt);
    }
}
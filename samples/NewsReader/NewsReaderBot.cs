using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("News Reader Bot - hya")]
public class NewsReaderBot : FlowBase
{

    [WorkflowRun]
    public async Task Run()
    {
        string sysPrompt = "You are a news reader bot.";
        await InitUserConversation(sysPrompt);
    }
}
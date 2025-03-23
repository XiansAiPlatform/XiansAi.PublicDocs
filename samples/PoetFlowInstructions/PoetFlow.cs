using Temporalio.Workflows;
using Temporalio.Activities;
using XiansAi.Flow;
using XiansAi.Activity;
[Workflow("Poet Flow")]
public class PoetFlow: FlowBase
{
    [WorkflowRun]
    public async Task<string?> Run(string keywords)
    {
        var geminiActivity = new ComposerActivity();
        var poem = await RunActivityAsync(
                    (IComposerActivity c) => c.GeneratePoemAsync(keywords));
        return poem;
    }
}

public interface IComposerActivity
{
    [Activity]
    [Knowledge("How to Generate a Poem")]
    Task<string?> GeneratePoemAsync(string keywords);
}


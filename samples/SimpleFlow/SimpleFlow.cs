using Temporalio.Workflows;
using Agentri.Flow;

[Workflow("Simple Flow 49")]
public class SimpleFlow: FlowBase
{
    [WorkflowRun]
    public async Task<string> Run(string name)
    {
        var output = "Hello";
        await DelayAsync(TimeSpan.FromSeconds(10));
        output += " World " + name;
        return await Task.FromResult(output + $" {name}!");
    }
}
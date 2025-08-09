# Developing a Business Process Flow (Deterministic)

## What is a Deterministic Flow?

Deterministic flows follow a predefined path that executes the same way each time. With deterministic process orchestration, what happens during each process execution is determined ahead of time, usually through a business process model. Given the same inputs, configuration, environment, and conditions, the process will always follow the same sequence of steps and yield the same results.

Deterministic process orchestration offers several benefits:

- Predictability and reproducibility, making processes easy to audit
- Visual process models that help teams explain and collaborate on process design
- Self-documenting nature when using BPMN - what you see is exactly what will be executed
- Relatively low execution costs and typically fast performance

However, deterministic flows also present challenges:

- Require thorough understanding and agreement on business processes, which many organizations struggle with
- Process model creation takes time and requires testing
- Difficult to deliver highly personalized experiences without maintaining many model variations

If the business process is well-known and requires consistent, repeatable results, then a deterministic flow is an excellent choice.

## Intelligence at Activity Level

While maintaining the deterministic nature of the overall process flow, it's possible to incorporate AI intelligence at the individual activity level. This hybrid approach leverages the predictability of deterministic processes while enhancing specific activities with the reasoning capabilities of Large Language Models (LLMs).

For example:

- **Document processing**: An activity that needs to understand and extract information from emails, invoices, or contracts can use LLMs to intelligently parse unstructured content, even when formats vary.
- **Data analysis**: Activities requiring classification, summarization, or sentiment analysis can leverage LLMs to provide nuanced interpretations of text data.
- **Decision support**: When processes involve evaluating complex information (like candidate CVs or customer feedback), LLMs can assist by providing reasoned analysis while keeping the process flow itself deterministic.
- **Content enrichment**: Activities that need to enhance or transform content (such as product descriptions or knowledge base articles) can use LLMs to generate improvements.

The key advantage of this approach is that you retain the reliability, auditability, and predictable execution of deterministic workflows while gaining the cognitive capabilities of AI at critical points in your process. Process activities become intelligent nodes within your deterministic framework, capable of handling unstructured data and complex reasoning tasks without sacrificing the overall control and predictability of your business process.

## Creating a Business Process Flow

Update your Program.cs:
`Program.cs >`

```csharp
using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("News Reader Agent");

var flow = agent.AddFlow<NewsReportFlow>();
flow.AddActivities<Activities>(new Activities());

await agent.RunAsync();
```

## Add the new business process flow

`NewsReportFlow.cs>`

```csharp
using Microsoft.Extensions.Logging;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("News Agent:News Report Flow")]
public class NewsReportFlow : FlowBase
{
  private int count = 0;

  [WorkflowRun]
  public async Task<string> Run(string newsUrl, string recipientEmail)
  {
    count++;
    Workflow.ExecuteActivityAsync(
      (Activities a) => a.WriteToFile($"Hello, world {count}"),
      new() { ScheduleToCloseTimeout = TimeSpan.FromMinutes(1) });
  }
}


public class Activities
{
    [Activity]
    public void WriteToFile(string message)
    {
        Console.WriteLine(message);
        File.WriteAllText("user-request.txt", message);
    }
}
```

Notes:

- The Xians Flows are Temporal workflows. You can see more about the Temporal.io workflow engine [here](https://docs.temporal.io). You can simply use all the Temporal workflow features in your flows.
- More details about the Developing Business Process Flows with Xians engine can be found [here](../4-automation/0-introduction.md).

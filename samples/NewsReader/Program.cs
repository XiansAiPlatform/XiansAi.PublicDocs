using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agentInfo = new AgentInfo("News Reader Agent - hya");

// create a new runner for the conversation bot
var newsReaderBot = new Runner<NewsReaderBot>(agentInfo);
newsReaderBot.AddBotCapabilities(typeof(Capabilities));

// Create a new runner for the news report flow
var newsReportFlow = new Runner<NewsReportFlow>(agentInfo);
newsReportFlow.AddFlowActivities<INewsActivities, NewsActivities>();

// Wait for both bots to finish
await Task.WhenAll(
    newsReportFlow.RunAsync(),
    newsReaderBot.RunAsync()
);

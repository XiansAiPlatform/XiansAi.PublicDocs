using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agentInfo = new AgentInfo("News Reader Agent");

// create a new runner for the agent
var newsReaderBot = new Runner<NewsReaderBot>(agentInfo);
await newsReaderBot.RunAsync();

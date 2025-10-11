using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new AgentTeam("My News Reader 2");

var flow = agent.AddAgent<NewsReportFlow>();
flow.AddActivities<INewsActivities, NewsActivities>();

var bot = agent.AddAgent<NewsReaderBot>();
bot.AddCapabilities<CapabilitiesInstance>();

await agent.RunAsync();

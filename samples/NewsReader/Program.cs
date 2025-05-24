using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("My News Reader 2");

var flow = agent.AddFlow<NewsReportFlow>();
flow.AddActivities<INewsActivities, NewsActivities>();

var bot = agent.AddBot<NewsReaderBot>();
bot.AddCapabilities<CapabilitiesInstance>();

await agent.RunAsync();

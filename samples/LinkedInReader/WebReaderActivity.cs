using Agentri.Activity;
using Agentri.Agent.GoogleSearch;
using DotNetEnv;
using MongoDB.Bson;
using System.Text.Json;

public class WebReaderActivity: ActivityBase, IWebReaderActivity
{
    private static readonly string MOUNT_PATH = "/prompt.txt";

    public async Task<LinkedInCompany?> ReadLinkedInPage(string url)
    {
        // get knowledge from server
        var instructionFilePath = await GetInstructionAsTempFile() ?? throw new Exception("Failed to get knowledge");

        // Create your docker agent
        var readerAgent = GetDockerAgent();
        // set env variables
        readerAgent.SetEnv("OPENAI_MODEL", Env.GetString("OPENAI_MODEL"));
        readerAgent.SetEnv("OPENAI_API_KEY", Env.GetString("OPENAI_API_KEY"));
        // set volume so that docker can read the prompt file
        readerAgent.SetVolume(instructionFilePath, MOUNT_PATH);

        // set command line arguments
        var commandLineArguments = new Dictionary<string, string>
        {
            { "source", url },
            { "prompt-file", MOUNT_PATH }
        };
        var result = await readerAgent.DockerRun(commandLineArguments);
        return DeserializeLinkedInCompany(result.Output);
    }

    private static LinkedInCompany? DeserializeLinkedInCompany(string? json)
    {
        if (json == null)
        {
            return null;
        }
        return JsonSerializer.Deserialize<LinkedInCompany>(json);
    }

}
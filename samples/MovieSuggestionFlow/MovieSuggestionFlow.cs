using Temporalio.Workflows;
using Temporalio.Activities;
using Agentri.Flow;

[Workflow("Movie Suggestion Flow")]
public class MovieSuggestionFlow: FlowBase
{
    [WorkflowRun]
    public async Task<object[]> Run(string commaSeparatedUserIds)
    {
        // Initialize a list to store the results
        var result = new List<object>();

        // Split the comma separated user ids into an array of integers
        var userIds = commaSeparatedUserIds.Split(',').Select(int.Parse).ToArray();

        // Iterate over each user id
        foreach (var id in userIds)
        {
            // Step 1: Fetch user details from JSONPlaceholder
            var userName = await RunActivityAsync(
                    (IUserActivity a) => a.GetUserNameAsync(id));
        
            // Step 2: Get an activity suggestion from Bored API
            var movie = await RunActivityAsync(
                    (IMovieActivity a) => a.GetMovieAsync(userName));

            // Add the result to the list
            result.Add(new { User = userName, Movie = movie });
        }

        // Return the results as an array
        return result.ToArray();
    }
}

public interface IUserActivity
{
    [Activity]
    Task<string?> GetUserNameAsync(int id);
}


public interface IMovieActivity
{
    [Activity]
    Task<string?> GetMovieAsync(string? userName);
}
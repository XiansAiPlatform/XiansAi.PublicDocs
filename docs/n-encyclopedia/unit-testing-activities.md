# Unit Testing Activities

## Overview

This guide explains how to effectively unit test activities using local knowledge for development.

## Setting Up Local Knowledge

During development, it's often more efficient to use local knowledge rather than fetching it from Xians portal. This approach speeds up development and testing cycles. Here's how to set it up:

1. Create a local knowledge folder (e.g., `knowledge`)
2. Store your knowledge files in this folder
3. Set the environment variable in your tests:

```csharp
Environment.SetEnvironmentVariable("LOCAL_INSTRUCTIONS_FOLDER", "/path/to/knowledge");
```

## File Matching

The file matching is done by the name of the file **excluding the file extension**.

Example:

- `ExampleProject.Knowledge/SalesMeeting.md` will match instructions named `SalesMeeting`
- `ExampleProject.Knowledge/Sales Meeting.md` will match instructions named `Sales Meeting`
- `ExampleProject.Knowledge/My Sales Meeting.txt` will match instructions named `My Sales Meeting`

## Test Structure Example

Here's a typical structure for activity unit tests where we use local knowledge folder:

Knowledge folder in the root of the test project: `ExampleProject.Knowledge`

```csharp
public class ExampleActivityTests
{
    private readonly ExampleActivity _activity;
    private readonly string _projectRoot;

    public ExampleActivityTests()
    {
        // Setup project root path
        _projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", ".."));

        // Load environment variables
        DotNetEnv.Env.Load(Path.Combine(_projectRoot, "..", ".env"));

        // *** Configure local knowledge ***
        var knowledgeFolder = Path.Combine(_projectRoot, "..", "ExampleProject.Knowledge");
        Environment.SetEnvironmentVariable("LOCAL_INSTRUCTIONS_FOLDER", knowledgeFolder);

        // Initialize activity
        _activity = new ExampleActivity();
    }

    [Fact]
    public async Task ActivityMethod_Scenario_ExpectedBehavior()
    {
        // Arrange
        var input = new InputModel
        {
            Property1 = "value1",
            Property2 = "value2"
        };

        // Act
        var result = await _activity.MethodUnderTest(input);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(expectedValue, result.Output);
    }
}
```

## Running Tests

- Use test filters to run specific tests:

   ```bash
   dotnet test --filter "FullyQualifiedName=Namespace.TestClass.TestMethod"
   ```

- OR run all tests in the test class:

   ```bash
   dotnet test
   ```

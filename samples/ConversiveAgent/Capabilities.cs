using XiansAi.Router.Plugins;

namespace ConversiveAgent;
public static class Capabilities 
{

    [Capability("Create a new broadband connection.")]
    [Parameter("customerName", "Customer's full name")]
    [Parameter("customerEmail", "Customer Email")]
    [Parameter("address", "Installation address")]
    [Parameter("planType", "Preferred plan type")]
    [Parameter("contactNumber", "Contact number")]
    [Parameter("preferredDate", "Preferred installation date")]
    [Returns("status message")]
    public static async Task<string> StartNewBroadbandConnectionWorkflow(string customerName, string customerEmail, string address, string planType, string contactNumber, DateTime preferredDate)
    {
        Console.WriteLine("Starting New Broadband Connection Workflow..., date: " + preferredDate.ToString("yyyy/MM/dd"));

        var inputs = new object[] { customerName, customerEmail, address, planType, contactNumber, preferredDate };
        Console.WriteLine(string.Join(", ", inputs));
        //await new CapabilityBase().StartWorkflowAsync("New Broadband Connection Workflow", "New Broadband Connection Workflow", inputs);
        await Task.CompletedTask;
        return "New broadband connection request initiated.";
    }

    [Capability("Start a billing issue resolution workflow.")]
    [Parameter("customerEmail", "Customer Email")]
    [Parameter("billMonth", "Billing month")]
    [Parameter("issueType", "Issue type (e.g., overcharge, missing discount)")]
    [Parameter("notes", "Additional notes")]
    [Returns("status message")]
    public static async Task<string> StartBillingIssueWorkflow(string customerEmail, string billMonth, string issueType, string notes)
    {
        Console.WriteLine("Starting Billing Issue Workflow...");
        var inputs = new string[] { customerEmail, billMonth, issueType, notes };

        //await new CapabilityBase().StartWorkflowAsync("Billing Workflow", "Billing Workflow", inputs);
        await Task.CompletedTask;
        return "New Billing issue ticket created.";
    }

    [Capability("Start technical support troubleshooting workflow.")]
    [Parameter("customerEmail", "Customer Email")]
    [Parameter("deviceType", "Device type: Modem, Router, Sim")]
    [Parameter("symptoms", "Issue symptoms")]
    [Returns("status message")]
    public static async Task<string> StartTechnicalSupportWorkflow(string customerEmail, string deviceType, string symptoms)
    {
        Console.WriteLine("Starting Technical Support Workflow...");
        var inputs = new string[] { customerEmail, deviceType, symptoms };

        //await new CapabilityBase().StartWorkflowAsync("Maintainence Workflow", "Maintainence Workflow", inputs);
        await Task.CompletedTask;

        return "A new Technical support ticket created.";
    }

    [Capability("Get available broadband plans.")]
    [Parameter("planType", "Plan type")]
    [Returns("status message")]
    public static Task<string[]> GetAvailableBroadbandPlans(string planType)
    {
        Console.WriteLine("Fetching available broadband plans...");

        // Mock data for broadband plans
        var plans = new string[]
        {
            "Basic Plan: 50 Mbps, $30/month",
            "Standard Plan: 100 Mbps, $50/month",
            "Premium Plan: 200 Mbps, $70/month",
            "Ultimate Plan: 500 Mbps, $100/month"
        };

        return Task.FromResult(plans);
    }
}
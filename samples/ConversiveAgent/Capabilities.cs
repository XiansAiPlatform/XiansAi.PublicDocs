using Microsoft.Extensions.Logging;
using XiansAi.Messaging;
using XiansAi.Router.Plugins;

namespace ConversiveAgent;
public class Capabilities
{
    private MessageThread _messageThread;
    private ILogger<Capabilities> _logger;
    public Capabilities(MessageThread messageThread)
    {
        _messageThread = messageThread;
        _logger = Globals.LogFactory.CreateLogger<Capabilities>();
    }

    [Capability("Create a new broadband connection for a customer by initiating the installation process.")]
    [Parameter("customerName", "Customer's full name (first and last name)")]
    [Parameter("customerEmail", "Customer's email address in valid format (e.g., name@domain.com)")]
    [Parameter("planType", "Preferred broadband plan type (Basic, Standard, Premium, or Ultimate)")]
    [Parameter("contactNumber", "Customer's contact phone number with country code if applicable")]
    [Returns("Confirmation message indicating that the broadband connection request has been initiated")]
    public async Task<string> OrderNewBroadbandConnection(string customerName, string customerEmail, string planType, string contactNumber)
    {
        var workflowId = "99xio:CustomerSupportAgent:NewConnectionFlow";
        try
        {
            Console.WriteLine("Handling over to New Connection Workflow...");
            var newConnectionRequest = new
            {
                CustomerName = customerName,
                CustomerEmail = customerEmail,
                PlanType = planType,
                ContactNumber = contactNumber,
                MessageContent = _messageThread.IncomingMessage.Content
            };

            await _messageThread.Handover(
                workflowId,
                "Initiate New Connection",
                _messageThread.ParticipantId,
                newConnectionRequest);
            return "New broadband connection request has been initiated. Our team will process your request.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OrderNewBroadbandConnection");
            throw;
        }
    }


    [Capability("Initiate technical support ticket to resolve connectivity or device issues.")]
    [Parameter("customerEmail", "Customer's registered email address for account identification")]
    [Parameter("deviceType", "Type of device experiencing issues: Phone, Internet, or TV")]
    [Parameter("issues", "Summary of the technical issues being experienced")]
    [Returns("Confirmation message indicating that a technical support ticket creation has been initiated")]
    public async Task<string> RaiseTechnicalSupportTicket(string customerEmail, string deviceType, string issues)
    {
        try
        {
            var workflowType = "Support Ticket Flow";
            var ticketRequest = new
            {
                CustomerEmail = customerEmail,
                DeviceType = deviceType,
                Issues = issues,
                MessageContent = _messageThread.IncomingMessage.Content
            };

            var ticketId = Guid.NewGuid().ToString();

            await _messageThread.StartAndHandover(
                workflowType,
                "Initiate Support Ticket",
                _messageThread.ParticipantId,
                ticketRequest);
            return "Technical support ticket creation process has been initiated.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in RaiseTechnicalSupportTicket");
            throw;
        }
    }

    [Capability("Retrieve detailed information about available broadband plans based on specified type.")]
    [Parameter("planType", "The specific broadband plan category to query (Basic, Standard, Premium, or Ultimate)")]
    [Returns("Array of plan details including bandwidth and pricing information")]
    public Task<string[]> GetAvailablePlans(string planType)
    {
        Console.WriteLine("Fetching available broadband plans... Incoming Message: " + _messageThread.IncomingMessage.Content);

        switch (planType)
        {
            case "Basic":
                return Task.FromResult(new string[] { "Bandwidth: 50 Mbps, Price: $30/month" });
            case "Standard":
                return Task.FromResult(new string[] { "Bandwidth: 100 Mbps, Price: $50/month" });
            case "Premium":
                return Task.FromResult(new string[] { "Bandwidth: 200 Mbps, Price: $70/month" });
            case "Ultimate":
                return Task.FromResult(new string[] { "Bandwidth: 500 Mbps, Price: $100/month" });
        }
        return Task.FromResult(new string[] { "Invalid plan type" });
    }
}